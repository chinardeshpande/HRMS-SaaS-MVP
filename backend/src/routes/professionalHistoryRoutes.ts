import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/auth';
import professionalHistoryService from '../services/professionalHistoryService';
import managerTeamService from '../services/managerTeamService';
import { UserRole } from '../../../shared/types';
import { ManualEmploymentHistoryType } from '../models/ManualEmploymentHistory';

const router = Router();

// All routes require authentication
router.use(authenticate);

const canReadPositionHistory = async (req: Request, targetEmployeeId: string): Promise<boolean> => {
  const user = req.user!;

  if (user.role === UserRole.HR_ADMIN || user.role === UserRole.SYSTEM_ADMIN) {
    return true;
  }

  if (!user.employeeId) {
    return false;
  }

  if (user.employeeId === targetEmployeeId) {
    return true;
  }

  if (user.role === UserRole.MANAGER) {
    return managerTeamService.canAccessEmployee(user.employeeId, targetEmployeeId, user.tenantId);
  }

  return false;
};

const canReadCompensationHistory = (req: Request, targetEmployeeId: string): boolean => {
  const user = req.user!;

  if (user.role === UserRole.HR_ADMIN || user.role === UserRole.SYSTEM_ADMIN) {
    return true;
  }

  return !!user.employeeId && user.employeeId === targetEmployeeId;
};

const denyHistoryAccess = (res: Response) => res.status(403).json({
  success: false,
  error: {
    code: 'FORBIDDEN',
    message: 'You do not have permission to view this professional history',
  },
});

const parseManualHistoryPayload = (body: any) => {
  const allowedTypes = new Set(Object.values(ManualEmploymentHistoryType));
  const eventType = body.eventType;

  if (!allowedTypes.has(eventType)) {
    throw new Error('A valid event type is required');
  }

  if (!body.title || !String(body.title).trim()) {
    throw new Error('Title is required');
  }

  if (!body.effectiveDate || Number.isNaN(new Date(body.effectiveDate).getTime())) {
    throw new Error('A valid effective date is required');
  }

  const amount =
    body.amount === undefined || body.amount === null || body.amount === ''
      ? undefined
      : Number(body.amount);

  if (amount !== undefined && Number.isNaN(amount)) {
    throw new Error('Amount must be numeric');
  }

  return {
    eventType,
    title: String(body.title),
    effectiveDate: new Date(body.effectiveDate),
    description: body.description === undefined ? undefined : body.description,
    fromValue: body.fromValue === undefined ? undefined : body.fromValue,
    toValue: body.toValue === undefined ? undefined : body.toValue,
    amount,
    currency: body.currency === undefined ? undefined : body.currency,
    notes: body.notes === undefined ? undefined : body.notes,
  };
};

/**
 * GET /api/v1/professional-history/employee/:employeeId
 * Get combined professional history for an employee
 */
router.get('/employee/:employeeId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { employeeId } = req.params;

    if (!(await canReadPositionHistory(req, employeeId)) || !canReadCompensationHistory(req, employeeId)) {
      return denyHistoryAccess(res);
    }

    const history = await professionalHistoryService.getCombinedHistory(tenantId, employeeId);

    res.json({
      success: true,
      data: history,
      message: 'Professional history retrieved successfully',
    });
  } catch (error: any) {
    console.error('Error fetching professional history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch professional history',
      error: error.message,
    });
  }
});

/**
 * POST /api/v1/professional-history/manual/:employeeId
 * Create manual employment history entry
 */
router.post(
  '/manual/:employeeId',
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { employeeId } = req.params;
      const payload = parseManualHistoryPayload(req.body);

      const entry = await professionalHistoryService.createManualEmploymentHistory({
        tenantId,
        employeeId,
        ...payload,
        createdBy: req.user!.employeeId,
      });

      res.status(201).json({
        success: true,
        data: entry,
        message: 'Manual employment history entry created successfully',
      });
    } catch (error: any) {
      const status = error.message === 'Employee not found' ? 404 : 400;
      res.status(status).json({
        success: false,
        error: {
          code: status === 404 ? 'NOT_FOUND' : 'VALIDATION_ERROR',
          message: error.message || 'Failed to create manual employment history entry',
        },
      });
    }
  }
);

/**
 * PUT /api/v1/professional-history/manual/:manualHistoryId
 * Update manual employment history entry
 */
router.put(
  '/manual/:manualHistoryId',
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { manualHistoryId } = req.params;
      const payload = parseManualHistoryPayload(req.body);

      const entry = await professionalHistoryService.updateManualEmploymentHistory(
        tenantId,
        manualHistoryId,
        {
          ...payload,
          updatedBy: req.user!.employeeId,
        }
      );

      if (!entry) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Manual employment history entry not found' },
        });
      }

      res.json({
        success: true,
        data: entry,
        message: 'Manual employment history entry updated successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message || 'Failed to update manual employment history entry',
        },
      });
    }
  }
);

/**
 * DELETE /api/v1/professional-history/manual/:manualHistoryId
 * Delete manual employment history entry
 */
router.delete(
  '/manual/:manualHistoryId',
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN),
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { manualHistoryId } = req.params;
      const deleted = await professionalHistoryService.deleteManualEmploymentHistory(
        tenantId,
        manualHistoryId
      );

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Manual employment history entry not found' },
        });
      }

      res.json({
        success: true,
        data: { manualHistoryId },
        message: 'Manual employment history entry deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: error.message || 'Failed to delete manual employment history entry',
        },
      });
    }
  }
);

/**
 * GET /api/v1/professional-history/position/:employeeId
 * Get position history for an employee
 */
router.get('/position/:employeeId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { employeeId } = req.params;

    if (!(await canReadPositionHistory(req, employeeId))) {
      return denyHistoryAccess(res);
    }

    const history = await professionalHistoryService.getPositionHistory(tenantId, employeeId);

    res.json({
      success: true,
      data: history,
      message: 'Position history retrieved successfully',
    });
  } catch (error: any) {
    console.error('Error fetching position history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch position history',
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/professional-history/compensation/:employeeId
 * Get compensation history for an employee
 */
router.get('/compensation/:employeeId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { employeeId } = req.params;

    if (!canReadCompensationHistory(req, employeeId)) {
      return denyHistoryAccess(res);
    }

    const history = await professionalHistoryService.getCompensationHistory(tenantId, employeeId);

    res.json({
      success: true,
      data: history,
      message: 'Compensation history retrieved successfully',
    });
  } catch (error: any) {
    console.error('Error fetching compensation history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch compensation history',
      error: error.message,
    });
  }
});

export default router;
