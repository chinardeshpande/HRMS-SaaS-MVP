import { TEST_ACCOUNTS, loginAs, authGet } from '../helpers/testSetup';

describe('Compensation & Payslip Access', () => {
  /**
   * CRITICAL RISK: Salary leakage / Payslip leakage.
   * Salary data is the most sensitive HRMS data. These tests use the real
   * compensation route contract instead of non-existent list endpoints.
   */

  it('unauthenticated request to compensation is rejected', async () => {
    const res = await authGet('/compensation/employees/00000000-0000-0000-0000-000000000000', 'invalid-token');
    expect(res.status).toBe(401);
  });

  it('HR admin can access seeded employee compensation and payslip data', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    const employeeCtx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    expect(ctx).toBeTruthy();
    expect(employeeCtx?.employeeId).toBeTruthy();

    const res = await authGet(`/compensation/employees/${employeeCtx!.employeeId}`, ctx!.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.salaryStructures.length).toBeGreaterThan(0);
    expect(res.body.data.payslips.length).toBeGreaterThan(0);
    expect(Number(res.body.data.payslips[0].netPay)).toBe(52000);
  });

  it('employee can access own compensation only', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    expect(ctx?.employeeId).toBeTruthy();

    const res = await authGet(`/compensation/employees/${ctx!.employeeId}`, ctx!.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.salaryStructures.length).toBeGreaterThan(0);
    expect(res.body.data.payslips.length).toBeGreaterThan(0);
  });

  it('employee cannot access another employee compensation record', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    const managerCtx = await loginAs(TEST_ACCOUNTS.MANAGER);
    expect(ctx).toBeTruthy();
    expect(managerCtx?.employeeId).toBeTruthy();

    const res = await authGet(`/compensation/employees/${managerCtx!.employeeId}`, ctx!.token);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('compensation data is tenant-scoped', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
    const employeeCtx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    expect(ctx).toBeTruthy();
    expect(employeeCtx?.employeeId).toBeTruthy();

    const res = await authGet(`/compensation/employees/${employeeCtx!.employeeId}`, ctx!.token);
    expect(res.status).toBe(200);

    const structures = res.body.data?.salaryStructures || [];
    expect(structures.length).toBeGreaterThan(0);
    for (const structure of structures) {
      if (structure.tenantId) {
        expect(structure.tenantId).toBe(ctx!.tenantId);
      }
    }
  });
});
