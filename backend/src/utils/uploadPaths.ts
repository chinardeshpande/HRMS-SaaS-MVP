import path from 'path';

export const uploadRoot = path.resolve(process.cwd(), 'uploads');

export const uploadDir = (...segments: string[]) => path.join(uploadRoot, ...segments);

export const resolveUploadUrl = (fileUrl: string): string => {
  const normalizedUrl = fileUrl.replace(/^\/+uploads\/?/, '');
  return path.join(uploadRoot, normalizedUrl);
};
