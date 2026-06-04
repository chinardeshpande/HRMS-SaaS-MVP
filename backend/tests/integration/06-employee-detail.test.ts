import { TEST_ACCOUNTS, loginAs, authGet, requireAuth } from '../helpers/testSetup';

describe('Employee Detail Access', () => {
  it('HR admin can view any employee detail', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, TEST_ACCOUNTS.HR_ADMIN.label);

    // First get the employee list to find a valid ID
    const listRes = await authGet('/employees', ctx.token);
    expect(listRes.status).toBe(200);

    const employees = listRes.body.data?.employees || listRes.body.data || [];
    expect(Array.isArray(employees)).toBe(true);
    expect(employees.length).toBeGreaterThan(0);

    const firstEmp = employees[0];
    const detailRes = await authGet(`/employees/${firstEmp.employeeId}`, ctx.token);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.success).toBe(true);
    expect(detailRes.body.data.tenantId).toBe(ctx.tenantId);
  });

  it('employee can view their own detail via /auth/me', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(ctx, TEST_ACCOUNTS.EMPLOYEE.label);

    const res = await authGet('/auth/me', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBe(ctx.userId);
  });

  it('returns 404 for nonexistent employee ID', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, TEST_ACCOUNTS.HR_ADMIN.label);

    const res = await authGet('/employees/00000000-0000-0000-0000-000000000000', ctx.token);
    expect([404, 400]).toContain(res.status);
  });

  it('employee detail response does not leak other tenant data', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
    requireAuth(ctx, TEST_ACCOUNTS.SYSTEM_ADMIN.label);

    const listRes = await authGet('/employees', ctx.token);
    expect(listRes.status).toBe(200);

    const employees = listRes.body.data?.employees || listRes.body.data || [];
    expect(Array.isArray(employees)).toBe(true);
    expect(employees.length).toBeGreaterThan(0);

    for (const emp of employees.slice(0, 5)) {
      const detailRes = await authGet(`/employees/${emp.employeeId}`, ctx.token);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.tenantId).toBe(ctx.tenantId);
    }
  });
});
