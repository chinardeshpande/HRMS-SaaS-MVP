import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAllProbationCases,
  getProbationCase,
  getDueReviews,
  submitReview,
  hrApproveReview,
  flagAtRisk,
  extendProbation,
  confirmEmployee,
  terminateProbation,
  getAtRiskEmployees,
  getProbationStatistics,
} from '../controllers/probationController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Statistics and lists
router.get('/statistics', getProbationStatistics);
router.get('/at-risk', getAtRiskEmployees);
router.get('/cases', getAllProbationCases);

// Manager reviews
router.get('/my-team/due-reviews', getDueReviews);

// Probation case operations
router.get('/cases/:probationId', getProbationCase);
router.post('/cases/:probationId/flag-at-risk', flagAtRisk);
router.post('/cases/:probationId/extend', extendProbation);
router.post('/cases/:probationId/confirm', confirmEmployee);
router.post('/cases/:probationId/terminate', terminateProbation);
router.post('/cases/:probationId/reviews', submitReview);

// Review operations
router.post('/reviews/:reviewId/hr-approve', hrApproveReview);

export default router;
