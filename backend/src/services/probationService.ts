import { AppDataSource } from '../config/database';
import { ProbationCase } from '../models/ProbationCase';
import { ProbationReview } from '../models/ProbationReview';
import { ProbationTask } from '../models/ProbationTask';
import { Employee } from '../models/Employee';
import { ProbationState } from '../models/enums/ProbationState';
import { ReviewType, ReviewStatus, ProbationRecommendation } from '../models/enums/ReviewType';
import { TaskCategory, TaskPriority, TaskStatus } from '../models/enums/TaskStatus';
import probationFSMService from './ProbationFSMService';
import logger from '../utils/logger';

export class ProbationService {
  private probationCaseRepo = AppDataSource.getRepository(ProbationCase);
  private reviewRepo = AppDataSource.getRepository(ProbationReview);
  private taskRepo = AppDataSource.getRepository(ProbationTask);
  private employeeRepo = AppDataSource.getRepository(Employee);

  async getProbationCase(probationId: string): Promise<ProbationCase | null> {
    return this.probationCaseRepo.findOne({
      where: { probationId },
      relations: ['employee', 'employee.department', 'employee.designation'],
    });
  }

  async getAllProbationCases(tenantId: string, filters?: { state?: string }): Promise<ProbationCase[]> {
    const query: any = { tenantId };

    if (filters?.state) {
      query.currentState = filters.state;
    }

    return this.probationCaseRepo.find({
      where: query,
      relations: ['employee'],
      order: { probationEndDate: 'ASC' },
    });
  }

  async createReview(
    probationId: string,
    reviewType: ReviewType,
    managerId: string,
    data: Partial<ProbationReview>
  ): Promise<ProbationReview> {
    const probationCase = await this.probationCaseRepo.findOne({ where: { probationId } });

    if (!probationCase) {
      throw new Error('Probation case not found');
    }

    const review = this.reviewRepo.create({
      tenantId: probationCase.tenantId,
      probationId,
      employeeId: probationCase.employeeId,
      managerId,
      reviewType,
      status: ReviewStatus.PENDING,
      ...data,
    });

    const savedReview = await this.reviewRepo.save(review);
    logger.info(`Review created: ${savedReview.reviewId} for probation ${probationId}`);
    return savedReview;
  }

  async submitReview(
    probationId: string,
    managerId: string,
    reviewData: Partial<ProbationReview>
  ): Promise<ProbationReview> {
    // Get probation case to get employeeId and tenantId
    const probationCase = await this.probationCaseRepo.findOne({
      where: { probationId },
      relations: ['employee']
    });

    if (!probationCase) {
      throw new Error('Probation case not found');
    }

    // Calculate dueDate based on reviewType
    let dueDate: Date;
    const startDate = new Date(probationCase.probationStartDate);

    if (reviewData.reviewType === ReviewType.DAY_30) {
      dueDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else if (reviewData.reviewType === ReviewType.DAY_60) {
      dueDate = new Date(startDate.getTime() + 60 * 24 * 60 * 60 * 1000);
    } else if (reviewData.reviewType === ReviewType.FINAL) {
      dueDate = new Date(startDate.getTime() + 85 * 24 * 60 * 60 * 1000);
    } else {
      throw new Error('Invalid review type');
    }

    // Create new review
    const review = this.reviewRepo.create({
      tenantId: probationCase.tenantId,
      probationId,
      employeeId: probationCase.employeeId,
      managerId,
      status: ReviewStatus.SUBMITTED,
      dueDate,
      completedDate: new Date(),
      ...reviewData,
    });

    // Validate required fields based on review type
    if (review.reviewType === ReviewType.DAY_30) {
      if (!reviewData.roleClarityRating || !reviewData.learningSpeedRating ||
          !reviewData.communicationRating || !reviewData.cultureFitRating) {
        throw new Error('All 30-day review ratings are required');
      }

      if (reviewData.hasRiskFlag && !reviewData.riskFlagReason) {
        throw new Error('Risk flag reason is required when risk flag is set');
      }
    } else if (review.reviewType === ReviewType.DAY_60) {
      if (!reviewData.kpiProgressRating || !reviewData.independenceRating || !reviewData.monitoringStatus) {
        throw new Error('All 60-day review fields are required');
      }
    } else if (review.reviewType === ReviewType.FINAL) {
      if (!reviewData.recommendation) {
        throw new Error('Recommendation is required for final review');
      }

      if (reviewData.recommendation === ProbationRecommendation.EXTEND) {
        if (!reviewData.recommendedExtensionDays || !reviewData.improvementPlanDetails) {
          throw new Error('Extension days and improvement plan are required when recommending extension');
        }
      }
    }

    const savedReview = await this.reviewRepo.save(review);
    logger.info(`Review submitted: ${savedReview.reviewId} for probation ${probationId}`);
    return savedReview;
  }

  async hrApproveReview(reviewId: string, hrId: string, approved: boolean, notes?: string): Promise<void> {
    const review = await this.reviewRepo.findOne({ where: { reviewId } });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.status !== ReviewStatus.SUBMITTED) {
      throw new Error('Review must be submitted before HR approval');
    }

    review.hrApproved = approved;
    review.hrReviewedBy = hrId;
    review.hrReviewedDate = new Date();
    review.hrNotes = notes;
    review.status = approved ? ReviewStatus.HR_APPROVED : ReviewStatus.HR_REJECTED;

    await this.reviewRepo.save(review);
    logger.info(`Review ${reviewId} ${approved ? 'approved' : 'rejected'} by HR`);
  }

