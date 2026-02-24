import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createCandidate,
  getAllCandidates,
  getCandidateById,
  sendOffer,
  acceptOffer,
  uploadDocument,
  verifyDocument,
  transitionState,
  getOnboardingPipeline,
  getCandidateTasks,
  completeTask,
} from '../controllers/onboardingController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Pipeline stats
router.get('/pipeline', getOnboardingPipeline);

// Candidate routes
router.post('/candidates', createCandidate);
router.get('/candidates', getAllCandidates);
router.get('/candidates/:candidateId', getCandidateById);
router.post('/candidates/:candidateId/send-offer', sendOffer);
router.post('/candidates/:candidateId/accept-offer', acceptOffer);
router.post('/candidates/:candidateId/transition', transitionState);

// Document routes
router.post('/candidates/:candidateId/documents/upload', uploadDocument);
router.put('/documents/:documentId/verify', verifyDocument);

// Task routes
router.get('/candidates/:candidateId/tasks', getCandidateTasks);
router.post('/tasks/:taskId/complete', completeTask);

export default router;
