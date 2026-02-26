import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Designation } from '../models/Designation';
import { sendSuccess, sendError, sendCreated } from '../utils/responses';

export const getDesignations = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    const designationRepo = AppDataSource.getRepository(Designation);
    const designations = await designationRepo.find({
      where: { tenantId },
      order: { level: 'ASC', name: 'ASC' },
    });

    return sendSuccess(res, designations);
  } catch (error: any) {
    console.error('Error fetching designations:', error);
    return sendError(res, { code: 'FETCH_ERROR', message: error.message || 'Failed to fetch designations' }, 500);
  }
};

export const getDesignationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    const designationRepo = AppDataSource.getRepository(Designation);
    const designation = await designationRepo.findOne({
      where: { designationId: id, tenantId },
    });

    if (!designation) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Designation not found' }, 404);
    }

    return sendSuccess(res, designation);
  } catch (error: any) {
    console.error('Error fetching designation:', error);
    return sendError(res, { code: 'FETCH_ERROR', message: error.message || 'Failed to fetch designation' }, 500);
  }
};

export const createDesignation = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    const designationRepo = AppDataSource.getRepository(Designation);

    // Check for duplicate
    const existing = await designationRepo.findOne({
      where: { name: req.body.name, tenantId },
    });

    if (existing) {
      return sendError(res, { code: 'DUPLICATE', message: 'Designation with this name already exists' }, 400);
    }

    const designation = designationRepo.create({
      ...req.body,
      tenantId,
    });

    await designationRepo.save(designation);
    return sendCreated(res, designation);
  } catch (error: any) {
    console.error('Error creating designation:', error);
    return sendError(res, { code: 'CREATE_ERROR', message: error.message || 'Failed to create designation' }, 500);
  }
};

export const updateDesignation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    const designationRepo = AppDataSource.getRepository(Designation);
    const designation = await designationRepo.findOne({
      where: { designationId: id, tenantId },
    });

    if (!designation) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Designation not found' }, 404);
    }

    Object.assign(designation, req.body);
    await designationRepo.save(designation);

    return sendSuccess(res, designation);
  } catch (error: any) {
    console.error('Error updating designation:', error);
    return sendError(res, { code: 'UPDATE_ERROR', message: error.message || 'Failed to update designation' }, 500);
  }
};

export const deleteDesignation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    const designationRepo = AppDataSource.getRepository(Designation);
    const result = await designationRepo.delete({
      designationId: id,
      tenantId,
    });

    if (result.affected === 0) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Designation not found' }, 404);
    }

    return sendSuccess(res, null);
  } catch (error: any) {
    console.error('Error deleting designation:', error);
    return sendError(res, { code: 'DELETE_ERROR', message: error.message || 'Failed to delete designation' }, 500);
  }
};
