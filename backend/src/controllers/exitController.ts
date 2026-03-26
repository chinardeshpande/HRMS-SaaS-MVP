import { Request, Response } from 'express';
import exitService from '../services/exitService';
import exitFSMService from '../services/ExitFSMService';
import { sendSuccess, sendError, sendCreated } from '../utils/responses';
import logger from '../utils/logger';

export const submitResignation = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user!.employeeId!;
    const tenantId = req.user!.tenantId;
    const exitCase = await exitService.submitResignation(employeeId, tenantId, req.body);
    return sendCreated(res, exitCase);
  } catch (error: any) {
    logger.error('Submit resignation error:', error);
    return sendError(res, { code: 'SUBMIT_FAILED', message: error.message }, 400);
  }
};

export const approveResignation = async (req: Request, res: Response) => {
  try {
    const { exitId } = req.params;
    const userId = req.user!.employeeId!;
    const { notes } = req.body;

    await exitService.approveResignation(exitId, userId, notes);
    return sendSuccess(res, { message: 'Resignation approved successfully' });
  } catch (error: any) {
    logger.error('Approve resignation error:', error);
    return sendError(res, { code: 'APPROVAL_FAILED', message: error.message }, 400);
  }
};

export const rejectResignation = async (req: Request, res: Response) => {
  try {
    const { exitId } = req.params;
    const userId = req.user!.employeeId!;
    const { reason } = req.body;

    if (!reason) {
      return sendError(res, { code: 'VALIDATION_ERROR', message: 'Rejection reason is required' }, 400);
    }

    await exitService.rejectResignation(exitId, userId, reason);
    return sendSuccess(res, { message: 'Resignation rejected successfully' });
  } catch (error: any) {
    logger.error('Reject resignation error:', error);
    return sendError(res, { code: 'REJECTION_FAILED', message: error.message }, 400);
  }
};

export const buyoutNoticePeriod = async (req: Request, res: Response) => {
  try {
    const { exitId } = req.params;
    const userId = req.user!.employeeId!;
    const { buyoutAmount } = req.body;

    if (!buyoutAmount || buyoutAmount <= 0) {
      return sendError(res, { code: 'VALIDATION_ERROR', message: 'Valid buyout amount is required' }, 400);
    }

    await exitService.buyoutNoticePeriod(exitId, userId, buyoutAmount);
    return sendSuccess(res, { message: 'Notice period buyout processed successfully' });
  } catch (error: any) {
    logger.error('Notice period buyout error:', error);
    return sendError(res, { code: 'BUYOUT_FAILED', message: error.message }, 400);
  }
};

export const transitionState = async (req: Request, res: Response) => {
  try {
    const { exitId } = req.params;
    const { toState, reason } = req.body;
    const userId = req.user!.employeeId!;

    const result = await exitFSMService.transition(exitId, toState, userId, reason);

    if (!result.success) {
      return sendError(res, { code: 'TRANSITION_FAILED', message: result.message! }, 400);
    }

    return sendSuccess(res, { message: 'State transition successful' });
  } catch (error: any) {
    logger.error('State transition error:', error);
    return sendError(res, { code: 'TRANSITION_ERROR', message: error.message }, 500);
  }
};

export const updateClearance = async (req: Request, res: Response) => {
  try {
    const { clearanceId } = req.params;
    const userId = req.user!.employeeId!;

    await exitService.updateClearance(clearanceId, userId, req.body);
    return sendSuccess(res, { message: 'Clearance updated successfully' });
  } catch (error: any) {
    logger.error('Update clearance error:', error);
    return sendError(res, { code: 'UPDATE_FAILED', message: error.message }, 400);
  }
};

export const approveClearance = async (req: Request, res: Response) => {
  try {
    const { clearanceId } = req.params;
    const userId = req.user!.employeeId!;

    await exitService.approveClearance(clearanceId, userId);
    return sendSuccess(res, { message: 'Clearance approved successfully' });
  } catch (error: any) {
    logger.error('Approve clearance error:', error);
    return sendError(res, { code: 'APPROVAL_FAILED', message: error.message }, 400);
  }
};

export const recordAssetReturn = async (req: Request, res: Response) => {
  try {
    const { exitId } = req.params;
    const userId = req.user!.employeeId!;

    const asset = await exitService.recordAssetReturn(exitId, req.body, userId);
    return sendCreated(res, asset);
  } catch (error: any) {
    logger.error('Record asset return error:', error);
    return sendError(res, { code: 'RECORD_FAILED', message: error.message }, 400);
  }
};

export const scheduleExitInterview = async (req: Request, res: Response) => {
  try {
    const { exitId } = req.params;
    const { scheduledDate, conductedBy } = req.body;

    const interview = await exitService.scheduleExitInterview(exitId, new Date(scheduledDate), conductedBy);
    return sendCreated(res, interview);
  } catch (error: any) {
    logger.error('Schedule exit interview error:', error);
    return sendError(res, { code: 'SCHEDULE_FAILED', message: error.message }, 400);
  }
};

