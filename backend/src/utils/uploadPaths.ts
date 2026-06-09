import fs from 'fs';
import path from 'path';

const configuredUploadDir = process.env.UPLOAD_DIR || 'uploads';

const resolveUploadRoot = (value: string): string =>
  path.isAbsolute(value) ? path.resolve(value) : path.resolve(process.cwd(), value);

const unique = (values: string[]): string[] => Array.from(new Set(values.map((value) => path.resolve(value))));

export const uploadRoots = unique([
  resolveUploadRoot(configuredUploadDir),
  path.resolve(process.cwd(), 'uploads'),
  path.resolve(process.cwd(), '..', 'uploads'),
  path.resolve(__dirname, '../../uploads'),
  path.resolve(__dirname, '../../../uploads'),
]);

export const uploadRoot = uploadRoots[0];

export const uploadDir = (...segments: string[]) => path.join(uploadRoot, ...segments);

export const normalizeUploadUrl = (fileUrl: string): string =>
  fileUrl
    .replace(/^file:\/\//, '')
    .replace(/^\/+uploads\/?/, '')
    .replace(/^uploads\/?/, '');

const isInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
};

export const findUploadPath = (fileUrl?: string | null): string | null => {
  if (!fileUrl) return null;
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;

  const filePath = fileUrl.replace(/^file:\/\//, '');
  if (path.isAbsolute(filePath) && fs.existsSync(filePath)) {
    return filePath;
  }

  const relativeUrl = normalizeUploadUrl(fileUrl);
  for (const root of uploadRoots) {
    const candidate = path.resolve(root, relativeUrl);
    if (isInside(root, candidate) && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
};

export const resolveUploadUrl = (fileUrl: string): string => {
  const found = findUploadPath(fileUrl);
  if (found && !/^https?:\/\//i.test(found)) return found;
  return path.join(uploadRoot, normalizeUploadUrl(fileUrl));
};

export const uploadPathExists = (fileUrl?: string | null): boolean => Boolean(findUploadPath(fileUrl));
