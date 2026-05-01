import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/types';
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
router.get('/statistics', authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN), getProbationStatistics);
router.get('/at-risk', authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER), getAtRiskEmployees);
router.get('/cases', authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER), getAllProbationCases);

// Manager reviews
router.get('/my-team/due-reviews', authorize(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN), getDueReviews);

// Probation case operations
router.get('/cases/:probationId', authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER), getProbationCase);
router.post('/cases/:probationId/flag-at-risk', authorize(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN), flagAtRisk);
router.post('/cases/:probationId/extend', authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER), extendProbation);
router.post('/cases/:probationId/confirm', authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN), confirmEmployee);
router.post('/cases/:probationId/terminate', authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN), terminateProbation);
router.post('/cases/:probationId/reviews', authorize(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN), submitReview);

// Review operations
router.post('/reviews/:reviewId/hr-approve', authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN), hrApproveReview);

export default router;
