import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { OnboardingCase } from '../models/OnboardingCase';
import { OnboardingTask } from '../models/OnboardingTask';
import { ProbationCase } from '../models/ProbationCase';
import { ProbationTask } from '../models/ProbationTask';
import { PerformanceReview } from '../models/PerformanceReview';
import { Goal } from '../models/Goal';
import { ExitCase } from '../models/ExitCase';
import { Clearance } from '../models/Clearance';

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
      where: { caseId, tenantId },
      order: { dueDate: 'ASC' },
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const pendingTasks = tasks.filter((t) => t.status !== 'completed').length;
    const overdueTasks = tasks.filter(
      (t) => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;

    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Find next milestone
    const nextTask = tasks.find((t) => t.status !== 'completed');
    const nextMilestone = nextTask
      ? {
          name: nextTask.taskName,
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
      currentStage: onboardingCase.status,
      status: onboardingCase.status,
      completionPercentage,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      nextMilestone,
      blockers: blockers.length > 0 ? blockers : undefined,
      eta: onboardingCase.expectedJoiningDate,
      slaStatus,
    };
  }

  /**
   * Get probation/confirmation progress for an employee
   */
  async getProbationProgress(caseId: string, tenantId: string): Promise<ProgressData> {
    const probationCase = await this.probationCaseRepo.findOne({
      where: { caseId, tenantId },
      relations: ['employee', 'employee.department'],
    });

    if (!probationCase) {
      throw new Error('Probation case not found');
    }

    const tasks = await this.probationTaskRepo.find({
      where: { caseId, tenantId },
      order: { dueDate: 'ASC' },
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const pendingTasks = tasks.filter((t) => t.status !== 'completed').length;
    const overdueTasks = tasks.filter(
      (t) => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date()
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
    if (!probationCase.reviewStatus || probationCase.reviewStatus === 'pending') {
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
      currentStage: probationCase.status,
      status: probationCase.status,
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
    completedTasks += goals.filter((g) => g.status === 'completed').length;

    // Check review stages
    if (review.selfReviewSubmitted) completedTasks++;
    if (review.managerReviewSubmitted) completedTasks++;
    if (review.status === 'calibrated') completedTasks++;
    if (review.status === 'completed') completedTasks++;

    const completionPercentage = Math.round((completedTasks / totalTasks) * 100);
    const pendingTasks = totalTasks - completedTasks;

    // Determine next milestone
    let nextMilestoneName = '';
    if (!review.selfReviewSubmitted) {
      nextMilestoneName = 'Self-review submission';
    } else if (!review.managerReviewSubmitted) {
      nextMilestoneName = 'Manager review submission';
    } else if (review.status !== 'calibrated') {
      nextMilestoneName = 'Calibration';
    } else {
      nextMilestoneName = 'Finalization';
    }

    const daysRemaining = review.dueDate
      ? Math.ceil((new Date(review.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    // Blockers
    const blockers: string[] = [];
    const incompleteGoals = goals.filter((g) => g.status !== 'completed').length;
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
      currentStage: review.status,
      status: review.status,
      completionPercentage,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks: daysRemaining && daysRemaining < 0 ? pendingTasks : 0,
      nextMilestone: {
        name: nextMilestoneName,
        dueDate: review.dueDate,
        daysRemaining,
      },
      blockers: blockers.length > 0 ? blockers : undefined,
      eta: review.dueDate,
      slaStatus,
    };
  }

  /**
   * Get exit clearance progress
   */
  async getExitProgress(caseId: string, tenantId: string): Promise<ProgressData> {
    const exitCase = await this.exitCaseRepo.findOne({
      where: { caseId, tenantId },
      relations: ['employee'],
    });

    if (!exitCase) {
      throw new Error('Exit case not found');
    }

    const clearances = await this.clearanceRepo.find({
      where: { exitCaseId: caseId, tenantId },
    });

    const totalTasks = clearances.length;
    const completedTasks = clearances.filter((c) => c.status === 'cleared').length;
    const pendingTasks = clearances.filter((c) => c.status !== 'cleared').length;
    const overdueTasks = clearances.filter(
      (c) => c.status !== 'cleared' && c.dueDate && new Date(c.dueDate) < new Date()
    ).length;

    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Next milestone
    const nextClearance = clearances.find((c) => c.status !== 'cleared');
    const nextMilestone = nextClearance
      ? {
          name: `${nextClearance.clearanceType} clearance`,
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
    if (!exitCase.interviewCompleted) {
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
      currentStage: exitCase.status,
      status: exitCase.status,
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
      where: { employeeId, tenantId, status: In(['initiated', 'in_progress']) },
    });
    if (probation) {
      summary.probation = await this.getProbationProgress(probation.caseId, tenantId);
    }

    // Check for active performance reviews
    const reviews = await this.performanceReviewRepo.find({
      where: { employeeId, tenantId, status: In(['pending', 'in_progress']) },
    });
    if (reviews.length > 0) {
      summary.performance = await Promise.all(
        reviews.map((r) => this.getPerformanceReviewProgress(r.reviewId, tenantId))
      );
    }

    // Check for active exit
    const exit = await this.exitCaseRepo.findOne({
      where: { employeeId, tenantId, status: In(['initiated', 'in_progress']) },
    });
    if (exit) {
      summary.exit = await this.getExitProgress(exit.caseId, tenantId);
    }

    return summary;
  }
}

export default new ProgressTrackingService();
