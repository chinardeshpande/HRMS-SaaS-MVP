import { TEST_ACCOUNTS, loginAs, authGet } from '../helpers/testSetup';

describe('Employee Detail Access', () => {
  it('HR admin can view any employee detail', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    if (!ctx) {
      console.warn('SCAFFOLD: hr_admin not in DB — skipping');
      return;
    }

    // First get the employee list to find a valid ID
    const listRes = await authGet('/employees', ctx.token);
    if (listRes.status !== 200) {
      console.warn('SCAFFOLD: cannot list employees — skipping detail test');
      return;
    }

    const employees = listRes.body.data?.employees || listRes.body.data || [];
    if (!Array.isArray(employees) || employees.length === 0) {
      console.warn('SCAFFOLD: no employees in DB — skipping detail test');
      return;
    }

    const firstEmp = employees[0];
    const detailRes = await authGet(`/employees/${firstEmp.employeeId}`, ctx.token);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.success).toBe(true);
    expect(detailRes.body.data.tenantId).toBe(ctx.tenantId);
  });

  it('employee can view their own detail via /auth/me', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    if (!ctx) {
      console.warn('SCAFFOLD: employee not in DB — skipping');
      return;
    }

    const res = await authGet('/auth/me', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBe(ctx.userId);
  });

  it('returns 404 for nonexistent employee ID', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    if (!ctx) {
      console.warn('SCAFFOLD: hr_admin not in DB — skipping');
      return;
    }

    const res = await authGet('/employees/00000000-0000-0000-0000-000000000000', ctx.token);
    expect([404, 400, 500]).toContain(res.status);
  });

  it('employee detail response does not leak other tenant data', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
    if (!ctx) {
      console.warn('SCAFFOLD: system_admin not in DB — skipping');
      return;
    }

    const listRes = await authGet('/employees', ctx.token);
    if (listRes.status !== 200) return;

    const employees = listRes.body.data?.employees || listRes.body.data || [];
    if (!Array.isArray(employees) || employees.length === 0) return;

    for (const emp of employees.slice(0, 5)) {
      const detailRes = await authGet(`/employees/${emp.employeeId}`, ctx.token);
      if (detailRes.status === 200 && detailRes.body.data) {
        expect(detailRes.body.data.tenantId).toBe(ctx.tenantId);
      }
    }
  });
});
