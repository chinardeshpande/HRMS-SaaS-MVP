import jwt from 'jsonwebtoken';
import { api, API_PREFIX, TEST_ACCOUNTS, loginAs, authGet } from '../helpers/testSetup';

describe('Tenant Isolation', () => {
  /**
   * CRITICAL RISK: Tenant leakage
   * These tests verify that a user from one tenant cannot access another tenant's data.
   */

  it('forged tenantId in JWT is rejected or scoped correctly', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
    expect(ctx).toBeTruthy();

    // Forge a token with a different tenantId
    const forgedPayload = {
      userId: ctx!.userId,
      tenantId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      email: TEST_ACCOUNTS.SYSTEM_ADMIN.email,
      role: 'system_admin',
    };

    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
    const forgedToken = jwt.sign(forgedPayload, secret, { expiresIn: '1h' });

    // The server should reject this because the userId doesn't belong to the forged tenant
    const res = await authGet('/employees', forgedToken);
    expect(res.status).toBe(401);
  });

  it('employees endpoint returns only same-tenant data', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
    expect(ctx).toBeTruthy();

    const res = await authGet('/employees', ctx!.token);
    expect(res.status).toBe(200);

    const employees = res.body.data?.employees || res.body.data || [];
    if (Array.isArray(employees) && employees.length > 0) {
      // Every returned employee must belong to the same tenant
      for (const emp of employees) {
        expect(emp.tenantId).toBe(ctx!.tenantId);
      }
    }
  });

  it('two seeded tenants receive different tenant contexts and isolated employee lists', async () => {
    const acv = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
    const orbit = await loginAs(TEST_ACCOUNTS.SECOND_TENANT_ADMIN);
    expect(acv).toBeTruthy();
    expect(orbit).toBeTruthy();
    expect(acv!.tenantId).not.toBe(orbit!.tenantId);

    const acvEmployees = await authGet('/employees', acv!.token);
    const orbitEmployees = await authGet('/employees', orbit!.token);
    expect(acvEmployees.status).toBe(200);
    expect(orbitEmployees.status).toBe(200);

    const acvRows = acvEmployees.body.data?.employees || acvEmployees.body.data || [];
    const orbitRows = orbitEmployees.body.data?.employees || orbitEmployees.body.data || [];
    expect(acvRows.length).toBeGreaterThan(0);
    expect(orbitRows.length).toBeGreaterThan(0);
    expect(acvRows.every((employee: any) => employee.tenantId === acv!.tenantId)).toBe(true);
    expect(orbitRows.every((employee: any) => employee.tenantId === orbit!.tenantId)).toBe(true);
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
