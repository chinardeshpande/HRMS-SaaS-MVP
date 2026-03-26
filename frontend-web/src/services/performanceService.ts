import api from './api';

export interface PerformanceReview {
  reviewId: string;
  employeeId: string;
  employee: {
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    department: { name: string };
    designation: { name: string };
  };
  reviewCycle: string;
  reviewPeriod: string;
  currentState: string;
  overallRating?: number;
  reviewerId: string;
  reviewer?: {
    firstName: string;
    lastName: string;
  };
  goals: Goal[];
  midYearReview?: Review;
  annualReview?: Review;
  finalRating?: FinalRating;
  developmentPlan?: DevelopmentPlan;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  goalId: string;
  title: string;
  description: string;
  category: 'business' | 'personal' | 'technical' | 'leadership';
  targetDate: string;
  weightage: number;
  status: 'draft' | 'submitted' | 'approved' | 'in_progress' | 'achieved' | 'not_achieved';
  progress: number;
  kpis: KPI[];
}

export interface KPI {
  kpiId: string;
  metric: string;
  target: string;
  actual?: string;
  unit: string;
  status: 'on_track' | 'at_risk' | 'off_track' | 'achieved';
}

export interface Review {
  reviewId: string;
  reviewType: 'mid_year' | 'annual';
  selfRating: number;
  managerRating?: number;
  selfComments: string;
  managerComments?: string;
  achievements: string[];
  challenges: string[];
  feedback360?: Feedback360[];
  submittedDate?: string;
  completedDate?: string;
}

export interface Feedback360 {
  feedbackId: string;
  feedbackFrom: string;
  relationship: 'peer' | 'subordinate' | 'stakeholder';
  rating: number;
  comments: string;
}

export interface FinalRating {
  ratingId: string;
  managerRating: number;
  normalizationRating?: number;
  finalRating: number;
  ratingCategory: 'exceeds_expectations' | 'meets_expectations' | 'needs_improvement' | 'unsatisfactory';
  promotionRecommended: boolean;
  incrementPercentage?: number;
  comments: string;
}

export interface DevelopmentPlan {
  planId: string;
  skillGaps: string[];
  trainingRecommendations: string[];
  careerAspirations: string;
  actionItems: ActionItem[];
}

export interface ActionItem {
  itemId: string;
  action: string;
  timeline: string;
  status: 'pending' | 'in_progress' | 'completed';
}

