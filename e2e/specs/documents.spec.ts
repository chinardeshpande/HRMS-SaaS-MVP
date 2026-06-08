import { test, expect } from '@playwright/test';
import { loginViaAPI } from '../utils/auth';
import { ROUTES } from '../utils/routes';

test.describe('Document Access Boundaries', () => {
  test.describe('Employee document access', () => {
    test('DC01: employee can access own HR documents page', async ({ page }) => {
      await loginViaAPI(page, 'EMPLOYEE');
      await page.goto(ROUTES.MY_HR_DOCUMENTS);
      await page.waitForLoadState('networkidle');

      expect(page.url()).not.toContain('/login');
      // Should show my-hr-documents page without crash
    });

    test('DC02: employee cannot access document library (manager+ route)', async ({ page }) => {
      await loginViaAPI(page, 'EMPLOYEE');
      await page.goto(ROUTES.DOCUMENTS);
      await page.waitForLoadState('networkidle');

      const url = page.url();
      const bodyText = await page.textContent('body');
      const isDenied =
        url.includes('/login') ||
        url.includes('/dashboard') ||
        (bodyText && /denied|permission|unauthorized|not allowed|access/i.test(bodyText));

      expect(isDenied).toBeTruthy();
    });
  });

  test.describe('HR Admin document access', () => {
    test('DC03: HR admin can access document library', async ({ page }) => {
      await loginViaAPI(page, 'HR_ADMIN');
      await page.goto(ROUTES.DOCUMENTS);
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/documents');
    });
  });

  test.describe('Manager document access', () => {
    test('DC04: manager can access document library', async ({ page }) => {
      await loginViaAPI(page, 'MANAGER');
      await page.goto(ROUTES.DOCUMENTS);
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/documents');
    });
  });
});
