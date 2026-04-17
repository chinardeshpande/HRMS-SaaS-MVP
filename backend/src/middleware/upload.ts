import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req: any, file: Express.Multer.File, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req: any, file: Express.Multer.File, cb) => {
    // Generate unique filename: timestamp-originalname
    console.log('📁 [MULTER] Original filename from browser:', file.originalname);

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);

    console.log('📁 [MULTER] Extension:', ext);
    console.log('📁 [MULTER] Name without ext (raw):', nameWithoutExt);

    // Sanitize filename: remove special characters, replace spaces with hyphens
    // This fixes macOS screenshots which have non-breaking spaces and other special chars
    const sanitizedName = nameWithoutExt
      .replace(/[\u202F\u00A0]/g, ' ')  // Replace non-breaking spaces with regular spaces
      .replace(/[^\w\s.-]/g, '')         // Remove special characters except word chars, spaces, dots, hyphens
      .replace(/\s+/g, '-')              // Replace spaces with hyphens
      .replace(/-+/g, '-')               // Replace multiple hyphens with single hyphen
      .toLowerCase();                    // Convert to lowercase for consistency

    console.log('📁 [MULTER] Name sanitized:', sanitizedName);
    console.log('📁 [MULTER] Unique suffix:', uniqueSuffix);

    const finalFilename = `${sanitizedName}-${uniqueSuffix}${ext}`;
    console.log('📁 [MULTER] Final filename:', finalFilename);

    cb(null, finalFilename);
  },
});

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
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Export single file upload middleware
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const uploadSingle: any = upload.single('file');

// Export multiple files upload middleware
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const uploadMultiple: any = upload.array('files', 10); // Max 10 files
