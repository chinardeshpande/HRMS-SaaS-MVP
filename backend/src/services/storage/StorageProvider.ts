import { Readable } from 'stream';

export interface StoredObject {
  stream: Readable;
  contentType?: string;
  contentLength?: number;
}

export interface StorageProvider {
  put(key: string, buffer: Buffer, contentType: string): Promise<void>;
  getSignedUrl(key: string, ttlSeconds: number): Promise<string>;
  openRead(key: string): Promise<StoredObject>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
