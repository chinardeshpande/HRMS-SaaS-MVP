import { AppDataSource } from '../config/database';
import { Subscription, SubscriptionStatus } from '../models/Subscription';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';

const ACTIVE_SUBSCRIPTION_STATUSES = new Set<SubscriptionStatus>([
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIAL,
]);

export class SubscriptionEnforcementService {
  private subscriptionRepo = AppDataSource.getRepository(Subscription);
  private userRepo = AppDataSource.getRepository(User);

  async assertCanAddUser(tenantId: string): Promise<void> {
    const subscription = await this.subscriptionRepo.findOne({ where: { tenantId } });

    if (!subscription) {
      throw new AppError(
        'Active subscription is required before adding users',
        403,
        'SUBSCRIPTION_REQUIRED'
      );
    }

    if (!ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
      throw new AppError(
        'Subscription is not active. Please update billing before adding users.',
        403,
        'SUBSCRIPTION_INACTIVE',
        { status: subscription.status }
      );
    }

    if (subscription.status === SubscriptionStatus.TRIAL && this.isPastDate(subscription.trialEndDate)) {
      throw new AppError(
        'Trial period has ended. Please upgrade before adding users.',
        403,
        'SUBSCRIPTION_TRIAL_EXPIRED'
      );
    }

    const activeUsers = await this.countActiveUsers(tenantId);
    await this.updateCurrentUsers(tenantId, activeUsers);

    if (activeUsers >= subscription.maxUsers) {
      throw new AppError(
        'User limit reached for the current subscription plan',
        403,
        'SUBSCRIPTION_USER_LIMIT_REACHED',
        {
          currentUsers: activeUsers,
          maxUsers: subscription.maxUsers,
        }
      );
    }
  }

  async syncCurrentUsers(tenantId: string): Promise<number> {
    const activeUsers = await this.countActiveUsers(tenantId);
    await this.updateCurrentUsers(tenantId, activeUsers);
    return activeUsers;
  }

  private async countActiveUsers(tenantId: string): Promise<number> {
    return await this.userRepo.count({
      where: {
        tenantId,
        isActive: true,
      },
    });
  }

  private async updateCurrentUsers(tenantId: string, currentUsers: number): Promise<void> {
    await this.subscriptionRepo.update({ tenantId }, { currentUsers });
  }

  private isPastDate(date?: Date | null): boolean {
    if (!date) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const value = new Date(date);
    value.setHours(0, 0, 0, 0);

    return value < today;
  }
}

export const subscriptionEnforcementService = new SubscriptionEnforcementService();
export default subscriptionEnforcementService;
