import { TEST_ACCOUNTS, loginAs, authGet } from '../helpers/testSetup';

describe('Attendance Basic Flow', () => {
  it('unauthenticated request to attendance is rejected', async () => {
    const res = await authGet('/attendance/my-attendance', 'invalid-token');
    expect(res.status).toBe(401);
  });

  it('employee can view own attendance', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    if (!ctx) {
      console.warn('SCAFFOLD: employee not in DB — skipping');
      return;
    }

    const res = await authGet('/attendance/my-attendance', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('HR admin can view company-wide attendance', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    if (!ctx) {
      console.warn('SCAFFOLD: hr_admin not in DB — skipping');
      return;
    }

    const res = await authGet('/attendance/company-wide', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('employee cannot view company-wide attendance', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    if (!ctx) {
      console.warn('SCAFFOLD: employee not in DB — skipping');
      return;
    }

    const res = await authGet('/attendance/company-wide', ctx.token);
    expect(res.status).toBe(403);
  });

  it('employee cannot access attendance statistics', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    if (!ctx) {
      console.warn('SCAFFOLD: employee not in DB — skipping');
      return;
    }

    const res = await authGet('/attendance/statistics', ctx.token);
    expect(res.status).toBe(403);
  });

  it('HR admin can access attendance statistics', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    if (!ctx) {
      console.warn('SCAFFOLD: hr_admin not in DB — skipping');
      return;
    }

    const res = await authGet('/attendance/statistics', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('HR admin can access attendance by department', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    if (!ctx) {
      console.warn('SCAFFOLD: hr_admin not in DB — skipping');
      return;
    }

    const res = await authGet('/attendance/by-department', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
