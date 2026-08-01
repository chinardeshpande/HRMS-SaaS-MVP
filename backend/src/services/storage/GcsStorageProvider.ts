import { Storage } from '@google-cloud/storage';
import { StorageProvider } from './StorageProvider';

export const normalizeGcsKey = (key: string): string => {
  const keyWithoutLeadingSlash = key.replace(/^\/+/, '');
  return keyWithoutLeadingSlash.startsWith('uploads/')
    ? keyWithoutLeadingSlash.slice('uploads/'.length)
    : keyWithoutLeadingSlash;
};

export class GcsStorageProvider implements StorageProvider {
  private readonly bucket;

  constructor(bucketName: string, storage = new Storage()) {
    if (!bucketName) throw new Error('GCS bucket name is required');
    this.bucket = storage.bucket(bucketName);
  }

  async put(key: string, buffer: Buffer, contentType: string): Promise<void> {
    await this.bucket.file(normalizeGcsKey(key)).save(buffer, {
      resumable: false,
      validation: 'crc32c',
      metadata: {
        contentType,
        cacheControl: 'private, no-store',
      },
      preconditionOpts: { ifGenerationMatch: 0 },
    });
  }

  async getSignedUrl(key: string, ttlSeconds: number): Promise<string> {
    const [url] = await this.bucket.file(normalizeGcsKey(key)).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + ttlSeconds * 1000,
    });
    return url;
  }

  async delete(key: string): Promise<void> {
    await this.bucket.file(normalizeGcsKey(key)).delete({ ignoreNotFound: true });
  }

  async exists(key: string): Promise<boolean> {
    const [exists] = await this.bucket.file(normalizeGcsKey(key)).exists();
    return exists;
  }
}
