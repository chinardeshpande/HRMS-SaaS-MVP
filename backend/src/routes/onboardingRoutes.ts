import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';
import {
  createCandidate,
  getAllCandidates,
  getCandidateById,
  sendOffer,
  acceptOffer,
  uploadDocument,
  verifyDocument,
  downloadDocument,
  transitionState,
  getOnboardingPipeline,
  getCandidateTasks,
  completeTask,
  bulkUploadCandidates,
} from '../controllers/onboardingController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Pipeline stats
router.get('/pipeline', getOnboardingPipeline);

// Candidate routes
router.post('/candidates/bulk-upload', uploadSingle as any, bulkUploadCandidates);
router.post('/candidates', createCandidate);
router.get('/candidates', getAllCandidates);
router.get('/candidates/:candidateId', getCandidateById);
router.post('/candidates/:candidateId/send-offer', sendOffer);
router.post('/candidates/:candidateId/accept-offer', acceptOffer);
router.post('/candidates/:candidateId/transition', transitionState);

// Document routes - uploadSingle middleware handles file upload
router.post('/candidates/:candidateId/documents/upload', uploadSingle as any, uploadDocument);
router.put('/documents/:documentId/verify', verifyDocument);
router.get('/documents/:documentId/download', downloadDocument);

// Task routes
router.get('/candidates/:candidateId/tasks', getCandidateTasks);
router.post('/tasks/:taskId/complete', completeTask);

export default router;
