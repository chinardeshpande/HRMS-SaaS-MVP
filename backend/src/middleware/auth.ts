import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { AppError } from './errorHandler';
import { UserRole } from '../../../shared/types';

// Extend Express Request type to include user and tenant
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        tenantId: string;
        email: string;
        role: UserRole;
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
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No authentication token provided', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      email: decoded.email,
      role: decoded.role,
    };

    // Also set tenantId separately for easier access
    req.tenantId = decoded.tenantId;

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
