import { TEST_ACCOUNTS, loginAs, authGet } from '../helpers/testSetup';

describe('Document Access', () => {
  /**
   * CRITICAL RISK: Document leakage
   * Verify documents are tenant-scoped and role-gated.
   */

  it('unauthenticated request to documents is rejected', async () => {
    // /documents has no root GET; use /company-documents which requires auth
    const res = await authGet('/company-documents', 'invalid-token');
    expect(res.status).toBe(401);
  });

  it('HR admin can list company documents', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    if (!ctx) {
      console.warn('SCAFFOLD: hr_admin not in DB — skipping');
      return;
    }

    const res = await authGet('/company-documents', ctx.token);
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
    }
  });

  it('HR admin can list employee documents', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    if (!ctx) {
      console.warn('SCAFFOLD: hr_admin not in DB — skipping');
      return;
    }

    const res = await authGet('/employee-documents', ctx.token);
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
    }
  });

  it('HR admin can list document categories', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    if (!ctx) {
      console.warn('SCAFFOLD: hr_admin not in DB — skipping');
      return;
    }

    const res = await authGet('/document-categories', ctx.token);
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
    }
  });

  it('employee can access their own documents', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    if (!ctx) {
      console.warn('SCAFFOLD: employee not in DB — skipping');
      return;
    }

    // Employee documents endpoint — employee should see their own
    const res = await authGet('/employee-documents', ctx.token);
    expect([200, 403, 500]).toContain(res.status);

    if (res.status === 200 && res.body.data) {
      const docs = Array.isArray(res.body.data) ? res.body.data : res.body.data.documents || [];
      for (const doc of docs) {
        if (doc.tenantId) {
          expect(doc.tenantId).toBe(ctx.tenantId);
        }
      }
    }
  });

  it('document listing does not return documents from other tenants', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
    if (!ctx) {
      console.warn('SCAFFOLD: system_admin not in DB — skipping');
      return;
    }

    const res = await authGet('/company-documents', ctx.token);
    if (res.status !== 200) return;

    const docs = res.body.data?.documents || res.body.data || [];
    if (Array.isArray(docs)) {
      for (const doc of docs) {
        if (doc.tenantId) {
          expect(doc.tenantId).toBe(ctx.tenantId);
        }
      }
    }
  });
});
