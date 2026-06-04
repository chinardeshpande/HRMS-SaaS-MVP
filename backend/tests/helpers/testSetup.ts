import request from 'supertest';
import app from '../../src/app';

export const api = request(app);
export const API_PREFIX = '/api/v1';

export interface TestUser {
  label: string;
  email: string;
  password: string;
  expectedRole: string;
  expectedTenantName?: string;
}

// ACV Customer Zero test account matrix
// These accounts must exist in the database for integration tests to pass.
// If they don't exist, tests are marked as SCAFFOLD (expected to skip gracefully).
export const TEST_ACCOUNTS: Record<string, TestUser> = {
  SYSTEM_ADMIN: {
    label: 'System Admin (Tenant Owner)',
    email: 'chinar@acvsolutions.in',
    password: 'ACV@2026!',
    expectedRole: 'system_admin',
    expectedTenantName: 'ACV Solutions',
  },
  HR_ADMIN: {
    label: 'ACV HR Admin',
    email: 'hr@acvsolutions.in',
    password: 'ACV@2026!',
    expectedRole: 'hr_admin',
    expectedTenantName: 'ACV Solutions',
  },
  MANAGER: {
    label: 'ACV Manager',
    email: 'manager@acvsolutions.in',
    password: 'ACV@2026!',
    expectedRole: 'manager',
    expectedTenantName: 'ACV Solutions',
  },
  EMPLOYEE: {
    label: 'ACV Employee',
    email: 'employee@acvsolutions.in',
    password: 'ACV@2026!',
    expectedRole: 'employee',
    expectedTenantName: 'ACV Solutions',
  },
};

export interface AuthContext {
  token: string;
  refreshToken: string;
  userId: string;
  tenantId: string;
  role: string;
  employeeId?: string;
}

/**
 * Authenticate a test user and return tokens + context.
 * Returns null if login fails (account doesn't exist or wrong password).
 */
export async function loginAs(account: TestUser): Promise<AuthContext | null> {
  const res = await api
    .post(`${API_PREFIX}/auth/login`)
    .send({ email: account.email, password: account.password });

  if (res.status !== 200 || !res.body.success) {
    return null;
  }

  const { user, tokens } = res.body.data;
  return {
    token: tokens.token,
    refreshToken: tokens.refreshToken,
    userId: user.userId,
    tenantId: user.tenantId,
    role: user.role,
    employeeId: user.employeeId,
  };
}

/**
 * Create an authenticated supertest agent for a given token.
 */
export function authGet(path: string, token: string) {
  return api.get(`${API_PREFIX}${path}`).set('Authorization', `Bearer ${token}`);
}

export function authPost(path: string, token: string) {
  return api.post(`${API_PREFIX}${path}`).set('Authorization', `Bearer ${token}`);
}

export function authPut(path: string, token: string) {
  return api.put(`${API_PREFIX}${path}`).set('Authorization', `Bearer ${token}`);
}

export function authDelete(path: string, token: string) {
  return api.delete(`${API_PREFIX}${path}`).set('Authorization', `Bearer ${token}`);
}

/**
 * Skip test if auth context is null (account doesn't exist in DB).
 */
export function requireAuth(ctx: AuthContext | null, accountLabel: string): asserts ctx is AuthContext {
  if (!ctx) {
    throw new Error(
      `SCAFFOLD: ${accountLabel} account not available in database. ` +
      `Seed test accounts or configure .env to connect to a database with ACV data.`
    );
  }
}
