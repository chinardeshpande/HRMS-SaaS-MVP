import { Router } from 'express';
import dashboardService from '../services/dashboardService';
import { authenticate } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant';
import { UserRole } from '../../../shared/types';

const router = Router();

/**
 * @route   GET /api/v1/dashboard/stats
 * @desc    Get dashboard statistics for tenant (role-based)
 * @access  Private
 *
 * ROLE-BASED STATS:
 * - EMPLOYEE: Personal stats only
 * - MANAGER: Team stats (direct reports)
 * - HR_ADMIN/SYSTEM_ADMIN: Organization-wide stats
 */
router.get('/stats', authenticate, tenantIsolation, async (req, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const userRole = req.user!.role as UserRole;
    const employeeId = req.user!.employeeId || null;

    const stats = await dashboardService.getDashboardStatsByRole(
      tenantId,
      userRole,
      employeeId
    );

    res.json({
      success: true,
      data: stats,
      message: 'Dashboard statistics retrieved successfully',
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message,
    });
  }
});

export default router;