export const submitExitInterview = async (req: Request, res: Response) => {
  try {
    const { exitInterviewId } = req.params;

    const interview = await exitService.submitExitInterview(exitInterviewId, req.body);
    return sendSuccess(res, interview);
  } catch (error: any) {
    logger.error('Submit exit interview error:', error);
    return sendError(res, { code: 'SUBMIT_FAILED', message: error.message }, 400);
  }
};

export const calculateSettlement = async (req: Request, res: Response) => {
  try {
    const { exitId } = req.params;
    const userId = req.user!.employeeId!;

    const settlement = await exitService.calculateSettlement(exitId, req.body, userId);
    return sendCreated(res, settlement);
  } catch (error: any) {
    logger.error('Calculate settlement error:', error);
    return sendError(res, { code: 'CALCULATION_FAILED', message: error.message }, 400);
  }
};

export const approveSettlement = async (req: Request, res: Response) => {
  try {
    const { settlementId } = req.params;
    const userId = req.user!.employeeId!;
    const { notes } = req.body;

    await exitService.approveSettlement(settlementId, userId, notes);
    return sendSuccess(res, { message: 'Settlement approved successfully' });
  } catch (error: any) {
    logger.error('Approve settlement error:', error);
    return sendError(res, { code: 'APPROVAL_FAILED', message: error.message }, 400);
  }
};

export const markSettlementPaid = async (req: Request, res: Response) => {
  try {
    const { settlementId } = req.params;
    const userId = req.user!.employeeId!;
    const { paymentDate, paymentMode, paymentReferenceNumber } = req.body;

    if (!paymentDate || !paymentMode || !paymentReferenceNumber) {
      return sendError(res, { code: 'VALIDATION_ERROR', message: 'Payment details are required' }, 400);
    }

    await exitService.markSettlementPaid(settlementId, userId, {
      paymentDate: new Date(paymentDate),
      paymentMode,
      paymentReferenceNumber,
    });

    return sendSuccess(res, { message: 'Settlement marked as paid successfully' });
  } catch (error: any) {
    logger.error('Mark settlement paid error:', error);
    return sendError(res, { code: 'PAYMENT_FAILED', message: error.message }, 400);
  }
};

export const getExitCase = async (req: Request, res: Response) => {
  try {
    const { exitId } = req.params;
    const exitCase = await exitService.getExitCase(exitId);

    if (!exitCase) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Exit case not found' }, 404);
    }

    return sendSuccess(res, exitCase);
  } catch (error: any) {
    logger.error('Get exit case error:', error);
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 400);
  }
};

export const getAllExitCases = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const filters = {
      state: req.query.state as string | undefined,
    };

    const cases = await exitService.getAllExitCases(tenantId, filters);
    return sendSuccess(res, cases);
  } catch (error: any) {
    logger.error('Get all exit cases error:', error);
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 400);
  }
};

export const getPendingClearances = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const departmentType = req.query.departmentType as string | undefined;

    const clearances = await exitService.getPendingClearances(tenantId, departmentType);
    return sendSuccess(res, clearances);
  } catch (error: any) {
    logger.error('Get pending clearances error:', error);
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 400);
  }
};

export const getPendingAssetReturns = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    const assets = await exitService.getPendingAssetReturns(tenantId);
    return sendSuccess(res, assets);
  } catch (error: any) {
    logger.error('Get pending asset returns error:', error);
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 400);
  }
};

export const getExitStatistics = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    const stats = await exitService.getExitStatistics(tenantId);
    return sendSuccess(res, stats);
  } catch (error: any) {
    logger.error('Get exit statistics error:', error);
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 400);
  }
};

// ==================== EXIT CASE CRUD OPERATIONS ====================

export const updateExitCase = async (req: Request, res: Response) => {
  try {
    const { exitId } = req.params;
    const userId = req.user!.employeeId!;

    const updated = await exitService.updateExitCase(exitId, req.body, userId);
    return sendSuccess(res, updated);
  } catch (error: any) {
    logger.error('Update exit case error:', error);
    return sendError(res, { code: 'UPDATE_FAILED', message: error.message }, 400);
  }
};

export const deleteExitCase = async (req: Request, res: Response) => {
  try {
    const { exitId } = req.params;
    const userId = req.user!.employeeId!;

    await exitService.deleteExitCase(exitId, userId);
    return sendSuccess(res, { message: 'Exit case deleted successfully' });
  } catch (error: any) {
    logger.error('Delete exit case error:', error);
    return sendError(res, { code: 'DELETE_FAILED', message: error.message }, 400);
  }
};

// ==================== CLEARANCE CRUD OPERATIONS ====================

