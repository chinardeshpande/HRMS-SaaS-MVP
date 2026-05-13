import api from './api';
import { User } from '../types';

export interface ProfileUpdatePayload {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

class AccountService {
  async getMe(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Unable to load profile');
    }
    return response.data;
  }

  async updateProfile(data: ProfileUpdatePayload): Promise<User> {
    const response = await api.patch<User>('/auth/me', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Unable to update profile');
    }
    return response.data;
  }

  async changePassword(data: ChangePasswordPayload): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/change-password', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Unable to change password');
    }
    return response.data;
  }

  async uploadProfilePhoto(file: File): Promise<User> {
    const response = await api.upload<User>('/auth/profile-photo', file);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Unable to upload profile photo');
    }
    return response.data;
  }
}

export default new AccountService();
