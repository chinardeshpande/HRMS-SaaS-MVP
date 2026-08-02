import { authGet, loginAs, requireAuth, TEST_ACCOUNTS } from '../helpers/testSetup';

describe('API cache policy', () => {
  it('returns authenticated dynamic responses with no-store and without ETags', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(ctx, TEST_ACCOUNTS.EMPLOYEE.label);

    const first = await authGet('/hr-connect/posts', ctx.token);

    expect(first.status).toBe(200);
    expect(first.headers['cache-control']).toBe('no-store');
    expect(first.headers.etag).toBeUndefined();

    const conditional = await authGet('/hr-connect/posts', ctx.token).set(
      'If-None-Match',
      '"stale-client-etag"'
    );

    expect(conditional.status).toBe(200);
    expect(conditional.body.success).toBe(true);
  });
});
