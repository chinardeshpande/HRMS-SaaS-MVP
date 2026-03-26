import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { UserRole } from '../../../shared/types';

interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: UserRole;
  employeeId?: string;
}

/**
 * Optional authentication middleware - allows requests through even without valid token
 * But attaches user info if valid token is provided
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided - continue without user info
      next();
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

      // Attach user to request
      req.user = {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        email: decoded.email,
        role: decoded.role,
        employeeId: decoded.employeeId,
      };

      req.tenantId = decoded.tenantId;
    } catch (error) {
      // Invalid token - continue without user info
      console.log('Optional auth: Invalid token, continuing without auth');
    }

    next();
  } catch (error) {
    // Any error - just continue without user info
    next();
  }
};
