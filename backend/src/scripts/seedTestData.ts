import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Employee } from '../models/Employee';
import { Tenant } from '../models/Tenant';
import { Department } from '../models/Department';
import { Designation } from '../models/Designation';
import { LeavePolicy, LeaveType } from '../models/LeavePolicy';
import { LeaveBalance } from '../models/LeaveBalance';
import { AttendancePolicy } from '../models/AttendancePolicy';
import { UserRole, EmploymentStatus } from '../../../shared/types';
import bcrypt from 'bcrypt';

async function seedTestData() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Get repositories
    const userRepo = AppDataSource.getRepository(User);
    const employeeRepo = AppDataSource.getRepository(Employee);
    const tenantRepo = AppDataSource.getRepository(Tenant);
    const deptRepo = AppDataSource.getRepository(Department);
    const desigRepo = AppDataSource.getRepository(Designation);
    const leavePolicyRepo = AppDataSource.getRepository(LeavePolicy);
    const leaveBalanceRepo = AppDataSource.getRepository(LeaveBalance);
    const attendancePolicyRepo = AppDataSource.getRepository(AttendancePolicy);

    // 1. Create Test Tenant
    console.log('📦 Creating test tenant...');
    const tenant = tenantRepo.create({
      companyName: 'Acme Corporation',
      subdomain: 'acme',
      planType: 'professional',
      status: EmploymentStatus.ACTIVE,
    });
    await tenantRepo.save(tenant);
    console.log(`✅ Tenant created: ${tenant.companyName}`);

    // 2. Create Departments
    console.log('🏢 Creating departments...');
    const engineering = deptRepo.create({
      tenantId: tenant.tenantId,
      name: 'Engineering',
    });
    await deptRepo.save(engineering);

    const hr = deptRepo.create({
      tenantId: tenant.tenantId,
      name: 'Human Resources',
    });
    await deptRepo.save(hr);

    const sales = deptRepo.create({
      tenantId: tenant.tenantId,
      name: 'Sales',
    });
    await deptRepo.save(sales);
    console.log('✅ Departments created');

    // 3. Create Designations
    console.log('👔 Creating designations...');
    const ceo = desigRepo.create({
      tenantId: tenant.tenantId,
      name: 'CEO',
      level: 1,
    });
    await desigRepo.save(ceo);

    const vpEngineering = desigRepo.create({
      tenantId: tenant.tenantId,
      name: 'VP Engineering',
      level: 2,
    });
    await desigRepo.save(vpEngineering);

    const hrManager = desigRepo.create({
      tenantId: tenant.tenantId,
      name: 'HR Manager',
      level: 2,
    });
    await desigRepo.save(hrManager);

    const salesManager = desigRepo.create({
      tenantId: tenant.tenantId,
      name: 'Sales Manager',
      level: 2,
    });
    await desigRepo.save(salesManager);

    const engManager = desigRepo.create({
      tenantId: tenant.tenantId,
      name: 'Engineering Manager',
      level: 3,
    });
    await desigRepo.save(engManager);

    const seniorEngineer = desigRepo.create({
      tenantId: tenant.tenantId,
      name: 'Senior Software Engineer',
      level: 4,
    });
    await desigRepo.save(seniorEngineer);

    const engineerII = desigRepo.create({
      tenantId: tenant.tenantId,
      name: 'Software Engineer II',
      level: 4,
    });
    await desigRepo.save(engineerII);

    const juniorEngineer = desigRepo.create({
      tenantId: tenant.tenantId,
      name: 'Junior Software Engineer',
      level: 5,
    });
    await desigRepo.save(juniorEngineer);

    const hrCoordinator = desigRepo.create({
      tenantId: tenant.tenantId,
      name: 'HR Coordinator',
      level: 4,
    });
    await desigRepo.save(hrCoordinator);

    const hrAssistant = desigRepo.create({
      tenantId: tenant.tenantId,
      name: 'HR Assistant',
      level: 5,
    });
    await desigRepo.save(hrAssistant);

    const seniorSalesRep = desigRepo.create({
      tenantId: tenant.tenantId,
      name: 'Senior Sales Representative',
      level: 4,
    });
    await desigRepo.save(seniorSalesRep);

    const salesRep = desigRepo.create({
      tenantId: tenant.tenantId,
      name: 'Sales Representative',
      level: 5,
    });
    await desigRepo.save(salesRep);

    console.log('✅ Designations created');

    // 4. Create Leave Policies
    console.log('📋 Creating leave policies...');
    const sickLeavePolicy = leavePolicyRepo.create({
      tenantId: tenant.tenantId,
      policyName: 'Sick Leave Policy',
      leaveType: LeaveType.SICK,
      totalLeaves: 10,
      maxConsecutiveDays: 5,
      carryForward: false,
      requiresApproval: true,
      isActive: true,
    });
    await leavePolicyRepo.save(sickLeavePolicy);

    const casualLeavePolicy = leavePolicyRepo.create({
      tenantId: tenant.tenantId,
      policyName: 'Casual Leave Policy',
      leaveType: LeaveType.CASUAL,
      totalLeaves: 12,
      maxConsecutiveDays: 3,
      carryForward: true,
      maxCarryForward: 5,
      requiresApproval: true,
      isActive: true,
    });
    await leavePolicyRepo.save(casualLeavePolicy);

    const earnedLeavePolicy = leavePolicyRepo.create({
      tenantId: tenant.tenantId,
      policyName: 'Earned Leave Policy',
      leaveType: LeaveType.EARNED,
      totalLeaves: 15,
      maxConsecutiveDays: 10,
      carryForward: true,
      maxCarryForward: 10,
      encashable: true,
      requiresApproval: true,
      isActive: true,
    });
    await leavePolicyRepo.save(earnedLeavePolicy);
    console.log('✅ Leave policies created');

    // 5. Create Attendance Policy
    console.log('⏰ Creating attendance policy...');
    const attendancePolicy = attendancePolicyRepo.create({
      tenantId: tenant.tenantId,
      policyName: 'Standard Attendance Policy',
      standardCheckIn: '09:00:00',
      standardCheckOut: '18:00:00',
      lateGraceMinutes: 15,
      earlyGraceMinutes: 15,
      requiredWorkMinutes: 480, // 8 hours
      halfDayMinutes: 240, // 4 hours
      workingDays: [1, 2, 3, 4, 5], // Monday to Friday
      isActive: true,
    });
    await attendancePolicyRepo.save(attendancePolicy);
    console.log('✅ Attendance policy created');

    // 6. Create Test Users & Employees
    console.log('👥 Creating test users and employees...');

    const hashedPassword = await bcrypt.hash('password123', 10);
    const allEmployees: Employee[] = [];

    // Helper function to create employee and user
    async function createEmployeeAndUser(data: {
      code: string;
      firstName: string;
      lastName: string;
      deptId: string;
      desigId: string;
      role: UserRole;
      managerId?: string;
      joinDate: string;
    }) {
      const employee = employeeRepo.create({
        tenantId: tenant.tenantId,
        employeeCode: data.code,
        firstName: data.firstName,
        lastName: data.lastName,
        email: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@acme.com`,
        phone: `123456${data.code.replace('EMP', '').padStart(4, '0')}`,
        departmentId: data.deptId,
        designationId: data.desigId,
        managerId: data.managerId,
        dateOfJoining: data.joinDate,
        employmentType: 'full-time',
        status: EmploymentStatus.ACTIVE,
      });
      await employeeRepo.save(employee);

      const user = userRepo.create({
        tenantId: tenant.tenantId,
        email: employee.email,
        passwordHash: hashedPassword,
        fullName: `${data.firstName} ${data.lastName}`,
        role: data.role,
        employeeId: employee.employeeId,
        isActive: true,
      });
      await userRepo.save(user);

      allEmployees.push(employee);
      return employee;
    }

    // Admin (CEO)
    const adminEmployee = await createEmployeeAndUser({
      code: 'EMP001',
      firstName: 'Admin',
      lastName: 'User',
      deptId: hr.departmentId,
      desigId: ceo.designationId,
      role: UserRole.SYSTEM_ADMIN,
      joinDate: '2023-01-01',
    });

    // HR Department (5 employees)
    const hrManagerEmp = await createEmployeeAndUser({
      code: 'EMP002',
      firstName: 'Sarah',
      lastName: 'Johnson',
      deptId: hr.departmentId,
      desigId: hrManager.designationId,
      role: UserRole.HR_ADMIN,
      joinDate: '2023-02-01',
    });

    const hrCoordEmp = await createEmployeeAndUser({
      code: 'EMP003',
      firstName: 'Emily',
      lastName: 'Brown',
      deptId: hr.departmentId,
      desigId: hrCoordinator.designationId,
      role: UserRole.HR_ADMIN,
      managerId: hrManagerEmp.employeeId,
      joinDate: '2023-03-01',
    });

    await createEmployeeAndUser({
      code: 'EMP004',
      firstName: 'David',
      lastName: 'Martinez',
      deptId: hr.departmentId,
      desigId: hrAssistant.designationId,
      role: UserRole.EMPLOYEE,
      managerId: hrManagerEmp.employeeId,
      joinDate: '2023-04-01',
    });

    await createEmployeeAndUser({
      code: 'EMP005',
      firstName: 'Lisa',
      lastName: 'Anderson',
      deptId: hr.departmentId,
      desigId: hrAssistant.designationId,
      role: UserRole.EMPLOYEE,
      managerId: hrManagerEmp.employeeId,
      joinDate: '2023-05-01',
    });

    // Engineering Department (15 employees)
    const vpEngEmp = await createEmployeeAndUser({
      code: 'EMP006',
      firstName: 'John',
      lastName: 'Smith',
      deptId: engineering.departmentId,
      desigId: vpEngineering.designationId,
      role: UserRole.MANAGER,
      joinDate: '2023-02-15',
    });

    const engManager1 = await createEmployeeAndUser({
      code: 'EMP007',
      firstName: 'Michael',
      lastName: 'Chen',
      deptId: engineering.departmentId,
      desigId: engManager.designationId,
      role: UserRole.MANAGER,
      managerId: vpEngEmp.employeeId,
      joinDate: '2023-03-15',
    });

    const engManager2 = await createEmployeeAndUser({
      code: 'EMP008',
      firstName: 'Jessica',
      lastName: 'Taylor',
      deptId: engineering.departmentId,
      desigId: engManager.designationId,
      role: UserRole.MANAGER,
      managerId: vpEngEmp.employeeId,
      joinDate: '2023-04-15',
    });

    // Senior Engineers
    await createEmployeeAndUser({
      code: 'EMP009',
      firstName: 'Robert',
      lastName: 'Wilson',
      deptId: engineering.departmentId,
      desigId: seniorEngineer.designationId,
      role: UserRole.EMPLOYEE,
      managerId: engManager1.employeeId,
      joinDate: '2023-05-01',
    });

    await createEmployeeAndUser({
      code: 'EMP010',
      firstName: 'Jennifer',
      lastName: 'Lee',
      deptId: engineering.departmentId,
      desigId: seniorEngineer.designationId,
      role: UserRole.EMPLOYEE,
      managerId: engManager1.employeeId,
      joinDate: '2023-05-15',
    });

    await createEmployeeAndUser({
      code: 'EMP011',
      firstName: 'Daniel',
      lastName: 'Garcia',
      deptId: engineering.departmentId,
      desigId: seniorEngineer.designationId,
      role: UserRole.EMPLOYEE,
      managerId: engManager2.employeeId,
      joinDate: '2023-06-01',
    });

    // Software Engineers II
    await createEmployeeAndUser({
      code: 'EMP012',
      firstName: 'Alice',
      lastName: 'Williams',
      deptId: engineering.departmentId,
      desigId: engineerII.designationId,
      role: UserRole.EMPLOYEE,
      managerId: engManager1.employeeId,
      joinDate: '2023-06-15',
    });

    await createEmployeeAndUser({
      code: 'EMP013',
      firstName: 'Christopher',
      lastName: 'Rodriguez',
      deptId: engineering.departmentId,
      desigId: engineerII.designationId,
      role: UserRole.EMPLOYEE,
      managerId: engManager1.employeeId,
      joinDate: '2023-07-01',
    });

    await createEmployeeAndUser({
      code: 'EMP014',
      firstName: 'Michelle',
      lastName: 'White',
      deptId: engineering.departmentId,
      desigId: engineerII.designationId,
      role: UserRole.EMPLOYEE,
      managerId: engManager2.employeeId,
      joinDate: '2023-07-15',
    });

    await createEmployeeAndUser({
      code: 'EMP015',
      firstName: 'Kevin',
      lastName: 'Thomas',
      deptId: engineering.departmentId,
      desigId: engineerII.designationId,
      role: UserRole.EMPLOYEE,
      managerId: engManager2.employeeId,
      joinDate: '2023-08-01',
    });

    // Junior Engineers
    await createEmployeeAndUser({
      code: 'EMP016',
      firstName: 'Amanda',
      lastName: 'Jackson',
      deptId: engineering.departmentId,
      desigId: juniorEngineer.designationId,
      role: UserRole.EMPLOYEE,
      managerId: engManager1.employeeId,
      joinDate: '2023-08-15',
    });

    await createEmployeeAndUser({
      code: 'EMP017',
      firstName: 'Brian',
      lastName: 'Harris',
      deptId: engineering.departmentId,
      desigId: juniorEngineer.designationId,
      role: UserRole.EMPLOYEE,
      managerId: engManager1.employeeId,
      joinDate: '2023-09-01',
    });

    await createEmployeeAndUser({
      code: 'EMP018',
      firstName: 'Nicole',
      lastName: 'Martin',
      deptId: engineering.departmentId,
      desigId: juniorEngineer.designationId,
      role: UserRole.EMPLOYEE,
      managerId: engManager2.employeeId,
      joinDate: '2023-09-15',
    });

    await createEmployeeAndUser({
      code: 'EMP019',
      firstName: 'Ryan',
      lastName: 'Thompson',
      deptId: engineering.departmentId,
      desigId: juniorEngineer.designationId,
      role: UserRole.EMPLOYEE,
      managerId: engManager2.employeeId,
      joinDate: '2023-10-01',
    });

    await createEmployeeAndUser({
      code: 'EMP020',
      firstName: 'Stephanie',
      lastName: 'Moore',
      deptId: engineering.departmentId,
      desigId: juniorEngineer.designationId,
      role: UserRole.EMPLOYEE,
      managerId: engManager2.employeeId,
      joinDate: '2023-10-15',
    });

    // Sales Department (10 employees)
    const salesManagerEmp = await createEmployeeAndUser({
      code: 'EMP021',
      firstName: 'Matthew',
      lastName: 'Clark',
      deptId: sales.departmentId,
      desigId: salesManager.designationId,
      role: UserRole.MANAGER,
      joinDate: '2023-03-01',
    });

    // Senior Sales Reps
    await createEmployeeAndUser({
      code: 'EMP022',
      firstName: 'Ashley',
      lastName: 'Lewis',
      deptId: sales.departmentId,
      desigId: seniorSalesRep.designationId,
      role: UserRole.EMPLOYEE,
      managerId: salesManagerEmp.employeeId,
      joinDate: '2023-04-01',
    });

    await createEmployeeAndUser({
      code: 'EMP023',
      firstName: 'Brandon',
      lastName: 'Walker',
      deptId: sales.departmentId,
      desigId: seniorSalesRep.designationId,
      role: UserRole.EMPLOYEE,
      managerId: salesManagerEmp.employeeId,
      joinDate: '2023-05-01',
    });

    await createEmployeeAndUser({
      code: 'EMP024',
      firstName: 'Melissa',
      lastName: 'Hall',
      deptId: sales.departmentId,
      desigId: seniorSalesRep.designationId,
      role: UserRole.EMPLOYEE,
      managerId: salesManagerEmp.employeeId,
      joinDate: '2023-06-01',
    });

    // Sales Reps
    await createEmployeeAndUser({
      code: 'EMP025',
      firstName: 'Jason',
      lastName: 'Allen',
      deptId: sales.departmentId,
      desigId: salesRep.designationId,
      role: UserRole.EMPLOYEE,
      managerId: salesManagerEmp.employeeId,
      joinDate: '2023-07-01',
    });

    await createEmployeeAndUser({
      code: 'EMP026',
      firstName: 'Rachel',
      lastName: 'Young',
      deptId: sales.departmentId,
      desigId: salesRep.designationId,
      role: UserRole.EMPLOYEE,
      managerId: salesManagerEmp.employeeId,
      joinDate: '2023-08-01',
    });

    await createEmployeeAndUser({
      code: 'EMP027',
      firstName: 'Justin',
      lastName: 'King',
      deptId: sales.departmentId,
      desigId: salesRep.designationId,
      role: UserRole.EMPLOYEE,
      managerId: salesManagerEmp.employeeId,
      joinDate: '2023-09-01',
    });

    await createEmployeeAndUser({
      code: 'EMP028',
      firstName: 'Samantha',
      lastName: 'Scott',
      deptId: sales.departmentId,
      desigId: salesRep.designationId,
      role: UserRole.EMPLOYEE,
      managerId: salesManagerEmp.employeeId,
      joinDate: '2023-10-01',
    });

    await createEmployeeAndUser({
      code: 'EMP029',
      firstName: 'Eric',
      lastName: 'Green',
      deptId: sales.departmentId,
      desigId: salesRep.designationId,
      role: UserRole.EMPLOYEE,
      managerId: salesManagerEmp.employeeId,
      joinDate: '2023-11-01',
    });

    await createEmployeeAndUser({
      code: 'EMP030',
      firstName: 'Lauren',
      lastName: 'Adams',
      deptId: sales.departmentId,
      desigId: salesRep.designationId,
      role: UserRole.EMPLOYEE,
      managerId: salesManagerEmp.employeeId,
      joinDate: '2023-12-01',
    });

    console.log(`✅ ${allEmployees.length} users and employees created`);

    // 7. Initialize Leave Balances for all employees
    console.log('💼 Initializing leave balances...');
    const currentYear = new Date().getFullYear();
    const policies = [sickLeavePolicy, casualLeavePolicy, earnedLeavePolicy];

    for (const emp of allEmployees) {
      for (const policy of policies) {
        const balance = leaveBalanceRepo.create({
          employeeId: emp.employeeId,
          tenantId: tenant.tenantId,
          policyId: policy.policyId,
          leaveType: policy.leaveType,
          year: currentYear,
          totalAllocated: policy.totalLeaves,
          used: 0,
          pending: 0,
          carriedForward: 0,
          encashed: 0,
        });
        await leaveBalanceRepo.save(balance);
      }
    }
    console.log(`✅ Leave balances initialized for ${allEmployees.length} employees`);

    console.log('\n🎉 Test data seeded successfully!\n');
    console.log('=====================================');
    console.log('TEST CREDENTIALS (password: password123)');
    console.log('=====================================');
    console.log('👤 Admin:    admin@acme.com');
    console.log('👤 HR:       hr@acme.com');
    console.log('👤 Manager:  manager@acme.com');
    console.log('👤 Employee: employee@acme.com');
    console.log('👤 Employee: bob@acme.com');
    console.log('=====================================\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedTestData();
