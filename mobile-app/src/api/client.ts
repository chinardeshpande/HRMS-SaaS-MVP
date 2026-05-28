import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse } from '../types';
import { getSecurely, saveSecurely, deleteSecurely } from '../utils/secureStore';

export const API_BASE_URL = __DEV__
  ? 'http://localhost:5000/api/v1'
  : 'https://aurorahr.in/api/v1';

console.log('📱 Mobile API Base URL:', API_BASE_URL);

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      async (config) => {
        console.log(`📡 API [REQ]: ${config.method?.toUpperCase()} ${config.url}`);
        
        try {
          const tokensStr = await getSecurely('tokens');
          if (tokensStr) {
            const { token } = JSON.parse(tokensStr);
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
              console.log('🔑 Attached JWT Access Token');
            }
          }
        } catch (e) {
          console.error('❌ Failed to retrieve tokens from secure storage:', e);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors and auto-refresh token
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ API [RES]: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
        return response;
      },
      async (error: AxiosError<ApiResponse<any>>) => {
        console.warn(`⚠️ API [ERR]: ${error.response?.status || 'NETWORK'} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
        
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
 
        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
 
          try {
            console.log('🔄 Access token expired. Attempting token refresh...');
            const tokensStr = await getSecurely('tokens');
            if (tokensStr) {
              const { refreshToken } = JSON.parse(tokensStr);
              if (refreshToken) {
                // Post to refresh token endpoint
                const response = await axios.post<ApiResponse<any>>(`${API_BASE_URL}/auth/refresh`, { refreshToken });
                
                if (response.data.success && response.data.data) {
                  const newTokens = response.data.data; // contains token & refreshToken
                  await saveSecurely('tokens', JSON.stringify(newTokens));
                  console.log('✅ Token refresh successful. Saving new tokens...');
 
                  // Retry the original request with new token
                  if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newTokens.token}`;
                  }
                  return this.client(originalRequest);
                }
              }
            }
          } catch (refreshError) {
            console.warn('⚠️ Refresh token failed or expired:', refreshError);
            
            // Clear storage and propagate a logout event / action
            await AsyncStorage.removeItem('user');
            await deleteSecurely('tokens');
            // We can let the auth store know by throwing a specific error or using store triggers
            return Promise.reject(new Error('SESSION_EXPIRED'));
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // GET request
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.get(url, config);
    return response.data;
  }

  // POST request
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.post(url, data, config);
    return response.data;
  }

  // PUT request
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.put(url, data, config);
    return response.data;
  }

  // PATCH request
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.patch(url, data, config);
    return response.data;
  }

  // DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.delete(url, config);
    return response.data;
  }
}

export const api = new ApiClient();
export default api;
