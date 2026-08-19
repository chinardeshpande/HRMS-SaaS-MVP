import request from 'supertest';
import app from '../../src/app';
import { TEST_PASSWORD, TEST_USERS } from '../setup/seedTestData';

export const api = request(app);
export const API_PREFIX = '/api/v1';

export interface TestUser {
  label: string;
  email: string;
  password: string;
  expectedRole: string;
  expectedTenantName?: string;
}

// Deterministic QA fixture account matrix.
// These users are created in tests/setup/globalSetup.ts against the dedicated test DB.
export const TEST_ACCOUNTS: Record<string, TestUser> = {
  SYSTEM_ADMIN: {
    label: 'System Admin (Tenant Owner)',
    email: TEST_USERS.SYSTEM_ADMIN,
    password: TEST_PASSWORD,
    expectedRole: 'system_admin',
    expectedTenantName: 'ACV Solutions Pvt Ltd',
  },
  HR_ADMIN: {
    label: 'ACV HR Admin',
    email: TEST_USERS.HR_ADMIN,
    password: TEST_PASSWORD,
    expectedRole: 'hr_admin',
    expectedTenantName: 'ACV Solutions Pvt Ltd',
  },
  PAYROLL_PARTNER: {
    label: 'ACV Payroll Partner',
    email: TEST_USERS.PAYROLL_PARTNER,
    password: TEST_PASSWORD,
    expectedRole: 'payroll_partner',
    expectedTenantName: 'ACV Solutions Pvt Ltd',
  },
  MANAGER: {
    label: 'ACV Manager',
    email: TEST_USERS.MANAGER,
    password: TEST_PASSWORD,
    expectedRole: 'manager',
    expectedTenantName: 'ACV Solutions Pvt Ltd',
  },
  EMPLOYEE: {
    label: 'ACV Employee',
    email: TEST_USERS.EMPLOYEE,
    password: TEST_PASSWORD,
    expectedRole: 'employee',
    expectedTenantName: 'ACV Solutions Pvt Ltd',
  },
  SECOND_TENANT_ADMIN: {
    label: 'Second Tenant Admin',
    email: TEST_USERS.SECOND_TENANT_ADMIN,
    password: TEST_PASSWORD,
    expectedRole: 'system_admin',
    expectedTenantName: 'Orbit QA Isolation Ltd',
  },
  SECOND_TENANT_EMPLOYEE: {
    label: 'Second Tenant Employee',
    email: TEST_USERS.SECOND_TENANT_EMPLOYEE,
    password: TEST_PASSWORD,
    expectedRole: 'employee',
    expectedTenantName: 'Orbit QA Isolation Ltd',
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
 * Returns null if login fails.
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
