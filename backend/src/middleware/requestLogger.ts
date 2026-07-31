import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const traceHeader = req.get('x-cloud-trace-context');
  const correlationId =
    req.get('x-request-id') ||
    traceHeader?.split('/')[0] ||
    randomUUID();

  res.setHeader('X-Request-ID', correlationId);

  // Log request
  logger.info(`Incoming ${req.method} ${req.path}`, {
    correlationId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel](`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`, {
      correlationId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
};

export default requestLogger;
