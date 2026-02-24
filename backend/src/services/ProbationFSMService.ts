import { AppDataSource } from '../config/database';
import { ProbationCase } from '../models/ProbationCase';
import { ProbationReview } from '../models/ProbationReview';
import { Employee } from '../models/Employee';
import { StatusTransition } from '../models/StatusTransition';
import { AuditLog } from '../models/AuditLog';
import { ProbationState } from '../models/enums/ProbationState';
import { ReviewStatus, ReviewType } from '../models/enums/ReviewType';
import logger from '../utils/logger';

type TransitionGuard = (probationCase: ProbationCase) => Promise<boolean | string>;
type TransitionAction = (probationCase: ProbationCase, userId: string) => Promise<void>;

interface StateTransitionConfig {
  from: ProbationState;
  to: ProbationState;
  guards?: TransitionGuard[];
  actions?: TransitionAction[];
}

class ProbationFSMService {
  private probationCaseRepo = AppDataSource.getRepository(ProbationCase);
  private reviewRepo = AppDataSource.getRepository(ProbationReview);
  private employeeRepo = AppDataSource.getRepository(Employee);
  private transitionRepo = AppDataSource.getRepository(StatusTransition);
  private auditLogRepo = AppDataSource.getRepository(AuditLog);

  private transitions: StateTransitionConfig[] = [
    {
      from: ProbationState.PROBATION_ACTIVE,
      to: ProbationState.REVIEW_30_PENDING,
      actions: [],
    },
    {
      from: ProbationState.REVIEW_30_PENDING,
      to: ProbationState.REVIEW_30_DONE,
      guards: [this.guard30DayReviewSubmitted],
      actions: [this.actionMark30DayComplete],
    },
    {
      from: ProbationState.REVIEW_30_DONE,
      to: ProbationState.REVIEW_60_PENDING,
      actions: [],
    },
    {
      from: ProbationState.REVIEW_60_PENDING,
      to: ProbationState.REVIEW_60_DONE,
      guards: [this.guard60DayReviewSubmitted],
      actions: [this.actionMark60DayComplete],
    },
    {
      from: ProbationState.REVIEW_60_DONE,
      to: ProbationState.FINAL_REVIEW_PENDING,
      actions: [],
    },
    {
      from: ProbationState.FINAL_REVIEW_PENDING,
      to: ProbationState.DECISION_PENDING,
      guards: [this.guardFinalReviewSubmitted],
      actions: [this.actionMarkFinalReviewComplete],
    },
    {
      from: ProbationState.DECISION_PENDING,
      to: ProbationState.CONFIRMED,
      guards: [this.guardFinalReviewApproved],
      actions: [this.actionRecordConfirmation],
    },
    {
      from: ProbationState.DECISION_PENDING,
      to: ProbationState.PROBATION_EXTENDED,
      guards: [this.guardExtensionDetailsProvided],
      actions: [this.actionRecordExtension],
    },
    {
      from: ProbationState.PROBATION_EXTENDED,
      to: ProbationState.EXTENDED_PROBATION_ACTIVE,
      actions: [this.actionRescheduleReviews],
    },
    {
      from: ProbationState.DECISION_PENDING,
      to: ProbationState.PROBATION_TERMINATION,
      actions: [this.actionRecordTermination],
    },
  ];

