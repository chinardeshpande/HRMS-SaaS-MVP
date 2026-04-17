import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/types';
import multer from 'multer';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
} from '../controllers/employeeController';
import {
  bulkUploadEmployees,
  downloadEmployeeTemplate,
} from '../controllers/employeeBulkController';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

const router = Router();

// GET /api/v1/employees/template - Download CSV template for bulk upload
router.get('/template', authenticate, authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN), downloadEmployeeTemplate);

// GET /api/v1/employees/stats - Get employee statistics (all authenticated users, role-based in controller)
router.get('/stats', authenticate, getEmployeeStats);

// POST /api/v1/employees/bulk-upload - Bulk upload employees via CSV (HR and Admin only)
router.post(
  '/bulk-upload',
  authenticate,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  upload.single('file') as any,
  bulkUploadEmployees
);

// GET /api/v1/employees - Get all employees (role-based filtering in controller)
// Managers, HR, and Admins can access. Employees can technically call this but will only see themselves.
router.get('/', authenticate, getEmployees);

// GET /api/v1/employees/:id - Get employee by ID (role-based access check in controller)
router.get('/:id', authenticate, getEmployeeById);

// POST /api/v1/employees - Create new employee (HR and Admin only)
router.post('/', authenticate, authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN), createEmployee);

// PUT /api/v1/employees/:id - Update employee (HR and Admin only)
router.put('/:id', authenticate, authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN), updateEmployee);

// DELETE /api/v1/employees/:id - Soft delete employee (HR and Admin only)
router.delete('/:id', authenticate, authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN), deleteEmployee);

export default router;
