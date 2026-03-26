import { AppDataSource } from '../config/database';
import { OnboardingTask } from '../models/OnboardingTask';
import { ProbationTask } from '../models/ProbationTask';
import { TaskStatus, TaskCategory, TaskPriority } from '../models/enums/TaskStatus';
import logger from '../utils/logger';

export class TaskAutomationService {
  private onboardingTaskRepo = AppDataSource.getRepository(OnboardingTask);
  private probationTaskRepo = AppDataSource.getRepository(ProbationTask);

  async createTasksForState(
    entityType: 'candidate' | 'probation',
    entityId: string,
    state: string
  ): Promise<void> {
    // This would create predefined tasks based on state
    logger.info(`Creating tasks for ${entityType} ${entityId} in state ${state}`);
    // Task templates would be defined here
  }

  async checkOverdueTasks(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check onboarding tasks
    const overdueOnboardingTasks = await this.onboardingTaskRepo.find({
      where: {
        status: TaskStatus.PENDING,
        isOverdue: false,
      },
    });

    for (const task of overdueOnboardingTasks) {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        task.isOverdue = true;
        task.status = TaskStatus.OVERDUE;
        await this.onboardingTaskRepo.save(task);

        // Escalate if needed
        await this.escalateTask(task.taskId, task.escalationLevel + 1);
      }
    }

    // Check probation tasks
    const overdueProbationTasks = await this.probationTaskRepo.find({
      where: {
        status: TaskStatus.PENDING,
        isOverdue: false,
      },
    });

    for (const task of overdueProbationTasks) {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        task.isOverdue = true;
        task.status = TaskStatus.OVERDUE;
        await this.probationTaskRepo.save(task);

        // Escalate if needed
        await this.escalateTask(task.taskId, task.escalationLevel + 1, 'probation');
      }
    }

    logger.info('Overdue tasks check completed');
  }

  async escalateTask(taskId: string, level: number, type: 'onboarding' | 'probation' = 'onboarding'): Promise<void> {
    if (level > 3) return; // Max escalation level

    if (type === 'onboarding') {
      const task = await this.onboardingTaskRepo.findOne({ where: { taskId } });
      if (!task) return;
      task.escalationLevel = level;
      await this.onboardingTaskRepo.save(task);
    } else {
      const task = await this.probationTaskRepo.findOne({ where: { taskId } });
      if (!task) return;
      task.escalationLevel = level;
      await this.probationTaskRepo.save(task);
    }

    // Send notifications based on escalation level
    // Level 1: Manager
    // Level 2: HRBP
    // Level 3: HR Head

    logger.info(`Task ${taskId} escalated to level ${level}`);
  }

  async scheduleReviewReminders(): Promise<void> {
    // This would send reminders 3 days before review due dates
    logger.info('Review reminders scheduled');
  }
}

export default new TaskAutomationService();
