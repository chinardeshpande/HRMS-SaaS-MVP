import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant';
import { UserRole } from '../../../shared/types';
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
router.use(tenantIsolation);

// GET /api/v1/departments - Get all departments
router.get('/', getDepartments);

// GET /api/v1/departments/:id - Get department by ID
router.get('/:id', getDepartmentById);

// POST /api/v1/departments - Create new department
router.post('/', authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN), createDepartment);

// PUT /api/v1/departments/:id - Update department
router.put('/:id', authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN), updateDepartment);

// DELETE /api/v1/departments/:id - Delete department
router.delete('/:id', authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN), deleteDepartment);

export default router;
