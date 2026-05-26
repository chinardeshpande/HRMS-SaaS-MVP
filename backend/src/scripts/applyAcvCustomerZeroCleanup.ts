import 'reflect-metadata';
import fs from 'fs';
import path from 'path';
import { FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Tenant } from '../models/Tenant';
import { Employee } from '../models/Employee';
import { Department } from '../models/Department';
import { Designation } from '../models/Designation';
import { ExitCase } from '../models/ExitCase';
import { User } from '../models/User';
import { EmploymentStatus } from '../../../shared/types';
import { ExitState } from '../models/enums/ExitState';
import { ResignationType } from '../models/enums/ResignationType';

interface Options {
  tenantId?: string;
  companyName?: string;
  subdomain?: string;
  execute: boolean;
  workLocation: string;
  placeholderExitDate: string;
  resignationSubmittedDate: string;
  outputDir: string;
}

interface Report {
  mode: 'dry-run' | 'execute';
  generatedAt: string;
  tenant?: {
    tenantId: string;
    companyName: string;
    subdomain?: string | null;
  };
  options: Omit<Options, 'execute'>;
  planned: Record<string, any>;
  applied?: Record<string, any>;
  verification?: Record<string, any>;
  warnings: string[];
}

const usage = `
Usage:
  npm --prefix backend run acv:customer-zero-cleanup -- \\
    --company-name="ACV Solutions Pvt Ltd"

Dry-run is the default. Add --execute to mutate data.

Useful options:
  --tenant-id=<uuid>
  --company-name="ACV Solutions Pvt Ltd"
  --subdomain=acv
  --work-location="Mira Road, Thane"
  --placeholder-exit-date=2025-12-31
  --resignation-submitted-date=2025-12-01
  --output-dir="/path/to/evidence"
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

  const tenantId = readArg('tenant-id', args);
  const companyName = readArg('company-name', args) || 'ACV Solutions Pvt Ltd';
  const subdomain = readArg('subdomain', args);

  if (!tenantId && !companyName && !subdomain) {
    throw new Error('Provide --tenant-id, --company-name, or --subdomain');
  }

  return {
    tenantId,
    companyName,
    subdomain,
    execute: hasFlag('execute', args),
    workLocation: readArg('work-location', args) || 'Mira Road, Thane',
    placeholderExitDate: readArg('placeholder-exit-date', args) || '2025-12-31',
    resignationSubmittedDate: readArg('resignation-submitted-date', args) || '2025-12-01',
    outputDir:
      readArg('output-dir', args) ||
      path.resolve(process.cwd(), `acv-customer-zero-cleanup-${new Date().toISOString().replace(/[:.]/g, '-')}`),
  };
};

const parseDateOnly = (value: string, field: string): Date => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${field} must be YYYY-MM-DD, received ${value}`);
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${field} is not a valid date: ${value}`);
  }

  return parsed;
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
      .orWhere('LOWER(:companyName) LIKE LOWER(CONCAT(\'%\', tenant.companyName, \'%\'))', {
        companyName: options.companyName,
      })
      .getMany();
    tenants = [...tenants, ...companyMatches];
  }

  const unique = new Map(tenants.map((tenant) => [tenant.tenantId, tenant]));

  if (unique.size === 0) {
    throw new Error('No tenant matched the supplied selector');
  }

  if (unique.size > 1) {
    throw new Error(`Tenant selector matched multiple tenants: ${Array.from(unique.keys()).join(', ')}`);
  }

  return Array.from(unique.values())[0];
};

const csvEscape = (value: unknown): string => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const toCsv = (rows: Record<string, unknown>[], columns: string[]): string =>
  [columns.join(','), ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(','))].join('\n') + '\n';

const ensureOutput = (outputDir: string): void => {
  fs.mkdirSync(outputDir, { recursive: true });
};

const writeReport = (report: Report): void => {
  ensureOutput(report.options.outputDir);

  fs.writeFileSync(
    path.join(report.options.outputDir, 'acv-customer-zero-cleanup-report.json'),
    JSON.stringify(report, null, 2)
  );

  const summaryRows = Object.entries(report.verification || {}).map(([metric, value]) => ({ metric, value }));
  fs.writeFileSync(
    path.join(report.options.outputDir, 'verification-summary.csv'),
    toCsv(summaryRows, ['metric', 'value'])
  );

  const markdown = `# ACV Customer Zero Cleanup ${report.mode === 'execute' ? 'Execution' : 'Dry Run'}

Generated: ${report.generatedAt}

## Tenant

