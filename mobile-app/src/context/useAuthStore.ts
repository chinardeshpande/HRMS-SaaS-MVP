import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { endpoints } from '../api/endpoints';
import { User, AuthTokens, LoginRequest } from '../types';
import { saveSecurely, getSecurely, deleteSecurely } from '../utils/secureStore';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  biometricsEnabled: boolean;
  hasCachedSession: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
  clearError: () => void;
  setBiometricsEnabled: (enabled: boolean) => Promise<void>;
  unlockSession: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  biometricsEnabled: false,
  hasCachedSession: false,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await endpoints.auth.login(credentials);
      
      if (response.success && response.data) {
        const { user, tokens } = response.data;
        
        // Save user to standard AsyncStorage (non-sensitive metadata)
        await AsyncStorage.setItem('user', JSON.stringify(user));
        
        // Save tokens securely to Keychain / Keystore (sensitive data)
        await saveSecurely('tokens', JSON.stringify(tokens));
        
        set({
          user,
          tokens,
          isAuthenticated: true,
          isLoading: false,
          hasCachedSession: true
        });
      } else {
        set({
          error: response.error?.message || 'Login failed',
          isLoading: false
        });
      }
    } catch (err: any) {
      console.warn('⚠️ Zustand Login error:', err);
      const message = err.response?.data?.error?.message || err.message || 'Invalid credentials';
      set({
        error: message,
        isLoading: false
      });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      // Best-effort backend logout call
      await endpoints.auth.logout().catch(() => {});
    } finally {
      // Always clear local session storage
      await AsyncStorage.removeItem('user');
      await deleteSecurely('tokens');
      
      set({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        hasCachedSession: false
      });
    }
  },

  initAuth: async () => {
    set({ isLoading: true });
    try {
      const userStr = await AsyncStorage.getItem('user');
      const tokensStr = await getSecurely('tokens');
      const bioEnabledStr = await AsyncStorage.getItem('biometrics_enabled');
      const isBioEnabled = bioEnabledStr === 'true';

      if (userStr && tokensStr) {
        const user = JSON.parse(userStr);
        const tokens = JSON.parse(tokensStr);
        
        if (isBioEnabled) {
          // If biometrics are enabled, cache the session but do not authenticate yet.
          // The Login screen will prompt for biometric verification to set isAuthenticated to true.
          set({
            user,
            tokens,
            biometricsEnabled: true,
            hasCachedSession: true,
            isAuthenticated: false,
            isLoading: false
          });
        } else {
          // Normal auto-login flow
          set({
            user,
            tokens,
            biometricsEnabled: false,
            hasCachedSession: true,
            isAuthenticated: true,
            isLoading: false
          });
        }
      } else {
        set({ 
          isLoading: false,
          biometricsEnabled: isBioEnabled,
          hasCachedSession: false
        });
      }
    } catch (e) {
      console.warn('⚠️ Failed to initialize auth from storage:', e);
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  setBiometricsEnabled: async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('biometrics_enabled', enabled ? 'true' : 'false');
      set({ biometricsEnabled: enabled });
    } catch (e) {
      console.warn('⚠️ Failed to save biometrics preference:', e);
    }
  },

  unlockSession: () => {
    const { user, tokens } = get();
    if (user && tokens) {
      set({ isAuthenticated: true });
    } else {
      console.warn('⚠️ Cannot unlock session: missing user or tokens');
    }
  }
}));
