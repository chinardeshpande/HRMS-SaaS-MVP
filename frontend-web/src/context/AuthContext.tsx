import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthTokens } from '../types';
import { api } from '../services/api';
import { demoService, DemoPersonaKey } from '../services/demoService';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  startDemo: (persona?: DemoPersonaKey) => Promise<void>;
  switchToDemo: (persona?: DemoPersonaKey) => Promise<void>;
  exitDemo: () => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const decodeTokenPayload = (token?: string): Partial<User> | null => {
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      if (!payload) return null;

      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = normalizedPayload.padEnd(normalizedPayload.length + ((4 - normalizedPayload.length % 4) % 4), '=');
      return JSON.parse(window.atob(paddedPayload));
    } catch (error) {
      console.error('Error decoding auth token:', error);
      return null;
    }
  };

  const userFromToken = (userData: User, tokenData: AuthTokens): User | null => {
    const tokenPayload = decodeTokenPayload(tokenData.token);
    if (!tokenPayload?.userId || !tokenPayload?.tenantId || !tokenPayload?.role) {
      return null;
    }

    return {
      ...userData,
      userId: String(tokenPayload.userId),
      tenantId: String(tokenPayload.tenantId),
      email: String(tokenPayload.email || userData.email),
      role: tokenPayload.role as User['role'],
      employeeId: tokenPayload.employeeId ? String(tokenPayload.employeeId) : userData.employeeId,
    };
  };

  const persistSession = (userData: User, tokenData: AuthTokens): void => {
    const trustedUser = userFromToken(userData, tokenData) || userData;
    setUser(trustedUser);
    setTokens(tokenData);
    localStorage.setItem('user', JSON.stringify(trustedUser));
    localStorage.setItem('tokens', JSON.stringify(tokenData));
  };

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedTokens = localStorage.getItem('tokens');

        if (storedUser && storedTokens) {
          const parsedUser = JSON.parse(storedUser);
          const parsedTokens = JSON.parse(storedTokens);
          const trustedUser = userFromToken(parsedUser, parsedTokens);

          if (!trustedUser) {
            throw new Error('Stored session token is invalid');
          }

          setUser(trustedUser);
          setTokens(parsedTokens);
          localStorage.setItem('user', JSON.stringify(trustedUser));
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('tokens');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('🔐 Attempting login for:', email);

      // Call the actual backend API
      const response = await api.post<{ user: User; tokens: AuthTokens }>('/auth/login', {
        email,
        password
      });

      console.log('📥 Login response received:', response);

      // api.post returns ApiResponse<T>, so response.data contains the actual payload
      if (!response.success || !response.data) {
        console.error('❌ Login failed - invalid response structure:', response);
        throw new Error('Login failed');
      }

      const { user: userData, tokens: tokenData } = response.data;

      console.log('✅ User data extracted:', userData);
      console.log('✅ Tokens extracted:', { hasToken: !!tokenData.token, hasRefresh: !!tokenData.refreshToken });

      persistSession(userData, tokenData);
      localStorage.removeItem('preDemoSession');

      console.log('✅ Login successful - user and tokens stored');
    } catch (error: any) {
      console.error('❌ Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      const errorMessage = error.response?.data?.error?.message || error.message || 'Invalid email or password';
      throw new Error(errorMessage);
    }
  };

  const logout = (): void => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('user');
    localStorage.removeItem('tokens');
    localStorage.removeItem('preDemoSession');
  };

  const startDemo = async (persona: DemoPersonaKey = 'hr'): Promise<void> => {
    const session = await demoService.startDemo(persona);
    localStorage.removeItem('preDemoSession');
    persistSession(session.user, session.tokens);
    localStorage.setItem('demoSession', JSON.stringify({ persona, startedAt: new Date().toISOString() }));
  };

  const switchToDemo = async (persona: DemoPersonaKey = 'hr'): Promise<void> => {
    if (user && tokens && !user.isDemoMode) {
      localStorage.setItem('preDemoSession', JSON.stringify({ user, tokens }));
    }

    const session = await demoService.switchToDemo(persona);
    persistSession(session.user, session.tokens);
    localStorage.setItem('demoSession', JSON.stringify({ persona, startedAt: new Date().toISOString() }));
  };

  const exitDemo = (): void => {
    const storedOriginalSession = localStorage.getItem('preDemoSession');

    if (storedOriginalSession) {
      try {
        const originalSession = JSON.parse(storedOriginalSession);
        persistSession(originalSession.user, originalSession.tokens);
      } catch (error) {
        console.error('Error restoring pre-demo session:', error);
        logout();
      }
    } else {
      logout();
    }

    localStorage.removeItem('preDemoSession');
    localStorage.removeItem('demoSession');
  };

  const refreshToken = async (): Promise<void> => {
    try {
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      // TODO: Replace with actual API call
      // const response = await api.post('/auth/refresh', {
      //   refreshToken: tokens.refreshToken,
      // });
      // const newTokens = response.data.data;

      // setTokens(newTokens);
      // localStorage.setItem('tokens', JSON.stringify(newTokens));
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    tokens,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken,
    startDemo,
    switchToDemo,
    exitDemo,
    isDemoMode: !!user?.isDemoMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
