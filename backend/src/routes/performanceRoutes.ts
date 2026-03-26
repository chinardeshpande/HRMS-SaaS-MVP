import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/types';
import performanceController from '../controllers/performanceController';

const router = Router();

// ==================== REVIEW CRUD OPERATIONS ====================

// Get all performance reviews (HR, Manager)
router.get(
  '/reviews',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER),
  performanceController.getAllReviews
);

// Get review by ID
router.get(
  '/reviews/:reviewId',
  authenticate,
  performanceController.getReviewById
);

// Create performance review (HR only)
router.post(
  '/reviews',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  performanceController.createReview
);

// Update performance review
router.put(
  '/reviews/:reviewId',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER),
  performanceController.updateReview
);

// Delete performance review (HR only)
router.delete(
  '/reviews/:reviewId',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  performanceController.deleteReview
);

// ==================== GOAL CRUD OPERATIONS ====================

// Get all goals for a review
router.get(
  '/reviews/:reviewId/goals',
  authenticate,
  performanceController.getGoalsByReviewId
);

// Create goal
router.post(
  '/reviews/:reviewId/goals',
  authenticate,
  performanceController.createGoal
);

// Update goal
router.patch(
  '/goals/:goalId',
  authenticate,
  performanceController.updateGoal
);

// Delete goal
router.delete(
  '/goals/:goalId',
  authenticate,
  performanceController.deleteGoal
);

// Submit goals for approval
router.post(
  '/reviews/:reviewId/goals/submit',
  authenticate,
  performanceController.submitGoals
);

// Approve goals (Manager/HR)
router.post(
  '/reviews/:reviewId/goals/approve',
  authenticate,
  authorize(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  performanceController.approveGoals
);

// ==================== KPI CRUD OPERATIONS ====================

// Create KPI
router.post(
  '/goals/:goalId/kpis',
  authenticate,
  performanceController.createKPI
);

// Update KPI
router.put(
  '/kpis/:kpiId',
  authenticate,
  performanceController.updateKPI
);

// Delete KPI
router.delete(
  '/kpis/:kpiId',
  authenticate,
  performanceController.deleteKPI
);

// ==================== MID-YEAR REVIEW ====================

// Submit mid-year review
router.post(
  '/reviews/:reviewId/mid-year',
  authenticate,
  performanceController.submitMidYearReview
);

// Complete mid-year review (Manager/HR)
router.post(
  '/reviews/:reviewId/mid-year/complete',
  authenticate,
  authorize(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  performanceController.completeMidYearReview
);

// ==================== FINAL RATING ====================

// Submit final rating (Manager/HR only)
router.post(
  '/reviews/:reviewId/final-rating',
  authenticate,
  authorize(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  performanceController.submitFinalRating
);

// ==================== DEVELOPMENT PLAN CRUD OPERATIONS ====================

// Get action items for a review
router.get(
  '/reviews/:reviewId/action-items',
  authenticate,
  performanceController.getActionItemsByReviewId
);

// Create development plan with action items
router.post(
  '/reviews/:reviewId/development-plan',
  authenticate,
  authorize(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  performanceController.createDevelopmentPlan
);

// Create action item
router.post(
  '/reviews/:reviewId/action-items',
  authenticate,
  performanceController.createActionItem
);

// Update action item
router.put(
  '/action-items/:actionItemId',
  authenticate,
  performanceController.updateActionItem
);

// Delete action item
router.delete(
  '/action-items/:actionItemId',
  authenticate,
  performanceController.deleteActionItem
);

// ==================== 360 FEEDBACK CRUD OPERATIONS ====================

// Get 360 feedback for a review
router.get(
  '/reviews/:reviewId/feedback-360',
  authenticate,
  performanceController.getFeedbackByReviewId
);

// Submit 360 feedback
router.post(
  '/reviews/:reviewId/feedback-360',
  authenticate,
  performanceController.submit360Feedback
);

// Update 360 feedback
router.put(
  '/feedback-360/:feedbackId',
  authenticate,
  performanceController.updateFeedback360
);

// Delete 360 feedback
router.delete(
  '/feedback-360/:feedbackId',
  authenticate,
  performanceController.deleteFeedback360
);

export default router;
