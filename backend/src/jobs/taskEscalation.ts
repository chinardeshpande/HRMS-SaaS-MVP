import schedule from 'node-schedule';
import { AppDataSource } from '../config/database';
import taskAutomationService from '../services/taskAutomationService';
import notificationService from '../services/notificationService';
import { ProbationReview } from '../models/ProbationReview';
import { ReviewStatus } from '../models/enums/ReviewType';
import logger from '../utils/logger';

export function initializeScheduledJobs() {
  // Run daily at 9 AM - Check for overdue tasks
  schedule.scheduleJob('0 9 * * *', async () => {
    try {
      logger.info('🕐 Running daily task escalation job...');
      await taskAutomationService.checkOverdueTasks();
      logger.info('✅ Daily task escalation job completed');
    } catch (error: any) {
      logger.error('❌ Task escalation job failed:', error);
    }
  });

  // Run daily at 10 AM - Send review reminders
  schedule.scheduleJob('0 10 * * *', async () => {
    try {
      logger.info('🕐 Running daily review reminder job...');
      await sendReviewReminders();
      logger.info('✅ Daily review reminder job completed');
    } catch (error: any) {
      logger.error('❌ Review reminder job failed:', error);
    }
  });

  // Run every hour - Check for imminent deadlines
  schedule.scheduleJob('0 * * * *', async () => {
    try {
      logger.info('🕐 Running hourly deadline check...');
      await checkImminentDeadlines();
      logger.info('✅ Hourly deadline check completed');
    } catch (error: any) {
      logger.error('❌ Deadline check failed:', error);
    }
  });

  logger.info('✅ Scheduled jobs initialized successfully');
}

async function sendReviewReminders() {
  const reviewRepo = AppDataSource.getRepository(ProbationReview);

  // Find reviews due in 3 days
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  threeDaysFromNow.setHours(23, 59, 59, 999);

  const startOfDay = new Date(threeDaysFromNow);
  startOfDay.setHours(0, 0, 0, 0);

  const dueReviews = await reviewRepo.find({
    where: {
      status: ReviewStatus.PENDING,
    },
    relations: ['manager', 'employee', 'probationCase'],
  });

  for (const review of dueReviews) {
    const dueDate = new Date(review.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    // Check if due date is exactly 3 days from now
    if (dueDate.getTime() === startOfDay.getTime()) {
      await notificationService.notifyReviewDue(
        review.reviewId,
        review.managerId,
        review.tenantId
      );

      // Send email reminder
      await notificationService.sendEmail(
        review.manager.email,
        `Probation Review Due - ${review.employee.firstName} ${review.employee.lastName}`,
        `Reminder: ${review.reviewType} probation review for ${review.employee.firstName} ${review.employee.lastName} is due on ${review.dueDate.toDateString()}.`
      );

      logger.info(`📧 Review reminder sent to ${review.manager.email} for review ${review.reviewId}`);
    }
  }

  logger.info(`Processed ${dueReviews.length} review reminders`);
}

async function checkImminentDeadlines() {
  const reviewRepo = AppDataSource.getRepository(ProbationReview);

  // Find reviews due tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  const startOfTomorrow = new Date(tomorrow);
  startOfTomorrow.setHours(0, 0, 0, 0);

  const urgentReviews = await reviewRepo.find({
    where: {
      status: ReviewStatus.PENDING,
    },
    relations: ['manager', 'employee'],
  });

  let urgentCount = 0;
  for (const review of urgentReviews) {
    const dueDate = new Date(review.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    // Check if due tomorrow
    if (dueDate.getTime() === startOfTomorrow.getTime()) {
      await notificationService.createNotification({
        tenantId: review.tenantId,
        recipientId: review.managerId,
        notificationType: 'review_due' as any,
        title: '⚠️ URGENT: Review Due Tomorrow',
        message: `${review.reviewType} probation review for ${review.employee.firstName} ${review.employee.lastName} is due tomorrow!`,
        priority: 'urgent' as any,
        entityType: 'review',
        entityId: review.reviewId,
      });

      urgentCount++;
    }
  }

  if (urgentCount > 0) {
    logger.info(`⚠️  ${urgentCount} urgent review deadlines approaching`);
  }
}

// Export for manual testing
export { sendReviewReminders, checkImminentDeadlines };
