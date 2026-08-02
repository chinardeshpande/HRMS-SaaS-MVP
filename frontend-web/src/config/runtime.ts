const LOCAL_API_URL = 'http://localhost:5000/api/v1';

const runtimeConfig = typeof window !== 'undefined' ? window.__AURA_CONFIG__ : undefined;

export const API_BASE_URL =
  runtimeConfig?.apiUrl || import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || LOCAL_API_URL;

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export const SOCKET_URL =
  runtimeConfig?.socketUrl || import.meta.env.VITE_SOCKET_URL || API_ORIGIN;
