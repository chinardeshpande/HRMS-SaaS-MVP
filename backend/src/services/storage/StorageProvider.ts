export interface StorageProvider {
  put(key: string, buffer: Buffer, contentType: string): Promise<void>;
  getSignedUrl(key: string, ttlSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
