import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/types';
import documentController from '../controllers/documentController';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents');

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, images, Word, and Excel files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload document
router.post(
  '/upload',
  authenticate,
  upload.single('file') as any,
  documentController.uploadDocument
);

// Upload multiple documents
router.post(
  '/upload-multiple',
  authenticate,
  upload.array('files', 10) as any, // Max 10 files
  documentController.uploadMultipleDocuments
);

// Get document by ID
router.get(
  '/:documentId',
  authenticate,
  documentController.getDocument
);

// Download document
router.get(
  '/:documentId/download',
  authenticate,
  documentController.downloadDocument
);

// Get all documents for an entity
router.get(
  '/entity/:entityType/:entityId',
  authenticate,
  documentController.getEntityDocuments
);

// Update document metadata
router.patch(
  '/:documentId',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  documentController.updateDocument
);

// Verify document (HR only)
router.post(
  '/:documentId/verify',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  documentController.verifyDocument
);

// Reject document (HR only)
router.post(
  '/:documentId/reject',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  documentController.rejectDocument
);

// Delete document
router.delete(
  '/:documentId',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  documentController.deleteDocument
);

export default router;
