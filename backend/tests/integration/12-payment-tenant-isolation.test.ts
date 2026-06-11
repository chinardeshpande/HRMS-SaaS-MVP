import { authPost, authPut, authGet, loginAs, requireAuth, TEST_ACCOUNTS } from '../helpers/testSetup';

/**
 * REGRESSION: cross-tenant IDOR on PUT /payments/:paymentId/status
 *
 * Before the hotfix, settingsService.updatePaymentStatus looked up the payment
 * by paymentId alone (no tenant scoping). A SYSTEM_ADMIN of Tenant A could flip
 * the status of Tenant B's payment record by guessing/iterating the paymentId.
 *
 * Expected behaviour after fix:
 *   - Tenant A cannot modify Tenant B's payment.
 *   - The cross-tenant attempt returns 404 (NOT 403) so the existence of
 *     another tenant's payment record is not leaked.
 *   - Tenant B's payment status is left unchanged.
 */
describe('Payment status — cross-tenant isolation', () => {
  it('Tenant A token cannot modify a Tenant B payment (404, record unchanged)', async () => {
    const tenantA = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN); // ACV
    const tenantB = await loginAs(TEST_ACCOUNTS.SECOND_TENANT_ADMIN); // Orbit
    requireAuth(tenantA, TEST_ACCOUNTS.SYSTEM_ADMIN.label);
    requireAuth(tenantB, TEST_ACCOUNTS.SECOND_TENANT_ADMIN.label);
    expect(tenantA.tenantId).not.toBe(tenantB.tenantId);

    // Tenant B creates a payment in PENDING status.
    const createRes = await authPost('/settings/payments', tenantB.token).send({
      amount: 100,
      totalAmount: 100,
      currency: 'USD',
      paymentMethod: 'bank_transfer',
      billingPeriodStart: '2026-01-01',
      billingPeriodEnd: '2026-01-31',
      description: 'Tenant B isolation fixture',
    });
    expect(createRes.status).toBe(201);
    const paymentId = createRes.body.data.paymentId;
    expect(paymentId).toBeTruthy();
    expect(createRes.body.data.status).toBe('pending');

    // Tenant A attempts to flip Tenant B's payment to COMPLETED.
    const attackRes = await authPut(`/settings/payments/${paymentId}/status`, tenantA.token).send({
      status: 'completed',
    });

    // Must be 404 (not found / not 403) so existence is not disclosed.
    expect(attackRes.status).toBe(404);
    expect(attackRes.status).not.toBe(403);

    // Tenant B reads back its payment — status must be untouched.
    const verifyRes = await authGet('/settings/payments', tenantB.token);
    expect(verifyRes.status).toBe(200);
    const rows = verifyRes.body.data?.payments || verifyRes.body.data || [];
    const target = rows.find((p: any) => p.paymentId === paymentId);
    expect(target).toBeTruthy();
    expect(target.status).toBe('pending');
  });

  it('Tenant B (owner) can still modify its own payment (control)', async () => {
    const tenantB = await loginAs(TEST_ACCOUNTS.SECOND_TENANT_ADMIN);
    requireAuth(tenantB, TEST_ACCOUNTS.SECOND_TENANT_ADMIN.label);

    const createRes = await authPost('/settings/payments', tenantB.token).send({
      amount: 50,
      totalAmount: 50,
      currency: 'USD',
      paymentMethod: 'bank_transfer',
      billingPeriodStart: '2026-02-01',
      billingPeriodEnd: '2026-02-28',
      description: 'Tenant B self-update control',
    });
    expect(createRes.status).toBe(201);
    const paymentId = createRes.body.data.paymentId;

    const updateRes = await authPut(`/settings/payments/${paymentId}/status`, tenantB.token).send({
      status: 'completed',
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe('completed');
  });
});
