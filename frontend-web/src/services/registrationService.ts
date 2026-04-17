import api from './api';

export interface SignupData {
  companyName: string;
  adminEmail: string;
  adminFullName: string;
  phone?: string;
  industry?: string;
  companySize?: string;
  selectedPlan?: string;
  utmSource?: string;
  utmCampaign?: string;
}

export interface RegistrationResponse {
  registrationId: string;
  email: string;
  companyName: string;
  message: string;
}

export interface EmailVerificationResponse {
  registrationId: string;
  email: string;
  isVerified: boolean;
  message: string;
}

export interface CompletionResponse {
  tenantId: string;
  userId: string;
  employeeId: string;
  token: string;
  refreshToken: string;
  user: {
    userId: string;
    email: string;
    role: string;
    tenantId: string;
  };
  message: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number | string;
  duration: string;
  features: string[];
}

class RegistrationService {
  /**
   * Initiate company signup
   */
  async signup(data: SignupData): Promise<RegistrationResponse> {
    const response = await api.post('/registration/signup', data);
    return response.data;
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<EmailVerificationResponse> {
    const response = await api.post('/registration/verify-email', { token });
    return response.data;
  }

  /**
   * Complete registration with password
   */
  async completeRegistration(registrationId: string, password: string): Promise<CompletionResponse> {
    const response = await api.post('/registration/complete', {
      registrationId,
      password,
    });
    return response.data;
  }

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<{ message: string }> {
    const response = await api.post('/registration/resend-verification', { email });
    return response.data;
  }

  /**
   * Check email availability
   */
  async checkEmailAvailability(email: string): Promise<{ available: boolean; message: string }> {
    const response = await api.get(`/registration/check-email/${encodeURIComponent(email)}`);
    return response.data;
  }

  /**
   * Get available subscription plans
   */
  async getPlans(): Promise<Plan[]> {
    const response = await api.get('/registration/plans');
    return response.data || [];
  }
}

export default new RegistrationService();
