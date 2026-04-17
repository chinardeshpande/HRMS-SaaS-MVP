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
 * Seed script to create David Martinez test user
 *
 * Creates a Manager user in the Operations department
 * Email: david.martinez@acme.com
 * Password: password123
 */

async function seedDavidMartinez() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');
    console.log('\n🌱 Creating David Martinez test user...\n');

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

    // Check if user already exists
    const existingUser = await userRepo.findOne({
      where: { email: 'david.martinez@acme.com', tenantId: tenant.tenantId }
    });

    if (existingUser) {
      console.log('⚠️  David Martinez already exists!');
      console.log('\n📧 Email: david.martinez@acme.com');
      console.log('🔑 Password: password123\n');
      await AppDataSource.destroy();
      process.exit(0);
    }

    // Get or create Operations department
    let operationsDept = await departmentRepo.findOne({
      where: { tenantId: tenant.tenantId, name: 'Operations' }
    });

    if (!operationsDept) {
      operationsDept = departmentRepo.create({
        tenantId: tenant.tenantId,
        name: 'Operations',
      });
      await departmentRepo.save(operationsDept);
      console.log('✓ Created department: Operations');
    } else {
      console.log('→ Department exists: Operations');
    }

    // Get or create Operations Manager designation
    let operationsManagerDesig = await designationRepo.findOne({
      where: { tenantId: tenant.tenantId, name: 'Operations Manager' }
    });

    if (!operationsManagerDesig) {
      operationsManagerDesig = designationRepo.create({
        tenantId: tenant.tenantId,
        name: 'Operations Manager',
        level: 2,
      });
      await designationRepo.save(operationsManagerDesig);
      console.log('✓ Created designation: Operations Manager');
    } else {
      console.log('→ Designation exists: Operations Manager');
    }

    // Create employee
    const employee = employeeRepo.create({
      tenantId: tenant.tenantId,
      employeeCode: 'OPS001',
      firstName: 'David',
      lastName: 'Martinez',
      email: 'david.martinez@acme.com',
      phone: '+1-555-0501',
      departmentId: operationsDept.departmentId,
      designationId: operationsManagerDesig.designationId,
      dateOfJoining: new Date('2024-03-01'),
      probationEndDate: new Date('2024-06-01'),
      employmentType: 'full-time',
      status: EmploymentStatus.ACTIVE,
    });

    const savedEmployee = await employeeRepo.save(employee);
    console.log('✓ Created employee: David Martinez (OPS001)');

    // Create user
    const hashedPassword = await bcrypt.hash('password123', 10);

    const user = userRepo.create({
      tenantId: tenant.tenantId,
      email: 'david.martinez@acme.com',
      passwordHash: hashedPassword,
      fullName: 'David Martinez',
      role: UserRole.MANAGER,
      employeeId: savedEmployee.employeeId,
    });

    await userRepo.save(user);
    console.log('✓ Created user account: david.martinez@acme.com');

    // Now create some employees reporting to David Martinez
    console.log('\n👥 Creating team members for David Martinez...\n');

    // Get or create team member designations
    let coordinatorDesig = await designationRepo.findOne({
      where: { tenantId: tenant.tenantId, name: 'Operations Coordinator' }
    });

    if (!coordinatorDesig) {
      coordinatorDesig = designationRepo.create({
        tenantId: tenant.tenantId,
        name: 'Operations Coordinator',
        level: 3,
      });
      await designationRepo.save(coordinatorDesig);
      console.log('✓ Created designation: Operations Coordinator');
    }

    let specialistDesig = await designationRepo.findOne({
      where: { tenantId: tenant.tenantId, name: 'Operations Specialist' }
    });

    if (!specialistDesig) {
      specialistDesig = designationRepo.create({
        tenantId: tenant.tenantId,
        name: 'Operations Specialist',
        level: 4,
      });
      await designationRepo.save(specialistDesig);
      console.log('✓ Created designation: Operations Specialist');
    }

    // Create team members
    const teamMembers = [
      {
        email: 'maria.lopez@acme.com',
        fullName: 'Maria Lopez',
        code: 'OPS101',
        firstName: 'Maria',
        lastName: 'Lopez',
        phone: '+1-555-0511',
        designation: coordinatorDesig,
      },
      {
        email: 'carlos.rivera@acme.com',
        fullName: 'Carlos Rivera',
        code: 'OPS102',
        firstName: 'Carlos',
        lastName: 'Rivera',
        phone: '+1-555-0512',
        designation: specialistDesig,
      },
      {
        email: 'jessica.white@acme.com',
        fullName: 'Jessica White',
        code: 'OPS103',
        firstName: 'Jessica',
        lastName: 'White',
        phone: '+1-555-0513',
        designation: specialistDesig,
      },
    ];

    for (const member of teamMembers) {
      // Check if employee already exists
      const existingEmp = await employeeRepo.findOne({
        where: { email: member.email, tenantId: tenant.tenantId }
      });

      if (existingEmp) {
        console.log(`  ⚠️  ${member.fullName} already exists - skipping`);
        continue;
      }

      // Create employee
      const teamEmployee = employeeRepo.create({
        tenantId: tenant.tenantId,
        employeeCode: member.code,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        departmentId: operationsDept.departmentId,
        designationId: member.designation.designationId,
        dateOfJoining: new Date('2024-03-15'),
        probationEndDate: new Date('2024-06-15'),
        employmentType: 'full-time',
        status: EmploymentStatus.ACTIVE,
        managerId: savedEmployee.employeeId, // Reports to David Martinez
      });

      await employeeRepo.save(teamEmployee);

      // Create user account
      const teamUser = userRepo.create({
        tenantId: tenant.tenantId,
        email: member.email,
        passwordHash: hashedPassword,
        fullName: member.fullName,
        role: UserRole.EMPLOYEE,
        employeeId: teamEmployee.employeeId,
      });

      await userRepo.save(teamUser);

      console.log(`  ✓ Created team member: ${member.fullName} (${member.code})`);
    }

    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                 DAVID MARTINEZ - CREATED                      ');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('👔 MANAGER\n');
    console.log('  📧 Email: david.martinez@acme.com');
    console.log('  🔑 Password: password123');
    console.log('  👤 Name: David Martinez');
    console.log('  💼 Role: MANAGER');
    console.log('  🏢 Department: Operations');
    console.log('  📋 Designation: Operations Manager');
    console.log('  📅 Date of Joining: March 1, 2024');
    console.log('  👥 Direct Reports: 3 employees\n');

    console.log('─────────────────────────────────────────────────────────────\n');
    console.log('👥 TEAM MEMBERS (Reporting to David Martinez)\n');
    console.log('  1. Maria Lopez (Operations Coordinator)');
    console.log('     📧 maria.lopez@acme.com | 🔑 password123\n');
    console.log('  2. Carlos Rivera (Operations Specialist)');
    console.log('     📧 carlos.rivera@acme.com | 🔑 password123\n');
    console.log('  3. Jessica White (Operations Specialist)');
    console.log('     📧 jessica.white@acme.com | 🔑 password123\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    TEST SCENARIOS                             ');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('🧪 AS MANAGER (David Martinez):\n');
    console.log('  1. Login as david.martinez@acme.com');
    console.log('     → View "My Leave" tab (own leave requests)');
    console.log('     → Click "Team Approvals" tab');
    console.log('     → See 3 team members\' leave requests');
    console.log('     → Approve/reject team leave requests\n');

    console.log('🧪 AS TEAM MEMBER:\n');
    console.log('  1. Login as maria.lopez@acme.com');
    console.log('     → Apply for leave');
    console.log('     → Request appears in David Martinez\'s "Team Approvals"');
    console.log('  2. Login as carlos.rivera@acme.com');
    console.log('     → Check attendance, apply leave');
    console.log('  3. Login as jessica.white@acme.com');
    console.log('     → Normal employee operations\n');

    console.log('🧪 VERIFICATION:\n');
    console.log('  1. Login as david.martinez@acme.com');
    console.log('     ✅ Should see "My Leave" tab');
    console.log('     ✅ Should see "Team Approvals" tab with pending badge');
    console.log('     ✅ In "Team Approvals", should see team members\' requests');
    console.log('     ✅ Should NOT see own requests in "Team Approvals"');
    console.log('     ✅ Can approve/reject team leave requests\n');

    console.log('═══════════════════════════════════════════════════════════════\n');

    await AppDataSource.destroy();
    console.log('✅ David Martinez and team created successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating David Martinez:', error);
    process.exit(1);
  }
}

seedDavidMartinez();
