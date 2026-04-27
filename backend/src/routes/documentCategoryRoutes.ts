import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/documentCategoryController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/document-categories - Get all categories
router.get('/', getCategories);

// GET /api/v1/document-categories/:id - Get category by ID
router.get('/:id', getCategoryById);

// POST /api/v1/document-categories - Create new category
router.post('/', createCategory);

// PUT /api/v1/document-categories/:id - Update category
router.put('/:id', updateCategory);

// DELETE /api/v1/document-categories/:id - Delete category
router.delete('/:id', deleteCategory);

export default router;
