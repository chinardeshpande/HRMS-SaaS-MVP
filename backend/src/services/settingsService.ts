import { AppDataSource } from '../config/database';
import { Subscription, SubscriptionPlan, SubscriptionStatus, BillingCycle } from '../models/Subscription';
import { OrganizationSettings } from '../models/OrganizationSettings';
import { PaymentHistory, PaymentStatus, PaymentMethod } from '../models/PaymentHistory';
import { BusinessRules, RuleCategory } from '../models/BusinessRules';
import { Role } from '../models/Role';
import { Permission, PermissionModule, PermissionAction } from '../models/Permission';
import { Employee } from '../models/Employee';
import { In } from 'typeorm';

export class SettingsService {
  private static instance: SettingsService;
  private subscriptionRepo = AppDataSource.getRepository(Subscription);
  private orgSettingsRepo = AppDataSource.getRepository(OrganizationSettings);
  private paymentRepo = AppDataSource.getRepository(PaymentHistory);
  private businessRulesRepo = AppDataSource.getRepository(BusinessRules);
  private roleRepo = AppDataSource.getRepository(Role);
  private permissionRepo = AppDataSource.getRepository(Permission);
  private employeeRepo = AppDataSource.getRepository(Employee);

  private constructor() {}

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  // ==================== SUBSCRIPTION MANAGEMENT ====================

  async getSubscription(tenantId: string): Promise<Subscription | null> {
    return await this.subscriptionRepo.findOne({
      where: { tenantId },
      relations: ['tenant'],
    });
  }

  async createSubscription(data: {
    tenantId: string;
    plan: SubscriptionPlan;
    billingCycle: BillingCycle;
    price: number;
  }): Promise<Subscription> {
    const subscription = this.subscriptionRepo.create({
      ...data,
      status: SubscriptionStatus.TRIAL,
      maxUsers: this.getMaxUsersByPlan(data.plan),
      maxStorageGB: this.getMaxStorageByPlan(data.plan),
      features: this.getFeaturesByPlan(data.plan),
      trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      startDate: new Date(),
    });

    return await this.subscriptionRepo.save(subscription);
  }

  async updateSubscription(
    tenantId: string,
    updates: Partial<Subscription>
  ): Promise<Subscription | null> {
    const subscription = await this.subscriptionRepo.findOne({ where: { tenantId } });
    if (!subscription) return null;

    Object.assign(subscription, updates);
    return await this.subscriptionRepo.save(subscription);
  }

  async upgradePlan(tenantId: string, newPlan: SubscriptionPlan): Promise<Subscription | null> {
    const subscription = await this.subscriptionRepo.findOne({ where: { tenantId } });
    if (!subscription) return null;

    subscription.plan = newPlan;
    subscription.maxUsers = this.getMaxUsersByPlan(newPlan);
    subscription.maxStorageGB = this.getMaxStorageByPlan(newPlan);
    subscription.features = this.getFeaturesByPlan(newPlan);
    subscription.status = SubscriptionStatus.ACTIVE;

    return await this.subscriptionRepo.save(subscription);
  }

  async cancelSubscription(tenantId: string): Promise<Subscription | null> {
    const subscription = await this.subscriptionRepo.findOne({ where: { tenantId } });
    if (!subscription) return null;

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.autoRenew = false;

    return await this.subscriptionRepo.save(subscription);
  }

  private getMaxUsersByPlan(plan: SubscriptionPlan): number {
    const limits: Record<SubscriptionPlan, number> = {
      [SubscriptionPlan.FREE]: 10,
      [SubscriptionPlan.STARTER]: 50,
      [SubscriptionPlan.PROFESSIONAL]: 200,
      [SubscriptionPlan.ENTERPRISE]: 999999,
    };
    return limits[plan];
  }

  private getMaxStorageByPlan(plan: SubscriptionPlan): number {
    const limits: Record<SubscriptionPlan, number> = {
      [SubscriptionPlan.FREE]: 5,
      [SubscriptionPlan.STARTER]: 50,
      [SubscriptionPlan.PROFESSIONAL]: 200,
      [SubscriptionPlan.ENTERPRISE]: 1000,
    };
    return limits[plan];
  }

  private getFeaturesByPlan(plan: SubscriptionPlan): any {
    const features: Record<SubscriptionPlan, any> = {
      [SubscriptionPlan.FREE]: {
        advancedReporting: false,
        apiAccess: false,
        customBranding: false,
        ssoIntegration: false,
        prioritySupport: false,
        customWorkflows: false,
        aiInsights: false,
        multiCurrency: false,
      },
      [SubscriptionPlan.STARTER]: {
        advancedReporting: true,
        apiAccess: false,
        customBranding: false,
        ssoIntegration: false,
        prioritySupport: false,
        customWorkflows: false,
        aiInsights: false,
        multiCurrency: false,
      },
      [SubscriptionPlan.PROFESSIONAL]: {
        advancedReporting: true,
        apiAccess: true,
        customBranding: true,
        ssoIntegration: false,
        prioritySupport: true,
        customWorkflows: true,
        aiInsights: true,
        multiCurrency: true,
      },
      [SubscriptionPlan.ENTERPRISE]: {
        advancedReporting: true,
        apiAccess: true,
        customBranding: true,
        ssoIntegration: true,
        prioritySupport: true,
        customWorkflows: true,
        aiInsights: true,
        multiCurrency: true,
      },
    };
    return features[plan];
  }

