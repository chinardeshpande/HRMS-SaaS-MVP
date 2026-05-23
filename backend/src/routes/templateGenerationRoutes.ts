import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/types';
import templateGenerationController from '../controllers/templateGenerationController';

const router = Router();

/**
 * @route   GET /api/v1/document-templates
 * @desc    Get all available document templates
 * @access  Private (all authenticated users)
 */
router.get(
  '/',
  authenticate,
  templateGenerationController.getTemplates
);

/**
 * @route   POST /api/v1/document-templates/generate/preview
 * @desc    Preview a generated document before saving
 * @access  Private (HR and above)
 */
router.post(
  '/generate/preview',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER),
  templateGenerationController.previewGeneratedDocument
);

/**
 * @route   POST /api/v1/document-templates/generate
 * @desc    Generate a document from template
 * @access  Private (HR and above)
 */
router.post(
  '/generate',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER),
  templateGenerationController.generateDocument
);

/**
 * @route   GET /api/v1/document-templates/history
 * @desc    Get document generation history
 * @access  Private (HR and above)
 */
router.get(
  '/history',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  templateGenerationController.getHistory
);

/**
 * @route   GET /api/v1/document-templates/generated/:documentId/download
 * @desc    Download a previously generated document
 * @access  Private (HR and above)
 */
router.get(
  '/generated/:documentId/download',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER),
  templateGenerationController.downloadGeneratedDocument
);

/**
 * @route   DELETE /api/v1/document-templates/generated/:documentId
 * @desc    Remove a generated document from active history
 * @access  Private (HR Admin and System Admin only)
 */
router.delete(
  '/generated/:documentId',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  templateGenerationController.deleteGeneratedDocument
);

/**
 * @route   GET /api/v1/document-templates/:templateId
 * @desc    Get a single template by ID
 * @access  Private (HR and above)
 */
router.get(
  '/:templateId',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER),
  templateGenerationController.getTemplateById
);

/**
 * @route   PUT /api/v1/document-templates/:templateId
 * @desc    Update a template
 * @access  Private (HR Admin and System Admin only)
 */
router.put(
  '/:templateId',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  templateGenerationController.updateTemplate
);

/**
 * @route   POST /api/v1/document-templates/:templateId/preview
 * @desc    Preview template with sample data
 * @access  Private (HR and above)
 */
router.post(
  '/:templateId/preview',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER),
  templateGenerationController.previewTemplate
);

export default router;
