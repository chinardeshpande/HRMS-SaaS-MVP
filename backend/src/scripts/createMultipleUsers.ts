import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Employee } from '../models/Employee';
import { Tenant } from '../models/Tenant';
import { Department } from '../models/Department';
import { Designation } from '../models/Designation';
import bcrypt from 'bcrypt';
import { UserRole, EmploymentStatus } from '../../../shared/types';

async function createMultipleUsers() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const userRepo = AppDataSource.getRepository(User);
    const employeeRepo = AppDataSource.getRepository(Employee);
    const departmentRepo = AppDataSource.getRepository(Department);
    const designationRepo = AppDataSource.getRepository(Designation);

    // Find tenant
    const tenant = await tenantRepo.findOne({ where: { subdomain: 'acme' } });
    if (!tenant) {
      console.error('❌ Tenant "acme" not found!');
      process.exit(1);
    }

    // Get or create departments
    let engineering = await departmentRepo.findOne({
      where: { tenantId: tenant.tenantId, name: 'Engineering' }
    });

    if (!engineering) {
      engineering = departmentRepo.create({
        tenantId: tenant.tenantId,
        name: 'Engineering',
      });
      await departmentRepo.save(engineering);
    }

    let hr = await departmentRepo.findOne({
      where: { tenantId: tenant.tenantId, name: 'Human Resources' }
    });

    if (!hr) {
      hr = departmentRepo.create({
        tenantId: tenant.tenantId,
        name: 'Human Resources',
      });
      await departmentRepo.save(hr);
    }

    let sales = await departmentRepo.findOne({
      where: { tenantId: tenant.tenantId, name: 'Sales' }
    });

    if (!sales) {
      sales = departmentRepo.create({
        tenantId: tenant.tenantId,
        name: 'Sales',
      });
      await departmentRepo.save(sales);
    }

    // Get or create designations
    let hrManager = await designationRepo.findOne({
      where: { tenantId: tenant.tenantId, name: 'HR Manager' }
    });

    if (!hrManager) {
      hrManager = designationRepo.create({
        tenantId: tenant.tenantId,
        name: 'HR Manager',
        level: 2,
      });
      await designationRepo.save(hrManager);
    }

    let engineeringManager = await designationRepo.findOne({
      where: { tenantId: tenant.tenantId, name: 'Engineering Manager' }
    });

    if (!engineeringManager) {
      engineeringManager = designationRepo.create({
        tenantId: tenant.tenantId,
        name: 'Engineering Manager',
        level: 2,
      });
      await designationRepo.save(engineeringManager);
    }

    let softwareEngineer = await designationRepo.findOne({
      where: { tenantId: tenant.tenantId, name: 'Software Engineer' }
    });

    if (!softwareEngineer) {
      softwareEngineer = designationRepo.create({
        tenantId: tenant.tenantId,
        name: 'Software Engineer',
        level: 3,
      });
      await designationRepo.save(softwareEngineer);
    }

    let seniorEngineer = await designationRepo.findOne({
      where: { tenantId: tenant.tenantId, name: 'Senior Software Engineer' }
    });

    if (!seniorEngineer) {
      seniorEngineer = designationRepo.create({
        tenantId: tenant.tenantId,
        name: 'Senior Software Engineer',
        level: 3,
      });
      await designationRepo.save(seniorEngineer);
    }

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Define users to create
    const usersToCreate = [
      {
        email: 'hr@acme.com',
        fullName: 'Sarah Johnson',
        role: UserRole.HR_ADMIN,
        employeeData: {
          code: 'EMP001',
          firstName: 'Sarah',
          lastName: 'Johnson',
          departmentId: hr.departmentId,
          designationId: hrManager.designationId,
          phone: '+1-555-0001',
        }
      },
      {
        email: 'manager@acme.com',
        fullName: 'Michael Chen',
        role: UserRole.MANAGER,
        employeeData: {
          code: 'EMP002',
          firstName: 'Michael',
          lastName: 'Chen',
          departmentId: engineering.departmentId,
          designationId: engineeringManager.designationId,
          phone: '+1-555-0002',
        }
      },
      {
        email: 'alice@acme.com',
        fullName: 'Alice Williams',
        role: UserRole.EMPLOYEE,
        employeeData: {
          code: 'EMP003',
          firstName: 'Alice',
          lastName: 'Williams',
          departmentId: engineering.departmentId,
          designationId: seniorEngineer.designationId,
          phone: '+1-555-0003',
        }
      },
      {
        email: 'bob@acme.com',
        fullName: 'Bob Martinez',
        role: UserRole.EMPLOYEE,
        employeeData: {
          code: 'EMP004',
          firstName: 'Bob',
          lastName: 'Martinez',
          departmentId: engineering.departmentId,
          designationId: softwareEngineer.designationId,
          phone: '+1-555-0004',
        }
      },
      {
        email: 'emma@acme.com',
        fullName: 'Emma Davis',
        role: UserRole.EMPLOYEE,
        employeeData: {
          code: 'EMP005',
          firstName: 'Emma',
          lastName: 'Davis',
          departmentId: engineering.departmentId,
          designationId: softwareEngineer.designationId,
          phone: '+1-555-0005',
        }
      },
    ];

    console.log('\n👥 Creating test users and employees...\n');

    for (const userData of usersToCreate) {
      // Check if user already exists
      const existingUser = await userRepo.findOne({ where: { email: userData.email } });
      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists - skipping`);
        continue;
      }

      // Check if employee already exists by email or employee code
      let savedEmployee = await employeeRepo.findOne({
        where: [
          { email: userData.email },
          { employeeCode: userData.employeeData.code, tenantId: tenant.tenantId }
        ]
      });

      if (!savedEmployee) {
        // Create employee first
        const employee = employeeRepo.create({
          tenantId: tenant.tenantId,
          employeeCode: userData.employeeData.code,
          firstName: userData.employeeData.firstName,
          lastName: userData.employeeData.lastName,
          email: userData.email,
          phone: userData.employeeData.phone,
          departmentId: userData.employeeData.departmentId,
          designationId: userData.employeeData.designationId,
          dateOfJoining: new Date(),
          employmentType: 'full-time',
          status: EmploymentStatus.ACTIVE,
        });

        savedEmployee = await employeeRepo.save(employee);
      }

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

      console.log(`✅ Created: ${userData.fullName} (${userData.email}) - Role: ${userData.role}`);
    }

    // Set manager relationship (Bob and Emma report to Michael)
    const michael = await employeeRepo.findOne({ where: { email: 'manager@acme.com' } });
    const bob = await employeeRepo.findOne({ where: { email: 'bob@acme.com' } });
    const emma = await employeeRepo.findOne({ where: { email: 'emma@acme.com' } });
    const alice = await employeeRepo.findOne({ where: { email: 'alice@acme.com' } });

    if (michael && bob) {
      bob.managerId = michael.employeeId;
      await employeeRepo.save(bob);
    }

    if (michael && emma) {
      emma.managerId = michael.employeeId;
      await employeeRepo.save(emma);
    }

    if (michael && alice) {
      alice.managerId = michael.employeeId;
      await employeeRepo.save(alice);
    }

    console.log('\n✅ Manager relationships set');

    console.log('\n=====================================');
    console.log('TEST CREDENTIALS (All passwords: password123)');
    console.log('=====================================\n');
    console.log('👤 System Admin:');
    console.log('   Email:    admin@acme.com');
    console.log('   Password: password123');
    console.log('   Role:     System Administrator\n');

    console.log('👤 HR Manager (Sarah Johnson):');
    console.log('   Email:    hr@acme.com');
    console.log('   Password: password123');
    console.log('   Role:     HR Admin');
    console.log('   Dept:     Human Resources\n');

    console.log('👤 Engineering Manager (Michael Chen):');
    console.log('   Email:    manager@acme.com');
    console.log('   Password: password123');
    console.log('   Role:     Manager');
    console.log('   Dept:     Engineering');
    console.log('   Reports:  Alice, Bob, Emma\n');

    console.log('👤 Senior Engineer (Alice Williams):');
    console.log('   Email:    alice@acme.com');
    console.log('   Password: password123');
    console.log('   Role:     Employee');
    console.log('   Dept:     Engineering');
    console.log('   Manager:  Michael Chen\n');

    console.log('👤 Software Engineer (Bob Martinez):');
    console.log('   Email:    bob@acme.com');
    console.log('   Password: password123');
    console.log('   Role:     Employee');
    console.log('   Dept:     Engineering');
    console.log('   Manager:  Michael Chen\n');

    console.log('👤 Software Engineer (Emma Davis):');
    console.log('   Email:    emma@acme.com');
    console.log('   Password: password123');
    console.log('   Role:     Employee');
    console.log('   Dept:     Engineering');
    console.log('   Manager:  Michael Chen\n');

    console.log('=====================================');
    console.log('SUGGESTED TEST SCENARIOS:');
    console.log('=====================================\n');
    console.log('🔹 Chat Testing:');
    console.log('   - Login as Alice in Browser 1');
    console.log('   - Login as Bob in Incognito Browser 2');
    console.log('   - Start a chat conversation\n');

    console.log('🔹 HR Connect Testing:');
    console.log('   - Login as Emma (employee)');
    console.log('   - Ask HR questions via HR Connect');
    console.log('   - Login as Sarah (HR) to respond\n');

    console.log('🔹 Manager Features:');
    console.log('   - Login as Michael (manager)');
    console.log('   - View team members (Alice, Bob, Emma)');
    console.log('   - Approve/reject leave requests');
    console.log('   - Review probation cases\n');

    console.log('=====================================\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating users:', error);
    process.exit(1);
  }
}

createMultipleUsers();
