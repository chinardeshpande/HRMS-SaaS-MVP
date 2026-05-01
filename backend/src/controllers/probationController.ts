import { Request, Response } from 'express';
import probationService from '../services/probationService';
import { sendSuccess, sendError, sendCreated } from '../utils/responses';
import logger from '../utils/logger';

export const getAllProbationCases = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const filters = {
      state: req.query.state as string | undefined,
    };
    const cases = await probationService.getAllProbationCases(tenantId, filters);
    return sendSuccess(res, cases);
  } catch (error: any) {
    logger.error('Get probation cases error:', error);
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 400);
  }
};

export const getProbationCase = async (req: Request, res: Response) => {
  try {
    const { probationId } = req.params;
    const tenantId = req.user!.tenantId;
    const probationCase = await probationService.getProbationCase(probationId, tenantId);

    if (!probationCase) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Probation case not found' }, 404);
    }

    return sendSuccess(res, probationCase);
  } catch (error: any) {
    logger.error('Get probation case error:', error);
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 400);
  }
};

export const getDueReviews = async (req: Request, res: Response) => {
  try {
    const managerId = req.user!.employeeId;
    const tenantId = req.user!.tenantId;

    if (!managerId) {
      return sendError(res, { code: 'EMPLOYEE_PROFILE_REQUIRED', message: 'Employee profile is required' }, 400);
    }

    const reviews = await probationService.getDueReviews(managerId, tenantId);
    return sendSuccess(res, reviews);
  } catch (error: any) {
    logger.error('Get due reviews error:', error);
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 400);
  }
};

export const submitReview = async (req: Request, res: Response) => {
  try {
    const { probationId } = req.params;
    const managerId = req.user!.employeeId!;
    const tenantId = req.user!.tenantId;
    const review = await probationService.submitReview(probationId, tenantId, managerId, req.body);
    return sendCreated(res, review);
  } catch (error: any) {
    logger.error('Submit review error:', error);
    return sendError(res, { code: 'SUBMIT_FAILED', message: error.message }, 400);
  }
};

export const hrApproveReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const hrId = req.user!.employeeId!;
    const tenantId = req.user!.tenantId;
    const { approved, notes } = req.body;

    await probationService.hrApproveReview(reviewId, tenantId, hrId, approved, notes);
    return sendSuccess(res, { message: 'Review approval recorded successfully' });
  } catch (error: any) {
    logger.error('HR approve review error:', error);
    return sendError(res, { code: 'APPROVAL_FAILED', message: error.message }, 400);
  }
};

export const flagAtRisk = async (req: Request, res: Response) => {
  try {
    const { probationId } = req.params;
    const userId = req.user!.employeeId!;
    const tenantId = req.user!.tenantId;
    const { riskReason, riskLevel } = req.body;

    await probationService.flagAtRisk(probationId, tenantId, userId, riskReason, riskLevel);
    return sendSuccess(res, { message: 'Employee flagged as at-risk successfully' });
  } catch (error: any) {
    logger.error('Flag at-risk error:', error);
    return sendError(res, { code: 'FLAG_FAILED', message: error.message }, 400);
  }
};

export const extendProbation = async (req: Request, res: Response) => {
  try {
    const { probationId } = req.params;
    const userId = req.user!.employeeId!;
    const tenantId = req.user!.tenantId;
    const { extensionDays, reason, improvementPlan } = req.body;

    await probationService.extendProbation(probationId, tenantId, extensionDays, reason, improvementPlan, userId);
    return sendSuccess(res, { message: 'Probation extended successfully' });
  } catch (error: any) {
    logger.error('Extend probation error:', error);
    return sendError(res, { code: 'EXTENSION_FAILED', message: error.message }, 400);
  }
};

export const confirmEmployee = async (req: Request, res: Response) => {
  try {
    const { probationId } = req.params;
    const userId = req.user!.employeeId!;
    const tenantId = req.user!.tenantId;

    await probationService.confirmEmployee(probationId, tenantId, userId);
    return sendSuccess(res, { message: 'Employee confirmed successfully' });
  } catch (error: any) {
    logger.error('Confirm employee error:', error);
    return sendError(res, { code: 'CONFIRMATION_FAILED', message: error.message }, 400);
  }
};

export const terminateProbation = async (req: Request, res: Response) => {
  try {
    const { probationId } = req.params;
    const userId = req.user!.employeeId!;
    const tenantId = req.user!.tenantId;
    const { reason } = req.body;

    await probationService.terminateProbation(probationId, tenantId, reason, userId);
    return sendSuccess(res, { message: 'Probation terminated successfully' });
  } catch (error: any) {
    logger.error('Terminate probation error:', error);
    return sendError(res, { code: 'TERMINATION_FAILED', message: error.message }, 400);
  }
};

export const getAtRiskEmployees = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const employees = await probationService.getAtRiskEmployees(tenantId);
    return sendSuccess(res, employees);
  } catch (error: any) {
    logger.error('Get at-risk employees error:', error);
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 400);
  }
};

export const getProbationStatistics = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const stats = await probationService.getProbationStatistics(tenantId);
    return sendSuccess(res, stats);
  } catch (error: any) {
    logger.error('Get probation statistics error:', error);
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 400);
  }
};
