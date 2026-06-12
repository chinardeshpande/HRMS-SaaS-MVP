import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant';
import { UserRole } from '../../../shared/types';
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
  getMyExitCase,
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
router.use(tenantIsolation);

const managerOrHr = authorize(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN);
const hrOnly = authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN);

// Statistics and lists
router.get('/statistics', hrOnly, getExitStatistics);
router.get('/cases', managerOrHr, getAllExitCases);
router.get('/clearances/pending', managerOrHr, getPendingClearances);
router.get('/assets/pending', managerOrHr, getPendingAssetReturns);

// Employee resignation submission
router.post('/resign', submitResignation);
router.get('/my-case', getMyExitCase);

// Exit case operations (CRUD)
router.get('/cases/:exitId', managerOrHr, getExitCase);
router.put('/cases/:exitId', hrOnly, updateExitCase);
router.delete('/cases/:exitId', hrOnly, deleteExitCase);
router.post('/cases/:exitId/transition', hrOnly, transitionState);
router.post('/cases/:exitId/approve', managerOrHr, approveResignation);
router.post('/cases/:exitId/reject', managerOrHr, rejectResignation);
router.post('/cases/:exitId/notice-period/buyout', hrOnly, buyoutNoticePeriod);

// Clearance operations (CRUD)
router.get('/cases/:exitId/clearances', managerOrHr, getClearancesByExitId);
router.post('/cases/:exitId/clearances', hrOnly, createClearance);
router.put('/clearances/:clearanceId', managerOrHr, updateClearance);
router.delete('/clearances/:clearanceId', hrOnly, deleteClearance);
router.post('/clearances/:clearanceId/approve', managerOrHr, approveClearance);

// Asset return operations (CRUD)
router.get('/cases/:exitId/assets', managerOrHr, getAssetsByExitId);
router.post('/cases/:exitId/assets', managerOrHr, recordAssetReturn);
router.put('/assets/:assetId', managerOrHr, updateAssetReturn);
router.delete('/assets/:assetId', hrOnly, deleteAssetReturn);

// Exit interview operations (CRUD)
router.get('/cases/:exitId/exit-interview', managerOrHr, getExitInterviewByExitId);
router.post('/cases/:exitId/exit-interview/schedule', managerOrHr, scheduleExitInterview);
router.put('/exit-interviews/:exitInterviewId', managerOrHr, updateExitInterview);
router.put('/exit-interviews/:exitInterviewId/submit', submitExitInterview);
router.delete('/exit-interviews/:exitInterviewId', hrOnly, deleteExitInterview);

// Settlement operations (CRUD)
router.get('/cases/:exitId/settlement', hrOnly, getSettlementByExitId);
router.post('/cases/:exitId/settlement/calculate', hrOnly, calculateSettlement);
router.put('/settlements/:settlementId', hrOnly, updateSettlement);
router.delete('/settlements/:settlementId', hrOnly, deleteSettlement);
router.post('/settlements/:settlementId/approve', hrOnly, approveSettlement);
router.post('/settlements/:settlementId/mark-paid', hrOnly, markSettlementPaid);

export default router;
