/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SOCKET_URL?: string;
  // Add other env variables here as needed
}

interface Window {
  __AURA_CONFIG__?: Readonly<{
    apiUrl?: string;
    socketUrl?: string;
  }>;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
