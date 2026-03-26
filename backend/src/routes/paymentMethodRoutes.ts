import { Router } from 'express';
import * as paymentMethodController from '../controllers/paymentMethodController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

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
