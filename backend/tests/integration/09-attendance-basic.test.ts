import { TEST_ACCOUNTS, loginAs, authGet, authPost, requireAuth } from '../helpers/testSetup';

describe('Attendance Basic Flow', () => {
  it('unauthenticated request to attendance is rejected', async () => {
    const res = await authGet('/attendance/my-attendance', 'invalid-token');
    expect(res.status).toBe(401);
  });

  it('employee can view own attendance', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(ctx, TEST_ACCOUNTS.EMPLOYEE.label);

    const res = await authGet('/attendance/my-attendance', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('HR admin can view company-wide attendance', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, TEST_ACCOUNTS.HR_ADMIN.label);

    const res = await authGet('/attendance/company-wide', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('employee cannot view company-wide attendance', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(ctx, TEST_ACCOUNTS.EMPLOYEE.label);

    const res = await authGet('/attendance/company-wide', ctx.token);
    expect(res.status).toBe(403);
  });

  it('employee cannot access attendance statistics', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(ctx, TEST_ACCOUNTS.EMPLOYEE.label);

    const res = await authGet('/attendance/statistics', ctx.token);
    expect(res.status).toBe(403);
  });

  it('HR admin can access attendance statistics', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, TEST_ACCOUNTS.HR_ADMIN.label);

    const res = await authGet('/attendance/statistics', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('HR admin can access attendance by department', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, TEST_ACCOUNTS.HR_ADMIN.label);

    const res = await authGet('/attendance/by-department', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('employee can clock in, cannot duplicate clock in, and can clock out', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.SECOND_TENANT_EMPLOYEE);
    requireAuth(ctx, TEST_ACCOUNTS.SECOND_TENANT_EMPLOYEE.label);

    const clockIn = await authPost('/attendance/clock-in', ctx.token).send({ location: 'WFH' });
    expect(clockIn.status).toBe(200);
    expect(clockIn.body.success).toBe(true);
    expect(clockIn.body.data.status).toBe('present');
    expect(clockIn.body.data.location).toBe('WFH');
    expect(clockIn.body.data.checkIn).toBeTruthy();

    const duplicateClockIn = await authPost('/attendance/clock-in', ctx.token).send({ location: 'Office' });
    expect(duplicateClockIn.status).toBe(400);
    expect(duplicateClockIn.body.success).toBe(false);
    expect(duplicateClockIn.body.error).toContain('Already clocked in today');

    const clockOut = await authPost('/attendance/clock-out', ctx.token).send({});
    expect(clockOut.status).toBe(200);
    expect(clockOut.body.success).toBe(true);
    expect(clockOut.body.data.checkOut).toBeTruthy();
    expect(Number(clockOut.body.data.workMinutes)).toBeGreaterThanOrEqual(0);
  });
});
