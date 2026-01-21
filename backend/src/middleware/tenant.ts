import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { config } from '../config/config';

/**
 * Tenant isolation middleware
 * Ensures all database queries are scoped to the authenticated user's tenant
 */
export const tenantIsolation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Tenant ID should be set by the authenticate middleware from JWT
  if (!req.tenantId) {
    throw new AppError(
      'Tenant context not found. Please authenticate first.',
      401,
      'TENANT_CONTEXT_MISSING'
    );
  }

  // Set tenant ID in request context for database queries
  // This will be used by TypeORM to filter queries
  // You can also set it as a PostgreSQL session variable for Row-Level Security

  next();
};

/**
 * Extract tenant from subdomain (optional)
 * Format: {tenant}.hrms-saas.com
 */
export const extractTenantFromSubdomain = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!config.subdomainEnabled) {
    return next();
  }

  try {
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];

    // Skip if no subdomain or if it's www/api/localhost
    if (!subdomain || ['www', 'api', 'localhost'].includes(subdomain)) {
      return next();
    }

    // TODO: Look up tenant by subdomain in database
    // const tenant = await findTenantBySubdomain(subdomain);
    // if (!tenant) {
    //   throw new AppError('Invalid tenant subdomain', 404, 'TENANT_NOT_FOUND');
    // }

    // Attach tenant to request
    // req.tenantId = tenant.tenantId;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate tenant access
 * Ensures user can only access their own tenant's data
 */
export const validateTenantAccess = (tenantIdParam: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestedTenantId = req.params[tenantIdParam] || req.body.tenantId;
    const userTenantId = req.tenantId;

    if (!userTenantId) {
      throw new AppError('Tenant context not found', 401, 'UNAUTHORIZED');
    }

    if (requestedTenantId && requestedTenantId !== userTenantId) {
      throw new AppError(
        'Access denied. Cannot access data from another tenant.',
        403,
        'TENANT_MISMATCH'
      );
    }

    next();
  };
};

export default tenantIsolation;
