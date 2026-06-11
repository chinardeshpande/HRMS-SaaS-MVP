import { Request, Response } from 'express';
import { settingsService } from '../services/settingsService';
import { Subscription, SubscriptionPlan, BillingCycle } from '../models/Subscription';
import { OrganizationSettings } from '../models/OrganizationSettings';
import { PaymentStatus } from '../models/PaymentHistory';
import { RuleCategory } from '../models/BusinessRules';
import { PermissionModule } from '../models/Permission';
import leavePolicyService from '../services/leavePolicyService';
import attendancePolicyService from '../services/attendancePolicyService';

// ==================== SUBSCRIPTION CONTROLLERS ====================

const allowedSubscriptionUpdateFields: Array<keyof Subscription> = [
  'billingCycle',
  'autoRenew',
  'notes',
];

const allowedOrganizationUpdateFields: Array<keyof OrganizationSettings> = [
  'companyName',
  'companyDescription',
  'industry',
  'registrationNumber',
  'taxId',
  'logo',
  'email',
  'phone',
  'website',
  'address',
  'city',
  'state',
  'postalCode',
  'country',
  'timezone',
  'defaultLanguage',
  'currency',
  'dateFormat',
  'timeFormat',
  'fiscalYearStartMonth',
  'weekStartDay',
  'workingHours',
  'notificationSettings',
  'smtpConfig',
  'twoFactorAuthRequired',
  'passwordExpiryDays',
  'maxLoginAttempts',
  'sessionTimeoutMinutes',
  'ipWhitelistEnabled',
  'allowedIpAddresses',
  'branding',
  'customFields',
];

function pickAllowedFields<T extends object>(
  body: Record<string, any>,
  allowedFields: Array<keyof T>
): Partial<T> {
  return allowedFields.reduce((updates, field) => {
    if (body[field as string] !== undefined) {
      (updates as Record<string, any>)[field as string] = body[field as string];
    }

    return updates;
  }, {} as Partial<T>);
}

function validateSubscriptionUpdates(updates: Partial<Subscription>) {
  if (
    updates.billingCycle &&
    !Object.values(BillingCycle).includes(updates.billingCycle as BillingCycle)
  ) {
    throw new Error('A valid billing cycle is required');
  }
}

function validateOrganizationUpdates(updates: Partial<OrganizationSettings>) {
  if (updates.companyName !== undefined && !String(updates.companyName).trim()) {
    throw new Error('Company name cannot be blank');
  }

  if (
    updates.fiscalYearStartMonth !== undefined &&
    (Number(updates.fiscalYearStartMonth) < 1 || Number(updates.fiscalYearStartMonth) > 12)
  ) {
    throw new Error('Fiscal year start month must be between 1 and 12');
  }

  if (
    updates.weekStartDay !== undefined &&
    (Number(updates.weekStartDay) < 0 || Number(updates.weekStartDay) > 6)
  ) {
    throw new Error('Week start day must be between 0 and 6');
  }
}

