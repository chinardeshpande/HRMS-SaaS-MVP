import { api, API_PREFIX, TEST_ACCOUNTS, loginAs, authGet, requireAuth } from '../helpers/testSetup';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config/config';

describe('Auth: Login / Logout / Me', () => {
  describe('POST /auth/login', () => {
    it('rejects empty body with 400', async () => {
      const res = await api.post(`${API_PREFIX}/auth/login`).send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects wrong password with 401', async () => {
      const res = await api.post(`${API_PREFIX}/auth/login`).send({
        email: TEST_ACCOUNTS.SYSTEM_ADMIN.email,
        password: 'definitely-wrong-password',
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects nonexistent email with 401', async () => {
      const res = await api.post(`${API_PREFIX}/auth/login`).send({
        email: 'nonexistent-user-12345@example.com',
        password: 'any-password',
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects inactive account with generic 401', async () => {
      const res = await api.post(`${API_PREFIX}/auth/login`).send({
        email: 'inactive@acv.test',
        password: TEST_ACCOUNTS.EMPLOYEE.password,
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects duplicate email across tenants with generic 401', async () => {
      const res = await api.post(`${API_PREFIX}/auth/login`).send({
        email: 'duplicate@shared.test',
        password: TEST_ACCOUNTS.EMPLOYEE.password,
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects malformed email payload with 400', async () => {
      const res = await api.post(`${API_PREFIX}/auth/login`).send({
        email: 'not-an-email',
        password: TEST_ACCOUNTS.SYSTEM_ADMIN.password,
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects non-string login payload with 400', async () => {
      const res = await api.post(`${API_PREFIX}/auth/login`).send({
        email: 12345,
        password: { value: TEST_ACCOUNTS.SYSTEM_ADMIN.password },
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('login as system_admin returns token and correct role', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
      requireAuth(ctx, TEST_ACCOUNTS.SYSTEM_ADMIN.label);
      expect(ctx.token).toBeTruthy();
      expect(ctx.role).toBe(TEST_ACCOUNTS.SYSTEM_ADMIN.expectedRole);
      expect(ctx.tenantId).toBeTruthy();
    });

    it('login as hr_admin returns token and correct role', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
      requireAuth(ctx, TEST_ACCOUNTS.HR_ADMIN.label);
      expect(ctx.token).toBeTruthy();
      expect(ctx.role).toBe(TEST_ACCOUNTS.HR_ADMIN.expectedRole);
    });

    it('login as manager returns token and correct role', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.MANAGER);
      requireAuth(ctx, TEST_ACCOUNTS.MANAGER.label);
      expect(ctx.token).toBeTruthy();
      expect(ctx.role).toBe(TEST_ACCOUNTS.MANAGER.expectedRole);
    });

    it('login as employee returns token and correct role', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
      requireAuth(ctx, TEST_ACCOUNTS.EMPLOYEE.label);
      expect(ctx.token).toBeTruthy();
      expect(ctx.role).toBe(TEST_ACCOUNTS.EMPLOYEE.expectedRole);
    });

    it('login as second tenant admin returns an isolated tenant context', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.SECOND_TENANT_ADMIN);
      expect(ctx).toBeTruthy();
      expect(ctx!.token).toBeTruthy();
      expect(ctx!.role).toBe(TEST_ACCOUNTS.SECOND_TENANT_ADMIN.expectedRole);
      expect(ctx!.tenantId).toBeTruthy();
    });
  });

  describe('POST /auth/refresh', () => {
    it('returns a usable access token and rotates the refresh token', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
      requireAuth(ctx, TEST_ACCOUNTS.SYSTEM_ADMIN.label);

      const res = await api.post(`${API_PREFIX}/auth/refresh`).send({
        refreshToken: ctx.refreshToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeTruthy();
      expect(res.body.data.refreshToken).toBeTruthy();
      expect(res.body.data.refreshToken).not.toBe(ctx.refreshToken);

      const payload = jwt.decode(res.body.data.refreshToken) as jwt.JwtPayload;
      expect(payload.tokenType).toBe('refresh');
      expect(payload.userId).toBe(ctx.userId);
      expect(payload.tenantId).toBe(ctx.tenantId);

      const me = await authGet('/auth/me', res.body.data.token);
      expect(me.status).toBe(200);
      expect(me.body.data.userId).toBe(ctx.userId);
    });

    it('rejects an access token as a refresh token', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
      requireAuth(ctx, TEST_ACCOUNTS.SYSTEM_ADMIN.label);

      const res = await api.post(`${API_PREFIX}/auth/refresh`).send({
        refreshToken: ctx.token,
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });

    it('accepts a legacy refresh token issued before tokenType was added', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
      requireAuth(ctx, TEST_ACCOUNTS.SYSTEM_ADMIN.label);
      const legacyRefreshToken = jwt.sign(
        { userId: ctx.userId, tenantId: ctx.tenantId },
        config.jwt.secret,
        { expiresIn: '2h' }
      );

      const res = await api.post(`${API_PREFIX}/auth/refresh`).send({
        refreshToken: legacyRefreshToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeTruthy();
      expect((jwt.decode(res.body.data.refreshToken) as jwt.JwtPayload).tokenType).toBe('refresh');
    });

    it('rejects a missing refresh token with 400', async () => {
      const res = await api.post(`${API_PREFIX}/auth/refresh`).send({});
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /auth/me', () => {
    it('rejects unauthenticated request with 401', async () => {
      const res = await api.get(`${API_PREFIX}/auth/me`);
      expect(res.status).toBe(401);
    });

    it('rejects invalid token with 401', async () => {
      const res = await authGet('/auth/me', 'invalid-jwt-token-garbage');
      expect(res.status).toBe(401);
    });

    it('returns user profile for valid token', async () => {
      const ctx = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
      requireAuth(ctx, TEST_ACCOUNTS.SYSTEM_ADMIN.label);
      const res = await authGet('/auth/me', ctx.token);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe(ctx.userId);
      expect(res.body.data.tenantId).toBe(ctx.tenantId);
      expect(res.body.data.role).toBe(ctx.role);
    });
  });
});
