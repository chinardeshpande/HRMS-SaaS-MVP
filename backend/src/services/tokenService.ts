import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';

export interface RefreshTokenPayload {
  userId: string;
  tenantId: string;
  tokenType: 'refresh';
}

export const signRefreshToken = (userId: string, tenantId: string): string =>
  jwt.sign(
    {
      userId,
      tenantId,
      tokenType: 'refresh',
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.refreshExpiry,
      jwtid: randomUUID(),
    } as jwt.SignOptions
  );

export const isRefreshTokenPayload = (payload: jwt.JwtPayload): payload is jwt.JwtPayload & RefreshTokenPayload => {
  if (typeof payload.userId !== 'string' || typeof payload.tenantId !== 'string') {
    return false;
  }

  if (payload.tokenType === 'refresh') {
    return true;
  }

  // Refresh tokens issued before tokenType was introduced contained only
  // userId and tenantId. Access and password-reset tokens carry other claims.
  return (
    payload.tokenType === undefined &&
    payload.email === undefined &&
    payload.role === undefined &&
    payload.employeeId === undefined &&
    payload.purpose === undefined
  );
};
