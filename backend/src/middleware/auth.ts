import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { AppError } from './errorHandler';
import { UserRole } from '../../../shared/types';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';

// Extend Express Request type to include user and tenant
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        tenantId: string;
        email: string;
        role: UserRole;
        employeeId?: string;
      };
      tenantId?: string;
    }
  }
}

export interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: UserRole;
  employeeId?: string;
}

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header or query parameters
    let token = '';
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    } else if (req.query && req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      throw new AppError('No authentication token provided', 401, 'UNAUTHORIZED');
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    const user = await AppDataSource.getRepository(User).findOne({
      where: {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        isActive: true,
      },
    });

    if (!user) {
      throw new AppError('User account is inactive or no longer exists', 401, 'ACCOUNT_INACTIVE');
    }

    const tenant = await AppDataSource.getRepository(Tenant).findOne({
      where: { tenantId: decoded.tenantId },
    });

    if (!tenant || tenant.status !== 'active') {
      throw new AppError('Tenant account is inactive', 403, 'TENANT_INACTIVE');
    }

    // Attach user to request
    req.user = {
      userId: user.userId,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
    };

    // Also set tenantId separately for easier access
    req.tenantId = user.tenantId;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid authentication token', 401, 'INVALID_TOKEN'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Authentication token has expired', 401, 'TOKEN_EXPIRED'));
    } else {
      next(error);
    }
  }
};

/**
 * Check if user has required role(s)
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        'You do not have permission to perform this action',
        403,
        'FORBIDDEN'
      );
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

      req.user = {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        email: decoded.email,
        role: decoded.role,
        employeeId: decoded.employeeId,
      };

      req.tenantId = decoded.tenantId;
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};

export default authenticate;
