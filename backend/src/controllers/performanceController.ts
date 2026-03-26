import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { PerformanceReview, PerformanceState } from '../models/PerformanceReview';
import { Goal, GoalStatus } from '../models/Goal';
import { KPI } from '../models/KPI';
import { Feedback360 } from '../models/Feedback360';
import { DevelopmentActionItem } from '../models/DevelopmentActionItem';
import { sendSuccess, sendError, sendCreated } from '../utils/responses';
import { In } from 'typeorm';

export const getAllReviews = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { cycle, status } = req.query;

    const reviewRepo = AppDataSource.getRepository(PerformanceReview);
    const where: any = { tenantId };

    if (cycle) where.reviewCycle = cycle;
    if (status) where.currentState = status;

    const reviews = await reviewRepo.find({
      where,
      relations: ['employee', 'employee.department', 'employee.designation', 'reviewer'],
      order: { createdAt: 'DESC' },
    });

    // Calculate statistics
    const stats = {
      total: reviews.length,
      goalSetting: reviews.filter(r =>
        [PerformanceState.GOAL_SETTING, PerformanceState.GOALS_SUBMITTED, PerformanceState.GOALS_APPROVED].includes(r.currentState)
      ).length,
      midYear: reviews.filter(r =>
        [PerformanceState.MID_YEAR_PENDING, PerformanceState.MID_YEAR_SUBMITTED, PerformanceState.MID_YEAR_COMPLETED].includes(r.currentState)
      ).length,
      annualReview: reviews.filter(r =>
        [PerformanceState.ANNUAL_REVIEW_PENDING, PerformanceState.ANNUAL_REVIEW_SUBMITTED, PerformanceState.ANNUAL_REVIEW_COMPLETED].includes(r.currentState)
      ).length,
      rating: reviews.filter(r =>
        [PerformanceState.RATING_PENDING, PerformanceState.RATING_SUBMITTED, PerformanceState.RATING_APPROVED].includes(r.currentState)
      ).length,
    };

    return sendSuccess(res, { reviews, stats });
  } catch (error: any) {
    console.error('Get all reviews error:', error);
    return sendError(res, { code: 'FETCH_ERROR', message: error.message }, 500);
  }
};

export const getReviewById = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const tenantId = req.user!.tenantId;

    const reviewRepo = AppDataSource.getRepository(PerformanceReview);
    const goalRepo = AppDataSource.getRepository(Goal);
    const kpiRepo = AppDataSource.getRepository(KPI);
    const feedbackRepo = AppDataSource.getRepository(Feedback360);
    const actionItemRepo = AppDataSource.getRepository(DevelopmentActionItem);

    const review = await reviewRepo.findOne({
      where: { reviewId, tenantId },
      relations: ['employee', 'employee.department', 'employee.designation', 'employee.manager', 'reviewer'],
    });

    if (!review) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Review not found' }, 404);
    }

    // Fetch goals with KPIs
    const goals = await goalRepo.find({
      where: { reviewId, tenantId },
      order: { createdAt: 'ASC' },
    });

    for (const goal of goals) {
      const kpis = await kpiRepo.find({
        where: { goalId: goal.goalId, tenantId },
      });
      (goal as any).kpis = kpis;
    }

    // Fetch 360 feedback
    const feedback360 = await feedbackRepo.find({
      where: { reviewId, tenantId },
      relations: ['feedbackFrom'],
    });

    // Fetch development action items
    const actionItems = await actionItemRepo.find({
      where: { reviewId, tenantId },
      order: { createdAt: 'ASC' },
    });

    return sendSuccess(res, {
      ...review,
      goals,
      feedback360,
      developmentPlan: {
        skillGaps: review.skillGaps || [],
        trainingRecommendations: review.trainingRecommendations || [],
        careerAspirations: review.careerAspirations,
        actionItems,
      },
      midYearReview: review.midYearCompletedDate ? {
        reviewType: 'mid_year',
        selfRating: review.selfRatingMidYear,
        managerRating: review.managerRatingMidYear,
        selfComments: review.selfCommentsMidYear,
        managerComments: review.managerCommentsMidYear,
        achievements: review.achievements || [],
        challenges: review.challenges || [],
        submittedDate: review.midYearSubmittedDate,
        completedDate: review.midYearCompletedDate,
      } : null,
      annualReview: review.annualCompletedDate ? {
        reviewType: 'annual',
        selfRating: review.selfRatingAnnual,
        managerRating: review.managerRatingAnnual,
        selfComments: review.selfCommentsAnnual,
        managerComments: review.managerCommentsAnnual,
        achievements: review.achievements || [],
        challenges: review.challenges || [],
        submittedDate: review.annualSubmittedDate,
        completedDate: review.annualCompletedDate,
      } : null,
      finalRating: review.finalRating ? {
        managerRating: review.managerRatingAnnual,
        normalizationRating: review.normalizationRating,
        finalRating: review.finalRating,
        ratingCategory: review.ratingCategory,
        promotionRecommended: review.promotionRecommended,
        incrementPercentage: review.incrementPercentage,
        comments: review.finalComments,
      } : null,
    });
  } catch (error: any) {
    console.error('Get review by ID error:', error);
    return sendError(res, { code: 'FETCH_ERROR', message: error.message }, 500);
  }
};

