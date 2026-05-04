import 'reflect-metadata';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../config/database';
import { Tenant } from '../models/Tenant';
import { Department } from '../models/Department';
import { Designation } from '../models/Designation';
import { Employee } from '../models/Employee';
import { User } from '../models/User';
import { Attendance, AttendanceStatus } from '../models/Attendance';
import { LeavePolicy, LeaveType } from '../models/LeavePolicy';
import { LeaveBalance } from '../models/LeaveBalance';
import { LeaveRequest, LeaveStatus } from '../models/LeaveRequest';
import { AttendancePolicy } from '../models/AttendancePolicy';
import { Candidate } from '../models/Candidate';
import { OnboardingCase } from '../models/OnboardingCase';
import { OnboardingTask } from '../models/OnboardingTask';
import { OnboardingState } from '../models/enums/OnboardingState';
import { TaskCategory, TaskPriority, TaskStatus } from '../models/enums/TaskStatus';
import { ProbationCase } from '../models/ProbationCase';
import { ProbationState } from '../models/enums/ProbationState';
import { PerformanceReview, PerformanceState } from '../models/PerformanceReview';
import { Goal, GoalCategory, GoalStatus } from '../models/Goal';
import { ExitCase } from '../models/ExitCase';
import { ExitState } from '../models/enums/ExitState';
import { ResignationType } from '../models/enums/ResignationType';
import { Subscription, BillingCycle, SubscriptionPlan, SubscriptionStatus } from '../models/Subscription';
import { OrganizationSettings } from '../models/OrganizationSettings';
import { DEMO_PASSWORD, DEMO_TENANT_SUBDOMAIN, demoPersonas } from '../services/demoService';

const demoCompanyName = 'AuroraHR Demo Pvt Ltd';

const addDays = (days: number): Date => {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
};

const dateOnly = (days: number): Date => {
  const date = addDays(days);
  date.setHours(0, 0, 0, 0);
  return date;
};

const clearTenantData = async (tenantId: string): Promise<void> => {
  const tables = [
    'chat_messages',
    'chat_participants',
    'chat_conversations',
    'hr_connect_reactions',
    'hr_connect_comments',
    'hr_connect_posts',
    'hr_connect_group_members',
    'hr_connect_groups',
    'feedback_360',
    'development_action_items',
    'kpis',
    'goals',
    'performance_reviews',
    'final_settlements',
    'clearances',
    'asset_returns',
    'exit_interviews',
    'exit_cases',
    'notifications',
    'audit_logs',
    'status_transitions',
    'approvals',
    'onboarding_documents',
    'probation_tasks',
    'onboarding_tasks',
    'probation_reviews',
    'probation_cases',
    'onboarding_cases',
    'candidates',
    'time_entry_edits',
    'attendance',
    'leave_requests',
    'leave_balances',
    'attendance_policies',
    'leave_policies',
    'position_history',
    'compensation_history',
    'digital_library',
    'document_categories',
    'generated_documents',
    'users',
    'employees',
    'designations',
    'departments',
    'business_rules',
    'role_permissions',
    'permissions',
    'roles',
    'payment_methods',
    'payment_history',
    'organization_settings',
    'subscriptions',
    'user_invitations',
    'onboarding_progress',
    'company_registrations',
    'document_templates',
  ];

  for (const table of tables) {
    try {
      await AppDataSource.query(`DELETE FROM ${table} WHERE "tenantId" = $1`, [tenantId]);
    } catch (error: any) {
      if (!String(error.message).includes('does not exist') && !String(error.message).includes('column "tenantId" does not exist')) {
        console.warn(`Warning clearing ${table}: ${error.message}`);
      }
    }
  }
};