  async flagAtRisk(probationId: string, userId: string, reason: string, level: string): Promise<void> {
    const probationCase = await this.probationCaseRepo.findOne({ where: { probationId } });

    if (!probationCase) {
      throw new Error('Probation case not found');
    }

    probationCase.isAtRisk = true;
    probationCase.riskLevel = level;
    probationCase.riskReason = reason;
    probationCase.riskFlaggedBy = userId;
    probationCase.riskFlaggedDate = new Date();

    await this.probationCaseRepo.save(probationCase);

    // Create HR intervention task
    const task = this.taskRepo.create({
      tenantId: probationCase.tenantId,
      probationId,
      employeeId: probationCase.employeeId,
      title: `HR Intervention Required - Employee At Risk`,
      description: `Employee flagged as at-risk. Reason: ${reason}`,
      taskType: 'hr_intervention',
      category: TaskCategory.HR_INTERVENTION,
      status: TaskStatus.PENDING,
      priority: TaskPriority.URGENT,
      assignedRole: 'hr',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      isRequired: true,
    });

    await this.taskRepo.save(task);
    logger.info(`Employee ${probationCase.employeeId} flagged as at-risk`);
  }

  async extendProbation(
    probationId: string,
    extensionDays: number,
    reason: string,
    improvementPlan: string,
    userId: string
  ): Promise<void> {
    if (!reason || reason.trim() === '') {
      throw new Error('Extension reason is required');
    }

    if (!improvementPlan || improvementPlan.trim() === '') {
      throw new Error('Improvement plan is required');
    }

    if (!extensionDays || extensionDays <= 0) {
      throw new Error('Extension duration must be greater than 0');
    }

    const probationCase = await this.probationCaseRepo.findOne({ where: { probationId } });

    if (!probationCase) {
      throw new Error('Probation case not found');
    }

    probationCase.extensionReason = reason;
    probationCase.improvementPlan = improvementPlan;
    probationCase.extensionDurationDays = extensionDays;
    await this.probationCaseRepo.save(probationCase);

    // Transition to PROBATION_EXTENDED
    const result = await probationFSMService.transition(
      probationId,
      ProbationState.PROBATION_EXTENDED,
      userId,
      reason
    );

    if (!result.success) {
      throw new Error(result.message || 'Failed to extend probation');
    }

    logger.info(`Probation extended: ${probationId} by ${extensionDays} days`);
  }

  async confirmEmployee(probationId: string, userId: string, confirmationDate?: Date): Promise<void> {
    const probationCase = await this.probationCaseRepo.findOne({ where: { probationId } });

    if (!probationCase) {
      throw new Error('Probation case not found');
    }

    // Transition to CONFIRMED
    const result = await probationFSMService.transition(
      probationId,
      ProbationState.CONFIRMED,
      userId,
      'Employee confirmed after probation'
    );

    if (!result.success) {
      throw new Error(result.message || 'Failed to confirm employee');
    }

    logger.info(`Employee confirmed: ${probationCase.employeeId}`);
  }

  async terminateProbation(probationId: string, reason: string, userId: string): Promise<void> {
    if (!reason || reason.trim() === '') {
      throw new Error('Termination reason is required');
    }

    const probationCase = await this.probationCaseRepo.findOne({ where: { probationId } });

    if (!probationCase) {
      throw new Error('Probation case not found');
    }

    probationCase.decisionNotes = reason;
    await this.probationCaseRepo.save(probationCase);

    // Transition to PROBATION_TERMINATION
    const result = await probationFSMService.transition(
      probationId,
      ProbationState.PROBATION_TERMINATION,
      userId,
      reason
    );

    if (!result.success) {
      throw new Error(result.message || 'Failed to terminate probation');
    }

    logger.info(`Probation terminated: ${probationId}`);
  }

  async getDueReviews(managerId: string): Promise<ProbationReview[]> {
    return this.reviewRepo.find({
      where: {
        managerId,
        status: ReviewStatus.PENDING,
      },
      relations: ['employee', 'probationCase'],
      order: { dueDate: 'ASC' },
    });
  }

  async getAtRiskEmployees(tenantId: string): Promise<ProbationCase[]> {
    return this.probationCaseRepo.find({
      where: {
        tenantId,
        isAtRisk: true,
      },
      relations: ['employee'],
      order: { riskFlaggedDate: 'DESC' },
    });
  }

  async getProbationStatistics(tenantId: string): Promise<Record<string, number>> {
    const stats: Record<string, number> = {
      total: 0,
      active: 0,
      confirmed: 0,
      extended: 0,
      atRisk: 0,
      terminated: 0,
    };

    stats.total = await this.probationCaseRepo.count({ where: { tenantId } });
    stats.active = await this.probationCaseRepo.count({
      where: { tenantId, currentState: ProbationState.PROBATION_ACTIVE }
    });
    stats.confirmed = await this.probationCaseRepo.count({
      where: { tenantId, currentState: ProbationState.CONFIRMED }
    });
    stats.extended = await this.probationCaseRepo.count({
      where: { tenantId, isExtended: true }
    });
    stats.atRisk = await this.probationCaseRepo.count({
      where: { tenantId, isAtRisk: true }
    });
    stats.terminated = await this.probationCaseRepo.count({
      where: { tenantId, currentState: ProbationState.PROBATION_TERMINATION }
    });

    return stats;
  }
}

export default new ProbationService();
