import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/types';
import documentController from '../controllers/documentController';
import { config } from '../config/config';

const router = Router();

// Configure multer for file uploads
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
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: config.upload.maxSize
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
