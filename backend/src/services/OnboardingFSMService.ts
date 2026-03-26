import { AppDataSource } from '../config/database';
import { Candidate } from '../models/Candidate';
import { Employee } from '../models/Employee';
import { OnboardingCase } from '../models/OnboardingCase';
import { OnboardingDocument } from '../models/OnboardingDocument';
import { StatusTransition } from '../models/StatusTransition';
import { AuditLog } from '../models/AuditLog';
import { OnboardingState } from '../models/enums/OnboardingState';
import { VerificationStatus } from '../models/enums/DocumentEnums';
import { EmploymentStatus } from '../../../shared/types';
import logger from '../utils/logger';

type TransitionGuard = (candidate: Candidate, onboardingCase: OnboardingCase) => Promise<boolean | string>;
type TransitionAction = (candidate: Candidate, onboardingCase: OnboardingCase, userId: string) => Promise<void>;

interface StateTransitionConfig {
  from: OnboardingState;
  to: OnboardingState;
  guards?: TransitionGuard[];
  actions?: TransitionAction[];
  requiresApproval?: boolean;
  approvalType?: string;
}

class OnboardingFSMService {
  private candidateRepo = AppDataSource.getRepository(Candidate);
  private employeeRepo = AppDataSource.getRepository(Employee);
  private onboardingCaseRepo = AppDataSource.getRepository(OnboardingCase);
  private documentRepo = AppDataSource.getRepository(OnboardingDocument);
  private transitionRepo = AppDataSource.getRepository(StatusTransition);
  private auditLogRepo = AppDataSource.getRepository(AuditLog);

  private transitions: StateTransitionConfig[] = [
    // Forward transitions
    {
      from: OnboardingState.OFFER_APPROVED,
      to: OnboardingState.OFFER_SENT,
      actions: [this.actionRecordOfferSentDate],
    },
    {
      from: OnboardingState.OFFER_SENT,
      to: OnboardingState.OFFER_ACCEPTED,
      guards: [this.guardOfferAcceptanceReceived],
      actions: [this.actionCreateDocumentChecklist, this.actionCreatePreJoiningTasks],
    },
    {
      from: OnboardingState.OFFER_ACCEPTED,
      to: OnboardingState.DOCS_PENDING,
      actions: [],
    },
    {
      from: OnboardingState.DOCS_PENDING,
      to: OnboardingState.DOCS_SUBMITTED,
      guards: [this.guardAllRequiredDocsUploaded],
      actions: [this.actionNotifyHRForVerification],
    },
    {
      from: OnboardingState.DOCS_SUBMITTED,
      to: OnboardingState.HR_REVIEW,
      actions: [],
    },
    {
      from: OnboardingState.HR_REVIEW,
      to: OnboardingState.BGV_IN_PROGRESS,
      guards: [this.guardAllDocsVerified],
      actions: [this.actionInitiateBGV],
    },
    {
      from: OnboardingState.BGV_IN_PROGRESS,
      to: OnboardingState.BGV_PASSED,
      actions: [],
    },
    {
      from: OnboardingState.BGV_IN_PROGRESS,
      to: OnboardingState.BGV_DISCREPANCY,
      actions: [],
    },
    {
      from: OnboardingState.BGV_DISCREPANCY,
      to: OnboardingState.BGV_IN_PROGRESS,
      actions: [],
    },
    {
      from: OnboardingState.BGV_PASSED,
      to: OnboardingState.PRE_JOINING_SETUP,
      actions: [],
    },
    {
      from: OnboardingState.PRE_JOINING_SETUP,
      to: OnboardingState.JOINED,
      guards: [
        this.guardAppointmentLetterSigned,
        this.guardPolicyAcknowledgementsSigned,
        this.guardPayrollSetupComplete,
      ],
      actions: [
        this.actionCreateEmployeeRecord,
        this.actionInitiateProbation,
        this.actionCreateDay1Tasks,
      ],
    },
    {
      from: OnboardingState.JOINED,
      to: OnboardingState.ORIENTATION,
      actions: [],
    },
    {
      from: OnboardingState.ORIENTATION,
      to: OnboardingState.ONBOARDING_COMPLETE,
      guards: [this.guardOrientationTasksComplete],
      actions: [],
    },

    // Backward transitions (rollback capabilities)
    {
      from: OnboardingState.OFFER_SENT,
      to: OnboardingState.OFFER_APPROVED,
      actions: [],
    },
    {
      from: OnboardingState.OFFER_ACCEPTED,
      to: OnboardingState.OFFER_SENT,
      actions: [],
    },
    {
      from: OnboardingState.DOCS_PENDING,
      to: OnboardingState.OFFER_ACCEPTED,
      actions: [],
    },
    {
      from: OnboardingState.DOCS_SUBMITTED,
      to: OnboardingState.DOCS_PENDING,
      actions: [],
    },
    {
      from: OnboardingState.HR_REVIEW,
      to: OnboardingState.DOCS_SUBMITTED,
      actions: [],
    },
    {
      from: OnboardingState.BGV_IN_PROGRESS,
      to: OnboardingState.HR_REVIEW,
      actions: [],
    },
    {
      from: OnboardingState.BGV_PASSED,
      to: OnboardingState.BGV_IN_PROGRESS,
      actions: [],
    },
    {
      from: OnboardingState.PRE_JOINING_SETUP,
      to: OnboardingState.BGV_PASSED,
      actions: [],
    },
    {
      from: OnboardingState.ORIENTATION,
      to: OnboardingState.JOINED,
      actions: [],
    },
    {
      from: OnboardingState.ONBOARDING_COMPLETE,
      to: OnboardingState.ORIENTATION,
      actions: [],
    },
    {
      from: OnboardingState.ONBOARDING_COMPLETE,
      to: OnboardingState.JOINED,
      actions: [],
    },
  ];

