import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { DocumentCategory } from '../models/DocumentCategory';
import { sendSuccess, sendError, sendCreated } from '../utils/responses';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    const categoryRepo = AppDataSource.getRepository(DocumentCategory);
    const categories = await categoryRepo.find({
      where: { tenantId, isActive: true },
      order: { isDefault: 'DESC', name: 'ASC' },
    });

    return sendSuccess(res, categories);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return sendError(res, { code: 'FETCH_ERROR', message: error.message || 'Failed to fetch categories' }, 500);
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    const categoryRepo = AppDataSource.getRepository(DocumentCategory);
    const category = await categoryRepo.findOne({
      where: { categoryId: id, tenantId },
    });

    if (!category) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Category not found' }, 404);
    }

    return sendSuccess(res, category);
  } catch (error: any) {
    console.error('Error fetching category:', error);
    return sendError(res, { code: 'FETCH_ERROR', message: error.message || 'Failed to fetch category' }, 500);
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    const { name, description, color, icon } = req.body;

    if (!name) {
      return sendError(res, { code: 'VALIDATION_ERROR', message: 'Category name is required' }, 400);
    }

    const categoryRepo = AppDataSource.getRepository(DocumentCategory);

    // Check if category already exists
    const existingCategory = await categoryRepo.findOne({
      where: { tenantId, name },
    });

    if (existingCategory) {
      return sendError(res, { code: 'DUPLICATE_ERROR', message: 'Category with this name already exists' }, 400);
    }

    const category = categoryRepo.create({
      tenantId,
      name,
      description,
      color,
      icon,
      isDefault: false,
    });

    await categoryRepo.save(category);
    return sendCreated(res, category);
  } catch (error: any) {
    console.error('Error creating category:', error);
    return sendError(res, { code: 'CREATE_ERROR', message: error.message || 'Failed to create category' }, 500);
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    const categoryRepo = AppDataSource.getRepository(DocumentCategory);
    const category = await categoryRepo.findOne({
      where: { categoryId: id, tenantId },
    });

    if (!category) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Category not found' }, 404);
    }

    // Don't allow updating default categories
    if (category.isDefault) {
      return sendError(res, { code: 'FORBIDDEN', message: 'Cannot update system default categories' }, 403);
    }

    const { name, description, color, icon } = req.body;

    // Check for duplicate name
    if (name && name !== category.name) {
      const existingCategory = await categoryRepo.findOne({
        where: { tenantId, name },
      });

      if (existingCategory) {
        return sendError(res, { code: 'DUPLICATE_ERROR', message: 'Category with this name already exists' }, 400);
      }
    }

    Object.assign(category, { name, description, color, icon });
    await categoryRepo.save(category);

    return sendSuccess(res, category);
  } catch (error: any) {
    console.error('Error updating category:', error);
    return sendError(res, { code: 'UPDATE_ERROR', message: error.message || 'Failed to update category' }, 500);
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    const categoryRepo = AppDataSource.getRepository(DocumentCategory);
    const category = await categoryRepo.findOne({
      where: { categoryId: id, tenantId },
    });

    if (!category) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Category not found' }, 404);
    }

    // Don't allow deleting default categories
    if (category.isDefault) {
      return sendError(res, { code: 'FORBIDDEN', message: 'Cannot delete system default categories' }, 403);
    }

    // Soft delete by marking as inactive
    category.isActive = false;
    await categoryRepo.save(category);

    return sendSuccess(res, { message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return sendError(res, { code: 'DELETE_ERROR', message: error.message || 'Failed to delete category' }, 500);
  }
};