  async transition(
    probationId: string,
    toState: ProbationState,
    userId: string,
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; message?: string }> {
    const probationCase = await this.probationCaseRepo.findOne({
      where: { probationId },
      relations: ['employee', 'tenant'],
    });

    if (!probationCase) {
      return { success: false, message: 'Probation case not found' };
    }

    const fromState = probationCase.currentState;

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
        const guardResult = await guard.call(this, probationCase);
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
      probationCase.currentState = toState;
      await this.probationCaseRepo.save(probationCase);

      // Log transition
      await this.logTransition(probationCase, fromState, toState, userId, reason || 'State transition', metadata);

      // Execute actions
      if (transitionConfig.actions) {
        for (const action of transitionConfig.actions) {
          await action.call(this, probationCase, userId);
        }
      }

      logger.info(`Probation state transition: ${probationId} from ${fromState} to ${toState}`);

      return { success: true };
    } catch (error: any) {
      logger.error('Probation state transition failed:', error);
      return { success: false, message: error.message };
    }
  }

  private async logTransition(
    probationCase: ProbationCase,
    fromState: ProbationState,
    toState: ProbationState,
    userId: string,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Create StatusTransition record
    const transition = this.transitionRepo.create({
      tenantId: probationCase.tenantId,
      entityType: 'probation_case',
      entityId: probationCase.probationId,
      employeeId: probationCase.employeeId,
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
      tenantId: probationCase.tenantId,
      userId,
      action: 'PROBATION_STATE_TRANSITION',
      entityType: 'probation_case',
      entityId: probationCase.probationId,
      oldValue: { currentState: fromState },
      newValue: { currentState: toState },
      description: `Probation state changed from ${fromState} to ${toState}. Reason: ${reason}`,
    });

    await this.auditLogRepo.save(auditLog);
  }

  // Guards
  private async guard30DayReviewSubmitted(probationCase: ProbationCase): Promise<boolean | string> {
    const review = await this.reviewRepo.findOne({
      where: {
        probationId: probationCase.probationId,
        tenantId: probationCase.tenantId,
        reviewType: ReviewType.DAY_30,
      },
    });

    if (!review) {
      return '30-day review not found';
    }

    if (review.status !== ReviewStatus.SUBMITTED && review.status !== ReviewStatus.HR_APPROVED) {
      return '30-day review not submitted';
    }

    return true;
  }

  private async guard60DayReviewSubmitted(probationCase: ProbationCase): Promise<boolean | string> {
    const review = await this.reviewRepo.findOne({
      where: {
        probationId: probationCase.probationId,
        tenantId: probationCase.tenantId,
        reviewType: ReviewType.DAY_60,
      },
    });

    if (!review) {
      return '60-day review not found';
    }

    if (review.status !== ReviewStatus.SUBMITTED && review.status !== ReviewStatus.HR_APPROVED) {
      return '60-day review not submitted';
    }

    return true;
  }

  private async guardFinalReviewSubmitted(probationCase: ProbationCase): Promise<boolean | string> {
    const review = await this.reviewRepo.findOne({
      where: {
        probationId: probationCase.probationId,
        tenantId: probationCase.tenantId,
        reviewType: ReviewType.FINAL,
      },
    });

    if (!review) {
      return 'Final review not found';
    }

    if (review.status !== ReviewStatus.SUBMITTED && review.status !== ReviewStatus.HR_APPROVED) {
      return 'Final review not submitted';
    }

    return true;
  }

  private async guardFinalReviewApproved(probationCase: ProbationCase): Promise<boolean | string> {
    const review = await this.reviewRepo.findOne({
      where: {
        probationId: probationCase.probationId,
        tenantId: probationCase.tenantId,
        reviewType: ReviewType.FINAL,
      },
    });

    if (!review || !review.hrApproved) {
      return 'Final review not approved by HR';
    }

    if (review.recommendation !== 'confirm') {
      return 'Final review recommendation is not "confirm"';
    }

    return true;
  }

  private async guardExtensionDetailsProvided(probationCase: ProbationCase): Promise<boolean | string> {
    if (!probationCase.extensionReason || probationCase.extensionReason.trim() === '') {
      return 'Extension reason is required';
    }

    if (!probationCase.extensionDurationDays || probationCase.extensionDurationDays <= 0) {
      return 'Extension duration must be specified';
    }

    if (!probationCase.improvementPlan || probationCase.improvementPlan.trim() === '') {
      return 'Improvement plan is required for extension';
    }

    return true;
  }

  // Actions
  private async actionMark30DayComplete(probationCase: ProbationCase): Promise<void> {
    probationCase.review30Completed = true;
    await this.probationCaseRepo.save(probationCase);
  }

  private async actionMark60DayComplete(probationCase: ProbationCase): Promise<void> {
    probationCase.review60Completed = true;
    await this.probationCaseRepo.save(probationCase);
  }

  private async actionMarkFinalReviewComplete(probationCase: ProbationCase): Promise<void> {
    probationCase.finalReviewCompleted = true;
    await this.probationCaseRepo.save(probationCase);
  }

  private async actionRecordConfirmation(probationCase: ProbationCase, userId: string): Promise<void> {
    probationCase.finalDecision = 'confirmed';
    probationCase.decisionDate = new Date();
    probationCase.decidedBy = userId;
    await this.probationCaseRepo.save(probationCase);
    logger.info(`Employee ${probationCase.employeeId} confirmed`);
  }

  private async actionRecordExtension(probationCase: ProbationCase, userId: string): Promise<void> {
    probationCase.isExtended = true;
    probationCase.originalEndDate = probationCase.probationEndDate;
    probationCase.extendedBy = userId;
    probationCase.extensionDate = new Date();
    probationCase.finalDecision = 'extended';
    probationCase.decisionDate = new Date();
    probationCase.decidedBy = userId;

    // Calculate new end date
    const newEndDate = new Date(probationCase.probationEndDate);
    newEndDate.setDate(newEndDate.getDate() + (probationCase.extensionDurationDays || 30));
    probationCase.probationEndDate = newEndDate;

    await this.probationCaseRepo.save(probationCase);
    logger.info(`Probation extended for employee ${probationCase.employeeId} by ${probationCase.extensionDurationDays} days`);
  }

  private async actionRescheduleReviews(probationCase: ProbationCase): Promise<void> {
    // Recalculate review schedule based on extension
    if (probationCase.originalEndDate && probationCase.extensionDurationDays) {
      const extensionStart = new Date(probationCase.originalEndDate);

      // Schedule new 30-day review (if extension > 30 days)
      if (probationCase.extensionDurationDays >= 30) {
        const new30DayReview = new Date(extensionStart);
        new30DayReview.setDate(new30DayReview.getDate() + 30);
        probationCase.review30DueDate = new30DayReview;
        probationCase.review30Completed = false;
      }

      // Schedule new 60-day review (if extension > 60 days)
      if (probationCase.extensionDurationDays >= 60) {
        const new60DayReview = new Date(extensionStart);
        new60DayReview.setDate(new60DayReview.getDate() + 60);
        probationCase.review60DueDate = new60DayReview;
        probationCase.review60Completed = false;
      }

      // Schedule final review (85% of extension period or extension end - 5 days)
      const finalReviewDate = new Date(probationCase.probationEndDate);
      finalReviewDate.setDate(finalReviewDate.getDate() - 5);
      probationCase.finalReviewDueDate = finalReviewDate;
      probationCase.finalReviewCompleted = false;

      await this.probationCaseRepo.save(probationCase);
      logger.info(`Review schedule recalculated for extended probation ${probationCase.probationId}`);
    }
  }

  private async actionRecordTermination(probationCase: ProbationCase, userId: string): Promise<void> {
    probationCase.finalDecision = 'terminated';
    probationCase.decisionDate = new Date();
    probationCase.decidedBy = userId;
    await this.probationCaseRepo.save(probationCase);
    logger.info(`Probation terminated for employee ${probationCase.employeeId}`);
  }
}

export default new ProbationFSMService();
