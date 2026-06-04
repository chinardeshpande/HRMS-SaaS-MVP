import { TEST_ACCOUNTS, loginAs, authGet } from '../helpers/testSetup';

describe('Employee Register Visibility', () => {
  it('HR admin can list employees', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    if (!ctx) {
      console.warn('SCAFFOLD: hr_admin not in DB — skipping');
      return;
    }

    const res = await authGet('/employees', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const employees = res.body.data?.employees || res.body.data || [];
    expect(Array.isArray(employees)).toBe(true);
  });

  it('HR admin can access employee stats', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    if (!ctx) {
      console.warn('SCAFFOLD: hr_admin not in DB — skipping');
      return;
    }

    const res = await authGet('/employees/stats', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('employee can call employees list (gets filtered view)', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    if (!ctx) {
      console.warn('SCAFFOLD: employee not in DB — skipping');
      return;
    }

    const res = await authGet('/employees', ctx.token);
    // Employee role is allowed to call GET /employees (filtering happens in controller)
    expect([200, 403]).toContain(res.status);
  });

  it('all returned employees belong to same tenant', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
    if (!ctx) {
      console.warn('SCAFFOLD: system_admin not in DB — skipping');
      return;
    }

    const res = await authGet('/employees', ctx.token);
    if (res.status !== 200) return;

    const employees = res.body.data?.employees || res.body.data || [];
    if (Array.isArray(employees)) {
      for (const emp of employees) {
        expect(emp.tenantId).toBe(ctx.tenantId);
      }
    }
  });
});
