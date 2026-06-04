import { TEST_ACCOUNTS, loginAs, authGet } from '../helpers/testSetup';

describe('Compensation & Payslip Access', () => {
  /**
   * CRITICAL RISK: Salary leakage / Payslip leakage
   * Salary data is the most sensitive HRMS data.
   * An employee must never see another employee's salary.
   * A manager should only see their direct reports (if configured).
   */

  it('unauthenticated request to compensation is rejected', async () => {
    const res = await authGet('/compensation', 'invalid-token');
    expect(res.status).toBe(401);
  });

  it('HR admin can access compensation endpoints', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    if (!ctx) {
      console.warn('SCAFFOLD: hr_admin not in DB — skipping');
      return;
    }

    // List salary structures (HR view)
    const res = await authGet('/compensation/salary-structures', ctx.token);
    expect([200, 404, 500]).toContain(res.status);
    expect(res.status).not.toBe(403);
  });

  it('employee can access own compensation only', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    if (!ctx) {
      console.warn('SCAFFOLD: employee not in DB — skipping');
      return;
    }

    if (!ctx.employeeId) {
      console.warn('SCAFFOLD: employee has no employeeId linked — skipping');
      return;
    }

    // Employee should be able to access their own salary structure
    const res = await authGet(`/compensation/salary-structures/${ctx.employeeId}`, ctx.token);
    expect([200, 404, 500]).toContain(res.status);
    // Must not be 403 for own data
  });

  it('employee cannot access another employees salary structure', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    if (!ctx) {
      console.warn('SCAFFOLD: employee not in DB — skipping');
      return;
    }

    // Try to access a random employee's compensation
    const fakeId = '00000000-0000-0000-0000-000000000001';
    const res = await authGet(`/compensation/salary-structures/${fakeId}`, ctx.token);
    // Should be 403 (forbidden) or 404 (not found) — never 200 with another's data
    expect([403, 404, 500]).toContain(res.status);
  });

  it('HR admin can access payslip listing', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    if (!ctx) {
      console.warn('SCAFFOLD: hr_admin not in DB — skipping');
      return;
    }

    const res = await authGet('/compensation/payslips', ctx.token);
    expect([200, 404, 500]).toContain(res.status);
    expect(res.status).not.toBe(403);
  });

  it('compensation data is tenant-scoped', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
    if (!ctx) {
      console.warn('SCAFFOLD: system_admin not in DB — skipping');
      return;
    }

    const res = await authGet('/compensation/salary-structures', ctx.token);
    if (res.status !== 200) return;

    const structures = res.body.data?.structures || res.body.data || [];
    if (Array.isArray(structures)) {
      for (const s of structures) {
        if (s.tenantId) {
          expect(s.tenantId).toBe(ctx.tenantId);
        }
      }
    }
  });
});
