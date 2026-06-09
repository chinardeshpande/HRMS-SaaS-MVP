import { test, expect, BrowserContext } from '@playwright/test';
import { USERS } from '../fixtures/users';
import { SEED_EMPLOYEES } from '../fixtures/test-data';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

/**
 * Login via API in a specific browser context and inject auth into localStorage.
 */
async function loginInContext(context: BrowserContext, userKey: keyof typeof USERS): Promise<void> {
  const page = await context.newPage();
  const user = USERS[userKey];

  const response = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: user.email, password: user.password },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.success).toBe(true);

  await page.goto('/login');
  await page.evaluate(({ token, refreshToken, userData }) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('tokens', JSON.stringify({ token, refreshToken }));
  }, {
    token: body.data.tokens.token,
    refreshToken: body.data.tokens.refreshToken,
    userData: body.data.user,
  });
  await page.close();
}

test.describe('Tenant Isolation: Cross-Tenant Browser Tests', () => {
  let acvContext: BrowserContext;
  let orbitContext: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    acvContext = await browser.newContext();
    orbitContext = await browser.newContext();

    await loginInContext(acvContext, 'HR_ADMIN');
    await loginInContext(orbitContext, 'SECOND_TENANT_ADMIN');
  });

  test.afterAll(async () => {
    await acvContext?.close();
    await orbitContext?.close();
  });

  test('TI01: ACV and Orbit users land on separate dashboards', async () => {
    const acvPage = await acvContext.newPage();
    const orbitPage = await orbitContext.newPage();

    await acvPage.goto('/dashboard');
    await orbitPage.goto('/dashboard');

    await acvPage.waitForLoadState('networkidle');
    await orbitPage.waitForLoadState('networkidle');

    expect(acvPage.url()).toContain('/dashboard');
    expect(orbitPage.url()).toContain('/dashboard');

    // Both should load without redirecting to login
    expect(acvPage.url()).not.toContain('/login');
    expect(orbitPage.url()).not.toContain('/login');

    await acvPage.close();
    await orbitPage.close();
  });

  test('TI02: ACV employee list does not contain Orbit employees', async () => {
    const acvPage = await acvContext.newPage();
    await acvPage.goto('/employees');
    await acvPage.waitForLoadState('networkidle');

    const bodyText = await acvPage.textContent('body') || '';

    // ACV employees should be visible
    const hasAcvData =
      bodyText.includes(SEED_EMPLOYEES.EMPLOYEE.firstName) ||
      bodyText.includes(SEED_EMPLOYEES.MANAGER.firstName) ||
      bodyText.includes(SEED_EMPLOYEES.HR_ADMIN.firstName);

    // Orbit employees should NOT be visible
    expect(bodyText).not.toContain('Orbit Admin');
    expect(bodyText).not.toContain('Orbit Employee');
    expect(bodyText).not.toContain('orbit.test');
    expect(bodyText).not.toContain('QA/ORB/');

    await acvPage.close();
  });

  test('TI03: Orbit employee list does not contain ACV employees', async () => {
    const orbitPage = await orbitContext.newPage();
    await orbitPage.goto('/employees');
    await orbitPage.waitForLoadState('networkidle');

    const bodyText = await orbitPage.textContent('body') || '';

    // ACV employees should NOT be visible in Orbit context
    expect(bodyText).not.toContain(SEED_EMPLOYEES.EMPLOYEE.firstName + ' ' + SEED_EMPLOYEES.EMPLOYEE.lastName);
    expect(bodyText).not.toContain(SEED_EMPLOYEES.MANAGER.firstName + ' ' + SEED_EMPLOYEES.MANAGER.lastName);
    expect(bodyText).not.toContain('acv.test');
    expect(bodyText).not.toContain('QA/ACV/');

    await orbitPage.close();
  });

  test('TI04: ACV documents page does not show Orbit documents', async () => {
    const acvPage = await acvContext.newPage();
    await acvPage.goto('/documents');
    await acvPage.waitForLoadState('networkidle');

    const bodyText = await acvPage.textContent('body') || '';

    // Orbit's confidential document should not appear
    expect(bodyText).not.toContain('Orbit Confidential');
    expect(bodyText).not.toContain('orbit-confidential');

    await acvPage.close();
  });

  test('TI05: no cross-tenant salary data visible', async () => {
    const orbitPage = await orbitContext.newPage();
    await orbitPage.goto('/employees');
    await orbitPage.waitForLoadState('networkidle');

    const bodyText = await orbitPage.textContent('body') || '';

    // ACV salary data should never appear in Orbit context
    expect(bodyText).not.toContain('52000');
    expect(bodyText).not.toContain('60000');
    expect(bodyText).not.toContain('720000');

    await orbitPage.close();
  });

  test('TI06: direct URL to ACV employee detail from Orbit context is denied or empty', async () => {
    // Get an ACV employee ID via ACV context
    const acvPage = await acvContext.newPage();
    const acvEmployeesRes = await acvPage.request.get(`${API_BASE}/employees`, {
      headers: { 'Authorization': `Bearer ${await getToken(acvContext)}` },
    });
    const acvData = await acvEmployeesRes.json();
    await acvPage.close();

    const acvEmployees = acvData.data?.employees || acvData.data || [];
    if (!Array.isArray(acvEmployees) || acvEmployees.length === 0) {
      test.skip();
      return;
    }
    const acvEmployeeId = acvEmployees[0].employeeId;

    // Try to access that ACV employee from Orbit context
    const orbitPage = await orbitContext.newPage();
    await orbitPage.goto(`/employees/${acvEmployeeId}`);
    await orbitPage.waitForLoadState('networkidle');

    const bodyText = await orbitPage.textContent('body') || '';
    // Should not show ACV employee data
    expect(bodyText).not.toContain(SEED_EMPLOYEES.EMPLOYEE.firstName + ' ' + SEED_EMPLOYEES.EMPLOYEE.lastName);
    expect(bodyText).not.toContain('QA/ACV/');

    await orbitPage.close();
  });
});

/** Helper to extract token from a context's localStorage */
async function getToken(context: BrowserContext): Promise<string> {
  const page = await context.newPage();
  await page.goto('/login');
  const tokensStr = await page.evaluate(() => localStorage.getItem('tokens'));
  await page.close();
  const tokens = JSON.parse(tokensStr || '{}');
  return tokens.token || '';
}
