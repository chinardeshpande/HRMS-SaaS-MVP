import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant';
import { UserRole } from '../../../shared/types';
import performanceController from '../controllers/performanceController';

const router = Router();

// ==================== REVIEW CRUD OPERATIONS ====================

// Get all performance reviews (HR, Manager)
router.get(
  '/reviews',
  authenticate, tenantIsolation,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER),
  performanceController.getAllReviews
);

// Get reviews for the logged-in employee
router.get(
  '/my-reviews',
  authenticate, tenantIsolation,
  performanceController.getMyReviews
);

// Get review by ID
router.get(
  '/reviews/:reviewId',
  authenticate, tenantIsolation,
  performanceController.getReviewById
);

// Create performance review (HR only)
router.post(
  '/reviews',
  authenticate, tenantIsolation,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  performanceController.createReview
);

// Update performance review
router.put(
  '/reviews/:reviewId',
  authenticate, tenantIsolation,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER),
  performanceController.updateReview
);

// Delete performance review (HR only)
router.delete(
  '/reviews/:reviewId',
  authenticate, tenantIsolation,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  performanceController.deleteReview
);

// ==================== GOAL CRUD OPERATIONS ====================

// Get all goals for a review
router.get(
  '/reviews/:reviewId/goals',
  authenticate, tenantIsolation,
  performanceController.getGoalsByReviewId
);

// Create goal
router.post(
  '/reviews/:reviewId/goals',
  authenticate, tenantIsolation,
  performanceController.createGoal
);

// Update goal
router.patch(
  '/goals/:goalId',
  authenticate, tenantIsolation,
  performanceController.updateGoal
);

// Delete goal
router.delete(
  '/goals/:goalId',
  authenticate, tenantIsolation,
  performanceController.deleteGoal
);

// Submit goals for approval
router.post(
  '/reviews/:reviewId/goals/submit',
  authenticate, tenantIsolation,
  performanceController.submitGoals
);

// Approve goals (Manager/HR)
router.post(
  '/reviews/:reviewId/goals/approve',
  authenticate, tenantIsolation,
  authorize(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  performanceController.approveGoals
);

// ==================== KPI CRUD OPERATIONS ====================

// Create KPI
router.post(
  '/goals/:goalId/kpis',
  authenticate, tenantIsolation,
  performanceController.createKPI
);

// Update KPI
router.put(
  '/kpis/:kpiId',
  authenticate, tenantIsolation,
  performanceController.updateKPI
);

// Delete KPI
router.delete(
  '/kpis/:kpiId',
  authenticate, tenantIsolation,
  performanceController.deleteKPI
);

// ==================== MID-YEAR REVIEW ====================

// Submit mid-year review
router.post(
  '/reviews/:reviewId/mid-year',
  authenticate, tenantIsolation,
  performanceController.submitMidYearReview
);

// Complete mid-year review (Manager/HR)
router.post(
  '/reviews/:reviewId/mid-year/complete',
  authenticate, tenantIsolation,
  authorize(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  performanceController.completeMidYearReview
);

// ==================== FINAL RATING ====================

// Submit final rating (Manager/HR only)
router.post(
  '/reviews/:reviewId/final-rating',
  authenticate, tenantIsolation,
  authorize(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  performanceController.submitFinalRating
);

// ==================== DEVELOPMENT PLAN CRUD OPERATIONS ====================

// Get action items for a review
router.get(
  '/reviews/:reviewId/action-items',
  authenticate, tenantIsolation,
  performanceController.getActionItemsByReviewId
);

// Create development plan with action items
router.post(
  '/reviews/:reviewId/development-plan',
  authenticate, tenantIsolation,
  authorize(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  performanceController.createDevelopmentPlan
);

// Create action item
router.post(
  '/reviews/:reviewId/action-items',
  authenticate, tenantIsolation,
  performanceController.createActionItem
);

// Update action item
router.put(
  '/action-items/:actionItemId',
  authenticate, tenantIsolation,
  performanceController.updateActionItem
);

// Delete action item
router.delete(
  '/action-items/:actionItemId',
  authenticate, tenantIsolation,
  performanceController.deleteActionItem
);

// ==================== 360 FEEDBACK CRUD OPERATIONS ====================

// Get 360 feedback for a review
router.get(
  '/reviews/:reviewId/feedback-360',
  authenticate, tenantIsolation,
  performanceController.getFeedbackByReviewId
);

// Submit 360 feedback
router.post(
  '/reviews/:reviewId/feedback-360',
  authenticate, tenantIsolation,
  performanceController.submit360Feedback
);

// Update 360 feedback
router.put(
  '/feedback-360/:feedbackId',
  authenticate, tenantIsolation,
  performanceController.updateFeedback360
);

// Delete 360 feedback
router.delete(
  '/feedback-360/:feedbackId',
  authenticate, tenantIsolation,
  performanceController.deleteFeedback360
);

export default router;
