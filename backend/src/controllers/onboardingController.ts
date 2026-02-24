import { Request, Response } from 'express';
import onboardingService from '../services/onboardingService';
import onboardingFSMService from '../services/OnboardingFSMService';
import { sendSuccess, sendError, sendCreated } from '../utils/responses';
import logger from '../utils/logger';

export const createCandidate = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const candidate = await onboardingService.createCandidate(tenantId, req.body, userId);
    return sendCreated(res, candidate);
  } catch (error: any) {
    logger.error('Create candidate error:', error);
    return sendError(res, { code: 'CREATE_FAILED', message: error.message }, 400);
  }
};

export const getAllCandidates = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const filters = {
      state: req.query.state as string | undefined,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    };
    const candidates = await onboardingService.getAllCandidates(tenantId, filters);
    return sendSuccess(res, candidates);
  } catch (error: any) {
    logger.error('Get candidates error:', error);
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 400);
  }
};

export const getCandidateById = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;
    const candidate = await onboardingService.getCandidateById(candidateId);

    if (!candidate) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Candidate not found' }, 404);
    }

    return sendSuccess(res, candidate);
  } catch (error: any) {
    logger.error('Get candidate error:', error);
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 400);
  }
};

export const sendOffer = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;
    const userId = req.user!.userId;
    await onboardingService.sendOffer(candidateId, userId);
    return sendSuccess(res, { message: 'Offer sent successfully' });
  } catch (error: any) {
    logger.error('Send offer error:', error);
    return sendError(res, { code: 'SEND_OFFER_FAILED', message: error.message }, 400);
  }
};

export const acceptOffer = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;
    const userId = req.user?.userId; // Get userId if authenticated
    await onboardingService.acceptOffer(candidateId, req.body, userId);
    return sendSuccess(res, { message: 'Offer accepted successfully' });
  } catch (error: any) {
    logger.error('Accept offer error:', error);
    return sendError(res, { code: 'ACCEPT_OFFER_FAILED', message: error.message }, 400);
  }
};

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;
    const { fileName, filePath, documentType } = req.body;

    const document = await onboardingService.uploadDocument(
      candidateId,
      { fileName, filePath },
      documentType,
      req.body.metadata
    );

    return sendCreated(res, document);
  } catch (error: any) {
    logger.error('Upload document error:', error);
    return sendError(res, { code: 'UPLOAD_FAILED', message: error.message }, 400);
  }
};

export const verifyDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const userId = req.user!.userId;
    const { status, notes } = req.body;

    await onboardingService.verifyDocument(documentId, userId, status, notes);
    return sendSuccess(res, { message: 'Document verified successfully' });
  } catch (error: any) {
    logger.error('Verify document error:', error);
    return sendError(res, { code: 'VERIFY_FAILED', message: error.message }, 400);
  }
};

export const transitionState = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;
    const { toState, reason, metadata } = req.body;
    const userId = req.user!.userId;

    const result = await onboardingFSMService.transition(candidateId, toState, userId, reason, metadata);

    if (!result.success) {
      return sendError(res, { code: 'TRANSITION_FAILED', message: result.message! }, 400);
    }

    return sendSuccess(res, { message: 'State transition successful' });
  } catch (error: any) {
    logger.error('Transition state error:', error);
    return sendError(res, { code: 'TRANSITION_ERROR', message: error.message }, 500);
  }
};

export const getOnboardingPipeline = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const pipeline = await onboardingService.getOnboardingPipeline(tenantId);
    return sendSuccess(res, pipeline);
  } catch (error: any) {
    logger.error('Get pipeline error:', error);
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 400);
  }
};

export const getCandidateTasks = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;
    const tasks = await onboardingService.getCandidateTasks(candidateId);
    return sendSuccess(res, tasks);
  } catch (error: any) {
    logger.error('Get tasks error:', error);
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 400);
  }
};

export const completeTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user!.userId;
    const { notes } = req.body;

    await onboardingService.completeTask(taskId, userId, notes);
    return sendSuccess(res, { message: 'Task completed successfully' });
  } catch (error: any) {
    logger.error('Complete task error:', error);
    return sendError(res, { code: 'COMPLETE_FAILED', message: error.message }, 400);
  }
};
