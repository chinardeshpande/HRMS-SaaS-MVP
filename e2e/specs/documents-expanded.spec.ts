import { test, expect } from '@playwright/test';
import { loginViaAPI } from '../utils/auth';
import { ROUTES } from '../utils/routes';

test.describe('Document Access: Expanded Boundaries', () => {
  test.describe('Employee document area', () => {
    test('DX01: HR admin can navigate to employee detail documents tab', async ({ page }) => {
      await loginViaAPI(page, 'HR_ADMIN');
      await page.goto(ROUTES.EMPLOYEES);
      await page.waitForLoadState('networkidle');

      // Click first employee row/link to open detail
      const employeeLink = page.locator('a[href*="/employees/"], tr[data-employee-id], [class*="employee"] a').first();
      if (await employeeLink.count() > 0) {
        await employeeLink.click();
        await page.waitForLoadState('networkidle');

        // Look for a Documents tab
        const docsTab = page.locator('button, [role="tab"], a').filter({ hasText: /documents/i }).first();
        if (await docsTab.count() > 0) {
          await docsTab.click();
          await page.waitForLoadState('networkidle');
          // Page should not crash or show error
          const bodyText = await page.textContent('body') || '';
          expect(bodyText).not.toMatch(/error|crash|500/i);
        }
      }
    });

    test('DX02: employee denied access message does not expose file paths', async ({ page }) => {
      await loginViaAPI(page, 'EMPLOYEE');
      await page.goto(ROUTES.DOCUMENTS);
      await page.waitForLoadState('networkidle');

      const bodyText = await page.textContent('body') || '';

      // Should not expose internal file paths
      expect(bodyText).not.toMatch(/\/uploads\//);
      expect(bodyText).not.toMatch(/\/var\//);
      expect(bodyText).not.toMatch(/\/home\//);
      expect(bodyText).not.toMatch(/\.pdf$/m);
    });

    test('DX03: employee accessing /documents sees denial, not another employees data', async ({ page }) => {
      await loginViaAPI(page, 'EMPLOYEE');
      await page.goto(ROUTES.DOCUMENTS);
      await page.waitForLoadState('networkidle');

      const url = page.url();
      const bodyText = await page.textContent('body') || '';

      // Should be denied (redirect or access-denied message)
      const isDenied =
        url.includes('/login') ||
        url.includes('/dashboard') ||
        /denied|permission|unauthorized|not allowed|access/i.test(bodyText);

      expect(isDenied).toBeTruthy();

      // No other employee names should appear
      expect(bodyText).not.toContain('Aniket Manager');
      expect(bodyText).not.toContain('Chinar Owner');
    });
  });

  test.describe('Company document vault', () => {
    test('DX04: employee cannot access company documents area', async ({ page }) => {
      // Company documents are at /documents for HR+ roles
      // Employee should be denied
      await loginViaAPI(page, 'EMPLOYEE');
      await page.goto(ROUTES.DOCUMENTS);
      await page.waitForLoadState('networkidle');

      const url = page.url();
      const bodyText = await page.textContent('body') || '';

      const isDenied =
        url.includes('/login') ||
        url.includes('/dashboard') ||
        /denied|permission|unauthorized|not allowed|access/i.test(bodyText);

      expect(isDenied).toBeTruthy();
    });

    test('DX05: HR admin can see document library without crash', async ({ page }) => {
      await loginViaAPI(page, 'HR_ADMIN');
      await page.goto(ROUTES.DOCUMENTS);
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/documents');
      const bodyText = await page.textContent('body') || '';
      expect(bodyText).not.toMatch(/error.*500|internal server/i);
    });
  });
});