  async transition(
    candidateId: string,
    toState: OnboardingState,
    userId: string,
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; message?: string }> {
    const candidate = await this.candidateRepo.findOne({
      where: { candidateId },
      relations: ['tenant'],
    });

    if (!candidate) {
      return { success: false, message: 'Candidate not found' };
    }

    const onboardingCase = await this.onboardingCaseRepo.findOne({
      where: { candidateId, tenantId: candidate.tenantId },
    });

    if (!onboardingCase) {
      return { success: false, message: 'Onboarding case not found' };
    }

    const fromState = candidate.currentState;

    // Find transition config
    const transitionConfig = this.transitions.find(
      (t) => t.from === fromState && t.to === toState
    );

    if (!transitionConfig) {
      return {
        success: false,
        message: `Invalid transition from ${fromState} to ${toState}`,
      };
    }

    // Execute guards
    if (transitionConfig.guards) {
      for (const guard of transitionConfig.guards) {
        const guardResult = await guard.call(this, candidate, onboardingCase);
        if (guardResult !== true) {
          return {
            success: false,
            message: typeof guardResult === 'string' ? guardResult : 'Transition guard failed',
          };
        }
      }
    }

    // Execute transition
    try {
      candidate.currentState = toState;
      onboardingCase.currentState = toState;

      await this.candidateRepo.save(candidate);
      await this.onboardingCaseRepo.save(onboardingCase);

      // Log transition
      await this.logTransition(candidate, fromState, toState, userId, reason || 'State transition', metadata);

      // Execute actions
      if (transitionConfig.actions) {
        for (const action of transitionConfig.actions) {
          await action.call(this, candidate, onboardingCase, userId);
        }
      }

      logger.info(`Onboarding state transition: ${candidateId} from ${fromState} to ${toState}`);

      return { success: true };
    } catch (error: any) {
      logger.error('Onboarding state transition failed:', error);
      return { success: false, message: error.message };
    }
  }

  private async logTransition(
    candidate: Candidate,
    fromState: OnboardingState,
    toState: OnboardingState,
    userId: string,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Create StatusTransition record
    const transition = this.transitionRepo.create({
      tenantId: candidate.tenantId,
      entityType: 'candidate',
      entityId: candidate.candidateId,
      candidateId: candidate.candidateId,
      fromState,
      toState,
      triggeredBy: userId,
      triggerType: 'manual',
      reason,
      metadata,
    });

    await this.transitionRepo.save(transition);

    // Create AuditLog entry
    const auditLog = this.auditLogRepo.create({
      tenantId: candidate.tenantId,
      userId,
      action: 'STATE_TRANSITION',
      entityType: 'candidate',
      entityId: candidate.candidateId,
      oldValue: { currentState: fromState },
      newValue: { currentState: toState },
      description: `Onboarding state changed from ${fromState} to ${toState}. Reason: ${reason}`,
    });

    await this.auditLogRepo.save(auditLog);
  }