export const createClearance = async (req: Request, res: Response) => {
  try {
    const { exitId } = req.params;
    const userId = req.user!.employeeId!;

    const clearance = await exitService.createClearance(exitId, req.body, userId);
    return sendCreated(res, clearance);
  } catch (error: any) {
    logger.error('Create clearance error:', error);
    return sendError(res, { code: 'CREATE_FAILED', message: error.message }, 400);
  }
};

export const getClearancesByExitId = async (req: Request, res: Response) => {
  try {
    const { exitId } = req.params;

    const clearances = await exitService.getClearancesByExitId(exitId);
    return sendSuccess(res, clearances);
  } catch (error: any) {
    logger.error('Get clearances error:', error);
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 400);
  }
};

export const deleteClearance = async (req: Request, res: Response) => {
  try {
    const { clearanceId } = req.params;
    const userId = req.user!.employeeId!;

    await exitService.deleteClearance(clearanceId, userId);
    return sendSuccess(res, { message: 'Clearance deleted successfully' });
  } catch (error: any) {
    logger.error('Delete clearance error:', error);
    return sendError(res, { code: 'DELETE_FAILED', message: error.message }, 400);
  }
};

// ==================== ASSET RETURN CRUD OPERATIONS ====================

export const updateAssetReturn = async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;
    const userId = req.user!.employeeId!;

    const updated = await exitService.updateAssetReturn(assetId, req.body, userId);
    return sendSuccess(res, updated);
  } catch (error: any) {
    logger.error('Update asset return error:', error);
    return sendError(res, { code: 'UPDATE_FAILED', message: error.message }, 400);
  }
};

export const getAssetsByExitId = async (req: Request, res: Response) => {
  try {
    const { exitId } = req.params;

    const assets = await exitService.getAssetsByExitId(exitId);
    return sendSuccess(res, assets);
  } catch (error: any) {
    logger.error('Get assets error:', error);
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 400);
  }
};

export const deleteAssetReturn = async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;
    const userId = req.user!.employeeId!;

    await exitService.deleteAssetReturn(assetId, userId);
    return sendSuccess(res, { message: 'Asset return record deleted successfully' });
  } catch (error: any) {
    logger.error('Delete asset return error:', error);
    return sendError(res, { code: 'DELETE_FAILED', message: error.message }, 400);
  }
};

// ==================== EXIT INTERVIEW CRUD OPERATIONS ====================

export const updateExitInterview = async (req: Request, res: Response) => {
  try {
    const { exitInterviewId } = req.params;
    const userId = req.user!.employeeId!;

    const updated = await exitService.updateExitInterview(exitInterviewId, req.body, userId);
    return sendSuccess(res, updated);
  } catch (error: any) {
    logger.error('Update exit interview error:', error);
    return sendError(res, { code: 'UPDATE_FAILED', message: error.message }, 400);
  }
};

export const getExitInterviewByExitId = async (req: Request, res: Response) => {
  try {
    const { exitId } = req.params;

    const interview = await exitService.getExitInterviewByExitId(exitId);
    return sendSuccess(res, interview);
  } catch (error: any) {
    logger.error('Get exit interview error:', error);
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 400);
  }
};

export const deleteExitInterview = async (req: Request, res: Response) => {
  try {
    const { exitInterviewId } = req.params;
    const userId = req.user!.employeeId!;

    await exitService.deleteExitInterview(exitInterviewId, userId);
    return sendSuccess(res, { message: 'Exit interview deleted successfully' });
  } catch (error: any) {
    logger.error('Delete exit interview error:', error);
    return sendError(res, { code: 'DELETE_FAILED', message: error.message }, 400);
  }
};

// ==================== SETTLEMENT CRUD OPERATIONS ====================

export const updateSettlement = async (req: Request, res: Response) => {
  try {
    const { settlementId } = req.params;
    const userId = req.user!.employeeId!;

    const updated = await exitService.updateSettlement(settlementId, req.body, userId);
    return sendSuccess(res, updated);
  } catch (error: any) {
    logger.error('Update settlement error:', error);
    return sendError(res, { code: 'UPDATE_FAILED', message: error.message }, 400);
  }
};

export const getSettlementByExitId = async (req: Request, res: Response) => {
  try {
    const { exitId } = req.params;

    const settlement = await exitService.getSettlementByExitId(exitId);
    return sendSuccess(res, settlement);
  } catch (error: any) {
    logger.error('Get settlement error:', error);
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 400);
  }
};

export const deleteSettlement = async (req: Request, res: Response) => {
  try {
    const { settlementId } = req.params;
    const userId = req.user!.employeeId!;

    await exitService.deleteSettlement(settlementId, userId);
    return sendSuccess(res, { message: 'Settlement deleted successfully' });
  } catch (error: any) {
    logger.error('Delete settlement error:', error);
    return sendError(res, { code: 'DELETE_FAILED', message: error.message }, 400);
  }
};
