import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Department } from '../models/Department';
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
    const department = departmentRepo.create({
      ...req.body,
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
    const department = await departmentRepo.findOne({
      where: { departmentId: id, tenantId },
    });

    if (!department) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Department not found' }, 404);
    }

    Object.assign(department, req.body);
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
