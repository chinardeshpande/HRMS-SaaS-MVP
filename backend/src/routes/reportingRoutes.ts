import { Router } from 'express';
import reportingController from '../controllers/reportingController';
import { authenticate, authorize } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant';
import { UserRole } from '../../../shared/types';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(tenantIsolation);

/**
 * @route   GET /api/reports/attendance-summary
 * @desc    Get attendance summary report
 * @access  Private (HR, Manager)
 */
router.get(
  '/attendance-summary',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER),
  reportingController.getAttendanceSummary.bind(reportingController)
);

/**
 * @route   GET /api/reports/leave-balance
 * @desc    Get leave balance and usage report
 * @access  Private (HR, Manager)
 */
router.get(
  '/leave-balance',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER),
  reportingController.getLeaveBalance.bind(reportingController)
);

/**
 * @route   GET /api/reports/headcount
 * @desc    Get headcount report
 * @access  Private (HR, Manager)
 */
router.get(
  '/headcount',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER),
  reportingController.getHeadcount.bind(reportingController)
);

/**
 * @route   GET /api/reports/joiners-leavers
 * @desc    Get joiners and leavers report
 * @access  Private (HR, Manager)
 */
router.get(
  '/joiners-leavers',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN),
  reportingController.getJoinersLeavers.bind(reportingController)
);

/**
 * @route   GET /api/reports/confirmation-due
 * @desc    Get confirmation due report
 * @access  Private (HR, Manager)
 */
router.get(
  '/confirmation-due',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER),
  reportingController.getConfirmationDue.bind(reportingController)
);

/**
 * @route   GET /api/reports/attrition
 * @desc    Get attrition report
 * @access  Private (HR)
 */
router.get(
  '/attrition',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN),
  reportingController.getAttrition.bind(reportingController)
);

/**
 * @route   GET /api/reports/pms-completion
 * @desc    Get PMS completion report
 * @access  Private (HR, Manager)
 */
router.get(
  '/pms-completion',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER),
  reportingController.getPMSCompletion.bind(reportingController)
);

/**
 * @route   GET /api/reports/missing-documents
 * @desc    Get missing documents report
 * @access  Private (HR)
 */
router.get(
  '/missing-documents',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN),
  reportingController.getMissingDocuments.bind(reportingController)
);

/**
 * @route   GET /api/reports/memory-readiness
 * @desc    Get tenant memory readiness report
 * @access  Private (HR)
 */
router.get(
  '/memory-readiness',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN),
  reportingController.getMemoryReadiness.bind(reportingController)
);

/**
 * @route   GET /api/reports/saved
 * @desc    Get all saved reports
 * @access  Private (HR, Manager)
 */
router.get(
  '/saved',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER),
  reportingController.getSavedReports.bind(reportingController)
);

/**
 * @route   POST /api/reports/saved
 * @desc    Save a report configuration
 * @access  Private (HR, Manager)
 */
router.post(
  '/saved',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER),
  reportingController.saveReport.bind(reportingController)
);

/**
 * @route   POST /api/reports/saved/:reportId/execute
 * @desc    Execute a saved report
 * @access  Private (HR, Manager)
 */
router.post(
  '/saved/:reportId/execute',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER),
  reportingController.executeSavedReport.bind(reportingController)
);

export default router;
