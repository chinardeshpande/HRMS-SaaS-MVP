import { Router } from 'express';
import leaveController from '../controllers/leaveController';
import { authenticate, authorize } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant';
import { UserRole } from '../../../shared/types';

const router = Router();

// Employee routes - All authenticated employees can access
router.post('/apply', authenticate, tenantIsolation, leaveController.applyLeave);
router.put('/:leaveId/cancel', authenticate, tenantIsolation, leaveController.cancelLeave);
router.get('/my-requests', authenticate, tenantIsolation, leaveController.getMyRequests);
router.get('/my-balance', authenticate, tenantIsolation, leaveController.getMyBalance);
router.get('/policies', authenticate, tenantIsolation, leaveController.getPolicies);

// Manager routes - For approving team leave requests
router.get(
  '/pending-approvals',
  authenticate, tenantIsolation,
  authorize(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  leaveController.getPendingApprovals
);

router.put(
  '/:leaveId/approve',
  authenticate, tenantIsolation,
  authorize(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  leaveController.approveOrReject
);

// HR-only routes
router.get(
  '/all-requests',
  authenticate, tenantIsolation,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  leaveController.getAllRequests
);

router.get(
  '/statistics',
  authenticate, tenantIsolation,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  leaveController.getStatistics
);

router.post(
  '/initialize-balance',
  authenticate, tenantIsolation,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  leaveController.initializeBalance
);

export default router;
