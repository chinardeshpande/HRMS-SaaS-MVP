import { test, expect } from '@playwright/test';
import { loginViaAPI } from '../utils/auth';
import { ROUTES } from '../utils/routes';

test.describe('Leave Page Access', () => {
  test('L01: employee can open leave page', async ({ page }) => {
    await loginViaAPI(page, 'EMPLOYEE');
    await page.goto(ROUTES.LEAVE);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/leave');
    expect(page.url()).not.toContain('/login');
  });

  test('L02: manager can open leave page', async ({ page }) => {
    await loginViaAPI(page, 'MANAGER');
    await page.goto(ROUTES.LEAVE);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/leave');
  });

  test('L03: HR admin can open leave page', async ({ page }) => {
    await loginViaAPI(page, 'HR_ADMIN');
    await page.goto(ROUTES.LEAVE);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/leave');
  });

  // Leave apply and approval workflows are documented as manual/UAT
  // until the UI flow is stable enough for deterministic E2E testing.
  // See: docs/acv-implementation/ACV-E2E-Test-Plan.md
  test.skip('L04: employee submits leave request (manual/UAT)', async () => {
    // Requires: stable leave form, deterministic leave type, balance check
    // Implement after manual verification of leave UI stability
  });

  test.skip('L05: manager approves leave request (manual/UAT)', async () => {
    // Requires: pending leave request from L04, manager approval flow
    // Implement after L04 is stable
  });
});
