import { AppDataSource } from '../config/database';
import { Tenant } from '../models/Tenant';
import { Department } from '../models/Department';
import { Designation } from '../models/Designation';
import { Candidate } from '../models/Candidate';
import { OnboardingCase } from '../models/OnboardingCase';
import { OnboardingState } from '../models/enums/OnboardingState';
import { BGVStatus, DocumentVerificationStatus } from '../models/enums/DocumentEnums';
import { Employee } from '../models/Employee';
import { ProbationCase } from '../models/ProbationCase';
import { ProbationState } from '../models/enums/ProbationState';
import { OnboardingDocument } from '../models/OnboardingDocument';
import { OnboardingTask } from '../models/OnboardingTask';
import { StatusTransition } from '../models/StatusTransition';
import { ProbationReview } from '../models/ProbationReview';

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function generatePhone(): string {
  return `+1-555-${Math.floor(Math.random() * 9000) + 1000}`;
}

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
    const documentRepo = AppDataSource.getRepository(OnboardingDocument);
    const taskRepo = AppDataSource.getRepository(OnboardingTask);
    const transitionRepo = AppDataSource.getRepository(StatusTransition);
    const reviewRepo = AppDataSource.getRepository(ProbationReview);

    const tenant = await tenantRepo.findOne({ where: { subdomain: 'acme' } });
    if (!tenant) {
      console.error('❌ Tenant not found!');
      process.exit(1);
    }

    const departments = await departmentRepo.find({ where: { tenantId: tenant.tenantId } });
    const designations = await designationRepo.find({ where: { tenantId: tenant.tenantId } });

    if (departments.length === 0 || designations.length === 0) {
      console.error('❌ No departments or designations found! Please run base seed first.');
      process.exit(1);
    }

    console.log('📊 Creating comprehensive onboarding candidates...');

    const candidatesData = [
      { firstName: 'Alice', lastName: 'Johnson', email: 'alice.j@example.com', state: OnboardingState.OFFER_APPROVED, salary: 85000, daysOffset: -10 },
      { firstName: 'Bob', lastName: 'Smith', email: 'bob.s@example.com', state: OnboardingState.OFFER_SENT, salary: 75000, daysOffset: -7 },
      { firstName: 'Charlie', lastName: 'Brown', email: 'charlie.b@example.com', state: OnboardingState.OFFER_ACCEPTED, salary: 90000, daysOffset: -5 },
      { firstName: 'Diana', lastName: 'Prince', email: 'diana.p@example.com', state: OnboardingState.DOCS_PENDING, salary: 95000, daysOffset: -3 },
      { firstName: 'Eve', lastName: 'Adams', email: 'eve.a@example.com', state: OnboardingState.DOCS_SUBMITTED, salary: 80000, daysOffset: -2 },
      { firstName: 'Frank', lastName: 'Miller', email: 'frank.m@example.com', state: OnboardingState.HR_REVIEW, salary: 88000, daysOffset: -1 },
      { firstName: 'Grace', lastName: 'Lee', email: 'grace.l@example.com', state: OnboardingState.BGV_IN_PROGRESS, salary: 92000, daysOffset: 0 },
      { firstName: 'Henry', lastName: 'Ford', email: 'henry.f@example.com', state: OnboardingState.BGV_PASSED, salary: 87000, daysOffset: 5 },
      { firstName: 'Ivy', lastName: 'Chen', email: 'ivy.c@example.com', state: OnboardingState.PRE_JOINING_SETUP, salary: 94000, daysOffset: 10 },
      { firstName: 'Jack', lastName: 'Wilson', email: 'jack.w@example.com', state: OnboardingState.JOINED, salary: 96000, daysOffset: 15 },
      { firstName: 'Kelly', lastName: 'Martinez', email: 'kelly.m@example.com', state: OnboardingState.ORIENTATION, salary: 89000, daysOffset: 16 },
      { firstName: 'Liam', lastName: 'Taylor', email: 'liam.t@example.com', state: OnboardingState.ONBOARDING_COMPLETE, salary: 91000, daysOffset: 20 },
    ];

    for (const data of candidatesData) {
      const department = departments[Math.floor(Math.random() * departments.length)];
      const designation = designations[Math.floor(Math.random() * designations.length)];

      const candidate = candidateRepo.create({
        tenantId: tenant.tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: generatePhone(),
        currentState: data.state,
        departmentId: department.departmentId,
        designationId: designation.designationId,
        offeredSalary: data.salary,
        currency: 'USD',
        expectedJoinDate: addDays(new Date(), data.daysOffset + 30),
        actualJoinDate: [OnboardingState.JOINED, OnboardingState.ORIENTATION, OnboardingState.ONBOARDING_COMPLETE].includes(data.state)
          ? addDays(new Date(), data.daysOffset)
          : undefined,
        isActive: true,
      });

      const savedCandidate = await candidateRepo.save(candidate);

      // Calculate completion percentage based on state
      const stateProgress: Record<string, number> = {
        [OnboardingState.OFFER_APPROVED]: 10,
        [OnboardingState.OFFER_SENT]: 20,
        [OnboardingState.OFFER_ACCEPTED]: 30,
        [OnboardingState.DOCS_PENDING]: 40,
        [OnboardingState.DOCS_SUBMITTED]: 50,
        [OnboardingState.HR_REVIEW]: 60,
        [OnboardingState.BGV_IN_PROGRESS]: 70,
        [OnboardingState.BGV_PASSED]: 80,
        [OnboardingState.PRE_JOINING_SETUP]: 85,
        [OnboardingState.JOINED]: 90,
        [OnboardingState.ORIENTATION]: 95,
        [OnboardingState.ONBOARDING_COMPLETE]: 100,
      };

      // Determine BGV status based on state
      let bgvStatus = BGVStatus.NOT_INITIATED;
      if (data.state === OnboardingState.BGV_IN_PROGRESS) bgvStatus = BGVStatus.IN_PROGRESS;
      if (data.state === OnboardingState.BGV_PASSED) bgvStatus = BGVStatus.PASSED;
      if ([OnboardingState.PRE_JOINING_SETUP, OnboardingState.JOINED, OnboardingState.ORIENTATION, OnboardingState.ONBOARDING_COMPLETE].includes(data.state)) {
        bgvStatus = BGVStatus.PASSED;
      }

      // Create onboarding case
      const onboardingCase = onboardingCaseRepo.create({
        tenantId: tenant.tenantId,
        candidateId: savedCandidate.candidateId,
        currentState: data.state,
        completionPercentage: stateProgress[data.state] || 0,
        bgvStatus,
        bgvVendor: bgvStatus !== BGVStatus.NOT_INITIATED ? 'FirstAdvantage' : undefined,
        bgvReferenceId: bgvStatus !== BGVStatus.NOT_INITIATED ? `BGV-${Date.now()}-${savedCandidate.candidateId}` : undefined,
        offerSent: [OnboardingState.OFFER_SENT, OnboardingState.OFFER_ACCEPTED, OnboardingState.DOCS_PENDING, OnboardingState.DOCS_SUBMITTED, OnboardingState.HR_REVIEW, OnboardingState.BGV_IN_PROGRESS, OnboardingState.BGV_PASSED, OnboardingState.PRE_JOINING_SETUP, OnboardingState.JOINED, OnboardingState.ORIENTATION, OnboardingState.ONBOARDING_COMPLETE].includes(data.state),
        offerAccepted: [OnboardingState.OFFER_ACCEPTED, OnboardingState.DOCS_PENDING, OnboardingState.DOCS_SUBMITTED, OnboardingState.HR_REVIEW, OnboardingState.BGV_IN_PROGRESS, OnboardingState.BGV_PASSED, OnboardingState.PRE_JOINING_SETUP, OnboardingState.JOINED, OnboardingState.ORIENTATION, OnboardingState.ONBOARDING_COMPLETE].includes(data.state),
        documentsSubmitted: [OnboardingState.DOCS_SUBMITTED, OnboardingState.HR_REVIEW, OnboardingState.BGV_IN_PROGRESS, OnboardingState.BGV_PASSED, OnboardingState.PRE_JOINING_SETUP, OnboardingState.JOINED, OnboardingState.ORIENTATION, OnboardingState.ONBOARDING_COMPLETE].includes(data.state),
        documentsVerified: [OnboardingState.BGV_IN_PROGRESS, OnboardingState.BGV_PASSED, OnboardingState.PRE_JOINING_SETUP, OnboardingState.JOINED, OnboardingState.ORIENTATION, OnboardingState.ONBOARDING_COMPLETE].includes(data.state),
        bgvCompleted: [OnboardingState.BGV_PASSED, OnboardingState.PRE_JOINING_SETUP, OnboardingState.JOINED, OnboardingState.ORIENTATION, OnboardingState.ONBOARDING_COMPLETE].includes(data.state),
        preJoiningComplete: [OnboardingState.JOINED, OnboardingState.ORIENTATION, OnboardingState.ONBOARDING_COMPLETE].includes(data.state),
        joined: [OnboardingState.JOINED, OnboardingState.ORIENTATION, OnboardingState.ONBOARDING_COMPLETE].includes(data.state),
        orientationComplete: data.state === OnboardingState.ONBOARDING_COMPLETE,
      });

      await onboardingCaseRepo.save(onboardingCase);

      // Create realistic documents based on state
      if ([OnboardingState.OFFER_SENT, OnboardingState.OFFER_ACCEPTED, OnboardingState.DOCS_PENDING, OnboardingState.DOCS_SUBMITTED, OnboardingState.HR_REVIEW, OnboardingState.BGV_IN_PROGRESS, OnboardingState.BGV_PASSED, OnboardingState.PRE_JOINING_SETUP, OnboardingState.JOINED, OnboardingState.ORIENTATION, OnboardingState.ONBOARDING_COMPLETE].includes(data.state)) {
        const offerDoc = documentRepo.create({
          tenantId: tenant.tenantId,
          candidateId: savedCandidate.candidateId,
          documentType: 'offer_letter',
          category: 'system_generated',
          fileName: `Offer_Letter_${savedCandidate.firstName}_${savedCandidate.lastName}.pdf`,
          filePath: `/uploads/documents/offer_${savedCandidate.candidateId}.pdf`,
          version: 1,
          isRequired: true,
          requiresSignature: true,
          isSigned: data.state !== OnboardingState.OFFER_SENT,
          signedDate: data.state !== OnboardingState.OFFER_SENT ? addDays(new Date(), data.daysOffset + 1) : undefined,
          verificationStatus: DocumentVerificationStatus.VERIFIED,
        });
        await documentRepo.save(offerDoc);
      }

      if ([OnboardingState.DOCS_SUBMITTED, OnboardingState.HR_REVIEW, OnboardingState.BGV_IN_PROGRESS, OnboardingState.BGV_PASSED, OnboardingState.PRE_JOINING_SETUP, OnboardingState.JOINED, OnboardingState.ORIENTATION, OnboardingState.ONBOARDING_COMPLETE].includes(data.state)) {
        const docsToCreate = [
          { type: 'aadhar', fileName: 'Aadhar_Card.pdf' },
          { type: 'pan', fileName: 'PAN_Card.pdf' },
          { type: 'passport_size_photo', fileName: 'Photo.jpg' },
          { type: 'educational_certificates', fileName: 'Degree_Certificate.pdf' },
        ];

        for (const docData of docsToCreate) {
          const doc = documentRepo.create({
            tenantId: tenant.tenantId,
            candidateId: savedCandidate.candidateId,
            documentType: docData.type,
            category: 'candidate_upload',
            fileName: docData.fileName,
            filePath: `/uploads/documents/${docData.type}_${savedCandidate.candidateId}.pdf`,
            version: 1,
            isRequired: true,
            requiresSignature: false,
            verificationStatus: data.state === OnboardingState.HR_REVIEW
              ? DocumentVerificationStatus.UPLOADED
              : DocumentVerificationStatus.VERIFIED,
            verifiedDate: data.state !== OnboardingState.HR_REVIEW ? addDays(new Date(), data.daysOffset + 2) : undefined,
          });
          await documentRepo.save(doc);
        }
      }

      // Create tasks based on current state
      if (data.state === OnboardingState.DOCS_PENDING) {
        const tasks = [
          { title: 'Upload Aadhar Card', type: 'document_upload', priority: 'high', dueDate: addDays(new Date(), 7) },
          { title: 'Upload PAN Card', type: 'document_upload', priority: 'high', dueDate: addDays(new Date(), 7) },
          { title: 'Upload Educational Certificates', type: 'document_upload', priority: 'medium', dueDate: addDays(new Date(), 10) },
        ];

        for (const taskData of tasks) {
          const task = taskRepo.create({
            tenantId: tenant.tenantId,
            candidateId: savedCandidate.candidateId,
            title: taskData.title,
            taskType: taskData.type,
            category: 'documentation',
            status: 'pending',
            priority: taskData.priority,
            assignedRole: 'candidate',
            dueDate: taskData.dueDate,
            isRequired: true,
          });
          await taskRepo.save(task);
        }
      }

      if (data.state === OnboardingState.PRE_JOINING_SETUP) {
        const preJoiningTasks = [
          { title: 'Provision Laptop', type: 'it_provisioning', assignedRole: 'it', priority: 'high', dueDate: addDays(candidate.expectedJoinDate!, -3) },
          { title: 'Create Email Account', type: 'it_provisioning', assignedRole: 'it', priority: 'high', dueDate: addDays(candidate.expectedJoinDate!, -3) },
          { title: 'Verify Bank Details', type: 'payroll_setup', assignedRole: 'hr', priority: 'high', dueDate: addDays(candidate.expectedJoinDate!, -5) },
          { title: 'Assign Workspace', type: 'admin_setup', assignedRole: 'admin', priority: 'medium', dueDate: addDays(candidate.expectedJoinDate!, -2) },
        ];

        for (const taskData of preJoiningTasks) {
          const task = taskRepo.create({
            tenantId: tenant.tenantId,
            candidateId: savedCandidate.candidateId,
            title: taskData.title,
            taskType: taskData.type,
            category: 'pre_joining',
            status: 'pending',
            priority: taskData.priority,
            assignedRole: taskData.assignedRole,
            dueDate: taskData.dueDate,
            isRequired: true,
          });
          await taskRepo.save(task);
        }
      }

      if (data.state === OnboardingState.ORIENTATION) {
        const orientationTasks = [
          { title: 'Complete IT Security Training', type: 'training', priority: 'high', dueDate: addDays(new Date(), 3), status: 'in_progress' },
          { title: 'Complete Compliance Training', type: 'training', priority: 'high', dueDate: addDays(new Date(), 5), status: 'pending' },
          { title: 'Meet with Team Lead', type: 'orientation', priority: 'medium', dueDate: addDays(new Date(), 1), status: 'completed' },
        ];

        for (const taskData of orientationTasks) {
          const task = taskRepo.create({
            tenantId: tenant.tenantId,
            candidateId: savedCandidate.candidateId,
            title: taskData.title,
            taskType: taskData.type,
            category: 'orientation',
            status: taskData.status,
            priority: taskData.priority,
            assignedRole: 'candidate',
            dueDate: taskData.dueDate,
            isRequired: true,
            completedDate: taskData.status === 'completed' ? addDays(new Date(), -1) : undefined,
          });
          await taskRepo.save(task);
        }
      }

      // Create state transition history
      const stateSequence = [
        OnboardingState.OFFER_APPROVED,
        OnboardingState.OFFER_SENT,
        OnboardingState.OFFER_ACCEPTED,
        OnboardingState.DOCS_PENDING,
        OnboardingState.DOCS_SUBMITTED,
        OnboardingState.HR_REVIEW,
        OnboardingState.BGV_IN_PROGRESS,
        OnboardingState.BGV_PASSED,
        OnboardingState.PRE_JOINING_SETUP,
        OnboardingState.JOINED,
        OnboardingState.ORIENTATION,
        OnboardingState.ONBOARDING_COMPLETE,
      ];

      const currentIndex = stateSequence.indexOf(data.state);
      if (currentIndex > 0) {
        for (let i = 0; i < currentIndex; i++) {
          const transition = transitionRepo.create({
            tenantId: tenant.tenantId,
            entityType: 'candidate',
            entityId: savedCandidate.candidateId,
            candidateId: savedCandidate.candidateId,
            fromState: i === 0 ? 'new' : stateSequence[i - 1],
            toState: stateSequence[i],
            transitionDate: addDays(new Date(), data.daysOffset - (currentIndex - i) * 2),
            triggerType: 'manual',
            reason: i === 0 ? 'Candidate approved for hiring' : `Progressed to ${stateSequence[i]}`,
          });
          await transitionRepo.save(transition);
        }

        // Add current state transition
        const finalTransition = transitionRepo.create({
          tenantId: tenant.tenantId,
          entityType: 'candidate',
          entityId: savedCandidate.candidateId,
          candidateId: savedCandidate.candidateId,
          fromState: stateSequence[currentIndex - 1],
          toState: data.state,
          transitionDate: addDays(new Date(), data.daysOffset),
          triggerType: 'manual',
          reason: `Moved to ${data.state}`,
        });
        await transitionRepo.save(finalTransition);
      }

      console.log(`   ✓ Created candidate: ${data.firstName} ${data.lastName} (${data.state}) with ${currentIndex + 1} state transitions`);
    }

    console.log('\n📊 Creating comprehensive probation cases...');

    // Get active employees
    const employees = await employeeRepo.find({
      where: { tenantId: tenant.tenantId },
      take: 8,
    });

    if (employees.length < 6) {
      console.warn('⚠️  Less than 6 employees found. Probation scenarios will be limited.');
    }

    const probationScenarios = [
      {
        name: 'Scenario 1: 30-day pending (on track)',
        daysInProbation: 28,
        state: ProbationState.REVIEW_30_PENDING,
        review30Completed: false,
        review60Completed: false,
        finalReviewCompleted: false,
        isAtRisk: false,
      },
      {
        name: 'Scenario 2: 30-day done, 60-day pending (at risk)',
        daysInProbation: 58,
        state: ProbationState.REVIEW_60_PENDING,
        review30Completed: true,
        review60Completed: false,
        finalReviewCompleted: false,
        isAtRisk: true,
        riskLevel: 'High',
        riskReason: 'Missed multiple deadlines, communication issues',
      },
      {
        name: 'Scenario 3: Final review pending (on track)',
        daysInProbation: 83,
        state: ProbationState.FINAL_REVIEW_PENDING,
        review30Completed: true,
        review60Completed: true,
        finalReviewCompleted: false,
        isAtRisk: false,
      },
      {
        name: 'Scenario 4: Decision pending after final review',
        daysInProbation: 87,
        state: ProbationState.DECISION_PENDING,
        review30Completed: true,
        review60Completed: true,
        finalReviewCompleted: true,
        isAtRisk: false,
      },
      {
        name: 'Scenario 5: Confirmed (completed probation)',
        daysInProbation: 92,
        state: ProbationState.CONFIRMED,
        review30Completed: true,
        review60Completed: true,
        finalReviewCompleted: true,
        isAtRisk: false,
        finalDecision: 'confirmed',
      },
      {
        name: 'Scenario 6: Extended probation active',
        daysInProbation: 95,
        state: ProbationState.EXTENDED_PROBATION_ACTIVE,
        review30Completed: true,
        review60Completed: true,
        finalReviewCompleted: true,
        isAtRisk: true,
        riskLevel: 'Medium',
        riskReason: 'Performance below expectations, requires additional monitoring',
        isExtended: true,
        extensionDurationDays: 30,
        finalDecision: 'extended',
      },
    ];

    for (let i = 0; i < Math.min(employees.length, probationScenarios.length); i++) {
      const employee = employees[i];
      const scenario = probationScenarios[i];

      const probationStartDate = addDays(new Date(), -scenario.daysInProbation);
      const originalEndDate = addDays(probationStartDate, 90);
      const probationEndDate = scenario.isExtended
        ? addDays(originalEndDate, scenario.extensionDurationDays!)
        : originalEndDate;

      const probationCase = probationCaseRepo.create({
        tenantId: tenant.tenantId,
        employeeId: employee.employeeId,
        currentState: scenario.state,
        probationStartDate,
        probationEndDate,
        probationDurationDays: 90,
        review30DueDate: addDays(probationStartDate, 30),
        review30Completed: scenario.review30Completed,
        review60DueDate: addDays(probationStartDate, 60),
        review60Completed: scenario.review60Completed,
        finalReviewDueDate: addDays(probationStartDate, 85),
        finalReviewCompleted: scenario.finalReviewCompleted,
        isAtRisk: scenario.isAtRisk,
        riskLevel: scenario.riskLevel,
        riskReason: scenario.riskReason,
        isExtended: scenario.isExtended || false,
        extensionDurationDays: scenario.extensionDurationDays,
        originalEndDate: scenario.isExtended ? originalEndDate : undefined,
        finalDecision: scenario.finalDecision,
        decisionDate: scenario.finalDecision ? addDays(probationStartDate, scenario.isExtended ? 90 : 88) : undefined,
      });

      const savedProbation = await probationCaseRepo.save(probationCase);

      // Create 30-day review if completed
      if (scenario.review30Completed) {
        const review30 = reviewRepo.create({
          tenantId: tenant.tenantId,
          probationId: savedProbation.probationId,
          employeeId: employee.employeeId,
          reviewType: '30_day',
          dueDate: addDays(probationStartDate, 30),
          completedDate: addDays(probationStartDate, 29),
          status: 'completed',
          roleClarityRating: scenario.isAtRisk ? 2 : 4,
          learningSpeedRating: scenario.isAtRisk ? 3 : 4,
          communicationRating: scenario.isAtRisk ? 2 : 5,
          cultureFitRating: scenario.isAtRisk ? 3 : 5,
          hasRiskFlag: scenario.isAtRisk,
          riskFlagReason: scenario.isAtRisk ? 'Struggling with role clarity and communication' : undefined,
          managerComments: scenario.isAtRisk
            ? 'Employee is showing effort but struggling with key responsibilities. Needs closer monitoring.'
            : 'Strong start! Employee is adapting well to the role and team culture.',
          hrReviewedBy: undefined,
          hrApproved: true,
          hrNotes: 'Review noted. Will monitor progress.',
        });
        await reviewRepo.save(review30);
      }

      // Create 60-day review if completed
      if (scenario.review60Completed) {
        const review60 = reviewRepo.create({
          tenantId: tenant.tenantId,
          probationId: savedProbation.probationId,
          employeeId: employee.employeeId,
          reviewType: '60_day',
          dueDate: addDays(probationStartDate, 60),
          completedDate: addDays(probationStartDate, 59),
          status: 'completed',
          kpiProgressRating: scenario.isAtRisk ? 2 : 4,
          independenceRating: scenario.isAtRisk ? 2 : 4,
          monitoringStatus: scenario.isAtRisk ? 'at_risk' : 'on_track',
          managerComments: scenario.isAtRisk
            ? 'Limited progress on KPIs. Requires significant support. Considering extension.'
            : 'Meeting KPI targets. Increasing independence. On track for confirmation.',
          hrReviewedBy: undefined,
          hrApproved: true,
          hrNotes: scenario.isAtRisk ? 'HR intervention scheduled. May need extension.' : 'Progressing well.',
        });
        await reviewRepo.save(review60);
      }

      // Create final review if completed
      if (scenario.finalReviewCompleted) {
        const finalReview = reviewRepo.create({
          tenantId: tenant.tenantId,
          probationId: savedProbation.probationId,
          employeeId: employee.employeeId,
          reviewType: 'final',
          dueDate: addDays(probationStartDate, 85),
          completedDate: addDays(probationStartDate, 84),
          status: 'completed',
          recommendation: scenario.finalDecision === 'extended' ? 'extend' : scenario.finalDecision === 'confirmed' ? 'confirm' : undefined,
          recommendedExtensionDays: scenario.finalDecision === 'extended' ? scenario.extensionDurationDays : undefined,
          improvementPlanRequired: scenario.finalDecision === 'extended',
          improvementPlan: scenario.finalDecision === 'extended'
            ? 'Focus areas:\n1. Complete assigned projects independently with minimal supervision\n2. Improve response time and communication with stakeholders\n3. Meet at least 80% of KPI targets\n\nSupport provided:\n- Weekly 1:1s with manager\n- Mentorship from senior team member\n- Additional training resources'
            : undefined,
          managerComments: scenario.finalDecision === 'extended'
            ? 'Employee has shown improvement but needs more time to meet performance standards. Recommend 30-day extension with structured improvement plan.'
            : scenario.finalDecision === 'confirmed'
            ? 'Excellent performance throughout probation. Recommend immediate confirmation.'
            : 'Final review completed. Awaiting HR decision.',
          hrReviewedBy: undefined,
          hrApproved: scenario.finalDecision ? true : false,
          hrNotes: scenario.finalDecision === 'extended'
            ? 'Extension approved. Improvement plan in place.'
            : scenario.finalDecision === 'confirmed'
            ? 'Confirmed effective immediately.'
            : undefined,
        });
        await reviewRepo.save(finalReview);
      }

      // Create pending review for scenarios that need it
      if (!scenario.review30Completed && scenario.state === ProbationState.REVIEW_30_PENDING) {
        const pendingReview = reviewRepo.create({
          tenantId: tenant.tenantId,
          probationId: savedProbation.probationId,
          employeeId: employee.employeeId,
          reviewType: '30_day',
          dueDate: addDays(probationStartDate, 30),
          status: 'pending',
        });
        await reviewRepo.save(pendingReview);
      }

      if (!scenario.review60Completed && scenario.state === ProbationState.REVIEW_60_PENDING) {
        const pendingReview = reviewRepo.create({
          tenantId: tenant.tenantId,
          probationId: savedProbation.probationId,
          employeeId: employee.employeeId,
          reviewType: '60_day',
          dueDate: addDays(probationStartDate, 60),
          status: 'pending',
        });
        await reviewRepo.save(pendingReview);
      }

      if (!scenario.finalReviewCompleted && scenario.state === ProbationState.FINAL_REVIEW_PENDING) {
        const pendingReview = reviewRepo.create({
          tenantId: tenant.tenantId,
          probationId: savedProbation.probationId,
          employeeId: employee.employeeId,
          reviewType: 'final',
          dueDate: addDays(probationStartDate, 85),
          status: 'pending',
        });
        await reviewRepo.save(pendingReview);
      }

      // Create state transitions for probation
      const transitions = [
        { from: 'new', to: ProbationState.PROBATION_ACTIVE, daysOffset: -scenario.daysInProbation },
      ];

      if (scenario.review30Completed) {
        transitions.push({ from: ProbationState.PROBATION_ACTIVE, to: ProbationState.REVIEW_30_DONE, daysOffset: -scenario.daysInProbation + 30 });
      }
      if (scenario.review60Completed) {
        transitions.push({ from: ProbationState.REVIEW_30_DONE, to: ProbationState.REVIEW_60_DONE, daysOffset: -scenario.daysInProbation + 60 });
      }
      if (scenario.finalReviewCompleted && !scenario.finalDecision) {
        transitions.push({ from: ProbationState.REVIEW_60_DONE, to: ProbationState.DECISION_PENDING, daysOffset: -scenario.daysInProbation + 85 });
      }
      if (scenario.finalDecision === 'confirmed') {
        transitions.push({ from: ProbationState.DECISION_PENDING, to: ProbationState.CONFIRMED, daysOffset: -scenario.daysInProbation + 88 });
      }
      if (scenario.finalDecision === 'extended') {
        transitions.push({ from: ProbationState.DECISION_PENDING, to: ProbationState.PROBATION_EXTENDED, daysOffset: -scenario.daysInProbation + 88 });
        transitions.push({ from: ProbationState.PROBATION_EXTENDED, to: ProbationState.EXTENDED_PROBATION_ACTIVE, daysOffset: -scenario.daysInProbation + 90 });
      }

      for (const trans of transitions) {
        const transition = transitionRepo.create({
          tenantId: tenant.tenantId,
          entityType: 'probation',
          entityId: savedProbation.probationId,
          employeeId: employee.employeeId,
          fromState: trans.from,
          toState: trans.to,
          transitionDate: addDays(new Date(), trans.daysOffset),
          triggerType: trans.to.includes('REVIEW') || trans.to === ProbationState.DECISION_PENDING ? 'automatic' : 'manual',
          reason: `Probation state transition to ${trans.to}`,
        });
        await transitionRepo.save(transition);
      }

      console.log(`   ✓ ${scenario.name} - ${employee.firstName} ${employee.lastName} (${scenario.state})`);
    }

    console.log('\n✅ Comprehensive onboarding and probation seed data created successfully!');
    console.log(`\nSummary:`);
    console.log(`  - ${candidatesData.length} candidates across all onboarding states`);
    console.log(`  - ${Math.min(employees.length, probationScenarios.length)} probation cases with realistic scenarios`);
    console.log(`  - Realistic documents, tasks, reviews, and state transition history`);
    console.log(`  - At-risk employees flagged for HR intervention`);
    console.log(`  - Extension scenario with improvement plan`);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding onboarding data:', error);
    process.exit(1);
  }
}

seedOnboardingData();
