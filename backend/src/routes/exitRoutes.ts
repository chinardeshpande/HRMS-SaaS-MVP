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
  updateExitCase,
  deleteExitCase,
  createClearance,
  getClearancesByExitId,
  deleteClearance,
  updateAssetReturn,
  getAssetsByExitId,
  deleteAssetReturn,
  updateExitInterview,
  getExitInterviewByExitId,
  deleteExitInterview,
  updateSettlement,
  getSettlementByExitId,
  deleteSettlement,
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

// Exit case operations (CRUD)
router.get('/cases/:exitId', getExitCase);
router.put('/cases/:exitId', updateExitCase);
router.delete('/cases/:exitId', deleteExitCase);
router.post('/cases/:exitId/transition', transitionState);
router.post('/cases/:exitId/approve', approveResignation);
router.post('/cases/:exitId/reject', rejectResignation);
router.post('/cases/:exitId/notice-period/buyout', buyoutNoticePeriod);

// Clearance operations (CRUD)
router.get('/cases/:exitId/clearances', getClearancesByExitId);
router.post('/cases/:exitId/clearances', createClearance);
router.put('/clearances/:clearanceId', updateClearance);
router.delete('/clearances/:clearanceId', deleteClearance);
router.post('/clearances/:clearanceId/approve', approveClearance);

// Asset return operations (CRUD)
router.get('/cases/:exitId/assets', getAssetsByExitId);
router.post('/cases/:exitId/assets', recordAssetReturn);
router.put('/assets/:assetId', updateAssetReturn);
router.delete('/assets/:assetId', deleteAssetReturn);

// Exit interview operations (CRUD)
router.get('/cases/:exitId/exit-interview', getExitInterviewByExitId);
router.post('/cases/:exitId/exit-interview/schedule', scheduleExitInterview);
router.put('/exit-interviews/:exitInterviewId', updateExitInterview);
router.put('/exit-interviews/:exitInterviewId/submit', submitExitInterview);
router.delete('/exit-interviews/:exitInterviewId', deleteExitInterview);

// Settlement operations (CRUD)
router.get('/cases/:exitId/settlement', getSettlementByExitId);
router.post('/cases/:exitId/settlement/calculate', calculateSettlement);
router.put('/settlements/:settlementId', updateSettlement);
router.delete('/settlements/:settlementId', deleteSettlement);
router.post('/settlements/:settlementId/approve', approveSettlement);
router.post('/settlements/:settlementId/mark-paid', markSettlementPaid);

export default router;
