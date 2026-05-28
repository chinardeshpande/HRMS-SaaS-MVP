import 'reflect-metadata';
import { ILike } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Tenant } from '../models/Tenant';
import { LeavePolicy, LeaveType } from '../models/LeavePolicy';
import { LeaveBalance } from '../models/LeaveBalance';
import { Employee } from '../models/Employee';

type StandardPolicy = {
  policyName: string;
  leaveType: LeaveType;
  totalLeaves: number;
  maxConsecutiveDays: number;
  carryForward: boolean;
  maxCarryForward: number;
  encashable: boolean;
  minNoticeDays: number;
  requiresApproval: boolean;
  probationPeriod: number;
  applicableGender: 'all' | 'female' | 'male';
  description: string;
};

const standardPolicies: StandardPolicy[] = [
  {
    policyName: 'Casual Leave',
    leaveType: LeaveType.CASUAL,
    totalLeaves: 12,
    maxConsecutiveDays: 3,
    carryForward: false,
    maxCarryForward: 0,
    encashable: false,
    minNoticeDays: 1,
    requiresApproval: true,
    probationPeriod: 0,
    applicableGender: 'all',
    description: 'Casual leave for personal matters',
  },
  {
    policyName: 'Sick Leave',
    leaveType: LeaveType.SICK,
    totalLeaves: 12,
    maxConsecutiveDays: 7,
    carryForward: true,
    maxCarryForward: 6,
    encashable: false,
    minNoticeDays: 0,
    requiresApproval: true,
    probationPeriod: 0,
    applicableGender: 'all',
    description: 'Medical leave for illness',
  },
  {
    policyName: 'Earned Leave',
    leaveType: LeaveType.EARNED,
    totalLeaves: 21,
    maxConsecutiveDays: 15,
    carryForward: true,
    maxCarryForward: 15,
    encashable: true,
    minNoticeDays: 7,
    requiresApproval: true,
    probationPeriod: 3,
    applicableGender: 'all',
    description: 'Earned leave or privilege leave',
  },
  {
    policyName: 'Maternity Leave',
    leaveType: LeaveType.MATERNITY,
    totalLeaves: 180,
    maxConsecutiveDays: 180,
    carryForward: false,
    maxCarryForward: 0,
    encashable: false,
    minNoticeDays: 30,
    requiresApproval: true,
    probationPeriod: 0,
    applicableGender: 'female',
    description: 'Maternity leave for female employees',
  },
  {
    policyName: 'Paternity Leave',
    leaveType: LeaveType.PATERNITY,
    totalLeaves: 15,
    maxConsecutiveDays: 15,
    carryForward: false,
    maxCarryForward: 0,
    encashable: false,
    minNoticeDays: 7,
    requiresApproval: true,
    probationPeriod: 0,
    applicableGender: 'male',
    description: 'Paternity leave for male employees',
  },
];

const argValue = (name: string): string | undefined => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const hasFlag = (name: string): boolean => process.argv.includes(`--${name}`);

const normalizeGender = (gender?: string | null): string | undefined => {
  const normalized = gender?.trim().toLowerCase();
  if (!normalized) return undefined;
  if (['m', 'male'].includes(normalized)) return 'male';
  if (['f', 'female'].includes(normalized)) return 'female';
  return normalized;
};

const entitlementForEmployee = (policy: LeavePolicy, employee: Employee): number => {
  if (policy.leaveType === LeaveType.MATERNITY) {
    return normalizeGender(employee.gender) === 'female' ? Number(policy.totalLeaves) || 0 : 0;
  }
  if (policy.leaveType === LeaveType.PATERNITY) {
    return normalizeGender(employee.gender) === 'male' ? Number(policy.totalLeaves) || 0 : 0;
  }
  return Number(policy.totalLeaves) || 0;
};