- Company: ${report.tenant?.companyName || 'not resolved'}
- Tenant ID: ${report.tenant?.tenantId || 'not resolved'}
- Mode: ${report.mode}

## Planned

\`\`\`json
${JSON.stringify(report.planned, null, 2)}
\`\`\`

## Applied

\`\`\`json
${JSON.stringify(report.applied || {}, null, 2)}
\`\`\`

## Verification

\`\`\`json
${JSON.stringify(report.verification || {}, null, 2)}
\`\`\`

## Rollback Notes

This script is intended for ACV Customer Zero cleanup. It updates employee statuses, creates or updates completed exit cases, hard-deletes the known mock Chinar Deshpande ACV record if present, and updates active employee work locations.

If rollback is required after execution:

1. Re-run the report and identify records touched in \`acv-customer-zero-cleanup-report.json\`.
2. Restore the database from the latest available provider snapshot if a full rollback is required.
3. For a targeted rollback, revert:
   - placeholder exit cases with notes containing \`Created during ACV Customer Zero migration cleanup\`
   - employee status changes from \`exited\` back to \`inactive\` only for employees confirmed by ACV
   - active employee work locations if needed
4. The Chinar mock deletion is intentionally destructive because the record was confirmed as non-ACV mock data.

## Warnings

${report.warnings.length ? report.warnings.map((warning) => `- ${warning}`).join('\n') : '- None'}
`;

  fs.writeFileSync(path.join(report.options.outputDir, 'README.md'), markdown);
};

const getPlanningSnapshot = async (tenant: Tenant) => {
  const employeeRepo = AppDataSource.getRepository(Employee);
  const exitRepo = AppDataSource.getRepository(ExitCase);

  const [
    employees,
    inactiveEmployees,
    activeEmployees,
    existingExitCases,
    mockChinar,
    anupama,
    surekha,
    aniket,
    pooja,
    suraj,
    lopamudra,
  ] = await Promise.all([
    employeeRepo.find({ where: { tenantId: tenant.tenantId }, relations: ['department', 'designation', 'manager'] }),
    employeeRepo.find({ where: { tenantId: tenant.tenantId, status: EmploymentStatus.INACTIVE } }),
    employeeRepo.find({ where: { tenantId: tenant.tenantId, status: EmploymentStatus.ACTIVE } }),
    exitRepo.find({ where: { tenantId: tenant.tenantId } }),
    employeeRepo.findOne({
      where: [
        { tenantId: tenant.tenantId, firstName: 'Chinar', lastName: 'Deshpande', email: 'chinardeshpande@gmail.com' },
        { tenantId: tenant.tenantId, firstName: 'Chinar', lastName: 'Deshpande', employeeCode: 'EMP0001' },
      ],
    }),
    employeeRepo.findOne({ where: { tenantId: tenant.tenantId, email: 'anupama.bhat@acvsolutions.in' } }),
    employeeRepo.findOne({ where: { tenantId: tenant.tenantId, firstName: 'Surekha', lastName: 'Kamat' } }),
    employeeRepo.findOne({ where: { tenantId: tenant.tenantId, firstName: 'Aniket', lastName: 'Dalvi' } }),
    employeeRepo.findOne({ where: { tenantId: tenant.tenantId, firstName: 'Pooja', lastName: 'Gaud' } }),
    employeeRepo.findOne({ where: { tenantId: tenant.tenantId, firstName: 'Suraj', lastName: 'Shigavan' } }),
    employeeRepo.findOne({ where: { tenantId: tenant.tenantId, firstName: 'Lopamudra', lastName: 'Behera' } }),
  ]);

  return {
    employees,
    inactiveEmployees,
    activeEmployees,
    existingExitCases,
    mockChinar,
    anupama,
    surekha,
    aniket,
    pooja,
    suraj,
    lopamudra,
  };
};

