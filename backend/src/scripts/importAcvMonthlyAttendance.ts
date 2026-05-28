import 'reflect-metadata';
import fs from 'fs';
import path from 'path';
import { FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { Employee } from '../models/Employee';
import { Attendance, AttendanceStatus } from '../models/Attendance';
import auditService from '../services/auditService';
import { UserRole } from '../../../shared/types';

const DEFAULT_NORMALIZED_FILE = path.resolve(
  process.cwd(),
  '../docs/acv-implementation/latest-data-ingestion-2026-05-27/normalized/acv-latest-normalized.json'
);

interface Options {
  tenantId?: string;
  companyName?: string;
  subdomain?: string;
  actorEmail?: string;
  normalizedFile: string;
  outputDir: string;
  execute: boolean;
  force: boolean;
  includeExited: boolean;
}

interface NormalizedAttendanceRecord {
  employeeName: string;
  employeeCode: string;
  date: string;
  year: number;
  month: number;
  day: number;
  sourceCode: string;
  status: AttendanceStatus;
  notes: string;
  sourceFile: string;
  sourceSheet: string;
}

interface NormalizedPayload {
  generatedAt: string;
  sourceDir: string;
  attendanceRecords: NormalizedAttendanceRecord[];
  warnings?: string[];
}

interface PlanRow {
  employeeName: string;
  employeeCode?: string;
  matchedEmployeeCode?: string;
  matchedEmployeeId?: string;
  date: string;
  sourceCode: string;
  status: AttendanceStatus;
  existingAttendanceId?: string;
  existingStatus?: AttendanceStatus;
  action:
    | 'create'
    | 'update_existing'
    | 'skip_existing_same_status'
    | 'skip_existing_requires_force'
    | 'skip_exited_employee'
    | 'warning_no_employee';
  warning?: string;
}

const usage = `
Usage:
  npm --prefix backend run acv:attendance -- --company-name="ACV Solutions"

Dry-run is the default. Add --execute to apply creates. Add --force to update existing attendance statuses.

Options:
  --tenant-id=<uuid>
  --company-name="ACV Solutions"
  --subdomain=acv
  --actor-email=anupama.bhat@acvsolutions.in
  --normalized-file="/path/to/acv-latest-normalized.json"
  --output-dir="/path/to/evidence"
  --include-exited
  --force
`;

const readArg = (name: string, args: string[]): string | undefined => {
  const prefix = `--${name}=`;
  const match = args.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
};

const hasFlag = (name: string, args: string[]): boolean => args.includes(`--${name}`);

const parseArgs = (): Options => {
  const args = process.argv.slice(2);
  if (hasFlag('help', args) || hasFlag('h', args)) {
    console.log(usage.trim());
    process.exit(0);
  }
  if (!readArg('tenant-id', args) && !readArg('company-name', args) && !readArg('subdomain', args)) {
    throw new Error('Provide --tenant-id, --company-name, or --subdomain');
  }
  return {
    tenantId: readArg('tenant-id', args),
    companyName: readArg('company-name', args),
    subdomain: readArg('subdomain', args),
    actorEmail: readArg('actor-email', args) || 'anupama.bhat@acvsolutions.in',
    normalizedFile: readArg('normalized-file', args) || DEFAULT_NORMALIZED_FILE,
    outputDir:
      readArg('output-dir', args) ||
      path.resolve(process.cwd(), `acv-attendance-${new Date().toISOString().replace(/[:.]/g, '-')}`),
    execute: hasFlag('execute', args),
    force: hasFlag('force', args),
    includeExited: hasFlag('include-exited', args),
  };
};

const normalize = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeCode = (value: unknown): string => String(value ?? '').replace(/[^0-9]/g, '').replace(/^0+/, '');

const employeeAliases: Record<string, string> = {
  'surekha abhijit kamat': 'surekha kamat',
  lopamudra: 'lopamudra behera',
};

const dateOnly = (value: string): Date => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Invalid date: ${value}`);
  return value as unknown as Date;
};

const findTenant = async (options: Options): Promise<Tenant> => {
  const tenantRepo = AppDataSource.getRepository(Tenant);
  const where: FindOptionsWhere<Tenant>[] = [];
  if (options.tenantId) where.push({ tenantId: options.tenantId });
  if (options.subdomain) where.push({ subdomain: options.subdomain });
  let tenants = where.length ? await tenantRepo.find({ where }) : [];

  if (options.companyName) {
    const companyMatches = await tenantRepo
      .createQueryBuilder('tenant')
      .where('LOWER(tenant.companyName) = LOWER(:companyName)', { companyName: options.companyName })
      .orWhere('LOWER(tenant.companyName) LIKE LOWER(:partialCompanyName)', {
        partialCompanyName: `%${options.companyName}%`,
      })
      .getMany();
    tenants = [...tenants, ...companyMatches];
  }

  const unique = new Map(tenants.map((tenant) => [tenant.tenantId, tenant]));
  if (unique.size === 0) throw new Error('No tenant matched the supplied selector');
  if (unique.size > 1) throw new Error(`Tenant selector matched multiple tenants: ${Array.from(unique.keys()).join(', ')}`);
  return Array.from(unique.values())[0];
};

const findActor = async (tenantId: string, actorEmail?: string): Promise<User> => {
  const userRepo = AppDataSource.getRepository(User);
  const actor = actorEmail ? await userRepo.findOne({ where: { tenantId, email: actorEmail.toLowerCase() } }) : null;
  if (actor) return actor;

  const fallback = await userRepo.findOne({
    where: [
      { tenantId, role: UserRole.HR_ADMIN, isActive: true },
      { tenantId, role: UserRole.SYSTEM_ADMIN, isActive: true },
    ],
    order: { createdAt: 'ASC' },
  });
  if (!fallback) throw new Error('No active HR/system user found to attribute attendance import audit logs');
  return fallback;
};

const matchEmployee = (employees: Employee[], rawName: string, rawCode?: string): Employee | undefined => {
  const wantedCode = normalizeCode(rawCode);
  if (wantedCode) {
    const byCode = employees.find((employee) => normalizeCode(employee.employeeCode) === wantedCode);
    if (byCode) return byCode;
  }

  const wanted = employeeAliases[normalize(rawName)] || normalize(rawName);
  return employees.find((employee) => {
    const fullName = normalize(`${employee.firstName} ${employee.lastName}`);
    return fullName === wanted || fullName.includes(wanted) || wanted.includes(fullName);
  });
};

const writeReport = (options: Options, report: Record<string, unknown>): void => {
  fs.mkdirSync(options.outputDir, { recursive: true });
  fs.writeFileSync(path.join(options.outputDir, 'attendance-report.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(
    path.join(options.outputDir, 'README.md'),
    [
      '# ACV Monthly Attendance Import Report',
      '',
      `Mode: ${options.execute ? 'execute' : 'dry-run'}`,
      `Generated: ${new Date().toISOString()}`,
      '',
      'This importer backfills daily attendance status memory from monthly sheets. It does not import biometric punch times.',
      '',
    ].join('\n')
  );
};

const main = async (): Promise<void> => {
  const options = parseArgs();
  const payload = JSON.parse(fs.readFileSync(options.normalizedFile, 'utf-8')) as NormalizedPayload;

  await AppDataSource.initialize();
  const tenant = await findTenant(options);
  const actor = await findActor(tenant.tenantId, options.actorEmail);

  const employeeRepo = AppDataSource.getRepository(Employee);
  const attendanceRepo = AppDataSource.getRepository(Attendance);
  const employees = await employeeRepo.find({ where: { tenantId: tenant.tenantId } });

  const planned: PlanRow[] = [];
  const applied: PlanRow[] = [];

  for (const row of payload.attendanceRecords || []) {
    const employee = matchEmployee(employees, row.employeeName, row.employeeCode);
    if (!employee) {
      planned.push({
        employeeName: row.employeeName,
        employeeCode: row.employeeCode,
        date: row.date,
        sourceCode: row.sourceCode,
        status: row.status,
        action: 'warning_no_employee',
        warning: 'No matching ACV employee found for attendance row',
      });
      continue;
    }

    if (employee.status !== 'active' && !options.includeExited) {
      planned.push({
        employeeName: row.employeeName,
        employeeCode: row.employeeCode,
        matchedEmployeeCode: employee.employeeCode,
        matchedEmployeeId: employee.employeeId,
        date: row.date,
        sourceCode: row.sourceCode,
        status: row.status,
        action: 'skip_exited_employee',
        warning: 'Employee is not active; pass --include-exited to import historical attendance for exited employees',
      });
      continue;
    }

    const date = dateOnly(row.date);
    const existing = await attendanceRepo.findOne({
      where: { employeeId: employee.employeeId, tenantId: tenant.tenantId, date },
    });

    let action: PlanRow['action'] = 'create';
    if (existing && existing.status === row.status) action = 'skip_existing_same_status';
    else if (existing && !options.force) action = 'skip_existing_requires_force';
    else if (existing && options.force) action = 'update_existing';

    const planRow: PlanRow = {
      employeeName: row.employeeName,
      employeeCode: row.employeeCode,
      matchedEmployeeCode: employee.employeeCode,
      matchedEmployeeId: employee.employeeId,
      date: row.date,
      sourceCode: row.sourceCode,
      status: row.status,
      existingAttendanceId: existing?.attendanceId,
      existingStatus: existing?.status,
      action,
      warning: action === 'skip_existing_requires_force' ? 'Existing attendance status differs; rerun with --force after review' : undefined,
    };
    planned.push(planRow);

    if (!options.execute || action === 'skip_existing_same_status' || action === 'skip_existing_requires_force') continue;

    const before = existing ? { ...existing } : undefined;
    const attendance =
      existing ||
      attendanceRepo.create({
        employeeId: employee.employeeId,
        tenantId: tenant.tenantId,
        date,
      });

    attendance.status = row.status;
    attendance.workMinutes = row.status === AttendanceStatus.PRESENT ? attendance.workMinutes || 480 : 0;
    attendance.isManualOverride = true;
    attendance.overriddenBy = actor.employeeId || employee.employeeId;
    attendance.overriddenAt = new Date();
    attendance.overrideReason = 'ACV Customer Zero monthly attendance backfill';
    attendance.notes = row.notes;

    const saved = await attendanceRepo.save(attendance);
    await auditService.record({
      tenantId: tenant.tenantId,
      userId: actor.userId,
      action: existing ? 'ACV_ATTENDANCE_UPDATED' : 'ACV_ATTENDANCE_CREATED',
      entityType: 'Attendance',
      entityId: saved.attendanceId,
      oldValue: before,
      newValue: {
        employeeCode: employee.employeeCode,
        date: row.date,
        status: row.status,
        sourceCode: row.sourceCode,
        sourceFile: row.sourceFile,
        sourceSheet: row.sourceSheet,
      },
      description: 'ACV Customer Zero monthly attendance memory import',
    });
    applied.push(planRow);
  }

  const summary = planned.reduce<Record<string, number>>((acc, row) => {
    acc[row.action] = (acc[row.action] || 0) + 1;
    return acc;
  }, {});

  const report = {
    mode: options.execute ? 'execute' : 'dry-run',
    generatedAt: new Date().toISOString(),
    tenant: { tenantId: tenant.tenantId, companyName: tenant.companyName, subdomain: tenant.subdomain },
    actor: { userId: actor.userId, email: actor.email, role: actor.role },
    options,
    sourceGeneratedAt: payload.generatedAt,
    sourceDir: payload.sourceDir,
    summary,
    planned,
    applied,
    sourceWarnings: payload.warnings || [],
  };

  writeReport(options, report);
  console.log(JSON.stringify({ mode: report.mode, summary, outputDir: options.outputDir }, null, 2));
  await AppDataSource.destroy();
};

main().catch(async (error) => {
  console.error(error);
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
  process.exit(1);
});