export const getSubscription = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;

    const subscription = await settingsService.getSubscription(tenantId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Subscription not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { plan, billingCycle, price } = req.body;

    if (!plan || !billingCycle) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Plan and billing cycle are required',
        },
      });
    }

    const subscription = await settingsService.createSubscription({
      tenantId,
      plan: plan as SubscriptionPlan,
      billingCycle: billingCycle as BillingCycle,
      price: price || 0,
    });

    res.status(201).json({
      success: true,
      data: subscription,
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const updateSubscription = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const updates = pickAllowedFields<Subscription>(req.body, allowedSubscriptionUpdateFields);
    validateSubscriptionUpdates(updates);

    const subscription = await settingsService.updateSubscription(tenantId, updates);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Subscription not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    res.status(error.message?.includes('valid') ? 400 : 500).json({
      success: false,
      error: {
        code: error.message?.includes('valid') ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const upgradePlan = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { newPlan } = req.body;

    if (!newPlan) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'New plan is required',
        },
      });
    }

    const subscription = await settingsService.upgradePlan(tenantId, newPlan as SubscriptionPlan);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Subscription not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error: any) {
    console.error('Error upgrading plan:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;

    const subscription = await settingsService.cancelSubscription(tenantId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Subscription not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

// ==================== ORGANIZATION SETTINGS CONTROLLERS ====================

export const getOrganizationSettings = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;

    const settings = await settingsService.getOrganizationSettings(tenantId);

    if (!settings) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Organization settings not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error('Error fetching organization settings:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const updateOrganizationSettings = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const updates = pickAllowedFields<OrganizationSettings>(req.body, allowedOrganizationUpdateFields);
    validateOrganizationUpdates(updates);

    let settings = await settingsService.getOrganizationSettings(tenantId);

    if (!settings) {
      // Create if doesn't exist
      settings = await settingsService.createOrganizationSettings({
        tenantId,
        ...updates,
      });
    } else {
      settings = await settingsService.updateOrganizationSettings(tenantId, updates);
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error('Error updating organization settings:', error);
    res.status(error.message?.includes('must') || error.message?.includes('blank') ? 400 : 500).json({
      success: false,
      error: {
        code: error.message?.includes('must') || error.message?.includes('blank') ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

// ==================== PAYMENT CONTROLLERS ====================

export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { status, limit = 20, offset = 0 } = req.query;

    const result = await settingsService.getAllPayments(tenantId, {
      status: status as PaymentStatus,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const paymentData = req.body;

    const payment = await settingsService.createPayment({
      tenantId,
      ...paymentData,
    });

    res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { paymentId } = req.params;
    const { status, metadata } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Payment status is required',
        },
      });
    }

    const payment = await settingsService.updatePaymentStatus(
      paymentId,
      tenantId,
      status as PaymentStatus,
      metadata
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Payment not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

// ==================== BUSINESS RULES CONTROLLERS ====================

export const getAllBusinessRules = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { category } = req.query;

    const rules = await settingsService.getAllBusinessRules(
      tenantId,
      category as RuleCategory
    );

    res.status(200).json({
      success: true,
      data: rules,
    });
  } catch (error: any) {
    console.error('Error fetching business rules:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const getBusinessRuleById = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { ruleId } = req.params;

    const rule = await settingsService.getBusinessRuleById(ruleId, tenantId);

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Business rule not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: rule,
    });
  } catch (error: any) {
    console.error('Error fetching business rule:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const createBusinessRule = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const ruleData = req.body;

    if (!ruleData.category || !ruleData.ruleName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Category and rule name are required',
        },
      });
    }

    const rule = await settingsService.createBusinessRule({
      tenantId,
      ...ruleData,
    });

    res.status(201).json({
      success: true,
      data: rule,
    });
  } catch (error: any) {
    console.error('Error creating business rule:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const updateBusinessRule = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { ruleId } = req.params;
    const updates = req.body;

    const rule = await settingsService.updateBusinessRule(ruleId, tenantId, updates);

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Business rule not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: rule,
    });
  } catch (error: any) {
    console.error('Error updating business rule:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const deleteBusinessRule = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { ruleId } = req.params;

    const deleted = await settingsService.deleteBusinessRule(ruleId, tenantId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Business rule not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: { message: 'Business rule deleted successfully' },
    });
  } catch (error: any) {
    console.error('Error deleting business rule:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

// ==================== ROLE CONTROLLERS ====================

export const getAllRoles = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;

    const roles = await settingsService.getAllRoles(tenantId);

    res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const getRoleById = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { roleId } = req.params;

    const role = await settingsService.getRoleById(roleId, tenantId);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Role not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error: any) {
    console.error('Error fetching role:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const createRole = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const roleData = req.body;

    if (!roleData.roleName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Role name is required',
        },
      });
    }

    const role = await settingsService.createRole({
      tenantId,
      ...roleData,
    });

    res.status(201).json({
      success: true,
      data: role,
    });
  } catch (error: any) {
    console.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { roleId } = req.params;
    const updates = req.body;

    const role = await settingsService.updateRole(roleId, tenantId, updates);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Role not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error: any) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { roleId } = req.params;

    const deleted = await settingsService.deleteRole(roleId, tenantId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Role not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: { message: 'Role deleted successfully' },
    });
  } catch (error: any) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const assignPermissionsToRole = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { roleId } = req.params;
    const { permissionIds } = req.body;

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Permission IDs must be an array',
        },
      });
    }

    const role = await settingsService.assignPermissionsToRole(roleId, tenantId, permissionIds);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Role not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error: any) {
    console.error('Error assigning permissions to role:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

// ==================== PERMISSION CONTROLLERS ====================

export const getAllPermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await settingsService.getAllPermissions();

    res.status(200).json({
      success: true,
      data: permissions,
    });
  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const getPermissionsByModule = async (req: Request, res: Response) => {
  try {
    const { module } = req.params;

    const permissions = await settingsService.getPermissionsByModule(module as PermissionModule);

    res.status(200).json({
      success: true,
      data: permissions,
    });
  } catch (error: any) {
    console.error('Error fetching permissions by module:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const initializePermissions = async (req: Request, res: Response) => {
  try {
    await settingsService.initializeDefaultPermissions();

    res.status(200).json({
      success: true,
      data: { message: 'Permissions initialized successfully' },
    });
  } catch (error: any) {
    console.error('Error initializing permissions:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

// ==================== USER MANAGEMENT CONTROLLERS ====================

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { status, roleId, departmentId, limit = 50, offset = 0 } = req.query;

    const result = await settingsService.getAllUsers(tenantId, {
      status: status as string,
      roleId: roleId as string,
      departmentId: departmentId as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const assignRoleToUser = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { employeeId } = req.params;
    const { roleId } = req.body;

    if (!roleId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Role ID is required',
        },
      });
    }

    const user = await settingsService.assignRoleToUser(employeeId, roleId, tenantId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Error assigning role to user:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { employeeId } = req.params;

    const user = await settingsService.deactivateUser(employeeId, tenantId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Error deactivating user:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const reactivateUser = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { employeeId } = req.params;

    const user = await settingsService.reactivateUser(employeeId, tenantId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Error reactivating user:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message,
        details: error.details,
      },
    });
  }
};

// ==================== LEAVE POLICY CONTROLLERS ====================

export const createLeavePolicy = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const policyData = req.body;

    const policy = await leavePolicyService.createPolicy(tenantId, policyData);

    res.status(201).json({
      success: true,
      data: policy,
    });
  } catch (error: any) {
    console.error('Error creating leave policy:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const getAllLeavePolicies = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { isActive } = req.query;

    const filters: any = {};
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    const policies = await leavePolicyService.getAllPolicies(tenantId, filters);

    res.status(200).json({
      success: true,
      data: policies,
    });
  } catch (error: any) {
    console.error('Error fetching leave policies:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const getLeavePolicyById = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { policyId } = req.params;

    const policy = await leavePolicyService.getPolicyById(policyId, tenantId);

    res.status(200).json({
      success: true,
      data: policy,
    });
  } catch (error: any) {
    console.error('Error fetching leave policy:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const updateLeavePolicy = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { policyId } = req.params;
    const policyData = req.body;

    const policy = await leavePolicyService.updatePolicy(policyId, tenantId, policyData);

    res.status(200).json({
      success: true,
      data: policy,
    });
  } catch (error: any) {
    console.error('Error updating leave policy:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const deleteLeavePolicy = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { policyId } = req.params;

    await leavePolicyService.deletePolicy(policyId, tenantId);

    res.status(200).json({
      success: true,
      message: 'Leave policy deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting leave policy:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

// ==================== ATTENDANCE POLICY CONTROLLERS ====================

export const createAttendancePolicy = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const policyData = req.body;

    const policy = await attendancePolicyService.createPolicy(tenantId, policyData);

    res.status(201).json({
      success: true,
      data: policy,
    });
  } catch (error: any) {
    console.error('Error creating attendance policy:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const getAllAttendancePolicies = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { isActive } = req.query;

    const filters: any = {};
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    const policies = await attendancePolicyService.getAllPolicies(tenantId, filters);

    res.status(200).json({
      success: true,
      data: policies,
    });
  } catch (error: any) {
    console.error('Error fetching attendance policies:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const getAttendancePolicyById = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { policyId } = req.params;

    const policy = await attendancePolicyService.getPolicyById(policyId, tenantId);

    res.status(200).json({
      success: true,
      data: policy,
    });
  } catch (error: any) {
    console.error('Error fetching attendance policy:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const updateAttendancePolicy = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { policyId } = req.params;
    const policyData = req.body;

    const policy = await attendancePolicyService.updatePolicy(policyId, tenantId, policyData);

    res.status(200).json({
      success: true,
      data: policy,
    });
  } catch (error: any) {
    console.error('Error updating attendance policy:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const deleteAttendancePolicy = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { policyId } = req.params;

    await attendancePolicyService.deletePolicy(policyId, tenantId);

    res.status(200).json({
      success: true,
      message: 'Attendance policy deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting attendance policy:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

// ==================== SMTP CONFIGURATION CONTROLLERS ====================

export const getSmtpConfig = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;

    const smtpConfig = await settingsService.getSmtpConfig(tenantId);

    res.status(200).json({
      success: true,
      data: smtpConfig,
    });
  } catch (error: any) {
    console.error('Error fetching SMTP config:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const updateSmtpConfig = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const smtpConfig = req.body;

    await settingsService.updateSmtpConfig(tenantId, smtpConfig);

    res.status(200).json({
      success: true,
      message: 'SMTP configuration updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating SMTP config:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};
