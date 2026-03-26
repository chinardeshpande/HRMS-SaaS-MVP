import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import onboardingService from '../services/onboardingService';
import onboardingFSMService from '../services/OnboardingFSMService';
import { sendSuccess, sendError, sendCreated } from '../utils/responses';
import logger from '../utils/logger';
import { AppDataSource } from '../config/database';
import { OnboardingDocument } from '../models/OnboardingDocument';

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
    const { documentType } = req.body;

    // Check if file was uploaded
    if (!req.file) {
      return sendError(res, { code: 'NO_FILE', message: 'No file uploaded' }, 400);
    }

    // File info from multer
    const fileName = req.file.originalname;
    const filePath = req.file.path; // Full path to uploaded file
    const fileSize = req.file.size;
    const mimeType = req.file.mimetype;

    const document = await onboardingService.uploadDocument(
      candidateId,
      { fileName, filePath },
      documentType,
      {
        fileSize,
        mimeType,
        ...req.body.metadata,
      }
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

export const downloadDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const documentRepo = AppDataSource.getRepository(OnboardingDocument);

    const document = await documentRepo.findOne({ where: { documentId } });

    if (!document) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Document not found' }, 404);
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return sendError(res, { code: 'FILE_NOT_FOUND', message: 'File not found on server' }, 404);
    }

    // Set appropriate headers
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);

    // Stream the file
    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);
  } catch (error: any) {
    logger.error('Download document error:', error);
    return sendError(res, { code: 'DOWNLOAD_FAILED', message: error.message }, 500);
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

export const signDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const userId = req.user!.userId;

    await onboardingService.signDocument(documentId, userId);
    return sendSuccess(res, { message: 'Document signed successfully' });
  } catch (error: any) {
    logger.error('Sign document error:', error);
    return sendError(res, { code: 'SIGN_FAILED', message: error.message }, 400);
  }
};

export const getCandidateDocuments = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;
    const documents = await onboardingService.getCandidateDocuments(candidateId);
    return sendSuccess(res, documents);
  } catch (error: any) {
    logger.error('Get candidate documents error:', error);
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 400);
  }
};

export const signAllRequiredDocuments = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;
    const userId = req.user!.userId;

    await onboardingService.signAllRequiredDocuments(candidateId, userId);
    return sendSuccess(res, { message: 'All required documents signed successfully' });
  } catch (error: any) {
    logger.error('Sign all documents error:', error);
    return sendError(res, { code: 'SIGN_ALL_FAILED', message: error.message }, 400);
  }
};

export const getStateTransitionHistory = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;
    const history = await onboardingService.getStateTransitionHistory(candidateId);
    return sendSuccess(res, history);
  } catch (error: any) {
    logger.error('Get state history error:', error);
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 400);
  }
};

export const updateCandidate = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;
    const userId = req.user!.userId;
    const updated = await onboardingService.updateCandidate(candidateId, req.body, userId);
    return sendSuccess(res, updated);
  } catch (error: any) {
    logger.error('Update candidate error:', error);
    return sendError(res, { code: 'UPDATE_FAILED', message: error.message }, 400);
  }
};

export const generateAndSignDocuments = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;
    const userId = req.user!.userId;
    await onboardingService.generateAndSignRequiredDocuments(candidateId, userId);
    return sendSuccess(res, { message: 'All required documents generated and signed successfully' });
  } catch (error: any) {
    logger.error('Generate documents error:', error);
    return sendError(res, { code: 'GENERATE_FAILED', message: error.message }, 400);
  }
};

export const bulkUploadCandidates = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;

    if (!req.file) {
      return sendError(res, { code: 'NO_FILE', message: 'No CSV file uploaded' }, 400);
    }

    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Remove BOM if present
    const cleanContent = fileContent.replace(/^\uFEFF/, '');

    // Parse CSV manually
    const lines = cleanContent.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));

    if (lines.length < 2) {
      fs.unlinkSync(filePath); // Clean up uploaded file
      return sendError(res, { code: 'INVALID_CSV', message: 'CSV file must contain headers and at least one data row' }, 400);
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const results = {
      totalRows: lines.length - 1,
      successCount: 0,
      failureCount: 0,
      errors: [] as Array<{ row: number; error: string; data: any }>,
      successfulCandidates: [] as Array<{ candidateId: string; name: string; email: string }>,
    };

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const rowData: any = {};

        headers.forEach((header, index) => {
          const value = values[index];
          if (value && value !== '') {
            rowData[header] = value;
          }
        });

        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'departmentId', 'designationId', 'offeredSalary', 'expectedJoinDate'];
        const missingFields = requiredFields.filter(field => !rowData[field]);

        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Convert numeric fields
        if (rowData.offeredSalary) {
          rowData.offeredSalary = parseFloat(rowData.offeredSalary);
        }

        // Create candidate
        const candidate = await onboardingService.createCandidate(tenantId, rowData, userId);

        results.successCount++;
        results.successfulCandidates.push({
          candidateId: candidate.candidateId,
          name: `${candidate.firstName} ${candidate.lastName}`,
          email: candidate.email,
        });

      } catch (error: any) {
        results.failureCount++;
        results.errors.push({
          row: i + 1,
          error: error.message || 'Unknown error',
          data: lines[i],
        });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    return sendSuccess(res, results);
  } catch (error: any) {
    logger.error('Bulk upload error:', error);

    // Clean up uploaded file if it exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return sendError(res, { code: 'BULK_UPLOAD_FAILED', message: error.message }, 500);
  }
};