export const createReview = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const { employeeId, reviewerId, reviewCycle, reviewStartDate, reviewEndDate } = req.body;

    if (!employeeId || !reviewerId || !reviewCycle || !reviewStartDate || !reviewEndDate) {
      return sendError(res, { code: 'VALIDATION_ERROR', message: 'Missing required fields' }, 400);
    }

    const reviewRepo = AppDataSource.getRepository(PerformanceReview);

    // Check if review already exists for this employee and cycle
    const existingReview = await reviewRepo.findOne({
      where: { tenantId, employeeId, reviewCycle },
    });

    if (existingReview) {
      return sendError(res, { code: 'DUPLICATE_ERROR', message: 'Review already exists for this cycle' }, 400);
    }

    const review = reviewRepo.create({
      tenantId,
      employeeId,
      reviewerId,
      reviewCycle,
      reviewStartDate: new Date(reviewStartDate),
      reviewEndDate: new Date(reviewEndDate),
      currentState: PerformanceState.GOAL_SETTING,
    });

    await reviewRepo.save(review);

    const savedReview = await reviewRepo.findOne({
      where: { reviewId: review.reviewId },
      relations: ['employee', 'reviewer'],
    });

    return sendCreated(res, savedReview);
  } catch (error: any) {
    console.error('Create review error:', error);
    return sendError(res, { code: 'CREATE_ERROR', message: error.message }, 500);
  }
};

export const createGoal = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const tenantId = req.user!.tenantId;
    const { title, description, category, targetDate, weightage, kpis } = req.body;

    if (!title || !description || !targetDate) {
      return sendError(res, { code: 'VALIDATION_ERROR', message: 'Missing required fields' }, 400);
    }

    const reviewRepo = AppDataSource.getRepository(PerformanceReview);
    const goalRepo = AppDataSource.getRepository(Goal);
    const kpiRepo = AppDataSource.getRepository(KPI);

    const review = await reviewRepo.findOne({ where: { reviewId, tenantId } });
    if (!review) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Review not found' }, 404);
    }

    const goal = goalRepo.create({
      tenantId,
      reviewId,
      title,
      description,
      category,
      targetDate: new Date(targetDate),
      weightage: weightage || 0,
      status: GoalStatus.DRAFT,
      progress: 0,
    });

    await goalRepo.save(goal);

    // Create KPIs if provided
    if (kpis && Array.isArray(kpis)) {
      for (const kpiData of kpis) {
        const kpi = kpiRepo.create({
          tenantId,
          goalId: goal.goalId,
          metric: kpiData.metric,
          target: kpiData.target,
          unit: kpiData.unit,
          status: kpiData.status || 'on_track',
        });
        await kpiRepo.save(kpi);
      }
    }

    const savedGoal = await goalRepo.findOne({
      where: { goalId: goal.goalId },
    });

    if (savedGoal) {
      const kpiList = await kpiRepo.find({ where: { goalId: goal.goalId } });
      (savedGoal as any).kpis = kpiList;
    }

    return sendCreated(res, savedGoal);
  } catch (error: any) {
    console.error('Create goal error:', error);
    return sendError(res, { code: 'CREATE_ERROR', message: error.message }, 500);
  }
};