  // ==================== ORGANIZATION SETTINGS ====================

  async getOrganizationSettings(tenantId: string): Promise<OrganizationSettings | null> {
    return await this.orgSettingsRepo.findOne({ where: { tenantId } });
  }

  async createOrganizationSettings(
    data: Partial<OrganizationSettings> & { tenantId: string }
  ): Promise<OrganizationSettings> {
    const settings = this.orgSettingsRepo.create(data);
    return await this.orgSettingsRepo.save(settings);
  }

  async updateOrganizationSettings(
    tenantId: string,
    updates: Partial<OrganizationSettings>
  ): Promise<OrganizationSettings | null> {
    const settings = await this.orgSettingsRepo.findOne({ where: { tenantId } });
    if (!settings) return null;

    Object.assign(settings, updates);
    return await this.orgSettingsRepo.save(settings);
  }

  // ==================== PAYMENT MANAGEMENT ====================

  async getAllPayments(
    tenantId: string,
    options: {
      status?: PaymentStatus;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ payments: PaymentHistory[]; total: number }> {
    const query = this.paymentRepo
      .createQueryBuilder('payment')
      .where('payment.tenantId = :tenantId', { tenantId })
      .orderBy('payment.createdAt', 'DESC');

    if (options.status) {
      query.andWhere('payment.status = :status', { status: options.status });
    }

    if (options.limit) {
      query.take(options.limit);
    }

    if (options.offset) {
      query.skip(options.offset);
    }

    const [payments, total] = await query.getManyAndCount();
    return { payments, total };
  }

  async createPayment(data: Partial<PaymentHistory> & { tenantId: string }): Promise<PaymentHistory> {
    const invoiceNumber = await this.generateInvoiceNumber(data.tenantId);
    const payment = this.paymentRepo.create({
      ...data,
      invoiceNumber,
    });
    return await this.paymentRepo.save(payment);
  }

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    metadata?: any
  ): Promise<PaymentHistory | null> {
    const payment = await this.paymentRepo.findOne({ where: { paymentId } });
    if (!payment) return null;

    payment.status = status;
    if (status === PaymentStatus.COMPLETED) {
      payment.paidAt = new Date();
    }
    if (metadata) {
      payment.metadata = { ...payment.metadata, ...metadata };
    }

    return await this.paymentRepo.save(payment);
  }

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const count = await this.paymentRepo.count({ where: { tenantId } });
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `INV-${year}${month}-${String(count + 1).padStart(5, '0')}`;
  }

  // ==================== BUSINESS RULES ====================

  async getAllBusinessRules(
    tenantId: string,
    category?: RuleCategory
  ): Promise<BusinessRules[]> {
    const where: any = { tenantId };
    if (category) {
      where.category = category;
    }

    return await this.businessRulesRepo.find({
      where,
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
  }

  async getBusinessRuleById(ruleId: string, tenantId: string): Promise<BusinessRules | null> {
    return await this.businessRulesRepo.findOne({ where: { ruleId, tenantId } });
  }

  async createBusinessRule(
    data: Partial<BusinessRules> & { tenantId: string }
  ): Promise<BusinessRules> {
    const rule = this.businessRulesRepo.create(data);
    return await this.businessRulesRepo.save(rule);
  }

  async updateBusinessRule(
    ruleId: string,
    tenantId: string,
    updates: Partial<BusinessRules>
  ): Promise<BusinessRules | null> {
    const rule = await this.businessRulesRepo.findOne({ where: { ruleId, tenantId } });
    if (!rule) return null;

    Object.assign(rule, updates);
    return await this.businessRulesRepo.save(rule);
  }

  async deleteBusinessRule(ruleId: string, tenantId: string): Promise<boolean> {
    const result = await this.businessRulesRepo.delete({ ruleId, tenantId });
    return result.affected ? result.affected > 0 : false;
  }

  // ==================== ROLE MANAGEMENT ====================

  async getAllRoles(tenantId: string): Promise<Role[]> {
    return await this.roleRepo.find({
      where: { tenantId },
      relations: ['permissions'],
      order: { level: 'DESC', roleName: 'ASC' },
    });
  }

  async getRoleById(roleId: string, tenantId: string): Promise<Role | null> {
    return await this.roleRepo.findOne({
      where: { roleId, tenantId },
      relations: ['permissions', 'employees'],
    });
  }

  async createRole(data: Partial<Role> & { tenantId: string }): Promise<Role> {
    const role = this.roleRepo.create(data);
    return await this.roleRepo.save(role);
  }

  async updateRole(
    roleId: string,
    tenantId: string,
    updates: Partial<Role>
  ): Promise<Role | null> {
    const role = await this.roleRepo.findOne({
      where: { roleId, tenantId },
      relations: ['permissions'],
    });
    if (!role) return null;

    if (role.isSystemRole && updates.isSystemRole === false) {
      throw new Error('Cannot modify system role');
    }

    Object.assign(role, updates);
    return await this.roleRepo.save(role);
  }

  async deleteRole(roleId: string, tenantId: string): Promise<boolean> {
    const role = await this.roleRepo.findOne({ where: { roleId, tenantId } });
    if (!role) return false;

    if (role.isSystemRole) {
      throw new Error('Cannot delete system role');
    }

    if (role.employeeCount > 0) {
      throw new Error('Cannot delete role with assigned employees');
    }

    const result = await this.roleRepo.delete({ roleId, tenantId });
    return result.affected ? result.affected > 0 : false;
  }

  async assignPermissionsToRole(
    roleId: string,
    tenantId: string,
    permissionIds: string[]
  ): Promise<Role | null> {
    const role = await this.roleRepo.findOne({
      where: { roleId, tenantId },
      relations: ['permissions'],
    });
    if (!role) return null;

    const permissions = await this.permissionRepo.find({
      where: { permissionId: In(permissionIds) },
    });

    role.permissions = permissions;
    return await this.roleRepo.save(role);
  }

  // ==================== PERMISSION MANAGEMENT ====================

  async getAllPermissions(): Promise<Permission[]> {
    return await this.permissionRepo.find({
      where: { isActive: true },
      order: { module: 'ASC', action: 'ASC' },
    });
  }

  async getPermissionsByModule(module: PermissionModule): Promise<Permission[]> {
    return await this.permissionRepo.find({
      where: { module, isActive: true },
      order: { action: 'ASC' },
    });
  }

  async createPermission(data: Partial<Permission>): Promise<Permission> {
    const permission = this.permissionRepo.create(data);
    return await this.permissionRepo.save(permission);
  }

  async initializeDefaultPermissions(): Promise<void> {
    const modules = Object.values(PermissionModule);
    const actions = Object.values(PermissionAction);

    for (const module of modules) {
      for (const action of actions) {
        const permissionCode = `${module}.${action}`;
        const exists = await this.permissionRepo.findOne({
          where: { permissionCode },
        });

        if (!exists) {
          await this.permissionRepo.save({
            permissionCode,
            permissionName: `${action.charAt(0).toUpperCase() + action.slice(1)} ${module}`,
            module,
            action,
            isSystemPermission: true,
            isActive: true,
          });
        }
      }
    }
  }

  // ==================== USER MANAGEMENT ====================

  async getAllUsers(
    tenantId: string,
    options: {
      status?: string;
      roleId?: string;
      departmentId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ users: Employee[]; total: number }> {
    const query = this.employeeRepo
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.department', 'department')
      .leftJoinAndSelect('employee.designation', 'designation')
      .leftJoinAndSelect('employee.role', 'role')
      .leftJoinAndSelect('employee.manager', 'manager')
      .where('employee.tenantId = :tenantId', { tenantId })
      .orderBy('employee.createdAt', 'DESC');

    if (options.status) {
      query.andWhere('employee.status = :status', { status: options.status });
    }

    if (options.roleId) {
      query.andWhere('employee.roleId = :roleId', { roleId: options.roleId });
    }

    if (options.departmentId) {
      query.andWhere('employee.departmentId = :departmentId', {
        departmentId: options.departmentId,
      });
    }

    if (options.limit) {
      query.take(options.limit);
    }

    if (options.offset) {
      query.skip(options.offset);
    }

    const [users, total] = await query.getManyAndCount();
    return { users, total };
  }

  async assignRoleToUser(employeeId: string, roleId: string, tenantId: string): Promise<Employee | null> {
    const employee = await this.employeeRepo.findOne({
      where: { employeeId, tenantId },
    });
    if (!employee) return null;

    const role = await this.roleRepo.findOne({ where: { roleId, tenantId } });
    if (!role) throw new Error('Role not found');

    employee.roleId = roleId;
    return await this.employeeRepo.save(employee);
  }

  async deactivateUser(employeeId: string, tenantId: string): Promise<Employee | null> {
    const employee = await this.employeeRepo.findOne({
      where: { employeeId, tenantId },
    });
    if (!employee) return null;

    employee.status = 'inactive' as any;
    return await this.employeeRepo.save(employee);
  }

  async reactivateUser(employeeId: string, tenantId: string): Promise<Employee | null> {
    const employee = await this.employeeRepo.findOne({
      where: { employeeId, tenantId },
    });
    if (!employee) return null;

    employee.status = 'active' as any;
    return await this.employeeRepo.save(employee);
  }
}

export const settingsService = SettingsService.getInstance();
