import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/types';
import {
  getDesignations,
  getDesignationById,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} from '../controllers/designationController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/designations - Get all designations
router.get('/', getDesignations);

// GET /api/v1/designations/:id - Get designation by ID
router.get('/:id', getDesignationById);

// POST /api/v1/designations - Create new designation
router.post('/', authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN), createDesignation);

// PUT /api/v1/designations/:id - Update designation
router.put('/:id', authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN), updateDesignation);

// DELETE /api/v1/designations/:id - Delete designation
router.delete('/:id', authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN), deleteDesignation);

export default router;
