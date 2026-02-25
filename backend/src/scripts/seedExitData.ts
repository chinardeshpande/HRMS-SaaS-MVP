import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { ExitCase } from '../models/ExitCase';
import { Employee } from '../models/Employee';
import { Tenant } from '../models/Tenant';
import { ExitState } from '../models/enums/ExitState';
import { ResignationType } from '../models/enums/ResignationType';
import { EmploymentStatus } from '../../../shared/types';

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

async function seedExitData() {
  try {
    console.log('🌱 Seeding exit management data...');

    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const employeeRepo = AppDataSource.getRepository(Employee);
    const exitRepo = AppDataSource.getRepository(ExitCase);

    // Get first tenant
    const tenant = await tenantRepo.findOne({ where: {} });
    if (!tenant) {
      console.error('❌ No tenant found. Please run main seed script first.');
      return;
    }

    // Get active employees
    const employees = await employeeRepo.find({
      where: { tenantId: tenant.tenantId, status: EmploymentStatus.ACTIVE },
      relations: ['department', 'designation'],
      take: 15,
    });

    if (employees.length === 0) {
      console.error('❌ No active employees found. Please run main seed script first.');
      return;
    }

    console.log(`Found ${employees.length} employees to create exit cases for`);

    // Exit case scenarios with different states
    const exitScenarios = [
      { state: ExitState.RESIGNATION_SUBMITTED, type: ResignationType.VOLUNTARY, noticeDays: 30, daysAgo: 2 },
      { state: ExitState.RESIGNATION_SUBMITTED, type: ResignationType.VOLUNTARY, noticeDays: 60, daysAgo: 1 },
      { state: ExitState.RESIGNATION_APPROVED, type: ResignationType.VOLUNTARY, noticeDays: 30, daysAgo: 5 },
      { state: ExitState.NOTICE_PERIOD_ACTIVE, type: ResignationType.VOLUNTARY, noticeDays: 30, daysAgo: 10 },
      { state: ExitState.NOTICE_PERIOD_ACTIVE, type: ResignationType.VOLUNTARY, noticeDays: 60, daysAgo: 15 },
      { state: ExitState.CLEARANCE_INITIATED, type: ResignationType.VOLUNTARY, noticeDays: 30, daysAgo: 25 },
      { state: ExitState.CLEARANCE_IN_PROGRESS, type: ResignationType.VOLUNTARY, noticeDays: 30, daysAgo: 28 },
      { state: ExitState.ASSETS_PENDING, type: ResignationType.VOLUNTARY, noticeDays: 30, daysAgo: 29 },
      { state: ExitState.EXIT_INTERVIEW_PENDING, type: ResignationType.VOLUNTARY, noticeDays: 30, daysAgo: 30 },
      { state: ExitState.SETTLEMENT_CALCULATED, type: ResignationType.VOLUNTARY, noticeDays: 30, daysAgo: 31 },
      { state: ExitState.RESIGNATION_SUBMITTED, type: ResignationType.END_OF_CONTRACT, noticeDays: 45, daysAgo: 3 },
      { state: ExitState.NOTICE_PERIOD_ACTIVE, type: ResignationType.MUTUAL_SEPARATION, noticeDays: 30, daysAgo: 12 },
      { state: ExitState.CLEARANCE_IN_PROGRESS, type: ResignationType.VOLUNTARY, noticeDays: 30, daysAgo: 27 },
      { state: ExitState.EXIT_INTERVIEW_COMPLETED, type: ResignationType.VOLUNTARY, noticeDays: 30, daysAgo: 32 },
      { state: ExitState.SETTLEMENT_APPROVED, type: ResignationType.RETIREMENT, noticeDays: 90, daysAgo: 90 },
    ];

    const createdCases = [];

    for (let i = 0; i < Math.min(employees.length, exitScenarios.length); i++) {
      const employee = employees[i];
      const scenario = exitScenarios[i];
      const today = new Date();

      const resignationDate = addDays(today, -scenario.daysAgo);
      const lastWorkingDate = addDays(resignationDate, scenario.noticeDays);

      const exitCase = exitRepo.create({
        tenantId: tenant.tenantId,
        employeeId: employee.employeeId,
        currentState: scenario.state,
        resignationType: scenario.type,
        resignationSubmittedDate: resignationDate,
        resignationReason: getRandomReason(scenario.type),
        lastWorkingDate: lastWorkingDate,
        noticePeriodDays: scenario.noticeDays,
        isNoticePeriodBuyout: false,

        // Clearance tracking
        totalClearances: 5,
        completedClearances: getCompletedClearances(scenario.state),
        allClearancesCleared: getCompletedClearances(scenario.state) === 5,

        // Asset tracking
        totalAssets: 3,
        returnedAssets: getReturnedAssets(scenario.state),
        allAssetsReturned: getReturnedAssets(scenario.state) === 3,

        // Interview
        exitInterviewScheduledDate: isInterviewScheduled(scenario.state) ? addDays(lastWorkingDate, -5) : undefined,
        exitInterviewCompleted: scenario.state === ExitState.EXIT_INTERVIEW_COMPLETED || scenario.state === ExitState.SETTLEMENT_CALCULATED || scenario.state === ExitState.SETTLEMENT_APPROVED,
        exitInterviewCompletedDate: (scenario.state === ExitState.EXIT_INTERVIEW_COMPLETED || scenario.state === ExitState.SETTLEMENT_CALCULATED || scenario.state === ExitState.SETTLEMENT_APPROVED) ? addDays(lastWorkingDate, -3) : undefined,

        // Settlement
        settlementAmount: scenario.state === ExitState.SETTLEMENT_CALCULATED || scenario.state === ExitState.SETTLEMENT_APPROVED ? 150000 + Math.random() * 100000 : undefined,
        settlementApprovedDate: scenario.state === ExitState.SETTLEMENT_APPROVED ? addDays(today, -1) : undefined,

        createdAt: resignationDate,
        updatedAt: new Date(),
      });

      await exitRepo.save(exitCase);
      createdCases.push(exitCase);
      console.log(`✅ Created exit case for ${employee.firstName} ${employee.lastName} - ${scenario.state}`);
    }

    console.log(`\n🎉 Successfully seeded ${createdCases.length} exit cases!`);
    console.log('\nExit case distribution:');
    const stateCounts: Record<string, number> = {};
    createdCases.forEach(c => {
      stateCounts[c.currentState] = (stateCounts[c.currentState] || 0) + 1;
    });
    Object.entries(stateCounts).forEach(([state, count]) => {
      console.log(`  ${state}: ${count}`);
    });

    await AppDataSource.destroy();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding exit data:', error);
    process.exit(1);
  }
}

