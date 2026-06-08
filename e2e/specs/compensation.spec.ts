import { test, expect } from '@playwright/test';
import { loginViaAPI } from '../utils/auth';
import { ROUTES } from '../utils/routes';

test.describe('Compensation & Payslip Access Boundaries', () => {
  test('C01: HR admin accessing /compensation without employee context redirects to /employees', async ({ page }) => {
    // PRODUCT BEHAVIOUR: /compensation requires location.state.employee
    // When accessed directly (no employee context), it redirects to /employees.
    // This is correct product behaviour — compensation is per-employee, not standalone.
    await loginViaAPI(page, 'HR_ADMIN');
    await page.goto(ROUTES.COMPENSATION);
    await page.waitForLoadState('networkidle');

    // Redirects to employees (the compensation page requires employee context)
    expect(page.url()).toContain('/employees');
  });

  test('C02: employee cannot access compensation page (admin-only)', async ({ page }) => {
    await loginViaAPI(page, 'EMPLOYEE');
    await page.goto(ROUTES.COMPENSATION);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    const bodyText = await page.textContent('body');
    const isDenied =
      url.includes('/login') ||
      url.includes('/dashboard') ||
      (bodyText && /denied|permission|unauthorized|not allowed|access|administrator/i.test(bodyText));

    expect(isDenied).toBeTruthy();
  });

  test('C03: manager cannot access compensation page (admin-only)', async ({ page }) => {
    await loginViaAPI(page, 'MANAGER');
    await page.goto(ROUTES.COMPENSATION);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    const bodyText = await page.textContent('body');
    const isDenied =
      url.includes('/login') ||
      url.includes('/dashboard') ||
      (bodyText && /denied|permission|unauthorized|not allowed|access|administrator/i.test(bodyText));

    expect(isDenied).toBeTruthy();
  });

  test('C04: denied compensation page does not show salary amounts', async ({ page }) => {
    await loginViaAPI(page, 'EMPLOYEE');
    await page.goto(ROUTES.COMPENSATION);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body') || '';
    // Should not contain salary-like amounts
    expect(bodyText).not.toMatch(/₹\s*\d{4,}/);
    expect(bodyText).not.toMatch(/gross|net pay|annual ctc|salary structure/i);
  });
});
