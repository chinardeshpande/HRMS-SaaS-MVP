import path from 'path';
import { randomUUID } from 'crypto';
import { pipeline } from 'stream/promises';
import { Response } from 'express';
import { config } from '../../config/config';
import { GcsStorageProvider } from './GcsStorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';
import { StorageProvider } from './StorageProvider';

export const storageProvider: StorageProvider =
  config.storage.type === 'gcs'
    ? new GcsStorageProvider(config.storage.gcsBucket)
    : new LocalStorageProvider(path.resolve(config.upload.dir));

const contentTypeForFilename = (filename: string): string => {
  const types: Record<string, string> = {
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.html': 'text/html; charset=utf-8',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  return types[path.extname(filename).toLowerCase()] || 'application/octet-stream';
};

export const streamStoredObject = async (
  res: Response,
  key: string,
  filename: string,
  fallbackContentType?: string
): Promise<void> => {
  const storedObject = await storageProvider.openRead(key);
  const safeDownloadName = path.basename(filename).replace(/[\r\n"]/g, '_');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${safeDownloadName}"; filename*=UTF-8''${encodeURIComponent(safeDownloadName)}`
  );
  res.setHeader(
    'Content-Type',
    storedObject.contentType || fallbackContentType || contentTypeForFilename(safeDownloadName)
  );
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (storedObject.contentLength !== undefined) {
    res.setHeader('Content-Length', storedObject.contentLength.toString());
  }
  await pipeline(storedObject.stream, res);
};

const safeFilename = (filename: string): string => {
  const extension = path.extname(filename).toLowerCase().replace(/[^a-z0-9.]/g, '');
  const stem = path
    .basename(filename, path.extname(filename))
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .toLowerCase();
  return `${stem || 'document'}-${randomUUID()}${extension}`;
};

export const employeeDocumentKey = (
  tenantId: string,
  employeeId: string,
  filename: string
): string =>
  `tenants/${encodeURIComponent(tenantId)}/employees/${encodeURIComponent(employeeId)}/${safeFilename(filename)}`;

export const tenantDocumentKey = (
  tenantId: string,
  category: string,
  filename: string
): string =>
  `tenants/${encodeURIComponent(tenantId)}/${category.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}/${safeFilename(filename)}`;
