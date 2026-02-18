import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/departments - Get all departments
router.get('/', getDepartments);

// GET /api/v1/departments/:id - Get department by ID
router.get('/:id', getDepartmentById);

// POST /api/v1/departments - Create new department
router.post('/', createDepartment);

// PUT /api/v1/departments/:id - Update department
router.put('/:id', updateDepartment);

// DELETE /api/v1/departments/:id - Delete department
router.delete('/:id', deleteDepartment);

export default router;
