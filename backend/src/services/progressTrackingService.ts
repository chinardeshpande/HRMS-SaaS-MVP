import { In, Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { OnboardingCase } from '../models/OnboardingCase';
import { OnboardingTask } from '../models/OnboardingTask';
import { ProbationCase } from '../models/ProbationCase';
import { ProbationTask } from '../models/ProbationTask';
import { PerformanceReview, PerformanceState } from '../models/PerformanceReview';
import { Goal, GoalStatus } from '../models/Goal';
import { ExitCase } from '../models/ExitCase';
import { Clearance } from '../models/Clearance';
import { TaskStatus } from '../models/enums/TaskStatus';
import { ProbationState } from '../models/enums/ProbationState';
import { ExitState } from '../models/enums/ExitState';
import { ClearanceStatus } from '../models/enums/ClearanceStatus';

export interface ProgressData {
  id: string;
  type: 'onboarding' | 'probation' | 'performance' | 'exit';
  subject: {
    id: string;
    name: string;
    code?: string;
  };
  currentStage: string;
  status: string;
  completionPercentage: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  nextMilestone?: {
    name: string;
    dueDate?: Date;
    daysRemaining?: number;
  };
  blockers?: string[];
  eta?: Date;
  slaStatus?: 'on_track' | 'at_risk' | 'overdue';
  activityTimeline?: Array<{
    date: Date;
    event: string;
    actor?: string;
  }>;
}

/**
 * Progress Tracking Service
 * Tracks progress across all lifecycle workflows
 */
export class ProgressTrackingService {
  private onboardingCaseRepo: Repository<OnboardingCase>;
  private onboardingTaskRepo: Repository<OnboardingTask>;
  private probationCaseRepo: Repository<ProbationCase>;
  private probationTaskRepo: Repository<ProbationTask>;
  private performanceReviewRepo: Repository<PerformanceReview>;
  private goalRepo: Repository<Goal>;
  private exitCaseRepo: Repository<ExitCase>;
  private clearanceRepo: Repository<Clearance>;

  constructor() {
    this.onboardingCaseRepo = AppDataSource.getRepository(OnboardingCase);
    this.onboardingTaskRepo = AppDataSource.getRepository(OnboardingTask);
    this.probationCaseRepo = AppDataSource.getRepository(ProbationCase);
    this.probationTaskRepo = AppDataSource.getRepository(ProbationTask);
    this.performanceReviewRepo = AppDataSource.getRepository(PerformanceReview);
    this.goalRepo = AppDataSource.getRepository(Goal);
    this.exitCaseRepo = AppDataSource.getRepository(ExitCase);
    this.clearanceRepo = AppDataSource.getRepository(Clearance);
  }

  /**
   * Get onboarding progress for a candidate
   */
  async getOnboardingProgress(caseId: string, tenantId: string): Promise<ProgressData> {
    const onboardingCase = await this.onboardingCaseRepo.findOne({
      where: { caseId, tenantId },
      relations: ['candidate'],
    });

    if (!onboardingCase) {
      throw new Error('Onboarding case not found');
    }

    const tasks = await this.onboardingTaskRepo.find({
      where: { candidateId: onboardingCase.candidateId, tenantId },
      order: { dueDate: 'ASC' },
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const pendingTasks = tasks.filter((t) => t.status !== TaskStatus.COMPLETED).length;
    const overdueTasks = tasks.filter(
      (t) => t.status !== TaskStatus.COMPLETED && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;

    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Find next milestone
    const nextTask = tasks.find((t) => t.status !== TaskStatus.COMPLETED);
    const nextMilestone = nextTask
      ? {
          name: nextTask.title,
          dueDate: nextTask.dueDate,
          daysRemaining: nextTask.dueDate
            ? Math.ceil((new Date(nextTask.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : undefined,
        }
      : undefined;

    // Determine blockers
    const blockers: string[] = [];
    if (overdueTasks > 0) {
      blockers.push(`${overdueTasks} overdue task(s)`);
    }
    if (onboardingCase.bgvStatus === 'failed') {
      blockers.push('Background verification failed');
    }

    // SLA status
    let slaStatus: 'on_track' | 'at_risk' | 'overdue' = 'on_track';
    if (overdueTasks > 0) {
      slaStatus = 'overdue';
    } else if (nextMilestone && nextMilestone.daysRemaining && nextMilestone.daysRemaining <= 3) {
      slaStatus = 'at_risk';
    }

    return {
      id: caseId,
      type: 'onboarding',
      subject: {
        id: onboardingCase.candidateId,
        name: `${onboardingCase.candidate.firstName} ${onboardingCase.candidate.lastName}`,
      },
      currentStage: onboardingCase.currentState,
      status: onboardingCase.currentState,
      completionPercentage,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      nextMilestone,
      blockers: blockers.length > 0 ? blockers : undefined,
      eta: onboardingCase.candidate.expectedJoinDate,
      slaStatus,
    };
  }

  /**
   * Get probation/confirmation progress for an employee
   */
  async getProbationProgress(caseId: string, tenantId: string): Promise<ProgressData> {
    const probationCase = await this.probationCaseRepo.findOne({
      where: { probationId: caseId, tenantId },
      relations: ['employee', 'employee.department'],
    });

    if (!probationCase) {
      throw new Error('Probation case not found');
    }

    const tasks = await this.probationTaskRepo.find({
      where: { probationId: probationCase.probationId, tenantId },
      order: { dueDate: 'ASC' },
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const pendingTasks = tasks.filter((t) => t.status !== TaskStatus.COMPLETED).length;
    const overdueTasks = tasks.filter(
      (t) => t.status !== TaskStatus.COMPLETED && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;

    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate days to probation end
    const probationEndDate = probationCase.probationEndDate || probationCase.employee.probationEndDate;
    const daysRemaining = probationEndDate
      ? Math.ceil((new Date(probationEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    const nextMilestone = {
      name: 'Probation Confirmation',
      dueDate: probationEndDate,
      daysRemaining,
    };

    // Blockers
    const blockers: string[] = [];
    if (overdueTasks > 0) {
      blockers.push(`${overdueTasks} overdue review(s)`);
    }
    if (!probationCase.finalReviewCompleted) {
      blockers.push('Performance review not completed');
    }

    // SLA status
    let slaStatus: 'on_track' | 'at_risk' | 'overdue' = 'on_track';
    if (daysRemaining && daysRemaining < 0) {
      slaStatus = 'overdue';
    } else if (daysRemaining && daysRemaining <= 15) {
      slaStatus = 'at_risk';
    }

    return {
      id: caseId,
      type: 'probation',
      subject: {
        id: probationCase.employeeId,
        name: `${probationCase.employee.firstName} ${probationCase.employee.lastName}`,
        code: probationCase.employee.employeeCode,
      },
      currentStage: probationCase.currentState,
      status: probationCase.currentState,
      completionPercentage,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      nextMilestone,
      blockers: blockers.length > 0 ? blockers : undefined,
      eta: probationEndDate,
      slaStatus,
    };
  }

  /**
   * Get performance review progress
   */
  async getPerformanceReviewProgress(reviewId: string, tenantId: string): Promise<ProgressData> {
    const review = await this.performanceReviewRepo.findOne({
      where: { reviewId, tenantId },
      relations: ['employee', 'reviewer'],
    });

    if (!review) {
      throw new Error('Performance review not found');
    }

    const goals = await this.goalRepo.find({
      where: { reviewId, tenantId },
    });

    const totalTasks = goals.length + 4; // Goals + self-review + manager-review + calibration + finalization
    let completedTasks = 0;

    // Count completed goals
    completedTasks += goals.filter((g) => g.status === GoalStatus.ACHIEVED).length;

    // Check review stages
    if (review.midYearSubmittedDate || review.annualSubmittedDate) completedTasks++;
    if (review.midYearCompletedDate || review.annualCompletedDate) completedTasks++;
    if (review.currentState === PerformanceState.RATING_APPROVED) completedTasks++;
    if (review.currentState === PerformanceState.CYCLE_COMPLETE) completedTasks++;

    const completionPercentage = Math.round((completedTasks / totalTasks) * 100);
    const pendingTasks = totalTasks - completedTasks;

    // Determine next milestone
    let nextMilestoneName = '';
    if (!review.midYearSubmittedDate && !review.annualSubmittedDate) {
      nextMilestoneName = 'Self-review submission';
    } else if (!review.midYearCompletedDate && !review.annualCompletedDate) {
      nextMilestoneName = 'Manager review submission';
    } else if (review.currentState !== PerformanceState.RATING_APPROVED) {
      nextMilestoneName = 'Rating approval';
    } else {
      nextMilestoneName = 'Finalization';
    }

    const daysRemaining = review.reviewEndDate
      ? Math.ceil((new Date(review.reviewEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    // Blockers
    const blockers: string[] = [];
    const incompleteGoals = goals.filter((g) => g.status !== GoalStatus.ACHIEVED).length;
    if (incompleteGoals > 0) {
      blockers.push(`${incompleteGoals} incomplete goal(s)`);
    }
    if (daysRemaining && daysRemaining < 0) {
      blockers.push('Review overdue');
    }

    // SLA status
    let slaStatus: 'on_track' | 'at_risk' | 'overdue' = 'on_track';
    if (daysRemaining && daysRemaining < 0) {
      slaStatus = 'overdue';
    } else if (daysRemaining && daysRemaining <= 7) {
      slaStatus = 'at_risk';
    }

    return {
      id: reviewId,
      type: 'performance',
      subject: {
        id: review.employeeId,
        name: `${review.employee.firstName} ${review.employee.lastName}`,
        code: review.employee.employeeCode,
      },
      currentStage: review.currentState,
      status: review.currentState,
      completionPercentage,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks: daysRemaining && daysRemaining < 0 ? pendingTasks : 0,
      nextMilestone: {
        name: nextMilestoneName,
        dueDate: review.reviewEndDate,
        daysRemaining,
      },
      blockers: blockers.length > 0 ? blockers : undefined,
      eta: review.reviewEndDate,
      slaStatus,
    };
  }

  /**
   * Get exit clearance progress
   */
  async getExitProgress(caseId: string, tenantId: string): Promise<ProgressData> {
    const exitCase = await this.exitCaseRepo.findOne({
      where: { exitId: caseId, tenantId },
      relations: ['employee'],
    });

    if (!exitCase) {
      throw new Error('Exit case not found');
    }

    const clearances = await this.clearanceRepo.find({
      where: { exitId: exitCase.exitId, tenantId },
    });

    const totalTasks = clearances.length;
    const completedTasks = clearances.filter((c) => c.status === ClearanceStatus.CLEARED).length;
    const pendingTasks = clearances.filter((c) => c.status !== ClearanceStatus.CLEARED).length;
    const overdueTasks = clearances.filter(
      (c) => c.status !== ClearanceStatus.CLEARED && c.dueDate && new Date(c.dueDate) < new Date()
    ).length;

    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Next milestone
    const nextClearance = clearances.find((c) => c.status !== ClearanceStatus.CLEARED);
    const nextMilestone = nextClearance
      ? {
          name: nextClearance.clearanceName || `${nextClearance.departmentType} clearance`,
          dueDate: nextClearance.dueDate,
          daysRemaining: nextClearance.dueDate
            ? Math.ceil((new Date(nextClearance.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : undefined,
        }
      : {
          name: 'Final settlement',
          dueDate: exitCase.lastWorkingDate,
          daysRemaining: exitCase.lastWorkingDate
            ? Math.ceil((new Date(exitCase.lastWorkingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : undefined,
        };

    // Blockers
    const blockers: string[] = [];
    if (overdueTasks > 0) {
      blockers.push(`${overdueTasks} overdue clearance(s)`);
    }
    if (!exitCase.exitInterviewCompleted) {
      blockers.push('Exit interview not completed');
    }

    // SLA status
    let slaStatus: 'on_track' | 'at_risk' | 'overdue' = 'on_track';
    if (overdueTasks > 0) {
      slaStatus = 'overdue';
    } else if (nextMilestone.daysRemaining && nextMilestone.daysRemaining <= 3) {
      slaStatus = 'at_risk';
    }

    return {
      id: caseId,
      type: 'exit',
      subject: {
        id: exitCase.employeeId,
        name: `${exitCase.employee.firstName} ${exitCase.employee.lastName}`,
        code: exitCase.employee.employeeCode,
      },
      currentStage: exitCase.currentState,
      status: exitCase.currentState,
      completionPercentage,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      nextMilestone,
      blockers: blockers.length > 0 ? blockers : undefined,
      eta: exitCase.lastWorkingDate,
      slaStatus,
    };
  }

  /**
   * Get progress summary for an employee across all workflows
   */
  async getEmployeeProgressSummary(employeeId: string, tenantId: string): Promise<{
    onboarding?: ProgressData;
    probation?: ProgressData;
    performance?: ProgressData[];
    exit?: ProgressData;
  }> {
    const summary: any = {};

    // Check for active probation
    const probation = await this.probationCaseRepo.findOne({
      where: {
        employeeId,
        tenantId,
        currentState: In([
          ProbationState.PROBATION_ACTIVE,
          ProbationState.REVIEW_30_PENDING,
          ProbationState.REVIEW_60_PENDING,
          ProbationState.FINAL_REVIEW_PENDING,
          ProbationState.DECISION_PENDING,
          ProbationState.PROBATION_EXTENDED,
          ProbationState.EXTENDED_PROBATION_ACTIVE,
        ]),
      },
    });
    if (probation) {
      summary.probation = await this.getProbationProgress(probation.probationId, tenantId);
    }

    // Check for active performance reviews
    const reviews = await this.performanceReviewRepo.find({
      where: {
        employeeId,
        tenantId,
        currentState: In([
          PerformanceState.GOAL_SETTING,
          PerformanceState.GOALS_SUBMITTED,
          PerformanceState.GOALS_APPROVED,
          PerformanceState.MID_YEAR_PENDING,
          PerformanceState.MID_YEAR_SUBMITTED,
          PerformanceState.MID_YEAR_COMPLETED,
          PerformanceState.ANNUAL_REVIEW_PENDING,
          PerformanceState.ANNUAL_REVIEW_SUBMITTED,
          PerformanceState.ANNUAL_REVIEW_COMPLETED,
          PerformanceState.RATING_PENDING,
          PerformanceState.RATING_SUBMITTED,
          PerformanceState.RATING_APPROVED,
          PerformanceState.DEVELOPMENT_PLAN,
        ]),
      },
    });
    if (reviews.length > 0) {
      summary.performance = await Promise.all(
        reviews.map((r) => this.getPerformanceReviewProgress(r.reviewId, tenantId))
      );
    }

    // Check for active exit
    const exit = await this.exitCaseRepo.findOne({
      where: {
        employeeId,
        tenantId,
        currentState: In([
          ExitState.RESIGNATION_SUBMITTED,
          ExitState.RESIGNATION_APPROVED,
          ExitState.NOTICE_PERIOD_ACTIVE,
          ExitState.NOTICE_PERIOD_BUYOUT,
          ExitState.CLEARANCE_INITIATED,
          ExitState.CLEARANCE_IN_PROGRESS,
          ExitState.ASSETS_PENDING,
          ExitState.ASSETS_RETURNED,
          ExitState.EXIT_INTERVIEW_PENDING,
          ExitState.EXIT_INTERVIEW_COMPLETED,
          ExitState.SETTLEMENT_CALCULATED,
          ExitState.SETTLEMENT_APPROVED,
        ]),
      },
    });
    if (exit) {
      summary.exit = await this.getExitProgress(exit.exitId, tenantId);
    }

    return summary;
  }
}

export default new ProgressTrackingService();