const getVerification = async (tenant: Tenant) => {
  const employeeRepo = AppDataSource.getRepository(Employee);
  const exitRepo = AppDataSource.getRepository(ExitCase);

  const [
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    exitedEmployees,
    exitCases,
    activeWithoutMiraRoad,
    mockChinarCount,
  ] = await Promise.all([
    employeeRepo.count({ where: { tenantId: tenant.tenantId } }),
    employeeRepo.count({ where: { tenantId: tenant.tenantId, status: EmploymentStatus.ACTIVE } }),
    employeeRepo.count({ where: { tenantId: tenant.tenantId, status: EmploymentStatus.INACTIVE } }),
    employeeRepo.count({ where: { tenantId: tenant.tenantId, status: EmploymentStatus.EXITED } }),
    exitRepo.count({ where: { tenantId: tenant.tenantId } }),
    employeeRepo
      .createQueryBuilder('employee')
      .where('employee.tenantId = :tenantId', { tenantId: tenant.tenantId })
      .andWhere('employee.status = :status', { status: EmploymentStatus.ACTIVE })
      .andWhere('(employee.workLocation IS NULL OR employee.workLocation != :workLocation)', {
        workLocation: 'Mira Road, Thane',
      })
      .getCount(),
    employeeRepo.count({
      where: [
        { tenantId: tenant.tenantId, firstName: 'Chinar', lastName: 'Deshpande', email: 'chinardeshpande@gmail.com' },
        { tenantId: tenant.tenantId, firstName: 'Chinar', lastName: 'Deshpande', employeeCode: 'EMP0001' },
      ],
    }),
  ]);

  return {
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    exitedEmployees,
    exitCases,
    activeEmployeesWithoutMiraRoad: activeWithoutMiraRoad,
    mockChinarCount,
  };
};

