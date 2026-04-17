import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Employee } from '../models/Employee';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import { UserRole } from '../../../shared/types';
import logger from '../utils/logger';
import bcrypt from 'bcrypt';

/**
 * Setup test users and reporting hierarchy for Campuslife tenant
 *
 * Structure:
 * - 1 HR Admin (Chinar Deshpande)
 * - 3 Managers (each managing 5 employees)
 * - 15 Employees (5 under each manager)
 */
async function setupTestUsers() {
  try {
    logger.info('🚀 Starting Campuslife test user setup...');

    await AppDataSource.initialize();
    logger.info('✅ Database connection established');

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const employeeRepo = AppDataSource.getRepository(Employee);
    const userRepo = AppDataSource.getRepository(User);

    // Find Campuslife tenant
    const tenant = await tenantRepo.findOne({
      where: { companyName: 'Campuslife' }
    });

    if (!tenant) {
      logger.error('❌ Campuslife tenant not found');
      process.exit(1);
    }

    logger.info(`Found tenant: ${tenant.companyName} (ID: ${tenant.tenantId})`);

    // Get all employees
    const allEmployees = await employeeRepo.find({
      where: { tenantId: tenant.tenantId },
      order: { employeeCode: 'ASC' }
    });

    logger.info(`Found ${allEmployees.length} employees`);

    if (allEmployees.length < 19) {
      logger.error('❌ Need at least 19 employees (1 HR + 3 Managers + 15 Employees)');
      process.exit(1);
    }

    // Default password for all test users
    const defaultPassword = 'Test@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // ===== 1. CREATE HR ADMIN =====
    logger.info('\n📋 Step 1: Creating HR Admin user');

    const hrEmployee = allEmployees[0]; // EMP0079 - Chinar Deshpande

    // Check if user already exists
    let hrUser = await userRepo.findOne({
      where: { employeeId: hrEmployee.employeeId }
    });

    if (!hrUser) {
      hrUser = userRepo.create({
        tenantId: tenant.tenantId,
        email: hrEmployee.email,
        passwordHash: hashedPassword,
        fullName: `${hrEmployee.firstName} ${hrEmployee.lastName}`,
        role: UserRole.HR_ADMIN,
        employeeId: hrEmployee.employeeId,
        isActive: true,
      });
      await userRepo.save(hrUser);
      logger.info(`✅ Created HR Admin: ${hrEmployee.email} (${hrEmployee.employeeCode})`);
    } else {
      logger.info(`⏭️  HR Admin already exists: ${hrEmployee.email}`);
    }

    // ===== 2. CREATE MANAGERS =====
    logger.info('\n📋 Step 2: Creating Manager users');

    const managerEmployees = allEmployees.slice(1, 4); // THG106, THG105, THG104
    const managers = [];

    for (const managerEmp of managerEmployees) {
      let managerUser = await userRepo.findOne({
        where: { employeeId: managerEmp.employeeId }
      });

      if (!managerUser) {
        managerUser = userRepo.create({
          tenantId: tenant.tenantId,
          email: managerEmp.email,
          passwordHash: hashedPassword,
          fullName: `${managerEmp.firstName} ${managerEmp.lastName}`,
          role: UserRole.MANAGER,
          employeeId: managerEmp.employeeId,
          isActive: true,
        });
        await userRepo.save(managerUser);
        logger.info(`✅ Created Manager: ${managerEmp.email} (${managerEmp.employeeCode})`);
      } else {
        logger.info(`⏭️  Manager already exists: ${managerEmp.email}`);
      }

      managers.push(managerEmp);
    }

    // ===== 3. CREATE EMPLOYEES =====
    logger.info('\n📋 Step 3: Creating Employee users');

    const regularEmployees = allEmployees.slice(4, 19); // Next 15 employees
    const employeeUsers = [];

    for (const emp of regularEmployees) {
      let empUser = await userRepo.findOne({
        where: { employeeId: emp.employeeId }
      });

      if (!empUser) {
        empUser = userRepo.create({
          tenantId: tenant.tenantId,
          email: emp.email,
          passwordHash: hashedPassword,
          fullName: `${emp.firstName} ${emp.lastName}`,
          role: UserRole.EMPLOYEE,
          employeeId: emp.employeeId,
          isActive: true,
        });
        await userRepo.save(empUser);
        logger.info(`✅ Created Employee: ${emp.email} (${emp.employeeCode})`);
      } else {
        logger.info(`⏭️  Employee already exists: ${emp.email}`);
      }

      employeeUsers.push(emp);
    }

    // ===== 4. SET UP REPORTING HIERARCHY =====
    logger.info('\n📋 Step 4: Setting up reporting hierarchy');

    // Distribute 15 employees among 3 managers (5 each)
    let updateCount = 0;
    for (let i = 0; i < 15; i++) {
      const managerIndex = Math.floor(i / 5); // 0-4 → Manager 0, 5-9 → Manager 1, 10-14 → Manager 2
      const employee = regularEmployees[i];
      const manager = managers[managerIndex];

      if (employee.managerId !== manager.employeeId) {
        employee.managerId = manager.employeeId;
        await employeeRepo.save(employee);
        updateCount++;
        logger.info(`  ✅ ${employee.employeeCode} → reports to → ${manager.employeeCode}`);
      }
    }

    // Managers report to HR Admin
    for (const manager of managers) {
      if (manager.managerId !== hrEmployee.employeeId) {
        manager.managerId = hrEmployee.employeeId;
        await employeeRepo.save(manager);
        updateCount++;
        logger.info(`  ✅ ${manager.employeeCode} (Manager) → reports to → ${hrEmployee.employeeCode} (HR Admin)`);
      }
    }

    // ===== SUMMARY =====
    logger.info('\n✅ Setup completed successfully!');
    logger.info('\n📊 Summary:');
    logger.info(`   HR Admin: 1`);
    logger.info(`   Managers: ${managers.length}`);
    logger.info(`   Employees: ${employeeUsers.length}`);
    logger.info(`   Hierarchy updates: ${updateCount}`);
    logger.info(`\n🔑 Default Password: ${defaultPassword}`);
    logger.info('\n📋 Login Credentials:');
    logger.info(`\n   HR Admin:`);
    logger.info(`   - Email: ${hrEmployee.email}`);
    logger.info(`   - Password: ${defaultPassword}`);
    logger.info(`\n   Managers:`);
    managers.forEach((m, idx) => {
      logger.info(`   ${idx + 1}. ${m.email} - Password: ${defaultPassword}`);
    });
    logger.info(`\n   Employees:`);
    employeeUsers.slice(0, 5).forEach((e, idx) => {
      logger.info(`   ${idx + 1}. ${e.email} - Password: ${defaultPassword}`);
    });
    logger.info(`   ... and ${employeeUsers.length - 5} more employees\n`);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Error setting up test users:', error);
    process.exit(1);
  }
}

setupTestUsers();
