import { Router } from 'express';
import attendanceController from '../controllers/attendanceController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/types';

const router = Router();

// Employee routes - All authenticated employees can access
router.post('/clock-in', authenticate, attendanceController.clockIn);
router.post('/clock-out', authenticate, attendanceController.clockOut);
router.get('/my-attendance', authenticate, attendanceController.getMyAttendance);

// HR-only routes - Requires HR role
router.post(
  '/bulk-update',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  attendanceController.bulkUpdate
);

router.put(
  '/override/:attendanceId',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  attendanceController.overrideAttendance
);

router.get(
  '/company-wide',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER),
  attendanceController.getCompanyWide
);

router.get(
  '/statistics',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  attendanceController.getStatistics
);

router.get(
  '/by-department',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  attendanceController.getByDepartment
);

export default router;
