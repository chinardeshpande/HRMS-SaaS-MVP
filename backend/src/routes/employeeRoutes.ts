import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
} from '../controllers/employeeController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/employees/stats - Get employee statistics
router.get('/stats', getEmployeeStats);

// GET /api/v1/employees - Get all employees (with optional filters)
router.get('/', getEmployees);

// GET /api/v1/employees/:id - Get employee by ID
router.get('/:id', getEmployeeById);

// POST /api/v1/employees - Create new employee
router.post('/', createEmployee);

// PUT /api/v1/employees/:id - Update employee
router.put('/:id', updateEmployee);

// DELETE /api/v1/employees/:id - Soft delete employee
router.delete('/:id', deleteEmployee);

export default router;