const upsertDemoTenant = async (): Promise<Tenant> => {
  const tenantRepo = AppDataSource.getRepository(Tenant);
  let tenant = await tenantRepo.findOne({ where: { subdomain: DEMO_TENANT_SUBDOMAIN } });

  if (!tenant) {
    tenant = tenantRepo.create({
      companyName: demoCompanyName,
      subdomain: DEMO_TENANT_SUBDOMAIN,
      planType: 'enterprise',
      status: 'active',
      primaryColor: '#7c3aed',
      isTrialActive: false,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
      setupWizardCompleted: true,
    });
  } else {
    tenant.companyName = demoCompanyName;
    tenant.planType = 'enterprise';
    tenant.status = 'active';
    tenant.primaryColor = '#7c3aed';
    tenant.isTrialActive = false;
    tenant.onboardingCompleted = true;
    tenant.onboardingCompletedAt = new Date();
    tenant.setupWizardCompleted = true;
  }

  return tenantRepo.save(tenant);
};

const seedDemoData = async () => {
  await AppDataSource.initialize();

  try {
    const tenant = await upsertDemoTenant();
    await clearTenantData(tenant.tenantId);

    const departmentRepo = AppDataSource.getRepository(Department);
    const designationRepo = AppDataSource.getRepository(Designation);
    const employeeRepo = AppDataSource.getRepository(Employee);
    const userRepo = AppDataSource.getRepository(User);
    const leavePolicyRepo = AppDataSource.getRepository(LeavePolicy);
    const leaveBalanceRepo = AppDataSource.getRepository(LeaveBalance);
    const attendanceRepo = AppDataSource.getRepository(Attendance);
    const attendancePolicyRepo = AppDataSource.getRepository(AttendancePolicy);
    const leaveRequestRepo = AppDataSource.getRepository(LeaveRequest);
    const candidateRepo = AppDataSource.getRepository(Candidate);
    const onboardingCaseRepo = AppDataSource.getRepository(OnboardingCase);
    const onboardingTaskRepo = AppDataSource.getRepository(OnboardingTask);
    const probationRepo = AppDataSource.getRepository(ProbationCase);
    const performanceRepo = AppDataSource.getRepository(PerformanceReview);
    const goalRepo = AppDataSource.getRepository(Goal);
    const exitRepo = AppDataSource.getRepository(ExitCase);
    const subscriptionRepo = AppDataSource.getRepository(Subscription);
    const organizationSettingsRepo = AppDataSource.getRepository(OrganizationSettings);

    const departments = await departmentRepo.save([
      departmentRepo.create({ tenantId: tenant.tenantId, name: 'Executive Office' }),
      departmentRepo.create({ tenantId: tenant.tenantId, name: 'People Operations' }),
      departmentRepo.create({ tenantId: tenant.tenantId, name: 'Engineering' }),
      departmentRepo.create({ tenantId: tenant.tenantId, name: 'Sales' }),
      departmentRepo.create({ tenantId: tenant.tenantId, name: 'Finance & Operations' }),
    ]);

    const deptByName = new Map(departments.map((department) => [department.name, department]));

    const designations = await designationRepo.save([
      designationRepo.create({ tenantId: tenant.tenantId, name: 'Founder & CEO', level: 1 }),
      designationRepo.create({ tenantId: tenant.tenantId, name: 'Head of People', level: 2 }),
      designationRepo.create({ tenantId: tenant.tenantId, name: 'Engineering Manager', level: 3 }),
      designationRepo.create({ tenantId: tenant.tenantId, name: 'Senior Product Engineer', level: 4 }),
      designationRepo.create({ tenantId: tenant.tenantId, name: 'Customer Success Manager', level: 4 }),
      designationRepo.create({ tenantId: tenant.tenantId, name: 'Finance Operations Lead', level: 3 }),
      designationRepo.create({ tenantId: tenant.tenantId, name: 'People Operations Associate', level: 5 }),
      designationRepo.create({ tenantId: tenant.tenantId, name: 'Product Designer', level: 4 }),
      designationRepo.create({ tenantId: tenant.tenantId, name: 'Sales Development Representative', level: 5 }),
    ]);

    const desigByName = new Map(designations.map((designation) => [designation.name, designation]));

    const employeeSpecs = [
      ['DEMO001', 'Aditi', 'Rao', 'demo.admin@aurorahr.in', 'Executive Office', 'Founder & CEO', undefined, -900, 'system_admin'],
      ['DEMO002', 'Maya', 'Iyer', 'demo.hr@aurorahr.in', 'People Operations', 'Head of People', 'DEMO001', -520, 'hr_admin'],
      ['DEMO003', 'Arjun', 'Mehta', 'demo.manager@aurorahr.in', 'Engineering', 'Engineering Manager', 'DEMO001', -430, 'manager'],
      ['DEMO004', 'Neha', 'Shah', 'demo.employee@aurorahr.in', 'Engineering', 'Senior Product Engineer', 'DEMO003', -240, 'employee'],
      ['DEMO005', 'Kabir', 'Sethi', 'demo.finance@aurorahr.in', 'Finance & Operations', 'Finance Operations Lead', 'DEMO001', -360, 'hr_admin'],
      ['DEMO006', 'Sara', 'Fernandes', 'sara.fernandes.demo@aurorahr.in', 'People Operations', 'People Operations Associate', 'DEMO002', -80, 'employee'],
      ['DEMO007', 'Rohan', 'Kapoor', 'rohan.kapoor.demo@aurorahr.in', 'Engineering', 'Senior Product Engineer', 'DEMO003', -110, 'employee'],
      ['DEMO008', 'Isha', 'Menon', 'isha.menon.demo@aurorahr.in', 'Engineering', 'Product Designer', 'DEMO003', -35, 'employee'],
      ['DEMO009', 'Vikram', 'Nair', 'vikram.nair.demo@aurorahr.in', 'Sales', 'Customer Success Manager', 'DEMO001', -280, 'manager'],
      ['DEMO010', 'Tara', 'Bose', 'tara.bose.demo@aurorahr.in', 'Sales', 'Sales Development Representative', 'DEMO009', -18, 'employee'],
      ['DEMO011', 'Dev', 'Malhotra', 'dev.malhotra.demo@aurorahr.in', 'Engineering', 'Senior Product Engineer', 'DEMO003', -12, 'employee'],
      ['DEMO012', 'Pooja', 'Raman', 'pooja.raman.demo@aurorahr.in', 'Finance & Operations', 'People Operations Associate', 'DEMO005', -700, 'employee'],
    ] as const;

    const employeeByCode = new Map<string, Employee>();
    for (const [code, firstName, lastName, email, departmentName, designationName, , joiningDays] of employeeSpecs) {
      const employee = await employeeRepo.save(
        employeeRepo.create({
          tenantId: tenant.tenantId,
          employeeCode: code,
          firstName,
          lastName,
          email,
          phone: '+91 90000 00000',
          gender: firstName === 'Aditi' || firstName === 'Maya' || firstName === 'Neha' || firstName === 'Sara' || firstName === 'Isha' || firstName === 'Tara' || firstName === 'Pooja' ? 'female' : 'male',
          address: 'Aurora Demo Business Park, Bengaluru',
          departmentId: deptByName.get(departmentName)?.departmentId,
          designationId: desigByName.get(designationName)?.designationId,
          dateOfJoining: dateOnly(joiningDays),
          probationEndDate: joiningDays > -180 ? dateOnly(joiningDays + 90) : undefined,
          employmentType: 'full_time',
          status: 'active',
        })
      );
      employeeByCode.set(code, employee);
    }

    for (const [code, , , , , , managerCode] of employeeSpecs) {
      if (!managerCode) continue;
      const employee = employeeByCode.get(code);
      const manager = employeeByCode.get(managerCode);
      if (employee && manager) {
        employee.managerId = manager.employeeId;
        await employeeRepo.save(employee);
      }
    }

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const users = demoPersonas.map((persona) => {
      const employee = [...employeeByCode.values()].find((item) => item.email === persona.email);
      return userRepo.create({
        tenantId: tenant.tenantId,
        email: persona.email,
        fullName: employee ? `${employee.firstName} ${employee.lastName}` : persona.label,
        passwordHash,
        role: persona.role as any,
        employeeId: employee?.employeeId,
        isActive: true,
      });
    });
    await userRepo.save(users);

    await attendancePolicyRepo.save(
      attendancePolicyRepo.create({
        tenantId: tenant.tenantId,
        policyName: 'Aurora Flexible Hybrid Attendance',
        standardCheckIn: '09:30:00',
        standardCheckOut: '18:30:00',
        lateGraceMinutes: 15,
        earlyGraceMinutes: 15,
        requiredWorkMinutes: 480,
        halfDayMinutes: 240,
        workingDays: [1, 2, 3, 4, 5],
        isActive: true,
      })
    );

    const leavePolicies = await leavePolicyRepo.save([
      leavePolicyRepo.create({ tenantId: tenant.tenantId, policyName: 'Casual Leave', leaveType: LeaveType.CASUAL, totalLeaves: 12, maxConsecutiveDays: 3, carryForward: true, maxCarryForward: 5, requiresApproval: true, isActive: true }),
      leavePolicyRepo.create({ tenantId: tenant.tenantId, policyName: 'Sick Leave', leaveType: LeaveType.SICK, totalLeaves: 10, maxConsecutiveDays: 5, carryForward: false, requiresApproval: true, isActive: true }),
      leavePolicyRepo.create({ tenantId: tenant.tenantId, policyName: 'Earned Leave', leaveType: LeaveType.EARNED, totalLeaves: 18, maxConsecutiveDays: 12, carryForward: true, maxCarryForward: 12, encashable: true, requiresApproval: true, isActive: true }),
    ]);

    const currentYear = new Date().getFullYear();
    for (const employee of employeeByCode.values()) {
      for (const policy of leavePolicies) {
        await leaveBalanceRepo.save(
          leaveBalanceRepo.create({
            tenantId: tenant.tenantId,
            employeeId: employee.employeeId,
            policyId: policy.policyId,
            leaveType: policy.leaveType,
            year: currentYear,
            totalAllocated: policy.totalLeaves,
            used: policy.leaveType === LeaveType.CASUAL ? 2 : policy.leaveType === LeaveType.SICK ? 1 : 3,
            pending: 0,
            carriedForward: policy.leaveType === LeaveType.EARNED ? 4 : 0,
            encashed: 0,
          })
        );
      }
    }

    const employees = [...employeeByCode.values()];
    for (let day = -21; day <= -1; day += 1) {
      const calendarDate = dateOnly(day);
      const weekday = calendarDate.getDay();
      if (weekday === 0 || weekday === 6) continue;

      for (const [index, employee] of employees.entries()) {
        const checkIn = addDays(day);
        checkIn.setHours(9, index % 4 === 0 ? 52 : 28, 0, 0);
        const checkOut = addDays(day);
        checkOut.setHours(index % 5 === 0 ? 17 : 18, index % 5 === 0 ? 55 : 38, 0, 0);

        await attendanceRepo.save(
          attendanceRepo.create({
            tenantId: tenant.tenantId,
            employeeId: employee.employeeId,
            date: calendarDate,
            checkIn,
            checkOut,
            workMinutes: index % 5 === 0 ? 445 : 500,
            status: index % 7 === 0 ? AttendanceStatus.HALF_DAY : AttendanceStatus.PRESENT,
            isLate: index % 4 === 0,
            lateMinutes: index % 4 === 0 ? 22 : 0,
            isEarlyOut: index % 5 === 0,
            earlyMinutes: index % 5 === 0 ? 35 : 0,
            location: index % 3 === 0 ? 'Remote' : 'Bengaluru Office',
            notes: 'Curated demo attendance record',
          })
        );
      }
    }

    const manager = employeeByCode.get('DEMO003')!;
    await leaveRequestRepo.save([
      leaveRequestRepo.create({ tenantId: tenant.tenantId, employeeId: employeeByCode.get('DEMO004')!.employeeId, leaveType: LeaveType.CASUAL, startDate: dateOnly(4), endDate: dateOnly(5), numberOfDays: 2, reason: 'Family function', status: LeaveStatus.PENDING, approverId: manager.employeeId }),
      leaveRequestRepo.create({ tenantId: tenant.tenantId, employeeId: employeeByCode.get('DEMO007')!.employeeId, leaveType: LeaveType.SICK, startDate: dateOnly(-9), endDate: dateOnly(-9), numberOfDays: 1, reason: 'Medical appointment', status: LeaveStatus.APPROVED, approverId: manager.employeeId, approvedAt: addDays(-10), approverComments: 'Approved. Take care.' }),
      leaveRequestRepo.create({ tenantId: tenant.tenantId, employeeId: employeeByCode.get('DEMO010')!.employeeId, leaveType: LeaveType.EARNED, startDate: dateOnly(16), endDate: dateOnly(20), numberOfDays: 5, reason: 'Planned vacation', status: LeaveStatus.PENDING, approverId: employeeByCode.get('DEMO009')!.employeeId }),
    ]);

    const candidates = await candidateRepo.save([
      candidateRepo.create({ tenantId: tenant.tenantId, firstName: 'Ananya', lastName: 'Kulkarni', email: 'ananya.kulkarni.demo@aurorahr.in', phone: '+91 91111 00001', currentState: OnboardingState.DOCS_SUBMITTED, departmentId: deptByName.get('Engineering')!.departmentId, designationId: desigByName.get('Senior Product Engineer')!.designationId, reportingManagerId: manager.employeeId, offeredSalary: 2200000, currency: 'INR', expectedJoinDate: dateOnly(14), offerSentDate: dateOnly(-8), offerAcceptedDate: dateOnly(-5), employmentType: 'full_time', workLocation: 'Bengaluru Hybrid', city: 'Bengaluru', state: 'Karnataka', pincode: '560001', remarks: 'Demo candidate with documents awaiting HR review' }),
      candidateRepo.create({ tenantId: tenant.tenantId, firstName: 'Nikhil', lastName: 'Verma', email: 'nikhil.verma.demo@aurorahr.in', phone: '+91 91111 00002', currentState: OnboardingState.BGV_IN_PROGRESS, departmentId: deptByName.get('Sales')!.departmentId, designationId: desigByName.get('Sales Development Representative')!.designationId, reportingManagerId: employeeByCode.get('DEMO009')!.employeeId, offeredSalary: 900000, currency: 'INR', expectedJoinDate: dateOnly(24), offerSentDate: dateOnly(-12), offerAcceptedDate: dateOnly(-9), employmentType: 'full_time', workLocation: 'Mumbai', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', remarks: 'Demo candidate in background verification' }),
    ]);

    for (const candidate of candidates) {
      await onboardingCaseRepo.save(
        onboardingCaseRepo.create({
          tenantId: tenant.tenantId,
          candidateId: candidate.candidateId,
          currentState: candidate.currentState,
          completionPercentage: candidate.currentState === OnboardingState.BGV_IN_PROGRESS ? 58 : 42,
          offerSent: true,
          offerAccepted: true,
          documentsSubmitted: candidate.currentState === OnboardingState.DOCS_SUBMITTED,
          documentsVerified: false,
          bgvCompleted: false,
          bgvVendor: 'DemoVerify',
          bgvInitiatedDate: candidate.currentState === OnboardingState.BGV_IN_PROGRESS ? dateOnly(-3) : undefined,
          notes: 'Curated demo onboarding journey',
        })
      );

      await onboardingTaskRepo.save([
        onboardingTaskRepo.create({ tenantId: tenant.tenantId, candidateId: candidate.candidateId, title: 'Verify identity documents', description: 'PAN, Aadhaar, education proof, and address proof', taskType: 'document_verification', category: TaskCategory.DOCUMENT_VERIFICATION, status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, assignedTo: employeeByCode.get('DEMO002')!.employeeId, dueDate: dateOnly(2), isRequired: true }),
        onboardingTaskRepo.create({ tenantId: tenant.tenantId, candidateId: candidate.candidateId, title: 'Prepare laptop and SaaS access', description: 'Provision laptop, email, Slack, payroll, and HRMS access', taskType: 'it_provisioning', category: TaskCategory.IT_PROVISIONING, status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, assignedTo: employeeByCode.get('DEMO005')!.employeeId, dueDate: dateOnly(7), isRequired: true }),
      ]);
    }

    await probationRepo.save([
      probationRepo.create({ tenantId: tenant.tenantId, employeeId: employeeByCode.get('DEMO006')!.employeeId, currentState: ProbationState.REVIEW_60_PENDING, probationStartDate: dateOnly(-80), probationEndDate: dateOnly(10), probationDurationDays: 90, review30DueDate: dateOnly(-50), review30Completed: true, review60DueDate: dateOnly(-20), finalReviewDueDate: dateOnly(7), isAtRisk: false, notes: 'Strong culture fit, pending 60-day review sign-off' }),
      probationRepo.create({ tenantId: tenant.tenantId, employeeId: employeeByCode.get('DEMO008')!.employeeId, currentState: ProbationState.PROBATION_ACTIVE, probationStartDate: dateOnly(-35), probationEndDate: dateOnly(55), probationDurationDays: 90, review30DueDate: dateOnly(-5), review30Completed: false, review60DueDate: dateOnly(25), finalReviewDueDate: dateOnly(50), isAtRisk: true, riskLevel: 'medium', riskReason: 'Needs clearer stakeholder communication in design reviews', riskFlaggedBy: manager.employeeId, riskFlaggedDate: dateOnly(-4), notes: 'Demo at-risk probation case' }),
    ]);

    const review = await performanceRepo.save(
      performanceRepo.create({
        tenantId: tenant.tenantId,
        employeeId: employeeByCode.get('DEMO004')!.employeeId,
        reviewerId: manager.employeeId,
        reviewCycle: `${currentYear}`,
        reviewStartDate: dateOnly(-120),
        reviewEndDate: dateOnly(180),
        currentState: PerformanceState.MID_YEAR_PENDING,
        selfRatingMidYear: 4.2,
        managerRatingMidYear: 4.0,
        selfCommentsMidYear: 'Delivered onboarding analytics and improved leave visibility.',
        managerCommentsMidYear: 'Strong ownership. Next focus is mentoring newer engineers.',
        achievements: ['Shipped manager leave dashboard', 'Reduced attendance reconciliation time'],
        challenges: ['Cross-team dependency delays'],
        skillGaps: ['System design depth for reporting workloads'],
        trainingRecommendations: ['Advanced analytics architecture'],
        careerAspirations: 'Grow into Staff Engineer track',
      })
    );

    await goalRepo.save([
      goalRepo.create({ tenantId: tenant.tenantId, reviewId: review.reviewId, title: 'Launch manager HR dashboard', description: 'Create actionable leave, attendance, probation, and performance summary for people managers.', category: GoalCategory.BUSINESS, targetDate: dateOnly(90), weightage: 40, status: GoalStatus.IN_PROGRESS, progress: 68, notes: 'Demo goal in progress' }),
      goalRepo.create({ tenantId: tenant.tenantId, reviewId: review.reviewId, title: 'Improve attendance exception workflow', description: 'Reduce HR manual follow-up with cleaner exception states and reporting.', category: GoalCategory.TECHNICAL, targetDate: dateOnly(120), weightage: 35, status: GoalStatus.APPROVED, progress: 45, notes: 'Demo technical goal' }),
      goalRepo.create({ tenantId: tenant.tenantId, reviewId: review.reviewId, title: 'Mentor new joiners', description: 'Support onboarding and technical ramp-up for new engineers.', category: GoalCategory.LEADERSHIP, targetDate: dateOnly(150), weightage: 25, status: GoalStatus.IN_PROGRESS, progress: 55, notes: 'Demo leadership goal' }),
    ]);

    await exitRepo.save(
      exitRepo.create({
        tenantId: tenant.tenantId,
        employeeId: employeeByCode.get('DEMO012')!.employeeId,
        currentState: ExitState.CLEARANCE_IN_PROGRESS,
        resignationType: ResignationType.VOLUNTARY,
        resignationSubmittedDate: dateOnly(-11),
        resignationApprovedDate: dateOnly(-9),
        resignationReason: 'Relocation',
        detailedReason: 'Moving to another city for family reasons.',
        approvedBy: employeeByCode.get('DEMO002')!.employeeId,
        noticePeriodDays: 30,
        noticePeriodStartDate: dateOnly(-9),
        noticePeriodEndDate: dateOnly(21),
        lastWorkingDate: dateOnly(21),
        clearanceInitiatedDate: dateOnly(-8),
        allClearancesCleared: false,
        totalClearances: 5,
        completedClearances: 3,
        assetsReturnInitiatedDate: dateOnly(-6),
        allAssetsReturned: false,
        totalAssets: 3,
        returnedAssets: 2,
        exitInterviewScheduledDate: dateOnly(12),
        exitInterviewCompleted: false,
        settlementAmount: 185000,
        totalDeductions: 5000,
        netSettlementAmount: 180000,
        isEligibleForRehire: true,
        notes: 'Demo exit lifecycle case in clearance stage',
      })
    );

    await subscriptionRepo.save(
      subscriptionRepo.create({
        tenantId: tenant.tenantId,
        plan: SubscriptionPlan.ENTERPRISE,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: BillingCycle.YEARLY,
        price: 720000,
        maxUsers: 250,
        currentUsers: employeeByCode.size,
        maxStorageGB: 500,
        currentStorageGB: 38.5,
        startDate: dateOnly(-160),
        endDate: dateOnly(205),
        nextBillingDate: dateOnly(205),
        autoRenew: true,
        features: {
          advancedReporting: true,
          apiAccess: true,
          customBranding: true,
          ssoIntegration: true,
          prioritySupport: true,
          customWorkflows: true,
          aiInsights: true,
          multiCurrency: true,
        },
        notes: 'Demo enterprise subscription',
      })
    );

    await organizationSettingsRepo.save(
      organizationSettingsRepo.create({
        tenantId: tenant.tenantId,
        companyName: demoCompanyName,
        legalName: 'AuroraHR Demo Private Limited',
        email: 'people.demo@aurorahr.in',
        phone: '+91 80 4000 9000',
        website: 'https://aurorahr.in',
        address: 'Aurora Demo Business Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        pincode: '560001',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
        fiscalYearStart: 'April',
        employeeCodePrefix: 'DEMO',
        nextEmployeeNumber: 13,
      })
    );

    tenant.employeeCount = employeeByCode.size;
    await AppDataSource.getRepository(Tenant).save(tenant);

    console.log('Demo tenant seeded successfully.');
    console.log(`Company: ${demoCompanyName}`);
    console.log(`Subdomain: ${DEMO_TENANT_SUBDOMAIN}`);
    console.log(`Password for all demo personas: ${DEMO_PASSWORD}`);
    for (const persona of demoPersonas) {
      console.log(`${persona.label}: ${persona.email}`);
    }
  } finally {
    await AppDataSource.destroy();
  }
};

seedDemoData().catch((error) => {
  console.error('Failed to seed demo data:', error);
  process.exit(1);
});
