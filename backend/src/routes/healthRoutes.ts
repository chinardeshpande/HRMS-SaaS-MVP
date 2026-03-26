/**
 * Health Check Routes
 * Provides various health check endpoints for monitoring
 */

import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { config } from '../config/config';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  checks?: {
    [key: string]: {
      status: 'up' | 'down';
      message?: string;
      latency?: number;
    };
  };
}

/**
 * Basic health check
 * GET /api/health
 */
router.get('/', (req: Request, res: Response) => {
  const response: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: config.apiVersion,
  };

  res.status(200).json({
    success: true,
    data: response,
  });
});

/**
 * Detailed health check with dependency checks
 * GET /api/health/detailed
 */
router.get('/detailed', async (req: Request, res: Response) => {
  const checks: HealthCheckResponse['checks'] = {};
  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

  // Check database connection
  try {
    const dbStart = Date.now();
    await AppDataSource.query('SELECT 1');
    const dbLatency = Date.now() - dbStart;
    checks.database = {
      status: 'up',
      latency: dbLatency,
      message: `Connected to PostgreSQL`,
    };
  } catch (error) {
    checks.database = {
      status: 'down',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    overallStatus = 'unhealthy';
  }

  // Check file system access
  try {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.accessSync(uploadDir, fs.constants.R_OK | fs.constants.W_OK);
    checks.fileSystem = {
      status: 'up',
      message: 'Upload directory accessible',
    };
  } catch (error) {
    checks.fileSystem = {
      status: 'down',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    overallStatus = 'degraded';
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const memoryPercent = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);

  checks.memory = {
    status: memoryPercent < 90 ? 'up' : 'down',
    message: `${memoryUsedMB}MB / ${memoryTotalMB}MB (${memoryPercent}%)`,
  };

  if (memoryPercent > 90) {
    overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
  }

  const response: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: config.apiVersion,
    checks,
  };

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  res.status(statusCode).json({
    success: overallStatus !== 'unhealthy',
    data: response,
  });
});

/**
 * Database health check
 * GET /api/health/db
 */
router.get('/db', async (req: Request, res: Response) => {
  try {
    const start = Date.now();
    const result = await AppDataSource.query('SELECT NOW() as time, version() as version');
    const latency = Date.now() - start;

    res.status(200).json({
      success: true,
      data: {
        status: 'up',
        latency: `${latency}ms`,
        serverTime: result[0].time,
        version: result[0].version,
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'DB_UNAVAILABLE',
        message: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * Readiness check (Kubernetes-style)
 * Returns 200 only if the service is ready to handle requests
 * GET /api/health/ready
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if database is connected
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }

    await AppDataSource.query('SELECT 1');

    res.status(200).json({
      success: true,
      data: {
        status: 'ready',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'NOT_READY',
        message: 'Service is not ready to handle requests',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * Liveness check (Kubernetes-style)
 * Returns 200 if the application is alive (even if not ready)
 * GET /api/health/live
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

/**
 * Startup check (Kubernetes-style)
 * Returns 200 when the application has completed startup
 * GET /api/health/startup
 */
router.get('/startup', async (req: Request, res: Response) => {
  try {
    // Check if all critical components are initialized
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }

    res.status(200).json({
      success: true,
      data: {
        status: 'started',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'STARTUP_INCOMPLETE',
        message: 'Application startup not complete',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

export default router;
