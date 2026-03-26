import api from './api';

export const exitService = {
  async submitResignation(data: any) {
    return api.post('/exit/resign', data);
  },

  async getAllExitCases(filters?: any) {
    return api.get('/exit/cases', { params: filters });
  },

  async getExitCase(exitId: string) {
    return api.get(`/exit/cases/${exitId}`);
  },

  async approveResignation(exitId: string, notes?: string) {
    return api.post(`/exit/cases/${exitId}/approve`, { notes });
  },

  async rejectResignation(exitId: string, reason: string) {
    return api.post(`/exit/cases/${exitId}/reject`, { reason });
  },

  async buyoutNoticePeriod(exitId: string, buyoutAmount: number) {
    return api.post(`/exit/cases/${exitId}/notice-period/buyout`, { buyoutAmount });
  },

  async transitionState(exitId: string, toState: string, reason?: string) {
    return api.post(`/exit/cases/${exitId}/transition`, { toState, reason });
  },

  async updateClearance(clearanceId: string, data: any) {
    return api.put(`/exit/clearances/${clearanceId}`, data);
  },

  async approveClearance(clearanceId: string) {
    return api.post(`/exit/clearances/${clearanceId}/approve`);
  },

  async recordAssetReturn(exitId: string, data: any) {
    return api.post(`/exit/cases/${exitId}/assets`, data);
  },

  async scheduleExitInterview(exitId: string, data: { scheduledDate: string; conductedBy: string }) {
    return api.post(`/exit/cases/${exitId}/exit-interview/schedule`, data);
  },

  async submitExitInterview(exitInterviewId: string, data: any) {
    return api.put(`/exit/exit-interviews/${exitInterviewId}/submit`, data);
  },

  async calculateSettlement(exitId: string, data: any) {
    return api.post(`/exit/cases/${exitId}/settlement/calculate`, data);
  },

  async approveSettlement(settlementId: string, notes?: string) {
    return api.post(`/exit/settlements/${settlementId}/approve`, { notes });
  },

  async markSettlementPaid(settlementId: string, data: { paymentDate: string; paymentMode: string; paymentReferenceNumber: string }) {
    return api.post(`/exit/settlements/${settlementId}/mark-paid`, data);
  },

  async getPendingClearances(departmentType?: string) {
    return api.get('/exit/clearances/pending', { params: { departmentType } });
  },

  async getPendingAssetReturns() {
    return api.get('/exit/assets/pending');
  },

  async getExitStatistics() {
    return api.get('/exit/statistics');
  },

  // ==================== EXIT CASE CRUD OPERATIONS ====================

  async updateExitCase(exitId: string, data: any) {
    return api.put(`/exit/cases/${exitId}`, data);
  },

  async deleteExitCase(exitId: string) {
    return api.delete(`/exit/cases/${exitId}`);
  },

  // ==================== CLEARANCE CRUD OPERATIONS ====================

  async getClearancesByExitId(exitId: string) {
    return api.get(`/exit/cases/${exitId}/clearances`);
  },

  async createClearance(exitId: string, data: any) {
    return api.post(`/exit/cases/${exitId}/clearances`, data);
  },

  async deleteClearance(clearanceId: string) {
    return api.delete(`/exit/clearances/${clearanceId}`);
  },

  // ==================== ASSET RETURN CRUD OPERATIONS ====================

  async getAssetsByExitId(exitId: string) {
    return api.get(`/exit/cases/${exitId}/assets`);
  },

  async updateAssetReturn(assetId: string, data: any) {
    return api.put(`/exit/assets/${assetId}`, data);
  },

  async deleteAssetReturn(assetId: string) {
    return api.delete(`/exit/assets/${assetId}`);
  },

  // ==================== EXIT INTERVIEW CRUD OPERATIONS ====================

  async getExitInterviewByExitId(exitId: string) {
    return api.get(`/exit/cases/${exitId}/exit-interview`);
  },

  async updateExitInterview(exitInterviewId: string, data: any) {
    return api.put(`/exit/exit-interviews/${exitInterviewId}`, data);
  },

  async deleteExitInterview(exitInterviewId: string) {
    return api.delete(`/exit/exit-interviews/${exitInterviewId}`);
  },

  // ==================== SETTLEMENT CRUD OPERATIONS ====================

  async getSettlementByExitId(exitId: string) {
    return api.get(`/exit/cases/${exitId}/settlement`);
  },

  async updateSettlement(settlementId: string, data: any) {
    return api.put(`/exit/settlements/${settlementId}`, data);
  },

  async deleteSettlement(settlementId: string) {
    return api.delete(`/exit/settlements/${settlementId}`);
  },
};

export default exitService;
