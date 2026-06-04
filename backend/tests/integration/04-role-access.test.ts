import { TEST_ACCOUNTS, loginAs, authGet, authPost, authDelete, requireAuth } from '../helpers/testSetup';

describe('Role-Based Access Control', () => {
  /**
   * CRITICAL RISK: Role leakage
   * Verify that employees cannot access HR-only endpoints,
   * and managers cannot access system_admin endpoints.
   */

  describe('Employee role restrictions', () => {
    it('employee cannot create employees (HR-only)', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
      requireAuth(ctx, 'QA fixture account');
      const res = await authPost('/employees', ctx.token)
        .send({ firstName: 'Test', lastName: 'User', email: 'test@test.com' });
      expect(res.status).toBe(403);
    });

    it('employee cannot delete employees (HR-only)', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
      requireAuth(ctx, 'QA fixture account');
      const res = await authDelete('/employees/fake-id-12345', ctx.token);
      expect(res.status).toBe(403);
    });

    it('employee cannot access company-wide attendance', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
      requireAuth(ctx, 'QA fixture account');
      const res = await authGet('/attendance/company-wide', ctx.token);
      expect(res.status).toBe(403);
    });

    it('employee cannot access all leave requests (HR-only)', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
      requireAuth(ctx, 'QA fixture account');
      const res = await authGet('/leave/all-requests', ctx.token);
      expect(res.status).toBe(403);
    });

    it('employee cannot access leave statistics (HR-only)', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
      requireAuth(ctx, 'QA fixture account');
      const res = await authGet('/leave/statistics', ctx.token);
      expect(res.status).toBe(403);
    });

    it('employee cannot bulk-update attendance (HR-only)', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
      requireAuth(ctx, 'QA fixture account');
      const res = await authPost('/attendance/bulk-update', ctx.token).send({ records: [] });
      expect(res.status).toBe(403);
    });
  });

  describe('Manager role restrictions', () => {
    it('manager cannot create employees (HR-only)', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.MANAGER);
      requireAuth(ctx, 'QA fixture account');
      const res = await authPost('/employees', ctx.token)
        .send({ firstName: 'Test', lastName: 'User', email: 'test@test.com' });
      expect(res.status).toBe(403);
    });

    it('manager cannot delete employees (HR-only)', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.MANAGER);
      requireAuth(ctx, 'QA fixture account');
      const res = await authDelete('/employees/fake-id-12345', ctx.token);
      expect(res.status).toBe(403);
    });

    it('manager CAN access company-wide attendance', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.MANAGER);
      requireAuth(ctx, 'QA fixture account');
      const res = await authGet('/attendance/company-wide', ctx.token);
      // Manager is authorized for company-wide attendance
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('manager CAN access pending leave approvals', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.MANAGER);
      requireAuth(ctx, 'QA fixture account');
      const res = await authGet('/leave/pending-approvals', ctx.token);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('HR Admin elevated access', () => {
    it('hr_admin CAN create employees', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
      requireAuth(ctx, 'QA fixture account');
      const res = await authPost('/employees', ctx.token)
        .send({ firstName: 'Test', lastName: 'User' });
      expect(res.status).toBe(400);
    });

    it('hr_admin CAN access all leave requests', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
      requireAuth(ctx, 'QA fixture account');
      const res = await authGet('/leave/all-requests', ctx.token);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('hr_admin CAN access company-wide attendance', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
      requireAuth(ctx, 'QA fixture account');
      const res = await authGet('/attendance/company-wide', ctx.token);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
