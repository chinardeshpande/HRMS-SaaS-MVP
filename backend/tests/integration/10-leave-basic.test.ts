import { TEST_ACCOUNTS, loginAs, authGet, authPost } from '../helpers/testSetup';

describe('Leave Basic Flow', () => {
  it('unauthenticated request to leave is rejected', async () => {
    const res = await authGet('/leave/my-requests', 'invalid-token');
    expect(res.status).toBe(401);
  });

  it('employee can view own leave requests', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    if (!ctx) {
      console.warn('SCAFFOLD: employee not in DB — skipping');
      return;
    }

    const res = await authGet('/leave/my-requests', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('employee can view own leave balance', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    if (!ctx) {
      console.warn('SCAFFOLD: employee not in DB — skipping');
      return;
    }

    const res = await authGet('/leave/my-balance', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('employee can view leave policies', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    if (!ctx) {
      console.warn('SCAFFOLD: employee not in DB — skipping');
      return;
    }

    const res = await authGet('/leave/policies', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('employee cannot view all leave requests (HR-only)', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    if (!ctx) {
      console.warn('SCAFFOLD: employee not in DB — skipping');
      return;
    }

    const res = await authGet('/leave/all-requests', ctx.token);
    expect(res.status).toBe(403);
  });

  it('employee cannot view pending approvals', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    if (!ctx) {
      console.warn('SCAFFOLD: employee not in DB — skipping');
      return;
    }

    const res = await authGet('/leave/pending-approvals', ctx.token);
    expect(res.status).toBe(403);
  });

  it('manager CAN view pending approvals', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.MANAGER);
    if (!ctx) {
      console.warn('SCAFFOLD: manager not in DB — skipping');
      return;
    }

    const res = await authGet('/leave/pending-approvals', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('HR admin CAN view all leave requests', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    if (!ctx) {
      console.warn('SCAFFOLD: hr_admin not in DB — skipping');
      return;
    }

    const res = await authGet('/leave/all-requests', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('leave apply rejects invalid payload', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    if (!ctx) {
      console.warn('SCAFFOLD: employee not in DB — skipping');
      return;
    }

    const res = await authPost('/leave/apply', ctx.token).send({});
    expect([400, 422]).toContain(res.status);
  });
});
