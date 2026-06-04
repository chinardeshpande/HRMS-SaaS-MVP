import jwt from 'jsonwebtoken';
import { api, API_PREFIX, TEST_ACCOUNTS, loginAs, authGet } from '../helpers/testSetup';

describe('Tenant Isolation', () => {
  /**
   * CRITICAL RISK: Tenant leakage
   * These tests verify that a user from one tenant cannot access another tenant's data.
   */

  it('forged tenantId in JWT is rejected or scoped correctly', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
    if (!ctx) {
      console.warn('SCAFFOLD: system_admin not in DB — skipping');
      return;
    }

    // Forge a token with a different tenantId
    const forgedPayload = {
      userId: ctx.userId,
      tenantId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      email: TEST_ACCOUNTS.SYSTEM_ADMIN.email,
      role: 'system_admin',
    };

    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
    const forgedToken = jwt.sign(forgedPayload, secret, { expiresIn: '1h' });

    // The server should reject this because the userId doesn't belong to the forged tenant
    const res = await authGet('/employees', forgedToken);
    // Expect either 401 (user not found for that tenant) or empty results (tenant-scoped)
    expect([401, 200]).toContain(res.status);
    if (res.status === 200) {
      // If 200, the response must be scoped to the forged (empty) tenant — no real data
      const employees = res.body.data?.employees || res.body.data || [];
      if (Array.isArray(employees)) {
        expect(employees.length).toBe(0);
      }
    }
  });

  it('employees endpoint returns only same-tenant data', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
    if (!ctx) {
      console.warn('SCAFFOLD: system_admin not in DB — skipping');
      return;
    }

    const res = await authGet('/employees', ctx.token);
    expect(res.status).toBe(200);

    const employees = res.body.data?.employees || res.body.data || [];
    if (Array.isArray(employees) && employees.length > 0) {
      // Every returned employee must belong to the same tenant
      for (const emp of employees) {
        expect(emp.tenantId).toBe(ctx.tenantId);
      }
    }
  });

  it('unauthenticated request to tenant-scoped endpoint returns 401', async () => {
    const endpoints = [
      '/employees',
      '/attendance/my-attendance',
      '/leave/my-requests',
      '/compensation',
      '/company-documents',
      '/departments',
    ];

    for (const endpoint of endpoints) {
      const res = await api.get(`${API_PREFIX}${endpoint}`);
      expect(res.status).toBe(401);
    }
  });
});
