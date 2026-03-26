import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';
import {
  createCandidate,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  sendOffer,
  acceptOffer,
  uploadDocument,
  verifyDocument,
  downloadDocument,
  signDocument,
  getCandidateDocuments,
  signAllRequiredDocuments,
  generateAndSignDocuments,
  transitionState,
  getStateTransitionHistory,
  getOnboardingPipeline,
  getCandidateTasks,
  completeTask,
  bulkUploadCandidates,
  createTask,
  updateTask,
  deleteTask,
  updateDocument,
  deleteDocument,
  updateBGVStatus,
  getBGVDetails,
  updateOnboardingCase,
  getOnboardingCase,
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
router.put('/candidates/:candidateId', updateCandidate);
router.post('/candidates/:candidateId/send-offer', sendOffer);
router.post('/candidates/:candidateId/accept-offer', acceptOffer);
router.post('/candidates/:candidateId/transition', transitionState);
router.get('/candidates/:candidateId/history', getStateTransitionHistory);

// Document routes - uploadSingle middleware handles file upload
router.get('/candidates/:candidateId/documents', getCandidateDocuments);
router.post('/candidates/:candidateId/documents/upload', uploadSingle as any, uploadDocument);
router.post('/candidates/:candidateId/documents/sign-all', signAllRequiredDocuments);
router.post('/candidates/:candidateId/documents/generate', generateAndSignDocuments);
router.put('/documents/:documentId/verify', verifyDocument);
router.post('/documents/:documentId/sign', signDocument);
router.get('/documents/:documentId/download', downloadDocument);

// Task routes (CRUD)
router.get('/candidates/:candidateId/tasks', getCandidateTasks);
router.post('/candidates/:candidateId/tasks', createTask);
router.put('/tasks/:taskId', updateTask);
router.delete('/tasks/:taskId', deleteTask);
router.post('/tasks/:taskId/complete', completeTask);

// Document CRUD routes
router.put('/documents/:documentId', updateDocument);
router.delete('/documents/:documentId', deleteDocument);

// BGV routes
router.get('/candidates/:candidateId/bgv', getBGVDetails);
router.put('/candidates/:candidateId/bgv', updateBGVStatus);

// Onboarding Case routes
router.get('/candidates/:candidateId/case', getOnboardingCase);
router.put('/candidates/:candidateId/case', updateOnboardingCase);

export default router;
