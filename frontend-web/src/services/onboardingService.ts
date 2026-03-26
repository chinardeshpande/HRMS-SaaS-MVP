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

  async uploadDocument(candidateId: string, file: File, documentType: string, metadata?: any) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    if (metadata) {
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });
    }

    return api.post(`/onboarding/candidates/${candidateId}/documents/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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

  async bulkUploadEmployees(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return api.post('/onboarding/candidates/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async getCandidateDocuments(candidateId: string) {
    return api.get(`/onboarding/candidates/${candidateId}/documents`);
  },

  async signDocument(documentId: string) {
    return api.post(`/onboarding/documents/${documentId}/sign`);
  },

  async signAllRequiredDocuments(candidateId: string) {
    return api.post(`/onboarding/candidates/${candidateId}/documents/sign-all`);
  },

  async generateAndSignDocuments(candidateId: string) {
    return api.post(`/onboarding/candidates/${candidateId}/documents/generate`);
  },

  async getStateTransitionHistory(candidateId: string) {
    return api.get(`/onboarding/candidates/${candidateId}/history`);
  },

  async updateCandidate(candidateId: string, data: any) {
    return api.put(`/onboarding/candidates/${candidateId}`, data);
  },

  // ==================== TASK CRUD OPERATIONS ====================

  async createTask(candidateId: string, data: any) {
    return api.post(`/onboarding/candidates/${candidateId}/tasks`, data);
  },

  async updateTask(taskId: string, data: any) {
    return api.put(`/onboarding/tasks/${taskId}`, data);
  },

  async deleteTask(taskId: string) {
    return api.delete(`/onboarding/tasks/${taskId}`);
  },

  // ==================== DOCUMENT CRUD OPERATIONS ====================

  async updateDocument(documentId: string, data: any) {
    return api.put(`/onboarding/documents/${documentId}`, data);
  },

  async deleteDocument(documentId: string) {
    return api.delete(`/onboarding/documents/${documentId}`);
  },

  async downloadDocument(documentId: string) {
    return api.get(`/onboarding/documents/${documentId}/download`);
  },

  // ==================== BGV OPERATIONS ====================

  async getBGVDetails(candidateId: string) {
    return api.get(`/onboarding/candidates/${candidateId}/bgv`);
  },

  async updateBGVStatus(candidateId: string, data: any) {
    return api.put(`/onboarding/candidates/${candidateId}/bgv`, data);
  },

  // ==================== ONBOARDING CASE OPERATIONS ====================

  async getOnboardingCase(candidateId: string) {
    return api.get(`/onboarding/candidates/${candidateId}/case`);
  },

  async updateOnboardingCase(candidateId: string, data: any) {
    return api.put(`/onboarding/candidates/${candidateId}/case`, data);
  },
};

export default onboardingService;
