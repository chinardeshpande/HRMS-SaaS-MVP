import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthTokens } from '../../../shared/types';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedTokens = localStorage.getItem('tokens');

        if (storedUser && storedTokens) {
          setUser(JSON.parse(storedUser));
          setTokens(JSON.parse(storedTokens));
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
      // TODO: Replace with actual API call
      // const response = await api.post('/auth/login', { email, password });
      // const { user, tokens } = response.data.data;

      // Mock data for now
      const mockUser: User = {
        userId: '1',
        tenantId: '1',
        email,
        fullName: 'Demo User',
        role: 'employee' as any,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockTokens: AuthTokens = {
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      };

      setUser(mockUser);
      setTokens(mockTokens);

      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('tokens', JSON.stringify(mockTokens));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = (): void => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('user');
    localStorage.removeItem('tokens');
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
