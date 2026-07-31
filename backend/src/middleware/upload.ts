import multer from 'multer';
import { config } from '../config/config';

// File filter - allow common document types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX. Got: ${file.mimetype}`));
  }
};

// Multer upload configuration
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: config.upload.maxSize,
  },
});

// Export single file upload middleware
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const uploadSingle: any = upload.single('file');

// Export multiple files upload middleware
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const uploadMultiple: any = upload.array('files', 10); // Max 10 files