// ==================== TASK CRUD OPERATIONS ====================

export const createTask = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;

    const task = await onboardingService.createTask(tenantId, candidateId, req.body, userId);
    return sendCreated(res, task);
  } catch (error: any) {
    logger.error('Create task error:', error);
    return sendError(res, { code: 'CREATE_TASK_FAILED', message: error.message }, 400);
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user!.userId;

    const task = await onboardingService.updateTask(taskId, req.body, userId);
    return sendSuccess(res, task);
  } catch (error: any) {
    logger.error('Update task error:', error);
    return sendError(res, { code: 'UPDATE_TASK_FAILED', message: error.message }, 400);
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user!.userId;

    await onboardingService.deleteTask(taskId, userId);
    return sendSuccess(res, { message: 'Task deleted successfully' });
  } catch (error: any) {
    logger.error('Delete task error:', error);
    return sendError(res, { code: 'DELETE_TASK_FAILED', message: error.message }, 400);
  }
};

// ==================== DOCUMENT CRUD OPERATIONS ====================

export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const userId = req.user!.userId;

    const document = await onboardingService.updateDocument(documentId, req.body, userId);
    return sendSuccess(res, document);
  } catch (error: any) {
    logger.error('Update document error:', error);
    return sendError(res, { code: 'UPDATE_DOCUMENT_FAILED', message: error.message }, 400);
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const userId = req.user!.userId;

    await onboardingService.deleteDocument(documentId, userId);
    return sendSuccess(res, { message: 'Document deleted successfully' });
  } catch (error: any) {
    logger.error('Delete document error:', error);
    return sendError(res, { code: 'DELETE_DOCUMENT_FAILED', message: error.message }, 400);
  }
};

// ==================== BGV CRUD OPERATIONS ====================

export const updateBGVStatus = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;
    const userId = req.user!.userId;
    const { bgvStatus, bgvVendor, bgvReferenceId, bgvInitiatedDate, bgvCompletedDate, bgvRemarks } = req.body;

    const updated = await onboardingService.updateBGVStatus(candidateId, {
      bgvStatus,
      bgvVendor,
      bgvReferenceId,
      bgvInitiatedDate,
      bgvCompletedDate,
      bgvRemarks,
    }, userId);

    return sendSuccess(res, updated);
  } catch (error: any) {
    logger.error('Update BGV status error:', error);
    return sendError(res, { code: 'UPDATE_BGV_FAILED', message: error.message }, 400);
  }
};

export const getBGVDetails = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;
    const bgvDetails = await onboardingService.getBGVDetails(candidateId);
    return sendSuccess(res, bgvDetails);
  } catch (error: any) {
    logger.error('Get BGV details error:', error);
    return sendError(res, { code: 'FETCH_BGV_FAILED', message: error.message }, 400);
  }
};

// ==================== ONBOARDING CASE CRUD OPERATIONS ====================

export const updateOnboardingCase = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;
    const userId = req.user!.userId;

    const onboardingCase = await onboardingService.updateOnboardingCase(candidateId, req.body, userId);
    return sendSuccess(res, onboardingCase);
  } catch (error: any) {
    logger.error('Update onboarding case error:', error);
    return sendError(res, { code: 'UPDATE_CASE_FAILED', message: error.message }, 400);
  }
};

export const getOnboardingCase = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;
    const onboardingCase = await onboardingService.getOnboardingCase(candidateId);

    if (!onboardingCase) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Onboarding case not found' }, 404);
    }

    return sendSuccess(res, onboardingCase);
  } catch (error: any) {
    logger.error('Get onboarding case error:', error);
    return sendError(res, { code: 'FETCH_CASE_FAILED', message: error.message }, 400);
  }
};
