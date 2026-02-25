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
};

export default exitService;
