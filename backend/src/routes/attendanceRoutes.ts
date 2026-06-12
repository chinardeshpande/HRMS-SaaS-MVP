import { Router } from 'express';
import attendanceController from '../controllers/attendanceController';
import { authenticate, authorize } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant';
import { UserRole } from '../../../shared/types';

const router = Router();

// Employee routes - All authenticated employees can access
router.post('/clock-in', authenticate, tenantIsolation, attendanceController.clockIn);
router.post('/clock-out', authenticate, tenantIsolation, attendanceController.clockOut);
router.get('/my-attendance', authenticate, tenantIsolation, attendanceController.getMyAttendance);

// HR-only routes - Requires HR role
router.post(
  '/bulk-update',
  authenticate, tenantIsolation,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  attendanceController.bulkUpdate
);

router.put(
  '/override/:attendanceId',
  authenticate, tenantIsolation,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  attendanceController.overrideAttendance
);

router.get(
  '/company-wide',
  authenticate, tenantIsolation,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER),
  attendanceController.getCompanyWide
);

router.get(
  '/statistics',
  authenticate, tenantIsolation,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  attendanceController.getStatistics
);

router.get(
  '/by-department',
  authenticate, tenantIsolation,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  attendanceController.getByDepartment
);

// Time Entry Edit (Regularization) routes
router.post('/regularization/request', authenticate, tenantIsolation, attendanceController.requestRegularization);
router.get('/regularization/my-requests', authenticate, tenantIsolation, attendanceController.getMyRegularizationRequests);
router.get(
  '/regularization/pending',
  authenticate, tenantIsolation,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER),
  attendanceController.getPendingRegularizations
);
router.put(
  '/regularization/:editId/approve',
  authenticate, tenantIsolation,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER),
  attendanceController.approveRegularization
);
router.put(
  '/regularization/:editId/reject',
  authenticate, tenantIsolation,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER),
  attendanceController.rejectRegularization
);

// Team attendance (for managers)
router.get(
  '/team',
  authenticate, tenantIsolation,
  authorize(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  attendanceController.getTeamAttendance
);

export default router;
