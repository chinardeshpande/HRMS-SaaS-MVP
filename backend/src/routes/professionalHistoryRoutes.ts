import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import professionalHistoryService from '../services/professionalHistoryService';
import managerTeamService from '../services/managerTeamService';
import { UserRole } from '../../../shared/types';

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