function getRandomReason(type: ResignationType): string {
  const reasons: Partial<Record<ResignationType, string[]>> = {
    [ResignationType.VOLUNTARY]: [
      'Better career opportunity',
      'Professional growth',
      'Career change',
    ],
    [ResignationType.END_OF_CONTRACT]: [
      'Contract period completed',
    ],
    [ResignationType.MUTUAL_SEPARATION]: [
      'Mutual agreement with management',
    ],
    [ResignationType.RETIREMENT]: [
      'Reached retirement age',
      'Voluntary early retirement',
    ],
    [ResignationType.INVOLUNTARY]: ['Performance issues'],
    [ResignationType.TERMINATION]: ['Policy violation'],
  };

  const options = reasons[type] || ['Other reasons'];
  return options[Math.floor(Math.random() * options.length)];
}

function getCompletedClearances(state: ExitState): number {
  if (state === ExitState.RESIGNATION_SUBMITTED || state === ExitState.RESIGNATION_APPROVED) return 0;
  if (state === ExitState.NOTICE_PERIOD_ACTIVE) return 0;
  if (state === ExitState.CLEARANCE_INITIATED) return 1;
  if (state === ExitState.CLEARANCE_IN_PROGRESS) return 3;
  if (state === ExitState.ASSETS_PENDING || state === ExitState.EXIT_INTERVIEW_PENDING ||
      state === ExitState.EXIT_INTERVIEW_COMPLETED || state === ExitState.SETTLEMENT_CALCULATED ||
      state === ExitState.SETTLEMENT_APPROVED) return 5;
  return 0;
}

function getReturnedAssets(state: ExitState): number {
  if (state === ExitState.ASSETS_PENDING) return 1;
  if (state === ExitState.EXIT_INTERVIEW_PENDING || state === ExitState.EXIT_INTERVIEW_COMPLETED ||
      state === ExitState.SETTLEMENT_CALCULATED || state === ExitState.SETTLEMENT_APPROVED) return 3;
  return 0;
}

function isInterviewScheduled(state: ExitState): boolean {
  return state === ExitState.EXIT_INTERVIEW_PENDING ||
         state === ExitState.EXIT_INTERVIEW_COMPLETED ||
         state === ExitState.SETTLEMENT_CALCULATED ||
         state === ExitState.SETTLEMENT_APPROVED;
}

seedExitData();
