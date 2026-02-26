import { Router } from 'express';
import { authenticate } from '../middleware/auth';
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
router.post('/', createDesignation);

// PUT /api/v1/designations/:id - Update designation
router.put('/:id', updateDesignation);

// DELETE /api/v1/designations/:id - Delete designation
router.delete('/:id', deleteDesignation);

export default router;
