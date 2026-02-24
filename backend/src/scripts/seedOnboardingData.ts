import { AppDataSource } from '../config/database';
import { Tenant } from '../models/Tenant';
import { Department } from '../models/Department';
import { Designation } from '../models/Designation';
import { Candidate } from '../models/Candidate';
import { OnboardingCase } from '../models/OnboardingCase';
import { OnboardingState } from '../models/enums/OnboardingState';
import { BGVStatus } from '../models/enums/DocumentEnums';
import { Employee } from '../models/Employee';
import { ProbationCase } from '../models/ProbationCase';
import { ProbationState } from '../models/enums/ProbationState';

async function seedOnboardingData() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const departmentRepo = AppDataSource.getRepository(Department);
    const designationRepo = AppDataSource.getRepository(Designation);
    const candidateRepo = AppDataSource.getRepository(Candidate);
    const onboardingCaseRepo = AppDataSource.getRepository(OnboardingCase);
    const employeeRepo = AppDataSource.getRepository(Employee);
    const probationCaseRepo = AppDataSource.getRepository(ProbationCase);

    const tenant = await tenantRepo.findOne({ where: { subdomain: 'acme' } });
    if (!tenant) {
      console.error('❌ Tenant not found!');
      process.exit(1);
    }

    const departments = await departmentRepo.find({ where: { tenantId: tenant.tenantId } });
    const designations = await designationRepo.find({ where: { tenantId: tenant.tenantId } });

    console.log('📊 Creating onboarding candidates...');

    const candidatesData = [
      { firstName: 'Alice', lastName: 'Johnson', email: 'alice.j@example.com', state: OnboardingState.OFFER_SENT, salary: 85000 },
      { firstName: 'Bob', lastName: 'Smith', email: 'bob.s@example.com', state: OnboardingState.OFFER_ACCEPTED, salary: 75000 },
      { firstName: 'Charlie', lastName: 'Brown', email: 'charlie.b@example.com', state: OnboardingState.DOCS_PENDING, salary: 90000 },
      { firstName: 'Diana', lastName: 'Prince', email: 'diana.p@example.com', state: OnboardingState.HR_REVIEW, salary: 95000 },
      { firstName: 'Eve', lastName: 'Adams', email: 'eve.a@example.com', state: OnboardingState.BGV_IN_PROGRESS, salary: 80000 },
      { firstName: 'Frank', lastName: 'Miller', email: 'frank.m@example.com', state: OnboardingState.PRE_JOINING_SETUP, salary: 88000 },
      { firstName: 'Grace', lastName: 'Lee', email: 'grace.l@example.com', state: OnboardingState.JOINED, salary: 92000 },
      { firstName: 'Henry', lastName: 'Ford', email: 'henry.f@example.com', state: OnboardingState.ORIENTATION, salary: 87000 },
    ];

    for (const data of candidatesData) {
      const candidate = candidateRepo.create({
        tenantId: tenant.tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
        currentState: data.state,
        departmentId: departments[Math.floor(Math.random() * departments.length)]?.departmentId,
        designationId: designations[Math.floor(Math.random() * designations.length)]?.designationId,
        offeredSalary: data.salary,
        currency: 'USD',
        expectedJoinDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      });

      const savedCandidate = await candidateRepo.save(candidate);

      // Create onboarding case
      const onboardingCase = onboardingCaseRepo.create({
        tenantId: tenant.tenantId,
        candidateId: savedCandidate.candidateId,
        currentState: data.state,
        completionPercentage: Math.random() * 80,
        bgvStatus: data.state === OnboardingState.BGV_IN_PROGRESS ? BGVStatus.IN_PROGRESS : BGVStatus.NOT_INITIATED,
        offerSent: [OnboardingState.OFFER_SENT, OnboardingState.OFFER_ACCEPTED].includes(data.state),
        offerAccepted: data.state === OnboardingState.OFFER_ACCEPTED,
      });

      await onboardingCaseRepo.save(onboardingCase);
      console.log(`   Created candidate: ${data.firstName} ${data.lastName} (${data.state})`);
    }

    console.log('\n📊 Creating probation cases...');

    // Get some active employees
    const employees = await employeeRepo.find({
      where: { tenantId: tenant.tenantId },
      take: 5,
    });

    for (const employee of employees) {
      const probationStartDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000); // 45 days ago
      const probationEndDate = new Date(probationStartDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days from start

      const probationCase = probationCaseRepo.create({
        tenantId: tenant.tenantId,
        employeeId: employee.employeeId,
        currentState: ProbationState.PROBATION_ACTIVE,
        probationStartDate,
        probationEndDate,
        probationDurationDays: 90,
        review30DueDate: new Date(probationStartDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        review30Completed: true,
        review60DueDate: new Date(probationStartDate.getTime() + 60 * 24 * 60 * 60 * 1000),
        review60Completed: false,
        finalReviewDueDate: new Date(probationStartDate.getTime() + 85 * 24 * 60 * 60 * 1000),
        finalReviewCompleted: false,
        isAtRisk: Math.random() > 0.7,
        riskLevel: Math.random() > 0.7 ? 'Medium' : undefined,
      });

      await probationCaseRepo.save(probationCase);
      console.log(`   Created probation case for: ${employee.firstName} ${employee.lastName}`);
    }

    console.log('\n✅ Onboarding and probation seed data created successfully!');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding onboarding data:', error);
    process.exit(1);
  }
}

seedOnboardingData();