export const updateGoal = async (req: Request, res: Response) => {
  try {
    const { goalId } = req.params;
    const tenantId = req.user!.tenantId;
    const updates = req.body;

    const goalRepo = AppDataSource.getRepository(Goal);

    const goal = await goalRepo.findOne({ where: { goalId, tenantId } });
    if (!goal) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Goal not found' }, 404);
    }

    // Update allowed fields
    const allowedFields = ['title', 'description', 'category', 'targetDate', 'weightage', 'progress', 'notes', 'managerFeedback', 'status'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        (goal as any)[field] = updates[field];
      }
    });

    await goalRepo.save(goal);

    return sendSuccess(res, goal);
  } catch (error: any) {
    console.error('Update goal error:', error);
    return sendError(res, { code: 'UPDATE_ERROR', message: error.message }, 500);
  }
};

export const submitGoals = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const tenantId = req.user!.tenantId;

    const reviewRepo = AppDataSource.getRepository(PerformanceReview);
    const goalRepo = AppDataSource.getRepository(Goal);

    const review = await reviewRepo.findOne({ where: { reviewId, tenantId } });
    if (!review) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Review not found' }, 404);
    }

    // Validate goals exist
    const goals = await goalRepo.find({ where: { reviewId, tenantId } });
    if (goals.length === 0) {
      return sendError(res, { code: 'VALIDATION_ERROR', message: 'No goals to submit' }, 400);
    }

    // Update all goals to submitted status
    await goalRepo.update({ reviewId, tenantId }, { status: GoalStatus.SUBMITTED });

    // Update review state
    review.currentState = PerformanceState.GOALS_SUBMITTED;
    await reviewRepo.save(review);

    return sendSuccess(res, { message: 'Goals submitted successfully', review });
  } catch (error: any) {
    console.error('Submit goals error:', error);
    return sendError(res, { code: 'SUBMIT_ERROR', message: error.message }, 500);
  }
};

export const approveGoals = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const tenantId = req.user!.tenantId;
    const { comments } = req.body;

    const reviewRepo = AppDataSource.getRepository(PerformanceReview);
    const goalRepo = AppDataSource.getRepository(Goal);

    const review = await reviewRepo.findOne({ where: { reviewId, tenantId } });
    if (!review) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Review not found' }, 404);
    }

    // Update all goals to approved status
    await goalRepo.update({ reviewId, tenantId }, { status: GoalStatus.APPROVED });

    // Update review state
    review.currentState = PerformanceState.GOALS_APPROVED;
    await reviewRepo.save(review);

    return sendSuccess(res, { message: 'Goals approved successfully', review });
  } catch (error: any) {
    console.error('Approve goals error:', error);
    return sendError(res, { code: 'APPROVE_ERROR', message: error.message }, 500);
  }
};

export const submitMidYearReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const tenantId = req.user!.tenantId;
    const { selfRating, selfComments, achievements, challenges } = req.body;

    if (!selfRating || !selfComments) {
      return sendError(res, { code: 'VALIDATION_ERROR', message: 'Self rating and comments are required' }, 400);
    }

    const reviewRepo = AppDataSource.getRepository(PerformanceReview);

    const review = await reviewRepo.findOne({ where: { reviewId, tenantId } });
    if (!review) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Review not found' }, 404);
    }

    review.selfRatingMidYear = selfRating;
    review.selfCommentsMidYear = selfComments;
    review.achievements = achievements || [];
    review.challenges = challenges || [];
    review.midYearSubmittedDate = new Date();
    review.currentState = PerformanceState.MID_YEAR_SUBMITTED;

    await reviewRepo.save(review);

    return sendSuccess(res, { message: 'Mid-year review submitted successfully', review });
  } catch (error: any) {
    console.error('Submit mid-year review error:', error);
    return sendError(res, { code: 'SUBMIT_ERROR', message: error.message }, 500);
  }
};

export const completeMidYearReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const tenantId = req.user!.tenantId;
    const { managerRating, managerComments } = req.body;

    if (!managerRating || !managerComments) {
      return sendError(res, { code: 'VALIDATION_ERROR', message: 'Manager rating and comments are required' }, 400);
    }

    const reviewRepo = AppDataSource.getRepository(PerformanceReview);

    const review = await reviewRepo.findOne({ where: { reviewId, tenantId } });
    if (!review) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Review not found' }, 404);
    }

    review.managerRatingMidYear = managerRating;
    review.managerCommentsMidYear = managerComments;
    review.midYearCompletedDate = new Date();
    review.currentState = PerformanceState.MID_YEAR_COMPLETED;

    await reviewRepo.save(review);

    return sendSuccess(res, { message: 'Mid-year review completed successfully', review });
  } catch (error: any) {
    console.error('Complete mid-year review error:', error);
    return sendError(res, { code: 'COMPLETE_ERROR', message: error.message }, 500);
  }
};

