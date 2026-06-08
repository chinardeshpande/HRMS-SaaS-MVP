import { test, expect } from '@playwright/test';
import { loginViaAPI } from '../utils/auth';
import { ROUTES } from '../utils/routes';
import { ADMIN_ONLY_ROUTES, MANAGER_PLUS_ROUTES } from '../fixtures/test-data';

test.describe('RBAC: Role-Based Route Access', () => {
  test.describe('Employee role restrictions', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaAPI(page, 'EMPLOYEE');
    });

    test('employee sees dashboard', async ({ page }) => {
      await page.goto(ROUTES.DASHBOARD);
      await page.waitForLoadState('networkidle');
      // Should load without redirect to login
      expect(page.url()).not.toContain('/login');
    });

    test('employee cannot access admin-only routes', async ({ page }) => {
      for (const route of ADMIN_ONLY_ROUTES) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        // Should either redirect to dashboard/login or show access denied
        const url = page.url();
        const bodyText = await page.textContent('body');
        const isDenied =
          url.includes('/login') ||
          url.includes('/dashboard') ||
          (bodyText && /denied|permission|unauthorized|not allowed|access/i.test(bodyText));

        expect(isDenied).toBeTruthy();
      }
    });

    test('employee cannot access manager-plus routes', async ({ page }) => {
      for (const route of MANAGER_PLUS_ROUTES) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        const url = page.url();
        const bodyText = await page.textContent('body');
        const isDenied =
          url.includes('/login') ||
          url.includes('/dashboard') ||
          (bodyText && /denied|permission|unauthorized|not allowed|access/i.test(bodyText));

        expect(isDenied).toBeTruthy();
      }
    });

    test('employee CAN access /my-hr-documents', async ({ page }) => {
      await page.goto(ROUTES.MY_HR_DOCUMENTS);
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toContain('/login');
    });

    test('employee CAN access /attendance', async ({ page }) => {
      await page.goto(ROUTES.ATTENDANCE);
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toContain('/login');
    });

    test('employee CAN access /leave', async ({ page }) => {
      await page.goto(ROUTES.LEAVE);
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toContain('/login');
    });
  });

  test.describe('HR Admin access', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaAPI(page, 'HR_ADMIN');
    });

    test('HR admin can access employee register', async ({ page }) => {
      await page.goto(ROUTES.EMPLOYEES);
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/employees');
    });

    test('HR admin can access compensation', async ({ page }) => {
      await page.goto(ROUTES.COMPENSATION);
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/compensation');
    });

    test('HR admin can access settings', async ({ page }) => {
      await page.goto(ROUTES.SETTINGS);
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/settings');
    });

    test('HR admin can access reports', async ({ page }) => {
      await page.goto(ROUTES.REPORTS);
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/reports');
    });

    test('HR admin can access documents', async ({ page }) => {
      await page.goto(ROUTES.DOCUMENTS);
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/documents');
    });
  });

  test.describe('Manager access', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaAPI(page, 'MANAGER');
    });

    test('manager can access employee register', async ({ page }) => {
      await page.goto(ROUTES.EMPLOYEES);
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/employees');
    });

    test('manager cannot access settings (admin-only)', async ({ page }) => {
      await page.goto(ROUTES.SETTINGS);
      await page.waitForLoadState('networkidle');

      const url = page.url();
      const bodyText = await page.textContent('body');
      const isDenied =
        url.includes('/login') ||
        url.includes('/dashboard') ||
        (bodyText && /denied|permission|unauthorized|not allowed|access|administrator/i.test(bodyText));

      expect(isDenied).toBeTruthy();
    });

    test('manager cannot access compensation (admin-only)', async ({ page }) => {
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
  });
});
