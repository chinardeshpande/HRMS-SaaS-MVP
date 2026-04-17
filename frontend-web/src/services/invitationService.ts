import api from './api';

export interface Invitation {
  invitationId: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: string;
  departmentId?: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;
  tokenExpiry: string;
  invitedBy: string;
  invitedAt: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InviteUserData {
  email: string;
  fullName: string;
  role: string;
  departmentId?: string;
}

export interface BulkInviteResult {
  successful: number;
  failed: number;
  errors: Array<{
    email: string;
    error: string;
  }>;
  invitations: Invitation[];
}

class InvitationService {
  /**
   * Send single invitation
   */
  async sendInvitation(data: InviteUserData): Promise<Invitation> {
    const response = await api.post('/invitations', data);
    return response.data;
  }

  /**
   * Get all invitations for tenant
   */
  async getInvitations(): Promise<Invitation[]> {
    const response = await api.get('/invitations');
    return response.data || [];
  }

  /**
   * Cancel an invitation
   */
  async cancelInvitation(invitationId: string): Promise<{ message: string }> {
    const response = await api.delete(`/invitations/${invitationId}`);
    return response.data;
  }

  /**
   * Resend an invitation
   */
  async resendInvitation(invitationId: string): Promise<Invitation> {
    const response = await api.post(`/invitations/resend/${invitationId}`);
    return response.data;
  }

  /**
   * Bulk invite users
   */
  async bulkInvite(users: InviteUserData[]): Promise<BulkInviteResult> {
    const response = await api.post('/invitations/bulk', { users });
    return response.data;
  }

  /**
   * Verify invitation token (public)
   */
  async verifyToken(token: string): Promise<{
    email: string;
    fullName: string;
    role: string;
    status: string;
    isValid: boolean;
  }> {
    const response = await api.get(`/invitations/verify/${token}`);
    return response.data;
  }

  /**
   * Accept invitation (public)
   */
  async acceptInvitation(token: string, password: string): Promise<{
    userId: string;
    employeeId: string;
    token: string;
    refreshToken: string;
    user: any;
    message: string;
  }> {
    const response = await api.post(`/invitations/accept/${token}`, { password });
    return response.data;
  }
}

export default new InvitationService();
