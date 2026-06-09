import { TEST_ACCOUNTS, loginAs, authGet, requireAuth } from '../helpers/testSetup';

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
    requireAuth(ctx, TEST_ACCOUNTS.HR_ADMIN.label);

    const res = await authGet('/company-documents', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.documents.length).toBeGreaterThan(0);
  });

  it('HR admin can list employee documents', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    const employeeCtx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    expect(ctx).toBeTruthy();
    expect(employeeCtx?.employeeId).toBeTruthy();

    const res = await authGet(`/employee-documents/employees/${employeeCtx!.employeeId}`, ctx!.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.documents)).toBe(true);
  });

  it('HR admin can list document categories', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, TEST_ACCOUNTS.HR_ADMIN.label);

    const res = await authGet('/document-categories', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('employee can access their own documents', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    expect(ctx?.employeeId).toBeTruthy();

    const res = await authGet(`/employee-documents/employees/${ctx!.employeeId}`, ctx!.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const docs = res.body.data.documents || [];
    expect(docs.length).toBeGreaterThan(0);
    for (const doc of docs) {
      if (doc.tenantId) {
        expect(doc.tenantId).toBe(ctx!.tenantId);
      }
    }
  });

  it('document listing does not return documents from other tenants', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
    requireAuth(ctx, TEST_ACCOUNTS.SYSTEM_ADMIN.label);

    const res = await authGet('/company-documents', ctx.token);
    expect(res.status).toBe(200);

    const docs = res.body.data?.documents || res.body.data || [];
    expect(docs.length).toBeGreaterThan(0);
    expect(Array.isArray(docs)).toBe(true);
    for (const doc of docs) {
      if (doc.tenantId) {
        expect(doc.tenantId).toBe(ctx.tenantId);
      }
    }
  });
});