export const submitFinalRating = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const tenantId = req.user!.tenantId;
    const { finalRating, normalizationRating, ratingCategory, promotionRecommended, incrementPercentage, comments } = req.body;

    if (!finalRating || !ratingCategory) {
      return sendError(res, { code: 'VALIDATION_ERROR', message: 'Final rating and category are required' }, 400);
    }

    const reviewRepo = AppDataSource.getRepository(PerformanceReview);

    const review = await reviewRepo.findOne({ where: { reviewId, tenantId } });
    if (!review) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Review not found' }, 404);
    }

    review.finalRating = finalRating;
    review.normalizationRating = normalizationRating;
    review.ratingCategory = ratingCategory;
    review.promotionRecommended = promotionRecommended || false;
    review.incrementPercentage = incrementPercentage;
    review.finalComments = comments;
    review.currentState = PerformanceState.RATING_APPROVED;

    await reviewRepo.save(review);

    return sendSuccess(res, { message: 'Final rating submitted successfully', review });
  } catch (error: any) {
    console.error('Submit final rating error:', error);
    return sendError(res, { code: 'SUBMIT_ERROR', message: error.message }, 500);
  }
};

export const createDevelopmentPlan = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const tenantId = req.user!.tenantId;
    const { skillGaps, trainingRecommendations, careerAspirations, actionItems } = req.body;

    const reviewRepo = AppDataSource.getRepository(PerformanceReview);
    const actionItemRepo = AppDataSource.getRepository(DevelopmentActionItem);

    const review = await reviewRepo.findOne({ where: { reviewId, tenantId } });
    if (!review) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Review not found' }, 404);
    }

    review.skillGaps = skillGaps || [];
    review.trainingRecommendations = trainingRecommendations || [];
    review.careerAspirations = careerAspirations;
    review.currentState = PerformanceState.DEVELOPMENT_PLAN;

    await reviewRepo.save(review);

    // Create action items
    if (actionItems && Array.isArray(actionItems)) {
      for (const itemData of actionItems) {
        const item = actionItemRepo.create({
          tenantId,
          reviewId,
          action: itemData.action,
          timeline: itemData.timeline,
          status: itemData.status || 'pending',
        });
        await actionItemRepo.save(item);
      }
    }

    return sendSuccess(res, { message: 'Development plan created successfully', review });
  } catch (error: any) {
    console.error('Create development plan error:', error);
    return sendError(res, { code: 'CREATE_ERROR', message: error.message }, 500);
  }
};

export const submit360Feedback = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const employeeId = req.user!.employeeId;
    const { relationship, rating, comments, strengths, areasOfImprovement, isAnonymous } = req.body;

    if (!relationship || !rating || !comments) {
      return sendError(res, { code: 'VALIDATION_ERROR', message: 'Relationship, rating, and comments are required' }, 400);
    }

    const feedbackRepo = AppDataSource.getRepository(Feedback360);

    const feedback = feedbackRepo.create({
      tenantId,
      reviewId,
      feedbackFromId: employeeId,
      relationship,
      rating,
      comments,
      strengths: strengths || [],
      areasOfImprovement: areasOfImprovement || [],
      isAnonymous: isAnonymous || false,
    });

    await feedbackRepo.save(feedback);

    return sendCreated(res, feedback);
  } catch (error: any) {
    console.error('Submit 360 feedback error:', error);
    return sendError(res, { code: 'SUBMIT_ERROR', message: error.message }, 500);
  }
};

// ==================== REVIEW CRUD OPERATIONS ====================

