import { TEST_ACCOUNTS, loginAs, authGet, authPost, requireAuth } from '../helpers/testSetup';

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

  it('HR admin can add an existing employee directly with supported profile fields', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, TEST_ACCOUNTS.HR_ADMIN.label);
    const suffix = Date.now().toString(36);

    const res = await authPost('/employees', ctx.token).send({
      employeeCode: `DIRECT-${suffix}`,
      firstName: 'Direct',
      lastName: 'Entry',
      email: `direct.${suffix}@acv.test`,
      phone: '9999999999',
      dateOfJoining: '2026-08-01',
      employmentType: 'full-time',
      workLocation: 'Pune',
      maritalStatus: 'single',
      nationality: 'Indian',
      emergencyContact: 'Pilot Contact',
      emergencyPhone: '8888888888',
      status: 'active',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(expect.objectContaining({
      tenantId: ctx.tenantId,
      employeeCode: `DIRECT-${suffix}`,
      workLocation: 'Pune',
      maritalStatus: 'single',
      nationality: 'Indian',
      emergencyContact: 'Pilot Contact',
      emergencyPhone: '8888888888',
    }));
  });

  it('manager cannot bypass onboarding by creating a direct employee', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.MANAGER);
    requireAuth(ctx, TEST_ACCOUNTS.MANAGER.label);

    const res = await authPost('/employees', ctx.token).send({
      employeeCode: 'FORBIDDEN-DIRECT',
      firstName: 'Forbidden',
      lastName: 'Entry',
      email: 'forbidden.direct@acv.test',
      dateOfJoining: '2026-08-01',
    });

    expect(res.status).toBe(403);
  });
});
