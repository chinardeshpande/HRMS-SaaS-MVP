import { Router } from 'express';
import * as paymentMethodController from '../controllers/paymentMethodController';
import { authenticate, authorize } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant';
import { UserRole } from '../../../shared/types';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(tenantIsolation);
router.use(authorize(UserRole.SYSTEM_ADMIN));

// Payment Methods CRUD
router.get('/', paymentMethodController.getAllPaymentMethods);
router.get('/default', paymentMethodController.getDefaultPaymentMethod);
router.post('/', paymentMethodController.createPaymentMethod);
router.put('/:paymentMethodId', paymentMethodController.updatePaymentMethod);
router.delete('/:paymentMethodId', paymentMethodController.deletePaymentMethod);
router.post('/:paymentMethodId/set-default', paymentMethodController.setDefaultPaymentMethod);

// Payment Processing
router.post('/process', paymentMethodController.processPayment);

export default router;
