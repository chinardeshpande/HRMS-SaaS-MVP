import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Department } from '../models/Department';
import { Employee } from '../models/Employee';
import { sendSuccess, sendError, sendCreated } from '../utils/responses';

export const getDepartments = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    const departmentRepo = AppDataSource.getRepository(Department);
    const departments = await departmentRepo.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });

    return sendSuccess(res, departments);
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    return sendError(res, { code: 'FETCH_ERROR', message: error.message || 'Failed to fetch departments' }, 500);
  }
};

export const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    const departmentRepo = AppDataSource.getRepository(Department);
    const department = await departmentRepo.findOne({
      where: { departmentId: id, tenantId },
    });

    if (!department) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Department not found' }, 404);
    }

    return sendSuccess(res, department);
  } catch (error: any) {
    console.error('Error fetching department:', error);
    return sendError(res, { code: 'FETCH_ERROR', message: error.message || 'Failed to fetch department' }, 500);
  }
};

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    const departmentRepo = AppDataSource.getRepository(Department);
    const name = String(req.body.name || '').trim();

    if (!name) {
      return sendError(res, { code: 'VALIDATION_ERROR', message: 'Department name is required' }, 400);
    }

    const existing = await departmentRepo.findOne({
      where: { name, tenantId },
    });

    if (existing) {
      return sendError(res, { code: 'DUPLICATE', message: 'Department with this name already exists' }, 400);
    }

    if (req.body.parentDeptId) {
      const parent = await departmentRepo.findOne({
        where: { departmentId: req.body.parentDeptId, tenantId },
      });

      if (!parent) {
        return sendError(res, { code: 'VALIDATION_ERROR', message: 'Parent department not found' }, 400);
      }
    }

    const department = departmentRepo.create({
      ...req.body,
      name,
      tenantId,
    });

    await departmentRepo.save(department);
    return sendCreated(res, department);
  } catch (error: any) {
    console.error('Error creating department:', error);
    return sendError(res, { code: 'CREATE_ERROR', message: error.message || 'Failed to create department' }, 500);
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    const departmentRepo = AppDataSource.getRepository(Department);
    const name = req.body.name !== undefined ? String(req.body.name || '').trim() : undefined;

    if (req.body.name !== undefined && !name) {
      return sendError(res, { code: 'VALIDATION_ERROR', message: 'Department name is required' }, 400);
    }

    const department = await departmentRepo.findOne({
      where: { departmentId: id, tenantId },
    });

    if (!department) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Department not found' }, 404);
    }

    if (req.body.parentDeptId === id) {
      return sendError(res, { code: 'VALIDATION_ERROR', message: 'A department cannot be its own parent' }, 400);
    }

    if (req.body.parentDeptId) {
      const parent = await departmentRepo.findOne({
        where: { departmentId: req.body.parentDeptId, tenantId },
      });

      if (!parent) {
        return sendError(res, { code: 'VALIDATION_ERROR', message: 'Parent department not found' }, 400);
      }
    }

    if (name && name !== department.name) {
      const existing = await departmentRepo.findOne({
        where: { name, tenantId },
      });

      if (existing && existing.departmentId !== id) {
        return sendError(res, { code: 'DUPLICATE', message: 'Department with this name already exists' }, 400);
      }
    }

    Object.assign(department, req.body, name ? { name } : {});
    await departmentRepo.save(department);

    return sendSuccess(res, department);
  } catch (error: any) {
    console.error('Error updating department:', error);
    return sendError(res, { code: 'UPDATE_ERROR', message: error.message || 'Failed to update department' }, 500);
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    const departmentRepo = AppDataSource.getRepository(Department);
    const employeeRepo = AppDataSource.getRepository(Employee);

    const [employeeCount, childDepartmentCount] = await Promise.all([
      employeeRepo.count({ where: { departmentId: id, tenantId } }),
      departmentRepo.count({ where: { parentDeptId: id, tenantId } }),
    ]);

    if (employeeCount > 0) {
      return sendError(res, { code: 'IN_USE', message: 'Cannot delete department with assigned employees' }, 400);
    }

    if (childDepartmentCount > 0) {
      return sendError(res, { code: 'IN_USE', message: 'Cannot delete department with sub-departments' }, 400);
    }

    const result = await departmentRepo.delete({
      departmentId: id,
      tenantId,
    });

    if (result.affected === 0) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Department not found' }, 404);
    }

    return sendSuccess(res, null);
  } catch (error: any) {
    console.error('Error deleting department:', error);
    return sendError(res, { code: 'DELETE_ERROR', message: error.message || 'Failed to delete department' }, 500);
  }
};
