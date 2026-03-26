import api from './api';

// ==================== TYPES ====================

export interface Subscription {
  subscriptionId: string;
  tenantId: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'trial' | 'expired' | 'cancelled' | 'suspended';
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  price: number | string; // Decimal type from DB comes as string
  maxUsers: number;
  currentUsers: number;
  maxStorageGB: number;
  currentStorageGB: number | string; // Decimal type from DB comes as string
  startDate?: string;
  endDate?: string;
  trialEndDate?: string;
  nextBillingDate?: string;
  autoRenew: boolean;
  features: {
    advancedReporting: boolean;
    apiAccess: boolean;
    customBranding: boolean;
    ssoIntegration: boolean;
    prioritySupport: boolean;
    customWorkflows: boolean;
    aiInsights: boolean;
    multiCurrency: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSettings {
  settingId: string;
  tenantId: string;
  companyName: string;
  companyDescription?: string;
  industry?: string;
  registrationNumber?: string;
  taxId?: string;
  logo?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  timezone: string;
  defaultLanguage: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  fiscalYearStartMonth: number;
  weekStartDay: number;
  workingHours?: Record<string, any>;
  notificationSettings?: Record<string, any>;
  twoFactorAuthRequired: boolean;
  passwordExpiryDays: number;
  maxLoginAttempts: number;
  sessionTimeoutMinutes: number;
  ipWhitelistEnabled: boolean;
  allowedIpAddresses?: string[];
  branding?: Record<string, any>;
  customFields?: Record<string, any>;
}

export interface PaymentHistory {
  paymentId: string;
  tenantId: string;
  subscriptionId?: string;
  invoiceNumber: string;
  amount: number | string; // Decimal type from DB comes as string
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod: string;
  transactionId?: string;
  description?: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  taxAmount: number | string; // Decimal type from DB comes as string
  discountAmount: number | string; // Decimal type from DB comes as string
  totalAmount: number | string; // Decimal type from DB comes as string
  paidAt?: string;
  dueDate?: string;
  invoiceUrl?: string;
  receiptUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface BusinessRule {
  ruleId: string;
  tenantId: string;
  category: 'leave' | 'attendance' | 'payroll' | 'performance' | 'onboarding' | 'exit' | 'general';
  ruleName: string;
  description?: string;
  isActive: boolean;
  leaveRules?: Record<string, any>;
  attendanceRules?: Record<string, any>;
  payrollRules?: Record<string, any>;
  performanceRules?: Record<string, any>;
  onboardingRules?: Record<string, any>;
  exitRules?: Record<string, any>;
  customWorkflows?: any[];
  priority: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt: string;
}

export interface Role {
  roleId: string;
  tenantId: string;
  roleName: string;
  description?: string;
  isSystemRole: boolean;
  isActive: boolean;
  level: number;
  permissions?: Permission[];
  employeeCount: number;
  dataAccessRules?: Record<string, any>;
  customPermissions?: Record<string, boolean>;
  createdAt: string;
}

export interface Permission {
  permissionId: string;
  permissionCode: string;
  permissionName: string;
  description?: string;
  module: string;
  action: string;
  isActive: boolean;
  isSystemPermission: boolean;
}

export interface User {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: string;
  roleId?: string;
  role?: Role;
  department?: any;
  designation?: any;
  dateOfJoining: string;
}

class SettingsService {
  // ==================== SUBSCRIPTION ====================

  async getSubscription(): Promise<Subscription> {
    const response = await api.get('/settings/subscription');
    return response.data;
  }

  async createSubscription(data: Partial<Subscription>): Promise<Subscription> {
    const response = await api.post('/settings/subscription', data);
    return response.data;
  }

  async updateSubscription(data: Partial<Subscription>): Promise<Subscription> {
    const response = await api.put('/settings/subscription', data);
    return response.data;
  }

  async upgradePlan(newPlan: Subscription['plan']): Promise<Subscription> {
    const response = await api.post('/settings/subscription/upgrade', { newPlan });
    return response.data;
  }

  async cancelSubscription(): Promise<Subscription> {
    const response = await api.post('/settings/subscription/cancel');
    return response.data;
  }

  // ==================== ORGANIZATION ====================

  async getOrganizationSettings(): Promise<OrganizationSettings> {
    const response = await api.get('/settings/organization');
    return response.data;
  }

  async updateOrganizationSettings(data: Partial<OrganizationSettings>): Promise<OrganizationSettings> {
    const response = await api.put('/settings/organization', data);
    return response.data;
  }

  // ==================== PAYMENTS ====================

  async getAllPayments(params?: { status?: string; limit?: number; offset?: number }): Promise<{ payments: PaymentHistory[]; total: number }> {
    const response = await api.get('/settings/payments', { params });
    return response.data;
  }

  async createPayment(data: Partial<PaymentHistory>): Promise<PaymentHistory> {
    const response = await api.post('/settings/payments', data);
    return response.data;
  }

  async updatePaymentStatus(paymentId: string, status: string, metadata?: any): Promise<PaymentHistory> {
    const response = await api.put(`/settings/payments/${paymentId}/status`, { status, metadata });
    return response.data;
  }

  // ==================== BUSINESS RULES ====================

  async getAllBusinessRules(category?: string): Promise<BusinessRule[]> {
    const response = await api.get('/settings/business-rules', { params: { category } });
    return response.data;
  }

  async getBusinessRuleById(ruleId: string): Promise<BusinessRule> {
    const response = await api.get(`/settings/business-rules/${ruleId}`);
    return response.data;
  }

  async createBusinessRule(data: Partial<BusinessRule>): Promise<BusinessRule> {
    const response = await api.post('/settings/business-rules', data);
    return response.data;
  }

  async updateBusinessRule(ruleId: string, data: Partial<BusinessRule>): Promise<BusinessRule> {
    const response = await api.put(`/settings/business-rules/${ruleId}`, data);
    return response.data;
  }

  async deleteBusinessRule(ruleId: string): Promise<void> {
    await api.delete(`/settings/business-rules/${ruleId}`);
  }

  // ==================== ROLES ====================

  async getAllRoles(): Promise<Role[]> {
    const response = await api.get('/settings/roles');
    return response.data;
  }

  async getRoleById(roleId: string): Promise<Role> {
    const response = await api.get(`/settings/roles/${roleId}`);
    return response.data;
  }

  async createRole(data: Partial<Role>): Promise<Role> {
    const response = await api.post('/settings/roles', data);
    return response.data;
  }

  async updateRole(roleId: string, data: Partial<Role>): Promise<Role> {
    const response = await api.put(`/settings/roles/${roleId}`, data);
    return response.data;
  }

  async deleteRole(roleId: string): Promise<void> {
    await api.delete(`/settings/roles/${roleId}`);
  }

  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<Role> {
    const response = await api.post(`/settings/roles/${roleId}/permissions`, { permissionIds });
    return response.data;
  }

  // ==================== PERMISSIONS ====================

  async getAllPermissions(): Promise<Permission[]> {
    const response = await api.get('/settings/permissions');
    return response.data;
  }

  async getPermissionsByModule(module: string): Promise<Permission[]> {
    const response = await api.get(`/settings/permissions/module/${module}`);
    return response.data;
  }

  async initializePermissions(): Promise<void> {
    await api.post('/settings/permissions/initialize');
  }

  // ==================== USERS ====================

  async getAllUsers(params?: { status?: string; roleId?: string; departmentId?: string; limit?: number; offset?: number }): Promise<{ users: User[]; total: number }> {
    const response = await api.get('/settings/users', { params });
    return response.data;
  }

  async assignRoleToUser(employeeId: string, roleId: string): Promise<User> {
    const response = await api.post(`/settings/users/${employeeId}/role`, { roleId });
    return response.data;
  }

  async deactivateUser(employeeId: string): Promise<User> {
    const response = await api.post(`/settings/users/${employeeId}/deactivate`);
    return response.data;
  }

  async reactivateUser(employeeId: string): Promise<User> {
    const response = await api.post(`/settings/users/${employeeId}/reactivate`);
    return response.data;
  }
}

export default new SettingsService();
