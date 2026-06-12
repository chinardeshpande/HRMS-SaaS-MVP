import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant';
import { UserRole } from '../../../shared/types';
import analyticsService from '../services/analyticsService';
import logger from '../utils/logger';

const router = Router();

router.get(
  '/metrics',
  authenticate, tenantIsolation,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER),
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      await analyticsService.initializeCoreMetrics(tenantId);
      const metrics = await analyticsService.getAvailableMetrics(tenantId);

      res.json({
        success: true,
        data: metrics.map((metric) => ({
          metricName: metric.metricName,
          displayName: metric.displayName,
          description: metric.description,
          category: metric.category,
          metricType: metric.metricType,
          unit: metric.unit,
          tags: metric.tags,
          lastCalculatedAt: metric.lastCalculatedAt,
          lastValue: metric.lastValue,
        })),
      });
    } catch (error: any) {
      logger.error('Error fetching analytics metrics:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch analytics metrics' },
      });
    }
  }
);

router.post(
  '/query',
  authenticate, tenantIsolation,
  authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER),
  async (req, res) => {
    try {
      const { tenantId, userId } = req.user!;
      const question = String(req.body.question || '').trim();

      if (!question) {
        return res.status(400).json({
          success: false,
          error: { message: 'Question is required' },
        });
      }

      await analyticsService.initializeCoreMetrics(tenantId);
      const result = await analyticsService.processQuery(tenantId, question, userId);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Error processing analytics query:', error);
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to process analytics query' },
      });
    }
  }
);

export default router;
