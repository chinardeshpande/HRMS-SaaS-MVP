import api from './api';

export const probationService = {
  async getAllProbationCases(filters?: any) {
    return api.get('/probation/cases', { params: filters });
  },

  async getProbationCase(probationId: string) {
    return api.get(`/probation/cases/${probationId}`);
  },

  async getDueReviews() {
    return api.get('/probation/my-team/due-reviews');
  },

  async submitReview(probationId: string, data: any) {
    return api.post(`/probation/cases/${probationId}/reviews`, data);
  },

  async hrApproveReview(reviewId: string, approved: boolean, notes?: string) {
    return api.post(`/probation/reviews/${reviewId}/hr-approve`, { approved, notes });
  },

  async flagAtRisk(probationId: string, data: { riskLevel: string; riskReason: string }) {
    return api.post(`/probation/cases/${probationId}/flag-at-risk`, data);
  },

  async extendProbation(probationId: string, data: { extensionDays: number; reason: string; improvementPlan: string }) {
    return api.post(`/probation/cases/${probationId}/extend`, data);
  },

  async confirmEmployee(probationId: string) {
    return api.post(`/probation/cases/${probationId}/confirm`);
  },

  async terminateProbation(probationId: string, data: { reason: string }) {
    return api.post(`/probation/cases/${probationId}/terminate`, data);
  },

  async getAtRiskEmployees() {
    return api.get('/probation/at-risk');
  },

  async getProbationStatistics() {
    return api.get('/probation/statistics');
  },
};

export default probationService;
