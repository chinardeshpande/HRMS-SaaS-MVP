import { Router } from 'express';
import attendanceController from '../controllers/attendanceController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/types';
import multer from 'multer';

const router = Router();
const attendanceImportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const isCsv =
      /\.(csv|xlsx)$/i.test(file.originalname) ||
      ['text/csv', 'application/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'].includes(file.mimetype);
    if (isCsv) callback(null, true);
    else callback(new Error('Only CSV or XLSX attendance files are allowed'));
  },
});

// Employee routes - All authenticated employees can access
router.post('/clock-in', authenticate, attendanceController.clockIn);
router.post('/clock-out', authenticate, attendanceController.clockOut);
router.post('/reopen-today', authenticate, attendanceController.reopenToday);
router.get('/my-attendance', authenticate, attendanceController.getMyAttendance);

router.get(
  '/import/config',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  attendanceController.getImportConfig
);
router.put(
  '/import/config',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  attendanceController.saveImportConfig
);

router.get(
  '/import/template',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  attendanceController.downloadImportTemplate
);

router.post(
  '/import/preview',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  attendanceImportUpload.single('file') as any,
  attendanceController.previewImport
);

router.post(
  '/import/commit',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  attendanceImportUpload.single('file') as any,
  attendanceController.commitImport
);

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

// Time Entry Edit (Regularization) routes
router.post('/regularization/request', authenticate, attendanceController.requestRegularization);
router.get('/regularization/my-requests', authenticate, attendanceController.getMyRegularizationRequests);
router.get(
  '/regularization/pending',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER),
  attendanceController.getPendingRegularizations
);
router.put(
  '/regularization/:editId/approve',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER),
  attendanceController.approveRegularization
);
router.put(
  '/regularization/:editId/reject',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER),
  attendanceController.rejectRegularization
);

// Team attendance (for managers)
router.get(
  '/team',
  authenticate,
  authorize(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  attendanceController.getTeamAttendance
);

export default router;