const main = async () => {
  const companyName = argValue('company-name') || 'ACV Solutions';
  const year = Number(argValue('year') || new Date().getFullYear());
  const execute = hasFlag('execute');
  const initializeBalances = hasFlag('initialize-balances');

  await AppDataSource.initialize();

  const tenantRepo = AppDataSource.getRepository(Tenant);
  const policyRepo = AppDataSource.getRepository(LeavePolicy);
  const employeeRepo = AppDataSource.getRepository(Employee);
  const balanceRepo = AppDataSource.getRepository(LeaveBalance);

  const tenant = await tenantRepo.findOne({
    where: [
      { companyName: ILike(companyName) },
      { companyName: ILike(`${companyName}%`) },
    ],
  });

  if (!tenant) {
    throw new Error(`Tenant not found for company name: ${companyName}`);
  }

  const actions: Array<{
    action: 'create' | 'update' | 'skip';
    leaveType: LeaveType;
    policyName: string;
    reason: string;
  }> = [];
  const balanceActions: Array<{
    action: 'create' | 'update' | 'skip';
    employeeCode: string;
    employeeName: string;
    leaveType: LeaveType;
    totalAllocated: number;
    reason: string;
  }> = [];

  for (const standardPolicy of standardPolicies) {
    const existing = await policyRepo.findOne({
      where: {
        tenantId: tenant.tenantId,
        leaveType: standardPolicy.leaveType,
      },
      order: { isActive: 'DESC', createdAt: 'ASC' },
    });

    if (!existing) {
      actions.push({
        action: 'create',
        leaveType: standardPolicy.leaveType,
        policyName: standardPolicy.policyName,
        reason: 'Missing policy component',
      });

      if (execute) {
        await policyRepo.save(policyRepo.create({ tenantId: tenant.tenantId, ...standardPolicy, isActive: true }));
      }
      continue;
    }

    const needsUpdate =
      !existing.isActive ||
      existing.applicableGender !== standardPolicy.applicableGender ||
      !existing.policyName;

    if (needsUpdate) {
      actions.push({
        action: 'update',
        leaveType: standardPolicy.leaveType,
        policyName: existing.policyName || standardPolicy.policyName,
        reason: [
          !existing.isActive ? 'reactivate' : '',
          existing.applicableGender !== standardPolicy.applicableGender ? 'fix gender applicability' : '',
          !existing.policyName ? 'fill policy name' : '',
        ].filter(Boolean).join(', '),
      });

      if (execute) {
        existing.isActive = true;
        existing.applicableGender = standardPolicy.applicableGender;
        existing.policyName = existing.policyName || standardPolicy.policyName;
        existing.description = existing.description || standardPolicy.description;
        await policyRepo.save(existing);
      }
      continue;
    }

    actions.push({
      action: 'skip',
      leaveType: standardPolicy.leaveType,
      policyName: existing.policyName,
      reason: 'Already present and active',
    });
  }

  if (initializeBalances) {
    const activeEmployees = await employeeRepo.find({
      where: {
        tenantId: tenant.tenantId,
        status: 'active' as any,
      },
      order: { employeeCode: 'ASC' },
    });
    const activePolicies = await policyRepo.find({
      where: {
        tenantId: tenant.tenantId,
        isActive: true,
      },
    });

    for (const employee of activeEmployees) {
      for (const policy of activePolicies) {
        const totalAllocated = entitlementForEmployee(policy, employee);
        const existingBalance = await balanceRepo.findOne({
          where: {
            tenantId: tenant.tenantId,
            employeeId: employee.employeeId,
            leaveType: policy.leaveType,
            year,
          },
        });

        if (!existingBalance) {
          balanceActions.push({
            action: 'create',
            employeeCode: employee.employeeCode,
            employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
            leaveType: policy.leaveType,
            totalAllocated,
            reason: 'Missing yearly employee leave balance',
          });

          if (execute) {
            await balanceRepo.save(balanceRepo.create({
              tenantId: tenant.tenantId,
              employeeId: employee.employeeId,
              policyId: policy.policyId,
              leaveType: policy.leaveType,
              year,
              totalAllocated,
              used: 0,
              pending: 0,
              carriedForward: 0,
              encashed: 0,
            }));
          }
          continue;
        }

        const needsGenderCorrection =
          [LeaveType.MATERNITY, LeaveType.PATERNITY].includes(existingBalance.leaveType) &&
          (Number(existingBalance.totalAllocated) !== totalAllocated || Number(existingBalance.carriedForward) !== 0);

        if (needsGenderCorrection) {
          balanceActions.push({
            action: 'update',
            employeeCode: employee.employeeCode,
            employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
            leaveType: policy.leaveType,
            totalAllocated,
            reason: 'Gender eligibility correction',
          });

          if (execute) {
            existingBalance.totalAllocated = totalAllocated;
            existingBalance.carriedForward = 0;
            await balanceRepo.save(existingBalance);
          }
          continue;
        }

        balanceActions.push({
          action: 'skip',
          employeeCode: employee.employeeCode,
          employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
          leaveType: policy.leaveType,
          totalAllocated: Number(existingBalance.totalAllocated) || 0,
          reason: 'Balance already exists',
        });
      }
    }
  }

  console.log(JSON.stringify({
    mode: execute ? 'execute' : 'dry-run',
    year,
    initializeBalances,
    tenant: {
      tenantId: tenant.tenantId,
      companyName: tenant.companyName,
    },
    actions,
    balanceActions,
  }, null, 2));

  await AppDataSource.destroy();
};

main().catch(async (error) => {
  console.error(error);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
