import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  submitResignation,
  approveResignation,
  rejectResignation,
  buyoutNoticePeriod,
  transitionState,
  updateClearance,
  approveClearance,
  recordAssetReturn,
  scheduleExitInterview,
  submitExitInterview,
  calculateSettlement,
  approveSettlement,
  markSettlementPaid,
  getExitCase,
  getAllExitCases,
  getPendingClearances,
  getPendingAssetReturns,
  getExitStatistics,
} from '../controllers/exitController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Statistics and lists
router.get('/statistics', getExitStatistics);
router.get('/cases', getAllExitCases);
router.get('/clearances/pending', getPendingClearances);
router.get('/assets/pending', getPendingAssetReturns);

// Employee resignation submission
router.post('/resign', submitResignation);

// Exit case operations
router.get('/cases/:exitId', getExitCase);
router.post('/cases/:exitId/transition', transitionState);
router.post('/cases/:exitId/approve', approveResignation);
router.post('/cases/:exitId/reject', rejectResignation);
router.post('/cases/:exitId/notice-period/buyout', buyoutNoticePeriod);

// Clearance operations
router.put('/clearances/:clearanceId', updateClearance);
router.post('/clearances/:clearanceId/approve', approveClearance);

// Asset return operations
router.post('/cases/:exitId/assets', recordAssetReturn);

// Exit interview operations
router.post('/cases/:exitId/exit-interview/schedule', scheduleExitInterview);
router.put('/exit-interviews/:exitInterviewId/submit', submitExitInterview);

// Settlement operations
router.post('/cases/:exitId/settlement/calculate', calculateSettlement);
router.post('/settlements/:settlementId/approve', approveSettlement);
router.post('/settlements/:settlementId/mark-paid', markSettlementPaid);

export default router;