  // Guards
  private async guardOfferAcceptanceReceived(candidate: Candidate): Promise<boolean | string> {
    if (!candidate.offerAcceptedDate) {
      return 'Offer acceptance date not recorded';
    }
    return true;
  }

  private async guardAllRequiredDocsUploaded(
    candidate: Candidate,
    onboardingCase: OnboardingCase
  ): Promise<boolean | string> {
    const requiredDocs = await this.documentRepo.count({
      where: {
        candidateId: candidate.candidateId,
        tenantId: candidate.tenantId,
        isRequired: true,
        verificationStatus: VerificationStatus.PENDING,
      },
    });

    if (requiredDocs > 0) {
      return `${requiredDocs} required documents are still pending upload`;
    }

    return true;
  }

  private async guardAllDocsVerified(
    candidate: Candidate,
    onboardingCase: OnboardingCase
  ): Promise<boolean | string> {
    const unverifiedDocs = await this.documentRepo.count({
      where: {
        candidateId: candidate.candidateId,
        tenantId: candidate.tenantId,
        isRequired: true,
        verificationStatus: VerificationStatus.UPLOADED,
      },
    });

    if (unverifiedDocs > 0) {
      return `${unverifiedDocs} required documents are pending verification`;
    }

    const rejectedDocs = await this.documentRepo.count({
      where: {
        candidateId: candidate.candidateId,
        tenantId: candidate.tenantId,
        isRequired: true,
        verificationStatus: VerificationStatus.REJECTED,
      },
    });

    if (rejectedDocs > 0) {
      return `${rejectedDocs} required documents were rejected and need to be re-uploaded`;
    }

    return true;
  }

  private async guardAppointmentLetterSigned(candidate: Candidate): Promise<boolean | string> {
    const appointmentLetter = await this.documentRepo.findOne({
      where: {
        candidateId: candidate.candidateId,
        tenantId: candidate.tenantId,
        documentType: 'appointment_letter' as any,
        isRequired: true,
      },
    });

    if (!appointmentLetter) {
      return 'Appointment letter not found';
    }

    if (!appointmentLetter.isSigned) {
      return 'Appointment letter not signed';
    }

    return true;
  }

  private async guardPolicyAcknowledgementsSigned(candidate: Candidate): Promise<boolean | string> {
    const requiredPolicies = ['nda', 'code_of_conduct', 'it_policy'];

    for (const policyType of requiredPolicies) {
      const policy = await this.documentRepo.findOne({
        where: {
          candidateId: candidate.candidateId,
          tenantId: candidate.tenantId,
          documentType: policyType as any,
          isRequired: true,
        },
      });

      if (!policy || !policy.isSigned) {
        return `${policyType.replace('_', ' ')} not signed`;
      }
    }

    return true;
  }

  private async guardPayrollSetupComplete(_candidate: Candidate): Promise<boolean | string> {
    // TODO: Check payroll setup when PayrollSetup entity is implemented
    return true;
  }

  private async guardOrientationTasksComplete(_candidate: Candidate): Promise<boolean | string> {
    // TODO: Check orientation tasks completion
    return true;
  }

  // Actions
  private async actionRecordOfferSentDate(candidate: Candidate, onboardingCase: OnboardingCase): Promise<void> {
    candidate.offerSentDate = new Date();
    onboardingCase.offerSent = true;
    await this.candidateRepo.save(candidate);
    await this.onboardingCaseRepo.save(onboardingCase);
  }

