import { AppDataSource } from '../config/database';
import bcrypt from 'bcrypt';

/**
 * COMPREHENSIVE HR TEST DATA SEED SCRIPT
 *
 * This script creates realistic test data for thorough HRMS testing:
 * - 5 Companies across different industries
 * - 60+ employees with realistic profiles
 * - Complete organizational hierarchies
 * - All HR workflows in various states
 * - Real-world edge cases and scenarios
 */

async function clearAndSeedComprehensive() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Step 1: Clear all tables
    console.log('🗑️  Clearing existing data...');

    const tables = [
      'chat_messages', 'chat_participants', 'chat_conversations',
      'hr_connect_reactions', 'hr_connect_comments', 'hr_connect_posts',
      'hr_connect_group_members', 'hr_connect_groups',
      'feedback_360', 'development_action_items', 'kpis', 'goals', 'performance_reviews',
      'final_settlements', 'clearances', 'asset_returns', 'exit_interviews', 'exit_cases',
      'notifications', 'audit_logs', 'status_transitions', 'approvals',
      'onboarding_documents', 'probation_tasks', 'onboarding_tasks',
      'probation_reviews', 'probation_cases', 'onboarding_cases', 'candidates',
      'time_entry_edits', 'attendance', 'leave_requests', 'leave_balances',
      'attendance_policies', 'leave_policies', 'position_history', 'compensation_history',
      'users', 'employees', 'designations', 'departments',
      'business_rules', 'role_permissions', 'permissions', 'roles',
      'payment_methods', 'payment_history', 'organization_settings', 'subscriptions',
      'user_invitations', 'onboarding_progress', 'company_registrations',
      'document_templates', 'tenants'
    ];

    for (const table of tables) {
      try {
        await AppDataSource.query(`TRUNCATE TABLE ${table} CASCADE`);
        console.log(`  ✓ Cleared ${table}`);
      } catch (err: any) {
        if (!err.message.includes('does not exist')) {
          console.log(`  ⚠ Warning clearing ${table}:`, err.message);
        }
      }
    }

    console.log('\n✅ Database cleared\n');

    // Step 2: Create comprehensive test data
    console.log('🌟 Creating comprehensive HR test data...\n');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // COMPANY 1: TechNova Solutions (Fast-growing Tech Startup)
    console.log('🏢 Company 1: TechNova Solutions (Tech Startup)');
    const techNova = await createCompany({
      name: 'TechNova Solutions',
      subdomain: 'technova',
      industry: 'Technology',
      size: 'startup',
      hashedPassword,
      departments: [
        { name: 'Engineering', headName: 'Sarah Chen' },
        { name: 'Product', headName: 'Michael Rodriguez' },
        { name: 'Sales', headName: 'Emily Watson' },
        { name: 'HR & Operations', headName: 'David Kim' }
      ],
      employees: [
        // Leadership
        { code: 'TN001', firstName: 'Sarah', lastName: 'Chen', email: 'sarah.chen@technova.com', role: 'admin', designation: 'CTO', department: 'Engineering', manager: null, salary: 180000, joiningDays: -730 },
        { code: 'TN002', firstName: 'Michael', lastName: 'Rodriguez', email: 'michael.r@technova.com', role: 'manager', designation: 'VP Product', department: 'Product', manager: 'TN001', salary: 160000, joiningDays: -600 },
        { code: 'TN003', firstName: 'Emily', lastName: 'Watson', email: 'emily.w@technova.com', role: 'manager', designation: 'VP Sales', department: 'Sales', manager: 'TN001', salary: 155000, joiningDays: -550 },
        { code: 'TN004', firstName: 'David', lastName: 'Kim', email: 'david.kim@technova.com', role: 'hr', designation: 'HR Director', department: 'HR & Operations', manager: 'TN001', salary: 140000, joiningDays: -500 },

        // Engineering Team (various states)
        { code: 'TN005', firstName: 'Priya', lastName: 'Sharma', email: 'priya.s@technova.com', role: 'employee', designation: 'Senior Engineer', department: 'Engineering', manager: 'TN001', salary: 130000, joiningDays: -450 },
        { code: 'TN006', firstName: 'James', lastName: 'Martinez', email: 'james.m@technova.com', role: 'employee', designation: 'Senior Engineer', department: 'Engineering', manager: 'TN001', salary: 125000, joiningDays: -400 },
        { code: 'TN007', firstName: 'Lisa', lastName: 'Thompson', email: 'lisa.t@technova.com', role: 'employee', designation: 'Software Engineer', department: 'Engineering', manager: 'TN005', salary: 110000, joiningDays: -180, probationEnd: 30 }, // On probation
        { code: 'TN008', firstName: 'Raj', lastName: 'Patel', email: 'raj.p@technova.com', role: 'employee', designation: 'Software Engineer', department: 'Engineering', manager: 'TN005', salary: 108000, joiningDays: -60 }, // Recently joined - onboarding

        // Product Team
        { code: 'TN009', firstName: 'Anna', lastName: 'Kowalski', email: 'anna.k@technova.com', role: 'employee', designation: 'Product Manager', department: 'Product', manager: 'TN002', salary: 135000, joiningDays: -320 },
        { code: 'TN010', firstName: 'Carlos', lastName: 'Mendoza', email: 'carlos.m@technova.com', role: 'employee', designation: 'UX Designer', department: 'Product', manager: 'TN002', salary: 95000, joiningDays: -200 },

        // Sales Team
        { code: 'TN011', firstName: 'Jennifer', lastName: 'Lee', email: 'jennifer.l@technova.com', role: 'employee', designation: 'Sales Manager', department: 'Sales', manager: 'TN003', salary: 120000, joiningDays: -280 },
        { code: 'TN012', firstName: 'Tom', lastName: 'Anderson', email: 'tom.a@technova.com', role: 'employee', designation: 'Account Executive', department: 'Sales', manager: 'TN011', salary: 90000, joiningDays: -150 },

        // HR & Ops
        { code: 'TN013', firstName: 'Maria', lastName: 'Garcia', email: 'maria.g@technova.com', role: 'hr', designation: 'HR Specialist', department: 'HR & Operations', manager: 'TN004', salary: 75000, joiningDays: -220 },
        { code: 'TN014', firstName: 'Alex', lastName: 'Brown', email: 'alex.b@technova.com', role: 'employee', designation: 'Office Manager', department: 'HR & Operations', manager: 'TN004', salary: 65000, joiningDays: -300 },
      ]
    });

    // COMPANY 2: GlobalManufacturing Corp (Established Manufacturing)
    console.log('\n🏭 Company 2: GlobalManufacturing Corp (Manufacturing)');
    const globalMfg = await createCompany({
      name: 'GlobalManufacturing Corp',
      subdomain: 'globalmfg',
      industry: 'Manufacturing',
      size: 'enterprise',
      hashedPassword,
      departments: [
        { name: 'Production', headName: 'Robert Johnson' },
        { name: 'Quality Assurance', headName: 'Linda Davis' },
        { name: 'Supply Chain', headName: 'Ahmed Hassan' },
        { name: 'Human Resources', headName: 'Patricia Miller' }
      ],
      employees: [
        // Leadership
        { code: 'GM001', firstName: 'Robert', lastName: 'Johnson', email: 'r.johnson@globalmfg.com', role: 'admin', designation: 'VP Operations', department: 'Production', manager: null, salary: 190000, joiningDays: -2000 },
        { code: 'GM002', firstName: 'Linda', lastName: 'Davis', email: 'l.davis@globalmfg.com', role: 'manager', designation: 'QA Director', department: 'Quality Assurance', manager: 'GM001', salary: 145000, joiningDays: -1800 },
        { code: 'GM003', firstName: 'Ahmed', lastName: 'Hassan', email: 'a.hassan@globalmfg.com', role: 'manager', designation: 'Supply Chain Director', department: 'Supply Chain', manager: 'GM001', salary: 150000, joiningDays: -1500 },
        { code: 'GM004', firstName: 'Patricia', lastName: 'Miller', email: 'p.miller@globalmfg.com', role: 'hr', designation: 'HR Director', department: 'Human Resources', manager: 'GM001', salary: 135000, joiningDays: -1600 },

        // Production (shift workers, various statuses)
        { code: 'GM005', firstName: 'John', lastName: 'Smith', email: 'j.smith@globalmfg.com', role: 'employee', designation: 'Production Supervisor', department: 'Production', manager: 'GM001', salary: 75000, joiningDays: -1200 },
        { code: 'GM006', firstName: 'Maria', lastName: 'Santos', email: 'm.santos@globalmfg.com', role: 'employee', designation: 'Production Operator', department: 'Production', manager: 'GM005', salary: 45000, joiningDays: -800 },
        { code: 'GM007', firstName: 'Wei', lastName: 'Zhang', email: 'w.zhang@globalmfg.com', role: 'employee', designation: 'Production Operator', department: 'Production', manager: 'GM005', salary: 47000, joiningDays: -600 },
        { code: 'GM008', firstName: 'Jose', lastName: 'Rivera', email: 'j.rivera@globalmfg.com', role: 'employee', designation: 'Machine Operator', department: 'Production', manager: 'GM005', salary: 42000, joiningDays: -90, probationEnd: 90 }, // Probation

        // Quality Assurance
        { code: 'GM009', firstName: 'Fatima', lastName: 'Ali', email: 'f.ali@globalmfg.com', role: 'employee', designation: 'QA Manager', department: 'Quality Assurance', manager: 'GM002', salary: 95000, joiningDays: -700 },
        { code: 'GM010', firstName: 'Kevin', lastName: 'O\'Brien', email: 'k.obrien@globalmfg.com', role: 'employee', designation: 'QA Specialist', department: 'Quality Assurance', manager: 'GM009', salary: 65000, joiningDays: -400 },

        // Supply Chain
        { code: 'GM011', firstName: 'Sanjay', lastName: 'Kumar', email: 's.kumar@globalmfg.com', role: 'employee', designation: 'Logistics Manager', department: 'Supply Chain', manager: 'GM003', salary: 85000, joiningDays: -900 },
        { code: 'GM012', firstName: 'Nina', lastName: 'Petrov', email: 'n.petrov@globalmfg.com', role: 'employee', designation: 'Procurement Specialist', department: 'Supply Chain', manager: 'GM003', salary: 70000, joiningDays: -500 },

        // HR Team
        { code: 'GM013', firstName: 'Grace', lastName: 'Wilson', email: 'g.wilson@globalmfg.com', role: 'hr', designation: 'HR Manager', department: 'Human Resources', manager: 'GM004', salary: 85000, joiningDays: -850 },
        { code: 'GM014', firstName: 'Daniel', lastName: 'Cohen', email: 'd.cohen@globalmfg.com', role: 'hr', designation: 'Recruiter', department: 'Human Resources', manager: 'GM013', salary: 60000, joiningDays: -300 },
      ]
    });

    // COMPANY 3: Horizon Consulting Partners (Professional Services)
    console.log('\n💼 Company 3: Horizon Consulting Partners (Consulting)');
    const horizonConsult = await createCompany({
      name: 'Horizon Consulting Partners',
      subdomain: 'horizon',
      industry: 'Consulting',
      size: 'medium',
      hashedPassword,
      departments: [
        { name: 'Strategy', headName: 'Victoria Sterling' },
        { name: 'Technology', headName: 'Marcus Johnson' },
        { name: 'Operations', headName: 'Aisha Mohammed' }
      ],
      employees: [
        // Partners & Leadership
        { code: 'HC001', firstName: 'Victoria', lastName: 'Sterling', email: 'v.sterling@horizonconsult.com', role: 'admin', designation: 'Managing Partner', department: 'Strategy', manager: null, salary: 250000, joiningDays: -1500 },
        { code: 'HC002', firstName: 'Marcus', lastName: 'Johnson', email: 'm.johnson@horizonconsult.com', role: 'manager', designation: 'Partner', department: 'Technology', manager: 'HC001', salary: 220000, joiningDays: -1200 },
        { code: 'HC003', firstName: 'Aisha', lastName: 'Mohammed', email: 'a.mohammed@horizonconsult.com', role: 'manager', designation: 'Partner', department: 'Operations', manager: 'HC001', salary: 215000, joiningDays: -1100 },

        // Senior Consultants
        { code: 'HC004', firstName: 'Jonathan', lastName: 'Park', email: 'j.park@horizonconsult.com', role: 'employee', designation: 'Senior Consultant', department: 'Strategy', manager: 'HC001', salary: 150000, joiningDays: -600 },
        { code: 'HC005', firstName: 'Sophia', lastName: 'Rossi', email: 's.rossi@horizonconsult.com', role: 'employee', designation: 'Senior Consultant', department: 'Technology', manager: 'HC002', salary: 145000, joiningDays: -550 },

        // Consultants
        { code: 'HC006', firstName: 'Oliver', lastName: 'Schmidt', email: 'o.schmidt@horizonconsult.com', role: 'employee', designation: 'Consultant', department: 'Strategy', manager: 'HC004', salary: 110000, joiningDays: -280 },
        { code: 'HC007', firstName: 'Yuki', lastName: 'Tanaka', email: 'y.tanaka@horizonconsult.com', role: 'employee', designation: 'Consultant', department: 'Technology', manager: 'HC005', salary: 105000, joiningDays: -200 },

        // Junior Consultants
        { code: 'HC008', firstName: 'Emma', lastName: 'Wright', email: 'e.wright@horizonconsult.com', role: 'employee', designation: 'Junior Consultant', department: 'Operations', manager: 'HC003', salary: 75000, joiningDays: -120, probationEnd: 60 },
        { code: 'HC009', firstName: 'Diego', lastName: 'Fernandez', email: 'd.fernandez@horizonconsult.com', role: 'employee', designation: 'Junior Consultant', department: 'Strategy', manager: 'HC004', salary: 72000, joiningDays: -45 }, // Recent hire

        // Support Staff
        { code: 'HC010', firstName: 'Rachel', lastName: 'Green', email: 'r.green@horizonconsult.com', role: 'hr', designation: 'Practice Manager', department: 'Operations', manager: 'HC003', salary: 90000, joiningDays: -400 },
      ]
    });

    // COMPANY 4: RetailPlus Inc (Retail Chain)
    console.log('\n🛒 Company 4: RetailPlus Inc (Retail)');
    const retailPlus = await createCompany({
      name: 'RetailPlus Inc',
      subdomain: 'retailplus',
      industry: 'Retail',
      size: 'medium',
      hashedPassword,
      departments: [
        { name: 'Store Operations', headName: 'Michelle Taylor' },
        { name: 'Merchandising', headName: 'Brandon Lewis' },
        { name: 'Customer Service', headName: 'Samantha White' }
      ],
      employees: [
        // Management
        { code: 'RP001', firstName: 'Michelle', lastName: 'Taylor', email: 'm.taylor@retailplus.com', role: 'admin', designation: 'Regional Manager', department: 'Store Operations', manager: null, salary: 120000, joiningDays: -1000 },
        { code: 'RP002', firstName: 'Brandon', lastName: 'Lewis', email: 'b.lewis@retailplus.com', role: 'manager', designation: 'Merchandising Director', department: 'Merchandising', manager: 'RP001', salary: 95000, joiningDays: -800 },
        { code: 'RP003', firstName: 'Samantha', lastName: 'White', email: 's.white@retailplus.com', role: 'manager', designation: 'CS Director', department: 'Customer Service', manager: 'RP001', salary: 85000, joiningDays: -750 },

        // Store Managers
        { code: 'RP004', firstName: 'Tyler', lastName: 'Anderson', email: 't.anderson@retailplus.com', role: 'employee', designation: 'Store Manager', department: 'Store Operations', manager: 'RP001', salary: 70000, joiningDays: -600 },
        { code: 'RP005', firstName: 'Jasmine', lastName: 'Patel', email: 'j.patel@retailplus.com', role: 'employee', designation: 'Store Manager', department: 'Store Operations', manager: 'RP001', salary: 68000, joiningDays: -550 },

        // Assistant Managers
        { code: 'RP006', firstName: 'Marcus', lastName: 'Brown', email: 'm.brown@retailplus.com', role: 'employee', designation: 'Assistant Manager', department: 'Store Operations', manager: 'RP004', salary: 50000, joiningDays: -300 },
        { code: 'RP007', firstName: 'Ashley', lastName: 'Davis', email: 'a.davis@retailplus.com', role: 'employee', designation: 'Assistant Manager', department: 'Store Operations', manager: 'RP005', salary: 48000, joiningDays: -250 },

        // Sales Associates (various states - some seasonal)
        { code: 'RP008', firstName: 'Chris', lastName: 'Martin', email: 'c.martin@retailplus.com', role: 'employee', designation: 'Sales Associate', department: 'Store Operations', manager: 'RP006', salary: 35000, joiningDays: -180 },
        { code: 'RP009', firstName: 'Taylor', lastName: 'Moore', email: 't.moore@retailplus.com', role: 'employee', designation: 'Sales Associate', department: 'Store Operations', manager: 'RP006', salary: 33000, joiningDays: -90, probationEnd: 90 },
        { code: 'RP010', firstName: 'Jordan', lastName: 'Clark', email: 'j.clark@retailplus.com', role: 'employee', designation: 'Sales Associate', department: 'Store Operations', manager: 'RP007', salary: 32000, joiningDays: -30 }, // Very new

        // Merchandising
        { code: 'RP011', firstName: 'Nicole', lastName: 'Harris', email: 'n.harris@retailplus.com', role: 'employee', designation: 'Buyer', department: 'Merchandising', manager: 'RP002', salary: 75000, joiningDays: -400 },
        { code: 'RP012', firstName: 'Ryan', lastName: 'Thomas', email: 'r.thomas@retailplus.com', role: 'employee', designation: 'Visual Merchandiser', department: 'Merchandising', manager: 'RP002', salary: 55000, joiningDays: -200 },
      ]
    });

    // COMPANY 5: HealthCare Partners (Healthcare)
    console.log('\n🏥 Company 5: HealthCare Partners (Healthcare)');
    const healthCare = await createCompany({
      name: 'HealthCare Partners',
      subdomain: 'healthcare',
      industry: 'Healthcare',
      size: 'medium',
      hashedPassword,
      departments: [
        { name: 'Clinical Services', headName: 'Dr. Sarah Mitchell' },
        { name: 'Nursing', headName: 'Jennifer Adams' },
        { name: 'Administration', headName: 'Robert Jackson' }
      ],
      employees: [
        // Leadership
        { code: 'HC001', firstName: 'Sarah', lastName: 'Mitchell', email: 's.mitchell@healthcarepartners.com', role: 'admin', designation: 'Medical Director', department: 'Clinical Services', manager: null, salary: 280000, joiningDays: -1800 },
        { code: 'HC002', firstName: 'Jennifer', lastName: 'Adams', email: 'j.adams@healthcarepartners.com', role: 'manager', designation: 'Director of Nursing', department: 'Nursing', manager: 'HC001', salary: 140000, joiningDays: -1500 },
        { code: 'HC003', firstName: 'Robert', lastName: 'Jackson', email: 'r.jackson@healthcarepartners.com', role: 'manager', designation: 'Administrator', department: 'Administration', manager: 'HC001', salary: 130000, joiningDays: -1400 },

        // Clinical Staff
        { code: 'HC004', firstName: 'Michael', lastName: 'Thompson', email: 'm.thompson@healthcarepartners.com', role: 'employee', designation: 'Physician', department: 'Clinical Services', manager: 'HC001', salary: 240000, joiningDays: -900 },
        { code: 'HC005', firstName: 'Lisa', lastName: 'Rodriguez', email: 'l.rodriguez@healthcarepartners.com', role: 'employee', designation: 'Physician', department: 'Clinical Services', manager: 'HC001', salary: 235000, joiningDays: -800 },

        // Nursing Staff
        { code: 'HC006', firstName: 'Amanda', lastName: 'Johnson', email: 'a.johnson@healthcarepartners.com', role: 'employee', designation: 'Nurse Practitioner', department: 'Nursing', manager: 'HC002', salary: 110000, joiningDays: -700 },
        { code: 'HC007', firstName: 'David', lastName: 'Lee', email: 'd.lee@healthcarepartners.com', role: 'employee', designation: 'Registered Nurse', department: 'Nursing', manager: 'HC002', salary: 75000, joiningDays: -500 },
        { code: 'HC008', firstName: 'Maria', lastName: 'Gonzalez', email: 'm.gonzalez@healthcarepartners.com', role: 'employee', designation: 'Registered Nurse', department: 'Nursing', manager: 'HC002', salary: 73000, joiningDays: -400 },
        { code: 'HC009', firstName: 'James', lastName: 'Wilson', email: 'j.wilson@healthcarepartners.com', role: 'employee', designation: 'Registered Nurse', department: 'Nursing', manager: 'HC002', salary: 72000, joiningDays: -150, probationEnd: 30 },

        // Administrative
        { code: 'HC010', firstName: 'Susan', lastName: 'Martinez', email: 's.martinez@healthcarepartners.com', role: 'hr', designation: 'HR Manager', department: 'Administration', manager: 'HC003', salary: 80000, joiningDays: -600 },
        { code: 'HC011', firstName: 'Thomas', lastName: 'Anderson', email: 't.anderson@healthcarepartners.com', role: 'employee', designation: 'Office Coordinator', department: 'Administration', manager: 'HC003', salary: 50000, joiningDays: -300 },
      ]
    });

    console.log('\n✅ All 5 companies created!');
    console.log('\n📊 Summary:');
    console.log(`   • TechNova Solutions: 14 employees (Tech Startup)`);
    console.log(`   • GlobalManufacturing Corp: 14 employees (Manufacturing)`);
    console.log(`   • Horizon Consulting: 10 employees (Consulting)`);
    console.log(`   • RetailPlus Inc: 12 employees (Retail)`);
    console.log(`   • HealthCare Partners: 11 employees (Healthcare)`);
    console.log(`   • TOTAL: 61 employees across 5 companies\n`);

    await AppDataSource.destroy();
    console.log('✅ Comprehensive seed completed successfully!\n');

    console.log('🔐 Login Credentials for Testing:');
    console.log('   Email: sarah.chen@technova.com | Password: password123');
    console.log('   Email: r.johnson@globalmfg.com | Password: password123');
    console.log('   Email: v.sterling@horizonconsult.com | Password: password123');
    console.log('   Email: m.taylor@retailplus.com | Password: password123');
    console.log('   Email: s.mitchell@healthcarepartners.com | Password: password123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Helper function to create a company with all supporting data
async function createCompany(config: {
  name: string;
  subdomain: string;
  industry: string;
  size: string;
  hashedPassword: string;
  departments: Array<{ name: string; headName: string }>;
  employees: Array<{
    code: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    designation: string;
    department: string;
    manager: string | null;
    salary: number;
    joiningDays: number; // Negative = days in past
    probationEnd?: number; // Days in future when probation ends
  }>;
}) {
  const { Tenant } = await import('../models/Tenant');
  const { Department } = await import('../models/Department');
  const { Designation } = await import('../models/Designation');
  const { Employee } = await import('../models/Employee');
  const { User } = await import('../models/User');
  const { LeavePolicy, LeaveType } = await import('../models/LeavePolicy');
  const { LeaveBalance } = await import('../models/LeaveBalance');
  const { AttendancePolicy } = await import('../models/AttendancePolicy');
  const { Role } = await import('../models/Role');

  const tenantRepo = AppDataSource.getRepository(Tenant);
  const deptRepo = AppDataSource.getRepository(Department);
  const desigRepo = AppDataSource.getRepository(Designation);
  const empRepo = AppDataSource.getRepository(Employee);
  const userRepo = AppDataSource.getRepository(User);
  const leavePolicyRepo = AppDataSource.getRepository(LeavePolicy);
  const leaveBalanceRepo = AppDataSource.getRepository(LeaveBalance);
  const attendancePolicyRepo = AppDataSource.getRepository(AttendancePolicy);
  const roleRepo = AppDataSource.getRepository(Role);

  // Create tenant
  const tenant = tenantRepo.create({
    companyName: config.name,
    subdomain: config.subdomain,
    planType: 'professional',
    status: 'active',
    isTrialActive: true,
    trialStartDate: new Date(),
    trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
  });
  await tenantRepo.save(tenant);

  // Create roles
  const adminRole = roleRepo.create({ tenantId: tenant.tenantId, roleName: 'Admin', description: 'Full access' });
  const managerRole = roleRepo.create({ tenantId: tenant.tenantId, roleName: 'Manager', description: 'Team management' });
  const hrRole = roleRepo.create({ tenantId: tenant.tenantId, roleName: 'HR', description: 'HR operations' });
  const employeeRole = roleRepo.create({ tenantId: tenant.tenantId, roleName: 'Employee', description: 'Standard employee' });
  await roleRepo.save([adminRole, managerRole, hrRole, employeeRole]);

  // Create departments
  const deptMap: Record<string, any> = {};
  for (const dept of config.departments) {
    const department = deptRepo.create({
      tenantId: tenant.tenantId,
      name: dept.name,
    });
    await deptRepo.save(department);
    deptMap[dept.name] = department;
  }

  // Create designations (extract unique ones)
  const uniqueDesignations = [...new Set(config.employees.map(e => e.designation))];
  const desigMap: Record<string, any> = {};
  for (let i = 0; i < uniqueDesignations.length; i++) {
    const designation = desigRepo.create({
      tenantId: tenant.tenantId,
      name: uniqueDesignations[i],
      level: Math.floor(i / 2) + 1, // Simple level assignment
    });
    await desigRepo.save(designation);
    desigMap[uniqueDesignations[i]] = designation;
  }

  // Create leave policies
  const sickLeave = leavePolicyRepo.create({
    tenantId: tenant.tenantId,
    policyName: 'Sick Leave',
    leaveType: LeaveType.SICK,
    totalLeaves: 10,
    maxConsecutiveDays: 5,
    carryForward: false,
    requiresApproval: true,
    isActive: true,
  });
  const casualLeave = leavePolicyRepo.create({
    tenantId: tenant.tenantId,
    policyName: 'Casual Leave',
    leaveType: LeaveType.CASUAL,
    totalLeaves: 12,
    maxConsecutiveDays: 3,
    carryForward: true,
    maxCarryForward: 5,
    requiresApproval: true,
    isActive: true,
  });
  const earnedLeave = leavePolicyRepo.create({
    tenantId: tenant.tenantId,
    policyName: 'Earned Leave',
    leaveType: LeaveType.EARNED,
    totalLeaves: 15,
    maxConsecutiveDays: 10,
    carryForward: true,
    maxCarryForward: 10,
    encashable: true,
    requiresApproval: true,
    isActive: true,
  });
  await leavePolicyRepo.save([sickLeave, casualLeave, earnedLeave]);

  // Create attendance policy
  const attendancePolicy = attendancePolicyRepo.create({
    tenantId: tenant.tenantId,
    policyName: 'Standard Attendance',
    standardCheckIn: '09:00:00',
    standardCheckOut: '18:00:00',
    lateGraceMinutes: 15,
    earlyGraceMinutes: 15,
    requiredWorkMinutes: 480,
    halfDayMinutes: 240,
    workingDays: [1, 2, 3, 4, 5],
    isActive: true,
  });
  await attendancePolicyRepo.save(attendancePolicy);

  // Create employees and users
  const empMap: Record<string, any> = {};
  for (const empData of config.employees) {
    const joiningDate = new Date();
    joiningDate.setDate(joiningDate.getDate() + empData.joiningDays);

    let probationEndDate = null;
    if (empData.probationEnd) {
      probationEndDate = new Date();
      probationEndDate.setDate(probationEndDate.getDate() + empData.probationEnd);
    }

    const employee = empRepo.create({
      tenantId: tenant.tenantId,
      employeeCode: empData.code,
      firstName: empData.firstName,
      lastName: empData.lastName,
      email: empData.email,
      phone: `+1-555-${Math.floor(1000 + Math.random() * 9000)}`,
      departmentId: deptMap[empData.department].departmentId,
      designationId: desigMap[empData.designation].designationId,
      managerId: empData.manager ? null : null, // Will update in second pass
      dateOfJoining: joiningDate,
      probationEndDate: probationEndDate,
      employmentType: 'full-time',
      status: 'active',
    });
    await empRepo.save(employee);
    empMap[empData.code] = employee;

    // Create user
    const roleMap: Record<string, any> = {
      'admin': adminRole,
      'manager': managerRole,
      'hr': hrRole,
      'employee': employeeRole,
    };

    const user = userRepo.create({
      tenantId: tenant.tenantId,
      employeeId: employee.employeeId,
      email: empData.email,
      password: config.hashedPassword,
      roleId: roleMap[empData.role].roleId,
    });
    await userRepo.save(user);

    // Create leave balances
    for (const policy of [sickLeave, casualLeave, earnedLeave]) {
      const balance = leaveBalanceRepo.create({
        tenantId: tenant.tenantId,
        employeeId: employee.employeeId,
        policyId: policy.policyId,
        leaveType: policy.leaveType,
        totalLeaves: policy.totalLeaves,
        usedLeaves: Math.floor(Math.random() * 3), // Random 0-2 leaves used
        pendingLeaves: 0,
        availableLeaves: policy.totalLeaves - Math.floor(Math.random() * 3),
      });
      await leaveBalanceRepo.save(balance);
    }
  }

  // Second pass: Update manager relationships
  for (const empData of config.employees) {
    if (empData.manager) {
      const employee = empMap[empData.code];
      const manager = empMap[empData.manager];
      if (manager) {
        employee.managerId = manager.employeeId;
        await empRepo.save(employee);
      }
    }
  }

  return tenant;
}

// Run the seed
clearAndSeedComprehensive();
