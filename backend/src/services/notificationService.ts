import { AppDataSource } from '../config/database';
import { Notification } from '../models/Notification';
import { NotificationType, NotificationPriority } from '../models/enums/NotificationEnums';
import logger from '../utils/logger';

export class NotificationService {
  private notificationRepo = AppDataSource.getRepository(Notification);

  async createNotification(data: Partial<Notification>): Promise<Notification> {
    const notification = this.notificationRepo.create(data);
    const saved = await this.notificationRepo.save(notification);
    logger.info(`Notification created: ${saved.notificationId}`);
    return saved;
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // Placeholder for email sending via Nodemailer
    logger.info(`Email would be sent to ${to}: ${subject}`);
  }

  async notifyTaskAssigned(taskId: string, assignedTo: string, tenantId: string): Promise<void> {
    await this.createNotification({
      tenantId,
      recipientId: assignedTo,
      notificationType: NotificationType.TASK_ASSIGNED,
      title: 'New Task Assigned',
      message: `A new task has been assigned to you`,
      priority: NotificationPriority.MEDIUM,
      entityType: 'task',
      entityId: taskId,
    });
  }

  async notifyTaskOverdue(taskId: string, assignedTo: string, tenantId: string): Promise<void> {
    await this.createNotification({
      tenantId,
      recipientId: assignedTo,
      notificationType: NotificationType.TASK_OVERDUE,
      title: 'Task Overdue',
      message: `One of your tasks is overdue`,
      priority: NotificationPriority.URGENT,
      entityType: 'task',
      entityId: taskId,
    });
  }

  async notifyReviewDue(reviewId: string, managerId: string, tenantId: string): Promise<void> {
    await this.createNotification({
      tenantId,
      recipientId: managerId,
      notificationType: NotificationType.REVIEW_DUE,
      title: 'Review Due Soon',
      message: `A probation review is due in 3 days`,
      priority: NotificationPriority.HIGH,
      entityType: 'review',
      entityId: reviewId,
    });
  }

  async notifyStateChange(
    entityId: string,
    recipientId: string,
    tenantId: string,
    fromState: string,
    toState: string
  ): Promise<void> {
    await this.createNotification({
      tenantId,
      recipientId,
      notificationType: NotificationType.STATE_CHANGE,
      title: 'Status Updated',
      message: `Status changed from ${fromState} to ${toState}`,
      priority: NotificationPriority.MEDIUM,
      entityId,
    });
  }

  async getNotifications(recipientId: string, isRead?: boolean): Promise<Notification[]> {
    const where: any = { recipientId };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    return this.notificationRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notification = await this.notificationRepo.findOne({ where: { notificationId } });

    if (notification) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.notificationRepo.save(notification);
    }
  }
}

export default new NotificationService();
