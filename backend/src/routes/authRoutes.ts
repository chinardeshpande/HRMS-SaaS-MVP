import { NextFunction, Request, Response, Router } from 'express';
import authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const profileUploadDir = path.join(__dirname, '../../uploads/profiles');
if (!fs.existsSync(profileUploadDir)) {
  fs.mkdirSync(profileUploadDir, { recursive: true });
}

const profilePhotoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, profileUploadDir),
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      cb(null, `${req.user?.userId || 'user'}-${Date.now()}${extension}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Only JPG, PNG, or WebP images are allowed'));
  },
});

const handleProfilePhotoUpload = (req: Request, res: Response, next: NextFunction) => {
  profilePhotoUpload.single('file')(req as any, res as any, (error: any) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const isFileTooLarge = error.code === 'LIMIT_FILE_SIZE';
      res.status(isFileTooLarge ? 413 : 400).json({
        success: false,
        error: {
          code: error.code,
          message: isFileTooLarge
            ? 'Profile photo must be 2 MB or smaller.'
            : 'Unable to process profile photo upload.',
        },
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: error.message || 'Only JPG, PNG, or WebP images are allowed.',
      },
    });
  });
};

// Public routes
router.post('/login', authController.login);
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.patch('/me', authenticate, authController.updateCurrentUserProfile);
router.post('/change-password', authenticate, authController.changePassword);
router.post(
  '/profile-photo',
  authenticate,
  handleProfilePhotoUpload,
  authController.uploadProfilePhoto
);

export default router;
