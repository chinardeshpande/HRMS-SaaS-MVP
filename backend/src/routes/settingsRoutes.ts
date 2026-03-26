import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== SUBSCRIPTION ROUTES ====================
router.get('/subscription', settingsController.getSubscription);
router.post('/subscription', settingsController.createSubscription);
router.put('/subscription', settingsController.updateSubscription);
router.post('/subscription/upgrade', settingsController.upgradePlan);
router.post('/subscription/cancel', settingsController.cancelSubscription);

// ==================== ORGANIZATION SETTINGS ROUTES ====================
router.get('/organization', settingsController.getOrganizationSettings);
router.put('/organization', settingsController.updateOrganizationSettings);

// ==================== PAYMENT ROUTES ====================
router.get('/payments', settingsController.getAllPayments);
router.post('/payments', settingsController.createPayment);
router.put('/payments/:paymentId/status', settingsController.updatePaymentStatus);

// ==================== BUSINESS RULES ROUTES ====================
router.get('/business-rules', settingsController.getAllBusinessRules);
router.get('/business-rules/:ruleId', settingsController.getBusinessRuleById);
router.post('/business-rules', settingsController.createBusinessRule);
router.put('/business-rules/:ruleId', settingsController.updateBusinessRule);
router.delete('/business-rules/:ruleId', settingsController.deleteBusinessRule);

// ==================== ROLE ROUTES ====================
router.get('/roles', settingsController.getAllRoles);
router.get('/roles/:roleId', settingsController.getRoleById);
router.post('/roles', settingsController.createRole);
router.put('/roles/:roleId', settingsController.updateRole);
router.delete('/roles/:roleId', settingsController.deleteRole);
router.post('/roles/:roleId/permissions', settingsController.assignPermissionsToRole);

// ==================== PERMISSION ROUTES ====================
router.get('/permissions', settingsController.getAllPermissions);
router.get('/permissions/module/:module', settingsController.getPermissionsByModule);
router.post('/permissions/initialize', settingsController.initializePermissions);

// ==================== USER MANAGEMENT ROUTES ====================
router.get('/users', settingsController.getAllUsers);
router.post('/users/:employeeId/role', settingsController.assignRoleToUser);
router.post('/users/:employeeId/deactivate', settingsController.deactivateUser);
router.post('/users/:employeeId/reactivate', settingsController.reactivateUser);

export default router;
