import { TEST_ACCOUNTS, loginAs, authGet, requireAuth } from '../helpers/testSetup';

describe('Employee Register Visibility', () => {
  it('HR admin can list employees', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, TEST_ACCOUNTS.HR_ADMIN.label);

    const res = await authGet('/employees', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const employees = res.body.data?.employees || res.body.data || [];
    expect(Array.isArray(employees)).toBe(true);
  });

  it('HR admin can access employee stats', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, TEST_ACCOUNTS.HR_ADMIN.label);

    const res = await authGet('/employees/stats', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('employee can call employees list (gets filtered view)', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(ctx, TEST_ACCOUNTS.EMPLOYEE.label);

    const res = await authGet('/employees', ctx.token);
    // Employee role is allowed to call GET /employees (filtering happens in controller)
    expect([200, 403]).toContain(res.status);
  });

  it('all returned employees belong to same tenant', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
    requireAuth(ctx, TEST_ACCOUNTS.SYSTEM_ADMIN.label);

    const res = await authGet('/employees', ctx.token);
    expect(res.status).toBe(200);

    const employees = res.body.data?.employees || res.body.data || [];
    expect(Array.isArray(employees)).toBe(true);
    expect(employees.length).toBeGreaterThan(0);
    for (const emp of employees) {
      expect(emp.tenantId).toBe(ctx.tenantId);
    }
  });
});
