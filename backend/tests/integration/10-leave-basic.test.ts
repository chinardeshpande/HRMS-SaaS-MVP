import { TEST_ACCOUNTS, loginAs, authGet, authPost, requireAuth } from '../helpers/testSetup';

describe('Leave Basic Flow', () => {
  it('unauthenticated request to leave is rejected', async () => {
    const res = await authGet('/leave/my-requests', 'invalid-token');
    expect(res.status).toBe(401);
  });

  it('employee can view own leave requests', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(ctx, TEST_ACCOUNTS.EMPLOYEE.label);

    const res = await authGet('/leave/my-requests', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('employee can view own leave balance', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(ctx, TEST_ACCOUNTS.EMPLOYEE.label);

    const res = await authGet('/leave/my-balance', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('employee can view leave policies', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(ctx, TEST_ACCOUNTS.EMPLOYEE.label);

    const res = await authGet('/leave/policies', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('employee cannot view all leave requests (HR-only)', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(ctx, TEST_ACCOUNTS.EMPLOYEE.label);

    const res = await authGet('/leave/all-requests', ctx.token);
    expect(res.status).toBe(403);
  });

  it('employee cannot view pending approvals', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(ctx, TEST_ACCOUNTS.EMPLOYEE.label);

    const res = await authGet('/leave/pending-approvals', ctx.token);
    expect(res.status).toBe(403);
  });

  it('manager CAN view pending approvals', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.MANAGER);
    requireAuth(ctx, TEST_ACCOUNTS.MANAGER.label);

    const res = await authGet('/leave/pending-approvals', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('HR admin CAN view all leave requests', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, TEST_ACCOUNTS.HR_ADMIN.label);

    const res = await authGet('/leave/all-requests', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('leave apply rejects invalid payload', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(ctx, TEST_ACCOUNTS.EMPLOYEE.label);

    const res = await authPost('/leave/apply', ctx.token).send({});
    expect([400, 422]).toContain(res.status);
  });
});
