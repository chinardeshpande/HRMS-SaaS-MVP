import { Router } from 'express';
import dashboardService from '../services/dashboardService';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/v1/dashboard/stats
 * @desc    Get dashboard statistics for tenant
 * @access  Private
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const tenantId = req.user!.tenantId;

    const stats = await dashboardService.getDashboardStats(tenantId);

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
