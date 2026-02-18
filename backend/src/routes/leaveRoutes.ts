import { Router } from 'express';
import leaveController from '../controllers/leaveController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/types';

const router = Router();

// Employee routes - All authenticated employees can access
router.post('/apply', authenticate, leaveController.applyLeave);
router.put('/:leaveId/cancel', authenticate, leaveController.cancelLeave);
router.get('/my-requests', authenticate, leaveController.getMyRequests);
router.get('/my-balance', authenticate, leaveController.getMyBalance);

// Manager routes - For approving team leave requests
router.get(
  '/pending-approvals',
  authenticate,
  authorize(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  leaveController.getPendingApprovals
);

router.put(
  '/:leaveId/approve',
  authenticate,
  authorize(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  leaveController.approveOrReject
);

// HR-only routes
router.get(
  '/all-requests',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  leaveController.getAllRequests
);

router.get(
  '/statistics',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  leaveController.getStatistics
);

router.post(
  '/initialize-balance',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  leaveController.initializeBalance
);

export default router;
