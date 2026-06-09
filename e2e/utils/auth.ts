import { Page, expect } from '@playwright/test';
import { USERS, UserKey } from '../fixtures/users';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

/**
 * Log in via the UI login page.
 * Waits for redirect to /dashboard after successful login.
 */
export async function loginViaUI(page: Page, userKey: UserKey): Promise<void> {
  const user = USERS[userKey];

  await page.goto('/login');
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10_000 });

  await page.fill('input[type="email"], input[name="email"]', user.email);
  await page.fill('input[type="password"], input[name="password"]', user.password);
  await page.click('button[type="submit"]');

  // Wait for navigation away from login page
  await page.waitForURL(/\/(dashboard|onboarding-wizard)/, { timeout: 15_000 });
}

/**
 * Log in via API and inject token into browser localStorage.
 * Faster than UI login — use for setup in non-auth test suites.
 */
export async function loginViaAPI(page: Page, userKey: UserKey): Promise<string> {
  const user = USERS[userKey];

  const response = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: user.email, password: user.password },
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.success).toBe(true);

  const token = body.data.tokens.token;
  const refreshToken = body.data.tokens.refreshToken;

  // Inject tokens into localStorage matching frontend AuthContext keys:
  //   localStorage.user = JSON.stringify(userData)
  //   localStorage.tokens = JSON.stringify({ token, refreshToken })
  await page.goto('/login'); // need a page loaded to access localStorage
  await page.evaluate(({ token, refreshToken, user: userData }) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('tokens', JSON.stringify({ token, refreshToken }));
  }, { token, refreshToken, user: body.data.user });

  return token;
}

/**
 * Log out by clearing localStorage and navigating to login.
 */
export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('tokens');
    localStorage.removeItem('preDemoSession');
    localStorage.removeItem('demoSession');
  });
  await page.goto('/login');
}

/**
 * Assert the user is redirected to login when accessing a protected route.
 */
export async function expectRedirectToLogin(page: Page, route: string): Promise<void> {
  await page.goto(route);
  // Should redirect to /login or show login page
  await page.waitForURL(/\/login/, { timeout: 10_000 });
  expect(page.url()).toContain('/login');
}