const performanceService = {
  // Get all performance reviews
  async getAllReviews(filters?: { cycle?: string; status?: string }) {
    return api.get<{ reviews: PerformanceReview[]; stats: any }>('/performance/reviews', { params: filters });
  },

  // Get review by ID
  async getReviewById(reviewId: string) {
    return api.get<PerformanceReview>(`/performance/reviews/${reviewId}`);
  },

  // Get review by employee ID
  async getReviewByEmployeeId(employeeId: string, cycle?: string) {
    return api.get<PerformanceReview>(`/performance/employees/${employeeId}/review`, { params: { cycle } });
  },

  // Get performance statistics
  async getStatistics() {
    return api.get<any>('/performance/statistics');
  },

  // Goal Management
  async createGoal(reviewId: string, goalData: Partial<Goal>) {
    return api.post<Goal>(`/performance/reviews/${reviewId}/goals`, goalData);
  },

  async updateGoal(goalId: string, goalData: Partial<Goal>) {
    return api.patch<Goal>(`/performance/goals/${goalId}`, goalData);
  },

  async submitGoals(reviewId: string) {
    return api.post<PerformanceReview>(`/performance/reviews/${reviewId}/goals/submit`);
  },

  async approveGoals(reviewId: string, comments?: string) {
    return api.post<PerformanceReview>(`/performance/reviews/${reviewId}/goals/approve`, { comments });
  },

  // Mid-Year Review
  async submitMidYearReview(reviewId: string, reviewData: Partial<Review>) {
    return api.post<PerformanceReview>(`/performance/reviews/${reviewId}/mid-year`, reviewData);
  },

  async completeMidYearReview(reviewId: string, managerData: { rating: number; comments: string }) {
    return api.post<PerformanceReview>(`/performance/reviews/${reviewId}/mid-year/complete`, managerData);
  },

  // Annual Review
  async submitAnnualReview(reviewId: string, reviewData: Partial<Review>) {
    return api.post<PerformanceReview>(`/performance/reviews/${reviewId}/annual`, reviewData);
  },

  async completeAnnualReview(reviewId: string, managerData: { rating: number; comments: string }) {
    return api.post<PerformanceReview>(`/performance/reviews/${reviewId}/annual/complete`, managerData);
  },

  // 360 Feedback
  async submit360Feedback(reviewId: string, feedback: Partial<Feedback360>) {
    return api.post<Feedback360>(`/performance/reviews/${reviewId}/feedback-360`, feedback);
  },

  // Final Rating
  async submitFinalRating(reviewId: string, ratingData: Partial<FinalRating>) {
    return api.post<PerformanceReview>(`/performance/reviews/${reviewId}/final-rating`, ratingData);
  },

  // Development Plan
  async createDevelopmentPlan(reviewId: string, planData: Partial<DevelopmentPlan>) {
    return api.post<PerformanceReview>(`/performance/reviews/${reviewId}/development-plan`, planData);
  },

  async updateDevelopmentPlan(reviewId: string, planData: Partial<DevelopmentPlan>) {
    return api.patch<PerformanceReview>(`/performance/reviews/${reviewId}/development-plan`, planData);
  },

  // ==================== REVIEW CRUD OPERATIONS ====================

  async createReview(reviewData: any) {
    return api.post<PerformanceReview>('/performance/reviews', reviewData);
  },

  async updateReview(reviewId: string, data: any) {
    return api.put<PerformanceReview>(`/performance/reviews/${reviewId}`, data);
  },

  async deleteReview(reviewId: string) {
    return api.delete(`/performance/reviews/${reviewId}`);
  },

  // ==================== GOAL CRUD OPERATIONS ====================

  async getGoalsByReviewId(reviewId: string) {
    return api.get<Goal[]>(`/performance/reviews/${reviewId}/goals`);
  },

  async deleteGoal(goalId: string) {
    return api.delete(`/performance/goals/${goalId}`);
  },

  // ==================== KPI CRUD OPERATIONS ====================

  async createKPI(goalId: string, data: Partial<KPI>) {
    return api.post<KPI>(`/performance/goals/${goalId}/kpis`, data);
  },

  async updateKPI(kpiId: string, data: Partial<KPI>) {
    return api.put<KPI>(`/performance/kpis/${kpiId}`, data);
  },

  async deleteKPI(kpiId: string) {
    return api.delete(`/performance/kpis/${kpiId}`);
  },

  // ==================== 360 FEEDBACK CRUD OPERATIONS ====================

  async getFeedbackByReviewId(reviewId: string) {
    return api.get<Feedback360[]>(`/performance/reviews/${reviewId}/feedback-360`);
  },

  async updateFeedback360(feedbackId: string, data: Partial<Feedback360>) {
    return api.put<Feedback360>(`/performance/feedback-360/${feedbackId}`, data);
  },

  async deleteFeedback360(feedbackId: string) {
    return api.delete(`/performance/feedback-360/${feedbackId}`);
  },

  // ==================== DEVELOPMENT ACTION ITEM CRUD OPERATIONS ====================

  async getActionItemsByReviewId(reviewId: string) {
    return api.get<ActionItem[]>(`/performance/reviews/${reviewId}/action-items`);
  },

  async createActionItem(reviewId: string, data: Partial<ActionItem>) {
    return api.post<ActionItem>(`/performance/reviews/${reviewId}/action-items`, data);
  },

  async updateActionItem(itemId: string, data: Partial<ActionItem>) {
    return api.put<ActionItem>(`/performance/action-items/${itemId}`, data);
  },

  async deleteActionItem(itemId: string) {
    return api.delete(`/performance/action-items/${itemId}`);
  },
};

export default performanceService;
