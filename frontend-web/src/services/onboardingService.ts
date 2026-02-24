import api from './api';

export const onboardingService = {
  async createCandidate(data: any) {
    return api.post('/onboarding/candidates', data);
  },

  async getAllCandidates(filters?: any) {
    return api.get('/onboarding/candidates', { params: filters });
  },

  async getCandidateById(candidateId: string) {
    return api.get(`/onboarding/candidates/${candidateId}`);
  },

  async sendOffer(candidateId: string) {
    return api.post(`/onboarding/candidates/${candidateId}/send-offer`);
  },

  async acceptOffer(candidateId: string, data: { acceptedDate: Date }) {
    return api.post(`/onboarding/candidates/${candidateId}/accept-offer`, data);
  },

  async uploadDocument(candidateId: string, data: any) {
    return api.post(`/onboarding/candidates/${candidateId}/documents/upload`, data);
  },

  async verifyDocument(documentId: string, status: string, notes?: string) {
    return api.put(`/onboarding/documents/${documentId}/verify`, { status, notes });
  },

  async transitionState(candidateId: string, toState: string, reason?: string, metadata?: any) {
    return api.post(`/onboarding/candidates/${candidateId}/transition`, { toState, reason, metadata });
  },

  async getOnboardingPipeline() {
    return api.get('/onboarding/pipeline');
  },

  async getCandidateTasks(candidateId: string) {
    return api.get(`/onboarding/candidates/${candidateId}/tasks`);
  },

  async completeTask(taskId: string, notes?: string) {
    return api.post(`/onboarding/tasks/${taskId}/complete`, { notes });
  },
};

export default onboardingService;
