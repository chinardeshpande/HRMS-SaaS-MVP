import path from 'path';
import { randomUUID } from 'crypto';
import { config } from '../../config/config';
import { GcsStorageProvider } from './GcsStorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';
import { StorageProvider } from './StorageProvider';

export const storageProvider: StorageProvider =
  config.storage.type === 'gcs'
    ? new GcsStorageProvider(config.storage.gcsBucket)
    : new LocalStorageProvider(path.resolve(config.upload.dir));

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
