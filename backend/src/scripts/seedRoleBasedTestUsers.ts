import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Employee } from '../models/Employee';
import { Tenant } from '../models/Tenant';
import { Department } from '../models/Department';
import { Designation } from '../models/Designation';
import bcrypt from 'bcrypt';
import { UserRole, EmploymentStatus } from '../../../shared/types';

/**
 * Comprehensive Role-Based Test User Seed Script
 *
 * Creates test users for all roles with different states:
 * - SYSTEM_ADMIN: Full system access
 * - HR_ADMIN: Two users (fully onboarded and newly onboarded)
 * - MANAGER: Three users (Engineering with reports, Sales with reports, New with no reports)
 * - EMPLOYEE: Three users (Active, Probation, New/Not onboarded)
 *
 * All passwords: password123
 */

async function seedRoleBasedTestUsers() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');
    console.log('\n🌱 Starting comprehensive role-based test user seeding...\n');

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const userRepo = AppDataSource.getRepository(User);
    const employeeRepo = AppDataSource.getRepository(Employee);
    const departmentRepo = AppDataSource.getRepository(Department);
    const designationRepo = AppDataSource.getRepository(Designation);

    // Find tenant
    const tenant = await tenantRepo.findOne({ where: { subdomain: 'acme' } });
    if (!tenant) {
      console.error('❌ Tenant "acme" not found! Please create tenant first.');
      process.exit(1);
    }

    console.log(`📋 Using tenant: ${tenant.companyName} (${tenant.subdomain})\n`);

    // ===========================
    // SETUP: Departments
    // ===========================
    console.log('📁 Setting up departments...');

    const departments = [
      { name: 'Engineering', description: 'Software Development' },
      { name: 'Sales', description: 'Sales and Business Development' },
      { name: 'Human Resources', description: 'HR and People Operations' },
      { name: 'Marketing', description: 'Marketing and Communications' },
      { name: 'Operations', description: 'Operations and Administration' },
    ];

    const deptMap: Record<string, Department> = {};

    for (const dept of departments) {
      let department = await departmentRepo.findOne({
        where: { tenantId: tenant.tenantId, name: dept.name }
      });

      if (!department) {
        department = departmentRepo.create({
          tenantId: tenant.tenantId,
          name: dept.name,
        });
        await departmentRepo.save(department);
        console.log(`  ✓ Created department: ${dept.name}`);
      } else {
        console.log(`  → Department exists: ${dept.name}`);
      }

      deptMap[dept.name] = department;
    }

    // ===========================
    // SETUP: Designations
    // ===========================
    console.log('\n💼 Setting up designations...');

    const designations = [
      { name: 'Chief Technology Officer', level: 1 },
      { name: 'VP of Engineering', level: 1 },
      { name: 'Engineering Manager', level: 2 },
      { name: 'Senior Software Engineer', level: 3 },
      { name: 'Software Engineer', level: 3 },
      { name: 'Junior Software Engineer', level: 4 },
      { name: 'Sales Manager', level: 2 },
      { name: 'Account Executive', level: 3 },
      { name: 'Sales Representative', level: 4 },
      { name: 'HR Manager', level: 2 },
      { name: 'HR Specialist', level: 3 },
      { name: 'Marketing Manager', level: 2 },
      { name: 'Operations Manager', level: 2 },
    ];

    const designMap: Record<string, Designation> = {};

    for (const desig of designations) {
      let designation = await designationRepo.findOne({
        where: { tenantId: tenant.tenantId, name: desig.name }
      });

      if (!designation) {
        designation = designationRepo.create({
          tenantId: tenant.tenantId,
          name: desig.name,
          level: desig.level,
        });
        await designationRepo.save(designation);
        console.log(`  ✓ Created designation: ${desig.name}`);
      } else {
        console.log(`  → Designation exists: ${desig.name}`);
      }

      designMap[desig.name] = designation;
    }

    const hashedPassword = await bcrypt.hash('password123', 10);

    // ===========================
    // USER CREATION DATA
    // ===========================
    console.log('\n👥 Creating comprehensive test users...\n');

    const usersToCreate = [
      // ===========================
      // SYSTEM_ADMIN
      // ===========================
      {
        email: 'admin@acme.com',
        fullName: 'System Administrator',
        role: UserRole.SYSTEM_ADMIN,
        employeeData: {
          code: 'ADMIN001',
          firstName: 'System',
          lastName: 'Administrator',
          departmentId: deptMap['Operations'].departmentId,
          designationId: designMap['Chief Technology Officer'].designationId,
          phone: '+1-555-0001',
          dateOfJoining: new Date('2024-01-01'),
          probationEndDate: new Date('2024-04-01'),
          status: EmploymentStatus.ACTIVE,
        },
        scenario: 'Full system access, all permissions',
      },

      // ===========================
      // HR_ADMIN
      // ===========================
      {
        email: 'hr.admin@acme.com',
        fullName: 'Sarah Johnson',
        role: UserRole.HR_ADMIN,
        employeeData: {
          code: 'HR001',
          firstName: 'Sarah',
          lastName: 'Johnson',
          departmentId: deptMap['Human Resources'].departmentId,
          designationId: designMap['HR Manager'].designationId,
          phone: '+1-555-0101',
          dateOfJoining: new Date('2024-02-01'),
          probationEndDate: new Date('2024-05-01'),
          status: EmploymentStatus.ACTIVE,
        },
        scenario: 'Fully onboarded HR Admin, manages all HR operations',
      },
      {
        email: 'hr.new@acme.com',
        fullName: 'Jennifer Martinez',
        role: UserRole.HR_ADMIN,
        employeeData: {
          code: 'HR002',
          firstName: 'Jennifer',
          lastName: 'Martinez',
          departmentId: deptMap['Human Resources'].departmentId,
          designationId: designMap['HR Specialist'].designationId,
          phone: '+1-555-0102',
          dateOfJoining: new Date(),
          probationEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
          status: EmploymentStatus.ACTIVE,
        },
        scenario: 'Recently joined HR Admin, just completed onboarding',
      },

      // ===========================
      // MANAGERS
      // ===========================
      {
        email: 'manager.eng@acme.com',
        fullName: 'Michael Chen',
        role: UserRole.MANAGER,
        employeeData: {
          code: 'ENG001',
          firstName: 'Michael',
          lastName: 'Chen',
          departmentId: deptMap['Engineering'].departmentId,
          designationId: designMap['Engineering Manager'].designationId,
          phone: '+1-555-0201',
          dateOfJoining: new Date('2024-01-15'),
          probationEndDate: new Date('2024-04-15'),
          status: EmploymentStatus.ACTIVE,
        },
        scenario: 'Engineering Manager with 5 direct reports',
      },
      {
        email: 'manager.sales@acme.com',
        fullName: 'David Rodriguez',
        role: UserRole.MANAGER,
        employeeData: {
          code: 'SALES001',
          firstName: 'David',
          lastName: 'Rodriguez',
          departmentId: deptMap['Sales'].departmentId,
          designationId: designMap['Sales Manager'].designationId,
          phone: '+1-555-0202',
          dateOfJoining: new Date('2024-02-01'),
          probationEndDate: new Date('2024-05-01'),
          status: EmploymentStatus.ACTIVE,
        },
        scenario: 'Sales Manager with 3 direct reports',
      },
      {
        email: 'manager.new@acme.com',
        fullName: 'Lisa Thompson',
        role: UserRole.MANAGER,
        employeeData: {
          code: 'MKT001',
          firstName: 'Lisa',
          lastName: 'Thompson',
          departmentId: deptMap['Marketing'].departmentId,
          designationId: designMap['Marketing Manager'].designationId,
          phone: '+1-555-0203',
          dateOfJoining: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          probationEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
          status: EmploymentStatus.ACTIVE,
        },
        scenario: 'Recently promoted Manager, no direct reports yet (Edge case)',
      },

      // ===========================
      // EMPLOYEES - Engineering Team
      // ===========================
      {
        email: 'employee.active@acme.com',
        fullName: 'Alice Williams',
        role: UserRole.EMPLOYEE,
        employeeData: {
          code: 'ENG101',
          firstName: 'Alice',
          lastName: 'Williams',
          departmentId: deptMap['Engineering'].departmentId,
          designationId: designMap['Senior Software Engineer'].designationId,
          phone: '+1-555-0301',
          dateOfJoining: new Date('2024-01-20'),
          probationEndDate: new Date('2024-04-20'),
          status: EmploymentStatus.ACTIVE,
        },
        scenario: 'Active employee, fully onboarded, regular daily use',
        managerId: 'manager.eng@acme.com',
      },
      {
        email: 'employee.probation@acme.com',
        fullName: 'Robert Brown',
        role: UserRole.EMPLOYEE,
        employeeData: {
          code: 'ENG102',
          firstName: 'Robert',
          lastName: 'Brown',
          departmentId: deptMap['Engineering'].departmentId,
          designationId: designMap['Software Engineer'].designationId,
          phone: '+1-555-0302',
          dateOfJoining: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          probationEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          status: EmploymentStatus.ACTIVE,
        },
        scenario: 'On probation - joined 2 months ago',
        managerId: 'manager.eng@acme.com',
      },
      {
        email: 'employee.new@acme.com',
        fullName: 'Emma Davis',
        role: UserRole.EMPLOYEE,
        employeeData: {
          code: 'ENG103',
          firstName: 'Emma',
          lastName: 'Davis',
          departmentId: deptMap['Engineering'].departmentId,
          designationId: designMap['Junior Software Engineer'].designationId,
          phone: '+1-555-0303',
          dateOfJoining: new Date(), // Today
          probationEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
          status: EmploymentStatus.ACTIVE,
        },
        scenario: 'Brand new employee, first-time login, not yet onboarded',
        managerId: 'manager.eng@acme.com',
      },

      // ===========================
      // EMPLOYEES - Engineering Team (Additional)
      // ===========================
      {
        email: 'james.wilson@acme.com',
        fullName: 'James Wilson',
        role: UserRole.EMPLOYEE,
        employeeData: {
          code: 'ENG104',
          firstName: 'James',
          lastName: 'Wilson',
          departmentId: deptMap['Engineering'].departmentId,
          designationId: designMap['Software Engineer'].designationId,
          phone: '+1-555-0304',
          dateOfJoining: new Date('2024-03-01'),
          probationEndDate: new Date('2024-06-01'),
          status: EmploymentStatus.ACTIVE,
        },
        scenario: 'Regular engineer in Michael\'s team',
        managerId: 'manager.eng@acme.com',
      },
      {
        email: 'sophia.garcia@acme.com',
        fullName: 'Sophia Garcia',
        role: UserRole.EMPLOYEE,
        employeeData: {
          code: 'ENG105',
          firstName: 'Sophia',
          lastName: 'Garcia',
          departmentId: deptMap['Engineering'].departmentId,
          designationId: designMap['Senior Software Engineer'].designationId,
          phone: '+1-555-0305',
          dateOfJoining: new Date('2024-02-15'),
          probationEndDate: new Date('2024-05-15'),
          status: EmploymentStatus.ACTIVE,
        },
        scenario: 'Senior engineer in Michael\'s team',
        managerId: 'manager.eng@acme.com',
      },

      // ===========================
      // EMPLOYEES - Sales Team
      // ===========================
      {
        email: 'john.taylor@acme.com',
        fullName: 'John Taylor',
        role: UserRole.EMPLOYEE,
        employeeData: {
          code: 'SALES101',
          firstName: 'John',
          lastName: 'Taylor',
          departmentId: deptMap['Sales'].departmentId,
          designationId: designMap['Account Executive'].designationId,
          phone: '+1-555-0401',
          dateOfJoining: new Date('2024-02-10'),
          probationEndDate: new Date('2024-05-10'),
          status: EmploymentStatus.ACTIVE,
        },
        scenario: 'Sales team member reporting to David',
        managerId: 'manager.sales@acme.com',
      },
      {
        email: 'olivia.moore@acme.com',
        fullName: 'Olivia Moore',
        role: UserRole.EMPLOYEE,
        employeeData: {
          code: 'SALES102',
          firstName: 'Olivia',
          lastName: 'Moore',
          departmentId: deptMap['Sales'].departmentId,
          designationId: designMap['Sales Representative'].designationId,
          phone: '+1-555-0402',
          dateOfJoining: new Date('2024-03-01'),
          probationEndDate: new Date('2024-06-01'),
          status: EmploymentStatus.ACTIVE,
        },
        scenario: 'Sales team member reporting to David',
        managerId: 'manager.sales@acme.com',
      },
      {
        email: 'william.anderson@acme.com',
        fullName: 'William Anderson',
        role: UserRole.EMPLOYEE,
        employeeData: {
          code: 'SALES103',
          firstName: 'William',
          lastName: 'Anderson',
          departmentId: deptMap['Sales'].departmentId,
          designationId: designMap['Account Executive'].designationId,
          phone: '+1-555-0403',
          dateOfJoining: new Date('2024-01-25'),
          probationEndDate: new Date('2024-04-25'),
          status: EmploymentStatus.ACTIVE,
        },
        scenario: 'Senior sales team member reporting to David',
        managerId: 'manager.sales@acme.com',
      },
    ];

    // ===========================
    // CREATE USERS & EMPLOYEES
    // ===========================

    const createdEmployees: Record<string, Employee> = {};

    for (const userData of usersToCreate) {
      // Check if user already exists
      const existingUser = await userRepo.findOne({
        where: { email: userData.email, tenantId: tenant.tenantId }
      });

      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists - skipping`);

        // Still fetch the employee for manager relationship setup
        const employee = await employeeRepo.findOne({
          where: { email: userData.email, tenantId: tenant.tenantId }
        });
        if (employee) {
          createdEmployees[userData.email] = employee;
        }
        continue;
      }

      // Check if employee already exists
      let savedEmployee = await employeeRepo.findOne({
        where: [
          { email: userData.email, tenantId: tenant.tenantId },
          { employeeCode: userData.employeeData.code, tenantId: tenant.tenantId }
        ]
      });

      if (!savedEmployee) {
        // Create employee
        const employee = employeeRepo.create({
          tenantId: tenant.tenantId,
          employeeCode: userData.employeeData.code,
          firstName: userData.employeeData.firstName,
          lastName: userData.employeeData.lastName,
          email: userData.email,
          phone: userData.employeeData.phone,
          departmentId: userData.employeeData.departmentId,
          designationId: userData.employeeData.designationId,
          dateOfJoining: userData.employeeData.dateOfJoining,
          probationEndDate: userData.employeeData.probationEndDate,
          employmentType: 'full-time',
          status: userData.employeeData.status,
        });

        savedEmployee = await employeeRepo.save(employee);
      }

      createdEmployees[userData.email] = savedEmployee;

      // Create user
      const user = userRepo.create({
        tenantId: tenant.tenantId,
        email: userData.email,
        passwordHash: hashedPassword,
        fullName: userData.fullName,
        role: userData.role,
        employeeId: savedEmployee.employeeId,
      });

      await userRepo.save(user);

      console.log(`✅ ${userData.role.toUpperCase().padEnd(15)} | ${userData.fullName.padEnd(25)} | ${userData.email}`);
      console.log(`   📋 Scenario: ${userData.scenario}`);
    }

    // ===========================
    // SET MANAGER RELATIONSHIPS
    // ===========================
    console.log('\n👔 Setting up manager-employee relationships...\n');

    const managerRelationships = usersToCreate.filter(u => u.managerId);

    for (const rel of managerRelationships) {
      const employee = createdEmployees[rel.email];
      const manager = createdEmployees[rel.managerId!];

      if (employee && manager) {
        employee.managerId = manager.employeeId;
        await employeeRepo.save(employee);
        console.log(`  ✓ ${employee.fullName} → reports to → ${manager.fullName}`);
      }
    }

    // ===========================
    // DISPLAY TEST CREDENTIALS
    // ===========================
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    TEST CREDENTIALS                           ');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('All passwords: password123');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('🔐 SYSTEM_ADMIN\n');
    console.log('  📧 admin@acme.com');
    console.log('  👤 System Administrator');
    console.log('  📝 Full system access, all permissions\n');

    console.log('─────────────────────────────────────────────────────────────\n');
    console.log('👨‍💼 HR_ADMIN\n');
    console.log('  📧 hr.admin@acme.com');
    console.log('  👤 Sarah Johnson (HR Manager)');
    console.log('  📝 Fully onboarded, manages all HR operations\n');
    console.log('  📧 hr.new@acme.com');
    console.log('  👤 Jennifer Martinez (HR Specialist)');
    console.log('  📝 Recently joined, just completed onboarding\n');

    console.log('─────────────────────────────────────────────────────────────\n');
    console.log('👔 MANAGERS\n');
    console.log('  📧 manager.eng@acme.com');
    console.log('  👤 Michael Chen (Engineering Manager)');
    console.log('  📝 Has 5 direct reports (Alice, Robert, Emma, James, Sophia)');
    console.log('  🏢 Engineering Department\n');
    console.log('  📧 manager.sales@acme.com');
    console.log('  👤 David Rodriguez (Sales Manager)');
    console.log('  📝 Has 3 direct reports (John, Olivia, William)');
    console.log('  🏢 Sales Department\n');
    console.log('  📧 manager.new@acme.com');
    console.log('  👤 Lisa Thompson (Marketing Manager)');
    console.log('  📝 Recently promoted, NO direct reports (Edge case)');
    console.log('  🏢 Marketing Department\n');

    console.log('─────────────────────────────────────────────────────────────\n');
    console.log('👤 EMPLOYEES\n');
    console.log('  📧 employee.active@acme.com');
    console.log('  👤 Alice Williams (Senior Software Engineer)');
    console.log('  📝 Active, fully onboarded, regular daily use');
    console.log('  👔 Reports to: Michael Chen\n');
    console.log('  📧 employee.probation@acme.com');
    console.log('  👤 Robert Brown (Software Engineer)');
    console.log('  📝 On probation - joined 2 months ago');
    console.log('  👔 Reports to: Michael Chen\n');
    console.log('  📧 employee.new@acme.com');
    console.log('  👤 Emma Davis (Junior Software Engineer)');
    console.log('  📝 Brand new, first-time login experience');
    console.log('  👔 Reports to: Michael Chen\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    TEST SCENARIOS                             ');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('🧪 EMPLOYEE JOURNEY:');
    console.log('  1. Login as employee.new@acme.com');
    console.log('     → First-time login → Onboarding wizard');
    console.log('  2. Login as employee.active@acme.com');
    console.log('     → Daily use → Apply leave → Check attendance');
    console.log('  3. Login as employee.probation@acme.com');
    console.log('     → Probation status → Limited features\n');

    console.log('🧪 MANAGER JOURNEY:');
    console.log('  1. Login as manager.eng@acme.com');
    console.log('     → View 5 direct reports → Approve leave requests');
    console.log('  2. Login as manager.sales@acme.com');
    console.log('     → Manage 3 sales team members → Team performance');
    console.log('  3. Login as manager.new@acme.com');
    console.log('     → Edge case: Manager with NO reports → Empty state\n');

    console.log('🧪 HR_ADMIN JOURNEY:');
    console.log('  1. Login as hr.admin@acme.com');
    console.log('     → Full employee management → Onboarding workflows');
    console.log('  2. Login as hr.new@acme.com');
    console.log('     → Recently onboarded HR Admin → Learning system\n');

    console.log('🧪 SYSTEM_ADMIN JOURNEY:');
    console.log('  1. Login as admin@acme.com');
    console.log('     → Full system access → Organization settings');
    console.log('     → User management → System configuration\n');

    console.log('🧪 CROSS-ROLE TESTING:');
    console.log('  • Manager approving employee leave requests');
    console.log('  • HR Admin managing onboarding for employee.new@acme.com');
    console.log('  • Employee-to-Employee chat (Alice ↔ Robert)');
    console.log('  • HR Connect: Employee questions → HR responses');
    console.log('  • Performance reviews: Manager → Employee\n');

    console.log('═══════════════════════════════════════════════════════════════\n');

    await AppDataSource.destroy();
    console.log('✅ Seeding complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    process.exit(1);
  }
}

seedRoleBasedTestUsers();