export const updateReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const tenantId = req.user!.tenantId;

    const reviewRepo = AppDataSource.getRepository(PerformanceReview);
    const review = await reviewRepo.findOne({ where: { reviewId, tenantId } });

    if (!review) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Review not found' }, 404);
    }

    Object.assign(review, req.body);
    await reviewRepo.save(review);

    return sendSuccess(res, review);
  } catch (error: any) {
    console.error('Update review error:', error);
    return sendError(res, { code: 'UPDATE_ERROR', message: error.message }, 500);
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const tenantId = req.user!.tenantId;

    const reviewRepo = AppDataSource.getRepository(PerformanceReview);
    const review = await reviewRepo.findOne({ where: { reviewId, tenantId } });

    if (!review) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Review not found' }, 404);
    }

    await reviewRepo.remove(review);
    return sendSuccess(res, { message: 'Review deleted successfully' });
  } catch (error: any) {
    console.error('Delete review error:', error);
    return sendError(res, { code: 'DELETE_ERROR', message: error.message }, 500);
  }
};

// ==================== GOAL CRUD OPERATIONS ====================

export const deleteGoal = async (req: Request, res: Response) => {
  try {
    const { goalId } = req.params;
    const tenantId = req.user!.tenantId;

    const goalRepo = AppDataSource.getRepository(Goal);
    const goal = await goalRepo.findOne({ where: { goalId, tenantId } });

    if (!goal) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Goal not found' }, 404);
    }

    await goalRepo.remove(goal);
    return sendSuccess(res, { message: 'Goal deleted successfully' });
  } catch (error: any) {
    console.error('Delete goal error:', error);
    return sendError(res, { code: 'DELETE_ERROR', message: error.message }, 500);
  }
};

export const getGoalsByReviewId = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const tenantId = req.user!.tenantId;

    const goalRepo = AppDataSource.getRepository(Goal);
    const goals = await goalRepo.find({
      where: { reviewId, tenantId },
      relations: ['kpis'],
      order: { createdAt: 'ASC' },
    });

    return sendSuccess(res, goals);
  } catch (error: any) {
    console.error('Get goals error:', error);
    return sendError(res, { code: 'FETCH_ERROR', message: error.message }, 500);
  }
};

// ==================== KPI CRUD OPERATIONS ====================

export const createKPI = async (req: Request, res: Response) => {
  try {
    const { goalId } = req.params;
    const tenantId = req.user!.tenantId;
    const { metric, target, actual, unit, status } = req.body;

    const kpiRepo = AppDataSource.getRepository(KPI);

    const kpi = kpiRepo.create({
      tenantId,
      goalId,
      metric,
      target,
      actual,
      unit,
      status: status || 'on_track',
    });

    await kpiRepo.save(kpi);
    return sendCreated(res, kpi);
  } catch (error: any) {
    console.error('Create KPI error:', error);
    return sendError(res, { code: 'CREATE_ERROR', message: error.message }, 500);
  }
};

export const updateKPI = async (req: Request, res: Response) => {
  try {
    const { kpiId } = req.params;
    const tenantId = req.user!.tenantId;

    const kpiRepo = AppDataSource.getRepository(KPI);
    const kpi = await kpiRepo.findOne({ where: { kpiId, tenantId } });

    if (!kpi) {
      return sendError(res, { code: 'NOT_FOUND', message: 'KPI not found' }, 404);
    }

    Object.assign(kpi, req.body);
    await kpiRepo.save(kpi);

    return sendSuccess(res, kpi);
  } catch (error: any) {
    console.error('Update KPI error:', error);
    return sendError(res, { code: 'UPDATE_ERROR', message: error.message }, 500);
  }
};

export const deleteKPI = async (req: Request, res: Response) => {
  try {
    const { kpiId } = req.params;
    const tenantId = req.user!.tenantId;

    const kpiRepo = AppDataSource.getRepository(KPI);
    const kpi = await kpiRepo.findOne({ where: { kpiId, tenantId } });

    if (!kpi) {
      return sendError(res, { code: 'NOT_FOUND', message: 'KPI not found' }, 404);
    }

    await kpiRepo.remove(kpi);
    return sendSuccess(res, { message: 'KPI deleted successfully' });
  } catch (error: any) {
    console.error('Delete KPI error:', error);
    return sendError(res, { code: 'DELETE_ERROR', message: error.message }, 500);
  }
};

// ==================== FEEDBACK 360 CRUD OPERATIONS ====================

export const getFeedbackByReviewId = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const tenantId = req.user!.tenantId;

    const feedbackRepo = AppDataSource.getRepository(Feedback360);
    const feedback = await feedbackRepo.find({
      where: { reviewId, tenantId },
      relations: ['feedbackFrom'],
      order: { createdAt: 'DESC' },
    });

    return sendSuccess(res, feedback);
  } catch (error: any) {
    console.error('Get feedback error:', error);
    return sendError(res, { code: 'FETCH_ERROR', message: error.message }, 500);
  }
};

