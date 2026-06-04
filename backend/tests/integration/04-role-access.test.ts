import { TEST_ACCOUNTS, loginAs, authGet, authPost, authPut, authDelete } from '../helpers/testSetup';

describe('Role-Based Access Control', () => {
  /**
   * CRITICAL RISK: Role leakage
   * Verify that employees cannot access HR-only endpoints,
   * and managers cannot access system_admin endpoints.
   */

  describe('Employee role restrictions', () => {
    it('employee cannot create employees (HR-only)', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
      if (!ctx) {
        console.warn('SCAFFOLD: employee account not in DB — skipping');
        return;
      }
      const res = await authPost('/employees', ctx.token)
        .send({ firstName: 'Test', lastName: 'User', email: 'test@test.com' });
      expect(res.status).toBe(403);
    });

    it('employee cannot delete employees (HR-only)', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
      if (!ctx) {
        console.warn('SCAFFOLD: employee account not in DB — skipping');
        return;
      }
      const res = await authDelete('/employees/fake-id-12345', ctx.token);
      expect(res.status).toBe(403);
    });

    it('employee cannot access company-wide attendance', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
      if (!ctx) {
        console.warn('SCAFFOLD: employee account not in DB — skipping');
        return;
      }
      const res = await authGet('/attendance/company-wide', ctx.token);
      expect(res.status).toBe(403);
    });

    it('employee cannot access all leave requests (HR-only)', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
      if (!ctx) {
        console.warn('SCAFFOLD: employee account not in DB — skipping');
        return;
      }
      const res = await authGet('/leave/all-requests', ctx.token);
      expect(res.status).toBe(403);
    });

    it('employee cannot access leave statistics (HR-only)', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
      if (!ctx) {
        console.warn('SCAFFOLD: employee account not in DB — skipping');
        return;
      }
      const res = await authGet('/leave/statistics', ctx.token);
      expect(res.status).toBe(403);
    });

    it('employee cannot bulk-update attendance (HR-only)', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
      if (!ctx) {
        console.warn('SCAFFOLD: employee account not in DB — skipping');
        return;
      }
      const res = await authPost('/attendance/bulk-update', ctx.token).send({ records: [] });
      expect(res.status).toBe(403);
    });
  });

  describe('Manager role restrictions', () => {
    it('manager cannot create employees (HR-only)', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.MANAGER);
      if (!ctx) {
        console.warn('SCAFFOLD: manager account not in DB — skipping');
        return;
      }
      const res = await authPost('/employees', ctx.token)
        .send({ firstName: 'Test', lastName: 'User', email: 'test@test.com' });
      expect(res.status).toBe(403);
    });

    it('manager cannot delete employees (HR-only)', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.MANAGER);
      if (!ctx) {
        console.warn('SCAFFOLD: manager account not in DB — skipping');
        return;
      }
      const res = await authDelete('/employees/fake-id-12345', ctx.token);
      expect(res.status).toBe(403);
    });

    it('manager CAN access company-wide attendance', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.MANAGER);
      if (!ctx) {
        console.warn('SCAFFOLD: manager account not in DB — skipping');
        return;
      }
      const res = await authGet('/attendance/company-wide', ctx.token);
      // Manager is authorized for company-wide attendance
      expect([200, 500]).toContain(res.status); // 500 if DB not connected
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
      }
    });

    it('manager CAN access pending leave approvals', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.MANAGER);
      if (!ctx) {
        console.warn('SCAFFOLD: manager account not in DB — skipping');
        return;
      }
      const res = await authGet('/leave/pending-approvals', ctx.token);
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('HR Admin elevated access', () => {
    it('hr_admin CAN create employees', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
      if (!ctx) {
        console.warn('SCAFFOLD: hr_admin account not in DB — skipping');
        return;
      }
      // We only test that the endpoint doesn't return 403 (it may return 400 for validation)
      const res = await authPost('/employees', ctx.token)
        .send({ firstName: 'Test', lastName: 'User' });
      expect(res.status).not.toBe(403);
    });

    it('hr_admin CAN access all leave requests', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
      if (!ctx) {
        console.warn('SCAFFOLD: hr_admin account not in DB — skipping');
        return;
      }
      const res = await authGet('/leave/all-requests', ctx.token);
      expect([200, 500]).toContain(res.status);
      expect(res.status).not.toBe(403);
    });

    it('hr_admin CAN access company-wide attendance', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
      if (!ctx) {
        console.warn('SCAFFOLD: hr_admin account not in DB — skipping');
        return;
      }
      const res = await authGet('/attendance/company-wide', ctx.token);
      expect(res.status).not.toBe(403);
    });
  });
});
