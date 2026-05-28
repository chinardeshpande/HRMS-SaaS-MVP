import 'reflect-metadata';
import fs from 'fs';
import path from 'path';
import { FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { Employee } from '../models/Employee';
import { LeaveBalance } from '../models/LeaveBalance';
import { LeavePolicy, LeaveType } from '../models/LeavePolicy';
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

interface NormalizedLeaveBalance {
  employeeName: string;
  year: number;
  leaveCode: string;
  leaveType: LeaveType;
  totalAllocated: number;
  used: number;
  pending: number;
  carriedForward: number;
  encashed: number;
  available: number;
  sourceFile: string;
  sourceSheet: string;
  monthlyEvidence: unknown[];
}

interface NormalizedPayload {
  generatedAt: string;
  sourceDir: string;
  leaveBalances: NormalizedLeaveBalance[];
  lopEvidence?: unknown[];
  warnings?: string[];
}

interface PlanRow {
  employeeName: string;
  matchedEmployeeCode?: string;
  matchedEmployeeId?: string;
  leaveType: LeaveType;
  year: number;
  sourceAvailable: number;
  sourceUsed: number;
  sourceTotalAllocated: number;
  existingBalanceId?: string;
  existingAvailable?: number;
  existingUsed?: number;
  existingTotalAllocated?: number;
  action:
    | 'create'
    | 'update_existing'
    | 'skip_existing_same_values'
    | 'skip_existing_requires_force'
    | 'skip_exited_employee'
    | 'warning_no_employee'
    | 'warning_no_policy';
  warning?: string;
}

const usage = `
Usage:
  npm --prefix backend run acv:leave-balances -- --company-name="ACV Solutions"

Dry-run is the default. Add --execute to apply creates. Add --force to update existing balances.

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
      path.resolve(process.cwd(), `acv-leave-balances-${new Date().toISOString().replace(/[:.]/g, '-')}`),
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

const employeeAliases: Record<string, string> = {
  'pooja guad': 'pooja gaud',
  'suraj shivgavan': 'suraj shigavan',
  lopamudra: 'lopamudra behera',
};

const round2 = (value: unknown): number => Math.round(Number(value || 0) * 100) / 100;

const availableOf = (balance: LeaveBalance): number =>
  round2(Number(balance.totalAllocated) + Number(balance.carriedForward) - Number(balance.used) - Number(balance.pending));

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
  if (!fallback) throw new Error('No active HR/system user found to attribute leave balance import audit logs');
  return fallback;
};

const matchEmployee = (employees: Employee[], rawName: string): Employee | undefined => {
  const wanted = employeeAliases[normalize(rawName)] || normalize(rawName);
  return employees.find((employee) => {
    const fullName = normalize(`${employee.firstName} ${employee.lastName}`);
    return fullName === wanted || fullName.includes(wanted) || wanted.includes(fullName);
  });
};

const sameBalanceValues = (existing: LeaveBalance, row: NormalizedLeaveBalance): boolean =>
  round2(existing.totalAllocated) === round2(row.totalAllocated) &&
  round2(existing.used) === round2(row.used) &&
  round2(existing.pending) === round2(row.pending) &&
  round2(existing.carriedForward) === round2(row.carriedForward) &&
  round2(existing.encashed) === round2(row.encashed);

const writeReport = (options: Options, report: Record<string, unknown>): void => {
  fs.mkdirSync(options.outputDir, { recursive: true });
  fs.writeFileSync(path.join(options.outputDir, 'leave-balances-report.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(
    path.join(options.outputDir, 'README.md'),
    [
      '# ACV Leave Balance Import Report',
      '',
      `Mode: ${options.execute ? 'execute' : 'dry-run'}`,
      `Generated: ${new Date().toISOString()}`,
      '',
      'This importer updates annual leave balance memory only. It does not create leave requests or payroll/LOP computation.',
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
  const policyRepo = AppDataSource.getRepository(LeavePolicy);
  const balanceRepo = AppDataSource.getRepository(LeaveBalance);

  const employees = await employeeRepo.find({ where: { tenantId: tenant.tenantId } });
  const policies = await policyRepo.find({ where: { tenantId: tenant.tenantId, isActive: true } });
  const policyByType = new Map(policies.map((policy) => [policy.leaveType, policy]));

  const planned: PlanRow[] = [];
  const applied: PlanRow[] = [];

  for (const row of payload.leaveBalances || []) {
    const employee = matchEmployee(employees, row.employeeName);
    if (!employee) {
      planned.push({
        employeeName: row.employeeName,
        leaveType: row.leaveType,
        year: row.year,
        sourceAvailable: row.available,
        sourceUsed: row.used,
        sourceTotalAllocated: row.totalAllocated,
        action: 'warning_no_employee',
        warning: 'No matching ACV employee found for leave balance row',
      });
      continue;
    }

    if (employee.status !== 'active' && !options.includeExited) {
      planned.push({
        employeeName: row.employeeName,
        matchedEmployeeCode: employee.employeeCode,
        matchedEmployeeId: employee.employeeId,
        leaveType: row.leaveType,
        year: row.year,
        sourceAvailable: row.available,
        sourceUsed: row.used,
        sourceTotalAllocated: row.totalAllocated,
        action: 'skip_exited_employee',
        warning: 'Employee is not active; pass --include-exited to import historical balances for exited employees',
      });
      continue;
    }

    const policy = policyByType.get(row.leaveType);
    if (!policy) {
      planned.push({
        employeeName: row.employeeName,
        matchedEmployeeCode: employee.employeeCode,
        matchedEmployeeId: employee.employeeId,
        leaveType: row.leaveType,
        year: row.year,
        sourceAvailable: row.available,
        sourceUsed: row.used,
        sourceTotalAllocated: row.totalAllocated,
        action: 'warning_no_policy',
        warning: `No active leave policy found for ${row.leaveType}`,
      });
      continue;
    }

    const existing = await balanceRepo.findOne({
      where: {
        employeeId: employee.employeeId,
        tenantId: tenant.tenantId,
        leaveType: row.leaveType,
        year: row.year,
      },
    });

    let action: PlanRow['action'] = 'create';
    if (existing && sameBalanceValues(existing, row)) action = 'skip_existing_same_values';
    else if (existing && !options.force) action = 'skip_existing_requires_force';
    else if (existing && options.force) action = 'update_existing';

    const planRow: PlanRow = {
      employeeName: row.employeeName,
      matchedEmployeeCode: employee.employeeCode,
      matchedEmployeeId: employee.employeeId,
      leaveType: row.leaveType,
      year: row.year,
      sourceAvailable: row.available,
      sourceUsed: row.used,
      sourceTotalAllocated: row.totalAllocated,
      existingBalanceId: existing?.balanceId,
      existingAvailable: existing ? availableOf(existing) : undefined,
      existingUsed: existing ? round2(existing.used) : undefined,
      existingTotalAllocated: existing ? round2(existing.totalAllocated) : undefined,
      action,
      warning: action === 'skip_existing_requires_force' ? 'Existing leave balance differs; rerun with --force after review' : undefined,
    };
    planned.push(planRow);

    if (!options.execute || action === 'skip_existing_same_values' || action === 'skip_existing_requires_force') continue;

    const before = existing ? { ...existing } : undefined;
    const balance =
      existing ||
      balanceRepo.create({
        employeeId: employee.employeeId,
        tenantId: tenant.tenantId,
        leaveType: row.leaveType,
        year: row.year,
      });

    balance.policyId = policy.policyId;
    balance.totalAllocated = row.totalAllocated;
    balance.used = row.used;
    balance.pending = row.pending;
    balance.carriedForward = row.carriedForward;
    balance.encashed = row.encashed;

    const saved = await balanceRepo.save(balance);
    await auditService.record({
      tenantId: tenant.tenantId,
      userId: actor.userId,
      action: existing ? 'ACV_LEAVE_BALANCE_UPDATED' : 'ACV_LEAVE_BALANCE_CREATED',
      entityType: 'LeaveBalance',
      entityId: saved.balanceId,
      oldValue: before,
      newValue: {
        employeeCode: employee.employeeCode,
        leaveType: row.leaveType,
        year: row.year,
        totalAllocated: row.totalAllocated,
        used: row.used,
        available: row.available,
        sourceFile: row.sourceFile,
        sourceSheet: row.sourceSheet,
      },
      description: 'ACV Customer Zero leave balance memory import',
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
    lopEvidence: payload.lopEvidence || [],
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
