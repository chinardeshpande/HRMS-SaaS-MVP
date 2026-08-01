import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import { StorageProvider } from './StorageProvider';

export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly rootDir: string) {}

  private resolveKey(key: string): string {
    if (
      !key ||
      path.isAbsolute(key) ||
      key.includes('\\') ||
      key.split('/').some((segment) => segment === '..' || segment === '.')
    ) {
      throw new Error('Invalid storage key');
    }
    const normalized = path.posix.normalize(key);
    const resolved = path.resolve(this.rootDir, normalized);
    const root = path.resolve(this.rootDir);
    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
      throw new Error('Invalid storage key');
    }
    return resolved;
  }

  async put(key: string, buffer: Buffer, _contentType: string): Promise<void> {
    const target = this.resolveKey(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, buffer, { flag: 'wx' });
  }

  async getSignedUrl(key: string, _ttlSeconds: number): Promise<string> {
    if (!(await this.exists(key))) throw new Error('Stored object not found');
    return `/uploads/${key.split('/').map(encodeURIComponent).join('/')}`;
  }

  async openRead(key: string) {
    const target = this.resolveKey(key);
    const stats = await fs.stat(target);
    return { stream: createReadStream(target), contentLength: stats.size };
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolveKey(key));
    } catch (error: any) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolveKey(key));
      return true;
    } catch {
      return false;
    }
  }
}
