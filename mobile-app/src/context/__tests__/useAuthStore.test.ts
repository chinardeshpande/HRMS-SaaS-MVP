import { useAuthStore } from '../useAuthStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { endpoints } from '../../api/endpoints';

// Mock endpoints
jest.mock('../../api/endpoints', () => ({
  endpoints: {
    auth: {
      login: jest.fn(),
      logout: jest.fn(() => Promise.resolve({ success: true })),
    },
  },
}));

describe('useAuthStore', () => {
  beforeEach(async () => {
    // Reset Zustand store state before each test
    useAuthStore.setState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      biometricsEnabled: false,
      hasCachedSession: false,
    });
    
    // Clear storage mocks
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  test('should return initial state correctly', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
    expect(state.isAuthenticated).toBeFalsy();
    expect(state.isLoading).toBeFalsy();
    expect(state.error).toBeNull();
    expect(state.biometricsEnabled).toBeFalsy();
    expect(state.hasCachedSession).toBeFalsy();
  });

  test('should login successfully and save credentials in storage', async () => {
    const mockUser = {
      userId: 'u-1',
      fullName: 'Sarah Johnson',
      email: 'sarah.johnson@acme.com',
      role: 'manager',
      tenantId: 'tenant-1',
    };
    const mockTokens = {
      token: 'jwt-access-token',
      refreshToken: 'jwt-refresh-token',
    };

    (endpoints.auth.login as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: { user: mockUser, tokens: mockTokens },
    });

    await useAuthStore.getState().login({ email: 'sarah.johnson@acme.com', password: 'password123' });

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.tokens).toEqual(mockTokens);
    expect(state.isAuthenticated).toBeTruthy();
    expect(state.isLoading).toBeFalsy();
    expect(state.error).toBeNull();

    // Verify AsyncStorage saves
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
    // Verify SecureStore saves
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('tokens', JSON.stringify(mockTokens));
  });

  test('should handle login errors gracefully without crashing', async () => {
    (endpoints.auth.login as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: { message: 'Invalid email or password' },
    });

    await useAuthStore.getState().login({ email: 'sarah.johnson@acme.com', password: 'wrong' });

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
    expect(state.isAuthenticated).toBeFalsy();
    expect(state.isLoading).toBeFalsy();
    expect(state.error).toBe('Invalid email or password');
  });

  test('should propagate exceptions for network crashes', async () => {
    (endpoints.auth.login as jest.Mock).mockRejectedValueOnce(new Error('Network Crash'));

    await expect(
      useAuthStore.getState().login({ email: 'sarah.johnson@acme.com', password: 'wrong' })
    ).rejects.toThrow('Network Crash');

    const state = useAuthStore.getState();
    expect(state.isLoading).toBeFalsy();
    expect(state.error).toBe('Network Crash');
  });

  test('should initialize authentication (auto-login) when biometrics are disabled', async () => {
    const mockUser = { userId: 'u-1', fullName: 'Sarah Johnson', email: 'sarah.johnson@acme.com' };
    const mockTokens = { token: 'token', refreshToken: 'refToken' };

    await AsyncStorage.setItem('user', JSON.stringify(mockUser));
    await SecureStore.setItemAsync('tokens', JSON.stringify(mockTokens));
    await AsyncStorage.setItem('biometrics_enabled', 'false');

    await useAuthStore.getState().initAuth();

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.tokens).toEqual(mockTokens);
    expect(state.isAuthenticated).toBeTruthy();
    expect(state.biometricsEnabled).toBeFalsy();
  });

  test('should initialize authentication but require biometric unlock when biometrics are enabled', async () => {
    const mockUser = { userId: 'u-1', fullName: 'Sarah Johnson', email: 'sarah.johnson@acme.com' };
    const mockTokens = { token: 'token', refreshToken: 'refToken' };

    await AsyncStorage.setItem('user', JSON.stringify(mockUser));
    await SecureStore.setItemAsync('tokens', JSON.stringify(mockTokens));
    await AsyncStorage.setItem('biometrics_enabled', 'true');

    await useAuthStore.getState().initAuth();

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.tokens).toEqual(mockTokens);
    expect(state.isAuthenticated).toBeFalsy(); // Gatekeeper is active
    expect(state.biometricsEnabled).toBeTruthy();
    expect(state.hasCachedSession).toBeTruthy();
  });

  test('should unlock session successfully when unlocked via biometrics', () => {
    const mockUser = { userId: 'u-1', fullName: 'Sarah Johnson', email: 'sarah.johnson@acme.com' };
    const mockTokens = { token: 'token', refreshToken: 'refToken' };

    // Pre-populate cached details
    useAuthStore.setState({ user: mockUser as any, tokens: mockTokens as any, isAuthenticated: false });

    useAuthStore.getState().unlockSession();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBeTruthy();
  });

  test('should enable/disable biometrics settings', async () => {
    await useAuthStore.getState().setBiometricsEnabled(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('biometrics_enabled', 'true');
    expect(useAuthStore.getState().biometricsEnabled).toBeTruthy();

    await useAuthStore.getState().setBiometricsEnabled(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('biometrics_enabled', 'false');
    expect(useAuthStore.getState().biometricsEnabled).toBeFalsy();
  });

  test('should clear local sessions completely upon logout', async () => {
    const mockUser = { userId: 'u-1', fullName: 'Sarah Johnson' };
    const mockTokens = { token: 'token' };

    useAuthStore.setState({
      user: mockUser as any,
      tokens: mockTokens as any,
      isAuthenticated: true,
      hasCachedSession: true,
    });

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
    expect(state.isAuthenticated).toBeFalsy();
    expect(state.hasCachedSession).toBeFalsy();

    // Storage should be cleared
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('tokens');
  });
});
