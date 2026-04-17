import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Employee } from '../models/Employee';
import { LeaveBalance } from '../models/LeaveBalance';
import { LeavePolicy } from '../models/LeavePolicy';
import { Tenant } from '../models/Tenant';
import { EmploymentStatus } from '../../../shared/types';
import logger from '../utils/logger';

/**
 * Initialize leave balances for all Campuslife employees
 *
 * Logic:
 * - Calculate pro-rata allocation based on joining date
 * - For employees who joined mid-year, allocate proportional leaves
 * - Skip employees who already have leave balances for current year
 */
async function initializeLeaveBalances() {
  try {
    logger.info('🚀 Starting leave balance initialization for Campuslife...');

    await AppDataSource.initialize();
    logger.info('✅ Database connection established');

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const employeeRepo = AppDataSource.getRepository(Employee);
    const policyRepo = AppDataSource.getRepository(LeavePolicy);
    const balanceRepo = AppDataSource.getRepository(LeaveBalance);

    // Find Campuslife tenant
    const tenant = await tenantRepo.findOne({
      where: { companyName: 'Campuslife' }
    });

    if (!tenant) {
      logger.error('❌ Campuslife tenant not found');
      process.exit(1);
    }

    logger.info(`Found tenant: ${tenant.companyName} (ID: ${tenant.tenantId})`);

    // Get all active leave policies
    const policies = await policyRepo.find({
      where: { tenantId: tenant.tenantId, isActive: true }
    });

    if (policies.length === 0) {
      logger.error('❌ No active leave policies found for Campuslife');
      process.exit(1);
    }

    logger.info(`Found ${policies.length} active leave policies`);
    policies.forEach(p => {
      logger.info(`  - ${p.policyName} (${p.leaveType}): ${p.totalLeaves} days/year`);
    });

    // Get all active employees
    const employees = await employeeRepo.find({
      where: { tenantId: tenant.tenantId, status: EmploymentStatus.ACTIVE }
    });

    logger.info(`\nFound ${employees.length} active employees`);

    const currentYear = new Date().getFullYear();
    logger.info(`Current year: ${currentYear}`);

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each employee
    for (const employee of employees) {
      logger.info(`\n📋 Processing: ${employee.employeeCode} - ${employee.firstName} ${employee.lastName}`);
      logger.info(`   Joining Date: ${employee.dateOfJoining}`);

      // Calculate pro-rata multiplier based on joining date
      const joiningDate = new Date(employee.dateOfJoining);
      const joiningYear = joiningDate.getFullYear();
      const joiningMonth = joiningDate.getMonth(); // 0-11

      let proRataMultiplier = 1.0;

      if (joiningYear === currentYear) {
        // Joined this year - calculate pro-rata
        const monthsRemaining = 12 - joiningMonth;
        proRataMultiplier = monthsRemaining / 12;
        logger.info(`   Joined in ${currentYear} - Pro-rata: ${(proRataMultiplier * 100).toFixed(0)}%`);
      } else if (joiningYear > currentYear) {
        // Future joining date - skip
        logger.info(`   ⏭️  Skipping - Joining date is in future`);
        skippedCount++;
        continue;
      } else {
        // Joined before current year - full allocation
        logger.info(`   Full allocation (joined before ${currentYear})`);
      }

      // Create leave balance for each policy
      for (const policy of policies) {
        try {
          // Check if balance already exists
          const existingBalance = await balanceRepo.findOne({
            where: {
              employeeId: employee.employeeId,
              leaveType: policy.leaveType,
              year: currentYear
            }
          });

          if (existingBalance) {
            logger.info(`   ⏭️  ${policy.leaveType}: Already exists (${existingBalance.totalAllocated} days)`);
            skippedCount++;
            continue;
          }

          // Calculate allocated leaves
          let allocatedLeaves = policy.totalLeaves * proRataMultiplier;

          // Round to 1 decimal place
          allocatedLeaves = Math.round(allocatedLeaves * 10) / 10;

          // Create leave balance
          const balance = balanceRepo.create({
            employeeId: employee.employeeId,
            tenantId: tenant.tenantId,
            policyId: policy.policyId,
            leaveType: policy.leaveType,
            year: currentYear,
            totalAllocated: allocatedLeaves,
            used: 0,
            pending: 0,
            carriedForward: 0,
            encashed: 0,
          });

          await balanceRepo.save(balance);
          logger.info(`   ✅ ${policy.leaveType}: Allocated ${allocatedLeaves} days`);
          createdCount++;

        } catch (error: any) {
          logger.error(`   ❌ Error creating ${policy.leaveType} balance:`, error.message);
          errorCount++;
        }
      }
    }

    // Summary
    logger.info('\n✅ Leave balance initialization completed!');
    logger.info('\n📊 Summary:');
    logger.info(`   Total Employees: ${employees.length}`);
    logger.info(`   Leave Policies: ${policies.length}`);
    logger.info(`   Balances Created: ${createdCount}`);
    logger.info(`   Already Exists: ${skippedCount}`);
    logger.info(`   Errors: ${errorCount}`);
    logger.info(`   Year: ${currentYear}\n`);

    // Show sample balances
    logger.info('📋 Sample Leave Balances:');
    const sampleEmployee = employees[0];
    const sampleBalances = await balanceRepo.find({
      where: {
        employeeId: sampleEmployee.employeeId,
        year: currentYear
      },
      relations: ['policy']
    });

    logger.info(`\n   Employee: ${sampleEmployee.employeeCode} - ${sampleEmployee.firstName} ${sampleEmployee.lastName}`);
    sampleBalances.forEach(b => {
      logger.info(`   - ${b.leaveType}: ${b.totalAllocated} allocated, ${b.available} available`);
    });
    logger.info('');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Error initializing leave balances:', error);
    process.exit(1);
  }
}

initializeLeaveBalances();