const main = async (): Promise<void> => {
  const options = parseArgs();
  const placeholderExitDate = parseDateOnly(options.placeholderExitDate, 'placeholderExitDate');
  const resignationSubmittedDate = parseDateOnly(options.resignationSubmittedDate, 'resignationSubmittedDate');
  const warnings: string[] = [];

  await AppDataSource.initialize();

  try {
    const tenant = await findTenant(options);
    const snapshot = await getPlanningSnapshot(tenant);

    const planned = {
      tenantId: tenant.tenantId,
      totalEmployees: snapshot.employees.length,
      activeEmployeesToSetWorkLocation: snapshot.activeEmployees.filter((employee) => employee.workLocation !== options.workLocation)
        .length,
      inactiveEmployeesToMarkExited: snapshot.inactiveEmployees.length,
      exitCasesCurrentlyPresent: snapshot.existingExitCases.length,
      mockChinarWillBeDeleted: Boolean(snapshot.mockChinar),
      anupamaExists: Boolean(snapshot.anupama),
      managerMappings: [
        'Surekha Kamat -> Anupama Bhat',
        'Aniket Dalvi -> Anupama Bhat',
        'Pooja Gaud -> Aniket Dalvi',
        'Suraj Shigavan -> Aniket Dalvi',
        'Lopamudra Behera -> Aniket Dalvi',
      ],
    };

    const report: Report = {
      mode: options.execute ? 'execute' : 'dry-run',
      generatedAt: new Date().toISOString(),
      tenant: {
        tenantId: tenant.tenantId,
        companyName: tenant.companyName,
        subdomain: tenant.subdomain || null,
      },
      options: {
        tenantId: options.tenantId,
        companyName: options.companyName,
        subdomain: options.subdomain,
        workLocation: options.workLocation,
        placeholderExitDate: options.placeholderExitDate,
        resignationSubmittedDate: options.resignationSubmittedDate,
        outputDir: options.outputDir,
      },
      planned,
      warnings,
    };

    if (!snapshot.surekha) warnings.push('Surekha Kamat not found; manager mapping will be skipped.');
    if (!snapshot.aniket) warnings.push('Aniket Dalvi not found; manager mapping will be skipped.');
    if (!snapshot.pooja) warnings.push('Pooja Gaud not found; manager mapping will be skipped.');
    if (!snapshot.suraj) warnings.push('Suraj Shigavan not found; manager mapping will be skipped.');
    if (!snapshot.lopamudra) warnings.push('Lopamudra Behera not found; manager mapping will be skipped.');

    if (!options.execute) {
      report.verification = await getVerification(tenant);
      writeReport(report);
      console.log(`Dry-run complete. Report: ${options.outputDir}`);
      console.log(JSON.stringify(report.planned, null, 2));
      return;
    }

    const applied = await AppDataSource.transaction(async (manager) => {
      const employeeRepo = manager.getRepository(Employee);
      const departmentRepo = manager.getRepository(Department);
      const designationRepo = manager.getRepository(Designation);
      const exitRepo = manager.getRepository(ExitCase);
      const userRepo = manager.getRepository(User);

      let management = await departmentRepo.findOne({ where: { tenantId: tenant.tenantId, name: 'Management' } });
      if (!management) {
        management = await departmentRepo.save(departmentRepo.create({ tenantId: tenant.tenantId, name: 'Management' }));
      }

      let director = await designationRepo.findOne({ where: { tenantId: tenant.tenantId, name: 'Director' } });
      if (!director) {
        director = await designationRepo.save(designationRepo.create({ tenantId: tenant.tenantId, name: 'Director', level: 1 }));
      }

      let anupama = await employeeRepo.findOne({ where: { tenantId: tenant.tenantId, email: 'anupama.bhat@acvsolutions.in' } });
      if (!anupama) {
        const conflictingCode = await employeeRepo.findOne({ where: { tenantId: tenant.tenantId, employeeCode: 'ACV/EMP/0001' } });
        if (conflictingCode) {
          throw new Error('ACV/EMP/0001 already exists for another employee; cannot create Anupama safely.');
        }

        anupama = await employeeRepo.save(
          employeeRepo.create({
            tenantId: tenant.tenantId,
            employeeCode: 'ACV/EMP/0001',
            firstName: 'Anupama',
            lastName: 'Bhat',
            email: 'anupama.bhat@acvsolutions.in',
            departmentId: management.departmentId,
            designationId: director.designationId,
            dateOfJoining: new Date('2022-12-11T00:00:00.000Z'),
            employmentType: 'Full-Time',
            workLocation: options.workLocation,
            status: EmploymentStatus.ACTIVE,
          })
        );
      } else {
        anupama.departmentId = management.departmentId;
        anupama.designationId = director.designationId;
        anupama.workLocation = options.workLocation;
        anupama.dateOfJoining = anupama.dateOfJoining || new Date('2022-12-11T00:00:00.000Z');
        anupama.status = EmploymentStatus.ACTIVE;
        await employeeRepo.save(anupama);
      }

      const anupamaUser = await userRepo.findOne({ where: { tenantId: tenant.tenantId, email: 'anupama.bhat@acvsolutions.in' } });
      if (anupamaUser && anupamaUser.employeeId !== anupama.employeeId) {
        anupamaUser.employeeId = anupama.employeeId;
        await userRepo.save(anupamaUser);
      }

      const employeesByName = new Map(
        (await employeeRepo.find({ where: { tenantId: tenant.tenantId } })).map((employee) => [
          `${employee.firstName} ${employee.lastName}`.toLowerCase(),
          employee,
        ])
      );

      const mappings: Array<[string, string]> = [
        ['Surekha Kamat', 'Anupama Bhat'],
        ['Aniket Dalvi', 'Anupama Bhat'],
        ['Pooja Gaud', 'Aniket Dalvi'],
        ['Suraj Shigavan', 'Aniket Dalvi'],
        ['Lopamudra Behera', 'Aniket Dalvi'],
      ];

      let managerMappingsUpdated = 0;
      for (const [employeeName, managerName] of mappings) {
        const employee = employeesByName.get(employeeName.toLowerCase());
        const mappedManager = employeesByName.get(managerName.toLowerCase()) || (managerName === 'Anupama Bhat' ? anupama : null);
        if (!employee || !mappedManager) continue;
        if (employee.managerId !== mappedManager.employeeId) {
          employee.managerId = mappedManager.employeeId;
          await employeeRepo.save(employee);
          managerMappingsUpdated += 1;
        }
      }

      const activeUpdate = await employeeRepo
        .createQueryBuilder()
        .update(Employee)
        .set({ workLocation: options.workLocation })
        .where('"tenantId" = :tenantId', { tenantId: tenant.tenantId })
        .andWhere('status = :status', { status: EmploymentStatus.ACTIVE })
        .execute();

      const inactiveEmployees = await employeeRepo.find({
        where: { tenantId: tenant.tenantId, status: EmploymentStatus.INACTIVE },
      });

      let exitCasesCreated = 0;
      let exitCasesUpdated = 0;
      for (const employee of inactiveEmployees) {
        let exitCase = await exitRepo.findOne({ where: { tenantId: tenant.tenantId, employeeId: employee.employeeId } });
        if (!exitCase) {
          exitCase = exitRepo.create({
            tenantId: tenant.tenantId,
            employeeId: employee.employeeId,
          } as Partial<ExitCase>);
          exitCasesCreated += 1;
        } else {
          exitCasesUpdated += 1;
        }

        Object.assign(exitCase, {
          currentState: ExitState.EXIT_COMPLETED,
          resignationType: ResignationType.VOLUNTARY,
          resignationSubmittedDate,
          resignationApprovedDate: resignationSubmittedDate,
          resignationReason: 'Historical ACV migration placeholder exit record',
          detailedReason:
            'Placeholder exit date used for data completion. To be manually corrected after ACV confirms actual exit details.',
          approvedBy: anupama.employeeId,
          noticePeriodDays: 30,
          noticePeriodStartDate: resignationSubmittedDate,
          noticePeriodEndDate: placeholderExitDate,
          lastWorkingDate: placeholderExitDate,
          actualExitDate: placeholderExitDate,
          clearanceInitiatedDate: placeholderExitDate,
          clearanceCompletedDate: placeholderExitDate,
          allClearancesCleared: true,
          totalClearances: 0,
          completedClearances: 0,
          assetsReturnInitiatedDate: placeholderExitDate,
          assetsReturnedDate: placeholderExitDate,
          allAssetsReturned: true,
          totalAssets: 0,
          returnedAssets: 0,
          exitInterviewCompleted: true,
          settlementCalculatedDate: placeholderExitDate,
          settlementApprovedDate: placeholderExitDate,
          settlementPaidDate: placeholderExitDate,
          isEligibleForRehire: true,
          exitCompletedDate: placeholderExitDate,
          exitCompletedBy: anupama.employeeId,
          notes: 'Created during ACV Customer Zero migration cleanup using common placeholder date 2025-12-31.',
        });
        await exitRepo.save(exitCase);

        employee.status = EmploymentStatus.EXITED;
        if (!employee.workLocation || employee.workLocation.startsWith('ACV migration:')) {
          employee.workLocation = options.workLocation;
        }
        await employeeRepo.save(employee);
      }

      const mockChinar = await employeeRepo.findOne({
        where: [
          { tenantId: tenant.tenantId, firstName: 'Chinar', lastName: 'Deshpande', email: 'chinardeshpande@gmail.com' },
          { tenantId: tenant.tenantId, firstName: 'Chinar', lastName: 'Deshpande', employeeCode: 'EMP0001' },
        ],
      });

      let mockChinarDeleted = false;
      if (mockChinar) {
        await manager.query('DELETE FROM generated_documents WHERE "employeeId" = $1', [mockChinar.employeeId]);
        await manager.query('DELETE FROM onboarding_documents WHERE "employeeId" = $1 OR "verifiedBy" = $1', [mockChinar.employeeId]);
        const candidateIds: Array<{ candidateId: string }> = await manager.query(
          'SELECT "candidateId" FROM candidates WHERE "employeeId" = $1',
          [mockChinar.employeeId]
        );
        for (const row of candidateIds) {
          await manager.query('DELETE FROM generated_documents WHERE "candidateId" = $1', [row.candidateId]);
          await manager.query('DELETE FROM onboarding_documents WHERE "candidateId" = $1', [row.candidateId]);
          await manager.query('DELETE FROM onboarding_cases WHERE "candidateId" = $1', [row.candidateId]);
          await manager.query('DELETE FROM candidates WHERE "candidateId" = $1', [row.candidateId]);
        }
        await manager.query('DELETE FROM compensation_share_logs WHERE "employeeId" = $1', [mockChinar.employeeId]);
        await manager.query('DELETE FROM payslips WHERE "employeeId" = $1', [mockChinar.employeeId]);
        await manager.query('DELETE FROM salary_structures WHERE "employeeId" = $1', [mockChinar.employeeId]);
        await manager.query('DELETE FROM compensation_history WHERE "employeeId" = $1 OR "approvedBy" = $1', [mockChinar.employeeId]);
        await manager.query('DELETE FROM position_history WHERE "employeeId" = $1 OR "approvedBy" = $1', [mockChinar.employeeId]);
        await manager.query(
          'DELETE FROM manual_employment_history WHERE "employeeId" = $1 OR "createdBy" = $1 OR "updatedBy" = $1',
          [mockChinar.employeeId]
        );
        await employeeRepo.remove(mockChinar);
        mockChinarDeleted = true;
      }

      return {
        managementDepartmentId: management.departmentId,
        directorDesignationId: director.designationId,
        anupamaEmployeeId: anupama.employeeId,
        managerMappingsUpdated,
        activeWorkLocationRowsTouched: activeUpdate.affected || 0,
        inactiveEmployeesMarkedExited: inactiveEmployees.length,
        exitCasesCreated,
        exitCasesUpdated,
        mockChinarDeleted,
      };
    });

    report.applied = applied;
    report.verification = await getVerification(tenant);
    writeReport(report);

    console.log(`Execution complete. Report: ${options.outputDir}`);
    console.log(JSON.stringify(report.verification, null, 2));
  } finally {
    await AppDataSource.destroy();
  }
};

main().catch(async (error) => {
  console.error(error);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
