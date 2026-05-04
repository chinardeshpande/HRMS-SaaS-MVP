import { api } from './api';
import { AuthTokens, User } from '../types';

export type DemoPersonaKey = 'admin' | 'hr' | 'manager' | 'employee' | 'finance';

export interface DemoPersona {
  key: DemoPersonaKey;
  label: string;
  email: string;
  role: string;
  journey: string;
}

export interface DemoSession {
  user: User;
  tokens: AuthTokens;
  demo: {
    tenantSubdomain: string;
    resetPolicy: string;
    personas: DemoPersona[];
  };
}

class DemoService {
  async getPersonas(): Promise<{ password: string; personas: DemoPersona[] }> {
    const response = await api.get<{ password: string; personas: DemoPersona[] }>('/demo/personas');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Unable to load demo personas');
    }
    return response.data;
  }

  async startDemo(persona: DemoPersonaKey = 'hr'): Promise<DemoSession> {
    const response = await api.post<DemoSession>('/demo/login', { persona });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Unable to start demo mode');
    }
    return response.data;
  }

  async switchToDemo(persona: DemoPersonaKey = 'hr'): Promise<DemoSession> {
    const response = await api.post<DemoSession>('/demo/switch', { persona });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Unable to switch to demo mode');
    }
    return response.data;
  }
}

export const demoService = new DemoService();
export default demoService;
