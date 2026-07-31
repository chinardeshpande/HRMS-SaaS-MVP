import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/types';

const router = Router();

// All routes require authentication
router.use(authenticate);

const ownerOnly = authorize(UserRole.SYSTEM_ADMIN);
const hrOperations = authorize(UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN);

// ==================== SUBSCRIPTION ROUTES ====================
router.get('/subscription', ownerOnly, settingsController.getSubscription);
router.post('/subscription', ownerOnly, settingsController.createSubscription);
router.put('/subscription', ownerOnly, settingsController.updateSubscription);
router.post('/subscription/upgrade', ownerOnly, settingsController.upgradePlan);
router.post('/subscription/cancel', ownerOnly, settingsController.cancelSubscription);

// ==================== ORGANIZATION SETTINGS ROUTES ====================
router.get('/organization', ownerOnly, settingsController.getOrganizationSettings);
router.put('/organization', ownerOnly, settingsController.updateOrganizationSettings);

// ==================== PAYMENT ROUTES ====================
router.get('/payments', ownerOnly, settingsController.getAllPayments);
router.post('/payments', ownerOnly, settingsController.createPayment);
router.put('/payments/:paymentId/status', ownerOnly, settingsController.updatePaymentStatus);

// ==================== BUSINESS RULES ROUTES ====================
router.get('/business-rules', hrOperations, settingsController.getAllBusinessRules);
router.get('/business-rules/:ruleId', hrOperations, settingsController.getBusinessRuleById);
router.post('/business-rules', hrOperations, settingsController.createBusinessRule);
router.put('/business-rules/:ruleId', hrOperations, settingsController.updateBusinessRule);
router.delete('/business-rules/:ruleId', hrOperations, settingsController.deleteBusinessRule);

// ==================== ROLE ROUTES ====================
router.get('/roles', hrOperations, settingsController.getAllRoles);
router.get('/roles/:roleId', hrOperations, settingsController.getRoleById);
router.post('/roles', ownerOnly, settingsController.createRole);
router.put('/roles/:roleId', ownerOnly, settingsController.updateRole);
router.delete('/roles/:roleId', ownerOnly, settingsController.deleteRole);
router.post('/roles/:roleId/permissions', ownerOnly, settingsController.assignPermissionsToRole);

// ==================== PERMISSION ROUTES ====================
router.get('/permissions', ownerOnly, settingsController.getAllPermissions);
router.get('/permissions/module/:module', ownerOnly, settingsController.getPermissionsByModule);
router.post('/permissions/initialize', ownerOnly, settingsController.initializePermissions);

// ==================== USER MANAGEMENT ROUTES ====================
router.get('/users', hrOperations, settingsController.getAllUsers);
router.get('/identity-mappings', ownerOnly, settingsController.getIdentityMappings);
router.post('/identity-mappings/:userId', ownerOnly, settingsController.assignIdentityMapping);
router.post('/users/:employeeId/role', hrOperations, settingsController.assignRoleToUser);
router.post('/users/:employeeId/deactivate', hrOperations, settingsController.deactivateUser);
router.post('/users/:employeeId/reactivate', hrOperations, settingsController.reactivateUser);

// ==================== LEAVE POLICY ROUTES ====================
router.get('/leave-policies', hrOperations, settingsController.getAllLeavePolicies);
router.get('/leave-policies/:policyId', hrOperations, settingsController.getLeavePolicyById);
router.post('/leave-policies', hrOperations, settingsController.createLeavePolicy);
router.put('/leave-policies/:policyId', hrOperations, settingsController.updateLeavePolicy);
router.delete('/leave-policies/:policyId', hrOperations, settingsController.deleteLeavePolicy);

// ==================== ATTENDANCE POLICY ROUTES ====================
router.get('/attendance-policies', hrOperations, settingsController.getAllAttendancePolicies);
router.get('/attendance-policies/:policyId', hrOperations, settingsController.getAttendancePolicyById);
router.post('/attendance-policies', hrOperations, settingsController.createAttendancePolicy);
router.put('/attendance-policies/:policyId', hrOperations, settingsController.updateAttendancePolicy);
router.delete('/attendance-policies/:policyId', hrOperations, settingsController.deleteAttendancePolicy);

// ==================== SMTP CONFIGURATION ROUTES ====================
router.get('/smtp', ownerOnly, settingsController.getSmtpConfig);
router.put('/smtp', ownerOnly, settingsController.updateSmtpConfig);

export default router;
