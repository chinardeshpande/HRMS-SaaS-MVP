import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize mock instances within the hoisted factory block to guarantee initialization timing
jest.mock('axios', () => {
  const mockRequestUse = jest.fn();
  const mockResponseUse = jest.fn();
  const mockGet = jest.fn(() => Promise.resolve({ data: { success: true, data: 'test-get' } }));
  const mockPostInstance = jest.fn(() => Promise.resolve({ data: { success: true, data: 'test-post' } }));

  // Expose mock methods on the global object for test suite assertions
  (global as any).mockRequestUse = mockRequestUse;
  (global as any).mockResponseUse = mockResponseUse;
  (global as any).mockGet = mockGet;
  (global as any).mockPostInstance = mockPostInstance;

  // Axios instance is a callable function AND an object with helper methods
  const mockInstance: any = jest.fn(() => Promise.resolve({ data: { success: true, data: 'test-retry' } }));
  mockInstance.get = mockGet;
  mockInstance.post = mockPostInstance;
  mockInstance.put = jest.fn(() => Promise.resolve({ data: { success: true, data: 'test-put' } }));
  mockInstance.patch = jest.fn(() => Promise.resolve({ data: { success: true, data: 'test-patch' } }));
  mockInstance.delete = jest.fn(() => Promise.resolve({ data: { success: true, data: 'test-delete' } }));
  mockInstance.defaults = { headers: { common: {} } };
  mockInstance.interceptors = {
    request: { use: mockRequestUse, eject: jest.fn() },
    response: { use: mockResponseUse, eject: jest.fn() },
  };

  return {
    create: jest.fn(() => mockInstance),
    post: jest.fn(),
  };
});

// Import API client AFTER mock is initialized
import { API_BASE_URL } from '../client';
import axios from 'axios';

// Capture the interceptor callbacks immediately at module load time!
const requestInterceptorCallback = (global as any).mockRequestUse.mock.calls[0][0];
const responseInterceptorSuccessCallback = (global as any).mockResponseUse.mock.calls[0][0];
const responseInterceptorErrorCallback = (global as any).mockResponseUse.mock.calls[0][1];

describe('ApiClient', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    // Clear SecureStore mock state by deleting tokens explicitly
    await SecureStore.deleteItemAsync('tokens');
  });

  test('Request Interceptor - should attach JWT Bearer token when tokens exist in secureStore', async () => {
    const mockTokens = { token: 'jwt-access-token', refreshToken: 'jwt-refresh-token' };
    await SecureStore.setItemAsync('tokens', JSON.stringify(mockTokens));

    const mockConfig: any = { headers: {} };
    const resolvedConfig = await requestInterceptorCallback(mockConfig);

    expect(resolvedConfig.headers.Authorization).toBe('Bearer jwt-access-token');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('tokens');
  });

  test('Request Interceptor - should proceed without Authorization header when no tokens exist', async () => {
    const mockConfig: any = { headers: {} };
    const resolvedConfig = await requestInterceptorCallback(mockConfig);

    expect(resolvedConfig.headers.Authorization).toBeUndefined();
  });

  test('Response Interceptor - should forward successful responses directly', () => {
    const mockResponse = { 
      status: 200, 
      data: { success: true, data: 'payload' },
      config: { method: 'GET', url: '/test' }
    };
    const result = responseInterceptorSuccessCallback(mockResponse);
    expect(result).toEqual(mockResponse);
  });

  test('Response Interceptor - should trigger token refresh upon 401 and retry the original request', async () => {
    const mockTokens = { token: 'old-access-token', refreshToken: 'old-refresh-token' };
    await SecureStore.setItemAsync('tokens', JSON.stringify(mockTokens));

    // Mock axios.post for the refresh endpoint call
    (axios.post as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: {
        success: true,
        data: { token: 'new-access-token', refreshToken: 'new-refresh-token' }
      }
    });

    // Mock original request config
    const mockOriginalRequest = {
      method: 'GET',
      url: '/leave/balances',
      headers: { Authorization: 'Bearer old-access-token' },
    };

    const mock401Error: any = {
      response: { status: 401 },
      config: mockOriginalRequest,
    };

    // Directly call error interceptor
    const interceptorPromise = responseInterceptorErrorCallback(mock401Error);
    
    // We expect it to resolve eventually with the retried client call
    await expect(interceptorPromise).resolves.toBeDefined();

    // Verify token refresh endpoints are called correctly
    expect(axios.post).toHaveBeenCalledWith(`${API_BASE_URL}/auth/refresh`, {
      refreshToken: 'old-refresh-token',
    });

    // Verify new tokens are saved securely
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'tokens',
      JSON.stringify({ token: 'new-access-token', refreshToken: 'new-refresh-token' })
    );

    // Verify retry includes the new Bearer token
    expect(mockOriginalRequest.headers.Authorization).toBe('Bearer new-access-token');
  });

  test('Response Interceptor - should clear session and reject with SESSION_EXPIRED if token refresh fails', async () => {
    const mockTokens = { token: 'old-access-token', refreshToken: 'old-refresh-token' };
    await SecureStore.setItemAsync('tokens', JSON.stringify(mockTokens));

    // Mock refresh endpoint throwing an error (expired refresh token)
    (axios.post as jest.Mock).mockRejectedValueOnce(new Error('Refresh Token Expired'));

    const mock401Error: any = {
      response: { status: 401 },
      config: {
        method: 'GET',
        url: '/leave/balances',
        headers: { Authorization: 'Bearer old-access-token' },
      },
    };

    // Call error interceptor, expecting it to reject with SESSION_EXPIRED
    await expect(responseInterceptorErrorCallback(mock401Error)).rejects.toThrow('SESSION_EXPIRED');

    // Storage should be completely scrubbed
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('tokens');
  });
});