  private async actionCreateDocumentChecklist(candidate: Candidate): Promise<void> {
    logger.info(`Creating document checklist for candidate ${candidate.candidateId}`);

    // Create required system-generated documents
    const requiredDocs = [
      { documentType: 'appointment_letter', requiresSignature: true, isRequired: true },
      { documentType: 'nda', requiresSignature: true, isRequired: true },
      { documentType: 'code_of_conduct', requiresSignature: true, isRequired: true },
      { documentType: 'it_policy', requiresSignature: true, isRequired: true },
    ];

    for (const docConfig of requiredDocs) {
      // Check if document already exists
      const existing = await this.documentRepo.findOne({
        where: {
          candidateId: candidate.candidateId,
          tenantId: candidate.tenantId,
          documentType: docConfig.documentType as any,
        },
      });

      if (!existing) {
        const document = this.documentRepo.create({
          tenantId: candidate.tenantId,
          candidateId: candidate.candidateId,
          documentType: docConfig.documentType as any,
          category: 'system_generated' as any,
          fileName: `${docConfig.documentType}_${candidate.candidateId}.pdf`,
          filePath: `/uploads/pending/${docConfig.documentType}_${candidate.candidateId}.pdf`,
          isRequired: docConfig.isRequired,
          requiresSignature: docConfig.requiresSignature,
          isSigned: false,
          verificationStatus: 'pending' as any,
        });

        await this.documentRepo.save(document);
        logger.info(`Created document placeholder: ${docConfig.documentType} for candidate ${candidate.candidateId}`);
      }
    }
  }

  private async actionCreatePreJoiningTasks(_candidate: Candidate): Promise<void> {
    // This would create tasks using TaskAutomationService
    logger.info('Creating pre-joining tasks');
    // Implementation will be added when TaskAutomationService is created
  }

  private async actionNotifyHRForVerification(_candidate: Candidate): Promise<void> {
    logger.info('Notifying HR for document verification');
    // Implementation will use NotificationService
  }

  private async actionInitiateBGV(candidate: Candidate, onboardingCase: OnboardingCase): Promise<void> {
    onboardingCase.bgvStatus = 'in_progress' as any;
    onboardingCase.bgvInitiatedDate = new Date();
    await this.onboardingCaseRepo.save(onboardingCase);
    logger.info(`BGV initiated for candidate ${candidate.candidateId}`);
  }

  private async actionCreateEmployeeRecord(candidate: Candidate): Promise<void> {
    logger.info(`Creating employee record for candidate ${candidate.candidateId}`);

    // Check if employee record already exists
    const existingEmployee = await this.employeeRepo.findOne({
      where: { email: candidate.email, tenantId: candidate.tenantId }
    });

    if (existingEmployee) {
      logger.info(`Employee record already exists for ${candidate.email}`);
      // Link candidate to existing employee
      candidate.employeeId = existingEmployee.employeeId;
      await this.candidateRepo.save(candidate);
      return;
    }

    // Generate employee code (simple auto-increment logic)
    const employeeCount = await this.employeeRepo.count({ where: { tenantId: candidate.tenantId } });
    const employeeCode = `EMP${String(employeeCount + 1).padStart(4, '0')}`;

    // Create new employee record from candidate data (only use fields that exist in Employee model)
    const employee = this.employeeRepo.create({
      tenantId: candidate.tenantId,
      employeeCode,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      phone: candidate.phone,
      dateOfBirth: candidate.dateOfBirth,
      gender: candidate.gender,
      address: candidate.address, // This is the only address field in Employee model
      departmentId: candidate.departmentId,
      designationId: candidate.designationId,
      managerId: candidate.reportingManagerId,
      dateOfJoining: candidate.actualJoinDate || new Date(),
      employmentType: candidate.employmentType || 'full-time',
      status: EmploymentStatus.ACTIVE,
    });

    const savedEmployee = await this.employeeRepo.save(employee);

    // Link candidate to employee
    candidate.employeeId = savedEmployee.employeeId;
    await this.candidateRepo.save(candidate);

    logger.info(`Employee record created: ${savedEmployee.employeeCode} (${savedEmployee.employeeId})`);
  }

  private async actionInitiateProbation(_candidate: Candidate): Promise<void> {
    logger.info('Initiating probation');
    // This will create ProbationCase when ProbationService is implemented
  }

  private async actionCreateDay1Tasks(_candidate: Candidate): Promise<void> {
    logger.info('Creating Day 1 tasks');
    // Implementation will use TaskAutomationService
  }
}

export default new OnboardingFSMService();