export const updateFeedback360 = async (req: Request, res: Response) => {
  try {
    const { feedbackId } = req.params;
    const tenantId = req.user!.tenantId;

    const feedbackRepo = AppDataSource.getRepository(Feedback360);
    const feedback = await feedbackRepo.findOne({ where: { feedbackId, tenantId } });

    if (!feedback) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Feedback not found' }, 404);
    }

    Object.assign(feedback, req.body);
    await feedbackRepo.save(feedback);

    return sendSuccess(res, feedback);
  } catch (error: any) {
    console.error('Update feedback error:', error);
    return sendError(res, { code: 'UPDATE_ERROR', message: error.message }, 500);
  }
};

export const deleteFeedback360 = async (req: Request, res: Response) => {
  try {
    const { feedbackId } = req.params;
    const tenantId = req.user!.tenantId;

    const feedbackRepo = AppDataSource.getRepository(Feedback360);
    const feedback = await feedbackRepo.findOne({ where: { feedbackId, tenantId } });

    if (!feedback) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Feedback not found' }, 404);
    }

    await feedbackRepo.remove(feedback);
    return sendSuccess(res, { message: 'Feedback deleted successfully' });
  } catch (error: any) {
    console.error('Delete feedback error:', error);
    return sendError(res, { code: 'DELETE_ERROR', message: error.message }, 500);
  }
};

// ==================== DEVELOPMENT ACTION ITEM CRUD OPERATIONS ====================

export const getActionItemsByReviewId = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const tenantId = req.user!.tenantId;

    const actionItemRepo = AppDataSource.getRepository(DevelopmentActionItem);
    const items = await actionItemRepo.find({
      where: { reviewId, tenantId },
      order: { createdAt: 'ASC' },
    });

    return sendSuccess(res, items);
  } catch (error: any) {
    console.error('Get action items error:', error);
    return sendError(res, { code: 'FETCH_ERROR', message: error.message }, 500);
  }
};

export const createActionItem = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const tenantId = req.user!.tenantId;
    const { action, timeline, status } = req.body;

    const actionItemRepo = AppDataSource.getRepository(DevelopmentActionItem);

    const item = actionItemRepo.create({
      tenantId,
      reviewId,
      action,
      timeline,
      status: status || 'pending',
    });

    await actionItemRepo.save(item);
    return sendCreated(res, item);
  } catch (error: any) {
    console.error('Create action item error:', error);
    return sendError(res, { code: 'CREATE_ERROR', message: error.message }, 500);
  }
};

export const updateActionItem = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const tenantId = req.user!.tenantId;

    const actionItemRepo = AppDataSource.getRepository(DevelopmentActionItem);
    const item = await actionItemRepo.findOne({ where: { itemId, tenantId } });

    if (!item) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Action item not found' }, 404);
    }

    Object.assign(item, req.body);
    await actionItemRepo.save(item);

    return sendSuccess(res, item);
  } catch (error: any) {
    console.error('Update action item error:', error);
    return sendError(res, { code: 'UPDATE_ERROR', message: error.message }, 500);
  }
};

export const deleteActionItem = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const tenantId = req.user!.tenantId;

    const actionItemRepo = AppDataSource.getRepository(DevelopmentActionItem);
    const item = await actionItemRepo.findOne({ where: { itemId, tenantId } });

    if (!item) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Action item not found' }, 404);
    }

    await actionItemRepo.remove(item);
    return sendSuccess(res, { message: 'Action item deleted successfully' });
  } catch (error: any) {
    console.error('Delete action item error:', error);
    return sendError(res, { code: 'DELETE_ERROR', message: error.message }, 500);
  }
};

export default {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  createGoal,
  updateGoal,
  deleteGoal,
  getGoalsByReviewId,
  submitGoals,
  approveGoals,
  createKPI,
  updateKPI,
  deleteKPI,
  submitMidYearReview,
  completeMidYearReview,
  submitFinalRating,
  createDevelopmentPlan,
  getActionItemsByReviewId,
  createActionItem,
  updateActionItem,
  deleteActionItem,
  submit360Feedback,
  getFeedbackByReviewId,
  updateFeedback360,
  deleteFeedback360,
};
