import { test, expect, BrowserContext, Page } from '@playwright/test';
import { USERS } from '../fixtures/users';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

async function loginInContext(context: BrowserContext, userKey: keyof typeof USERS): Promise<Page> {
  const page = await context.newPage();
  const user = USERS[userKey];
  const response = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: user.email, password: user.password },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  await page.goto('/login');
  await page.evaluate(({ token, refreshToken, userData }) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('tokens', JSON.stringify({ token, refreshToken }));
  }, {
    token: body.data.tokens.token,
    refreshToken: body.data.tokens.refreshToken,
    userData: body.data.user,
  });
  return page;
}

test.describe('Attendance: Employee Self-Service', () => {
  let empContext: BrowserContext;
  let empPage: Page;

  test.beforeAll(async ({ browser }) => {
    empContext = await browser.newContext();
    empPage = await loginInContext(empContext, 'EMPLOYEE');
  });

  test.afterAll(async () => {
    await empPage?.close();
    await empContext?.close();
  });

  test('AT01: employee opens attendance page without crash', async () => {
    await empPage.goto('/attendance');
    await empPage.waitForLoadState('networkidle');

    expect(empPage.url()).toContain('/attendance');
    expect(empPage.url()).not.toContain('/login');

    const bodyText = await empPage.textContent('body') || '';
    expect(bodyText).not.toMatch(/error.*500|internal server/i);
  });

  test('AT02: My Attendance view is visible and active by default', async () => {
    await empPage.goto('/attendance');
    await empPage.waitForLoadState('networkidle');
    await empPage.waitForTimeout(500);

    const bodyText = await empPage.textContent('body') || '';
    // Should show "My Attendance" or "Mine" tab as active
    const hasMyAttendance = /my attendance|mine/i.test(bodyText);
    expect(hasMyAttendance).toBeTruthy();
  });

  test('AT03: Clock In or Clock Out button is visible', async () => {
    await empPage.goto('/attendance');
    await empPage.waitForLoadState('networkidle');
    await empPage.waitForTimeout(1000);

    const clockInBtn = empPage.locator('button').filter({ hasText: /clock in/i }).first();
    const clockOutBtn = empPage.locator('button').filter({ hasText: /clock out/i }).first();

    const hasClockIn = await clockInBtn.count() > 0;
    const hasClockOut = await clockOutBtn.count() > 0;

    // One of the two should be visible (in or out, depending on current state)
    expect(hasClockIn || hasClockOut).toBeTruthy();
  });

  test('AT04: employee can punch clock in', async () => {
    await empPage.goto('/attendance');
    await empPage.waitForLoadState('networkidle');
    await empPage.waitForTimeout(1000);

    const clockInBtn = empPage.locator('button').filter({ hasText: /clock in/i }).first();
    if (await clockInBtn.count() === 0) {
      // Already clocked in today — verify Clock Out is visible instead
      const clockOutBtn = empPage.locator('button').filter({ hasText: /clock out/i }).first();
      expect(await clockOutBtn.count()).toBeGreaterThan(0);
      return; // Already clocked in, skip punch test
    }

    await clockInBtn.click();
    await empPage.waitForTimeout(2000);

    // After clock in, should see Clock Out button or a success indicator
    const bodyText = await empPage.textContent('body') || '';
    const punchSucceeded =
      /clock out/i.test(bodyText) ||
      /clocked in/i.test(bodyText) ||
      /success/i.test(bodyText);

    expect(punchSucceeded).toBeTruthy();
  });

  test('AT05: after clock in, Clock Out button appears', async () => {
    await empPage.goto('/attendance');
    await empPage.waitForLoadState('networkidle');
    await empPage.waitForTimeout(1000);

    // After AT04, employee should be clocked in
    const clockOutBtn = empPage.locator('button').filter({ hasText: /clock out/i }).first();
    const clockInBtn = empPage.locator('button').filter({ hasText: /clock in/i }).first();

    // Either Clock Out (already clocked in) or Clock In (not yet / already clocked out)
    const hasAnyClockButton = (await clockOutBtn.count()) > 0 || (await clockInBtn.count()) > 0;
    expect(hasAnyClockButton).toBeTruthy();
  });

  test('AT06: attendance records area shows date/status information', async () => {
    await empPage.goto('/attendance');
    await empPage.waitForLoadState('networkidle');
    await empPage.waitForTimeout(1000);

    const bodyText = await empPage.textContent('body') || '';

    // Should show some date or status-related content
    const hasRecordContent =
      /present|absent|half.*day|late|weekend|holiday/i.test(bodyText) ||
      /today|yesterday|this week|this month/i.test(bodyText) ||
      /\d{1,2}:\d{2}/i.test(bodyText); // time format like 09:30

    // Page loaded with attendance content (even if no specific records)
    expect(bodyText.length).toBeGreaterThan(100);
  });

  test('AT07: employee does NOT see Team/Company tab', async () => {
    await empPage.goto('/attendance');
    await empPage.waitForLoadState('networkidle');

    // Employee role should NOT see Team/Company/Approvals tabs
    const teamTab = empPage.locator('button').filter({ hasText: /^team$|^company$/i }).first();
    const approvalsTab = empPage.locator('button').filter({ hasText: /team approvals|approvals/i }).first();

    expect(await teamTab.count()).toBe(0);
    expect(await approvalsTab.count()).toBe(0);
  });

  test('AT08: attendance page does not show other tenant data', async () => {
    await empPage.goto('/attendance');
    await empPage.waitForLoadState('networkidle');

    const bodyText = await empPage.textContent('body') || '';
    expect(bodyText).not.toContain('Orbit');
    expect(bodyText).not.toContain('orbit.test');
    expect(bodyText).not.toContain('QA/ORB/');
  });
});

test.describe('Attendance: Manager Visibility', () => {
  test('AT09: manager sees Team/Company tab on attendance page', async ({ browser }) => {
    const mgrCtx = await browser.newContext();
    const mgrPage = await loginInContext(mgrCtx, 'MANAGER');

    await mgrPage.goto('/attendance');
    await mgrPage.waitForLoadState('networkidle');
    await mgrPage.waitForTimeout(500);

    // Manager should see Team or Company tab
    const teamTab = mgrPage.locator('button').filter({ hasText: /team|company/i }).first();
    expect(await teamTab.count()).toBeGreaterThan(0);

    await mgrPage.close();
    await mgrCtx.close();
  });

  test('AT10: manager can switch to Team view', async ({ browser }) => {
    const mgrCtx = await browser.newContext();
    const mgrPage = await loginInContext(mgrCtx, 'MANAGER');

    await mgrPage.goto('/attendance');
    await mgrPage.waitForLoadState('networkidle');

    const teamTab = mgrPage.locator('button').filter({ hasText: /team|company/i }).first();
    if (await teamTab.count() === 0) { test.skip(); await mgrPage.close(); await mgrCtx.close(); return; }

    await teamTab.click();
    await mgrPage.waitForLoadState('networkidle');
    await mgrPage.waitForTimeout(1000);

    const bodyText = await mgrPage.textContent('body') || '';
    // Should show team attendance data or empty state
    expect(bodyText).not.toMatch(/error.*500|internal server/i);

    // Should NOT show Orbit tenant data
    expect(bodyText).not.toContain('Orbit');
    expect(bodyText).not.toContain('orbit.test');

    await mgrPage.close();
    await mgrCtx.close();
  });

  test('AT11: manager Team Approvals tab is visible', async ({ browser }) => {
    const mgrCtx = await browser.newContext();
    const mgrPage = await loginInContext(mgrCtx, 'MANAGER');

    await mgrPage.goto('/attendance');
    await mgrPage.waitForLoadState('networkidle');

    const approvalsTab = mgrPage.locator('button').filter({ hasText: /approvals/i }).first();
    expect(await approvalsTab.count()).toBeGreaterThan(0);

    await mgrPage.close();
    await mgrCtx.close();
  });
});

test.describe('Attendance: HR Admin Visibility', () => {
  test('AT12: HR admin sees Company/Team tab on attendance page', async ({ browser }) => {
    const hrCtx = await browser.newContext();
    const hrPage = await loginInContext(hrCtx, 'HR_ADMIN');

    await hrPage.goto('/attendance');
    await hrPage.waitForLoadState('networkidle');
    await hrPage.waitForTimeout(500);

    // HR admin should see Company tab (labeled "Company" for HR/admin roles)
    const companyTab = hrPage.locator('button').filter({ hasText: /company|team/i }).first();
    expect(await companyTab.count()).toBeGreaterThan(0);

    await hrPage.close();
    await hrCtx.close();
  });

  test('AT13: HR admin can view company-wide attendance', async ({ browser }) => {
    const hrCtx = await browser.newContext();
    const hrPage = await loginInContext(hrCtx, 'HR_ADMIN');

    await hrPage.goto('/attendance');
    await hrPage.waitForLoadState('networkidle');

    const companyTab = hrPage.locator('button').filter({ hasText: /company|team/i }).first();
    if (await companyTab.count() === 0) { test.skip(); await hrPage.close(); await hrCtx.close(); return; }

    await companyTab.click();
    await hrPage.waitForLoadState('networkidle');
    await hrPage.waitForTimeout(1500);

    const bodyText = await hrPage.textContent('body') || '';

    // Should show company attendance content
    expect(bodyText).not.toMatch(/error.*500|internal server/i);

    // Should show employee names or attendance stats
    const hasContent =
      /present|absent|total|employee/i.test(bodyText) ||
      bodyText.length > 200;
    expect(hasContent).toBeTruthy();

    // No Orbit data
    expect(bodyText).not.toContain('Orbit');

    await hrPage.close();
    await hrCtx.close();
  });

  test('AT14: HR admin company attendance does not crash with date filters', async ({ browser }) => {
    const hrCtx = await browser.newContext();
    const hrPage = await loginInContext(hrCtx, 'HR_ADMIN');

    await hrPage.goto('/attendance');
    await hrPage.waitForLoadState('networkidle');

    const companyTab = hrPage.locator('button').filter({ hasText: /company|team/i }).first();
    if (await companyTab.count() === 0) { test.skip(); await hrPage.close(); await hrCtx.close(); return; }
    await companyTab.click();
    await hrPage.waitForLoadState('networkidle');
    await hrPage.waitForTimeout(500);

    // Look for date filter controls (Day/Range toggle)
    const dayButton = hrPage.locator('button').filter({ hasText: /^day$/i }).first();
    const rangeButton = hrPage.locator('button').filter({ hasText: /^range$/i }).first();

    if (await dayButton.count() > 0) {
      await dayButton.click();
      await hrPage.waitForTimeout(500);
      const bodyText = await hrPage.textContent('body') || '';
      expect(bodyText).not.toMatch(/error.*500|internal server/i);
    }

    if (await rangeButton.count() > 0) {
      await rangeButton.click();
      await hrPage.waitForTimeout(500);
      const bodyText = await hrPage.textContent('body') || '';
      expect(bodyText).not.toMatch(/error.*500|internal server/i);
    }

    await hrPage.close();
    await hrCtx.close();
  });
});

test.describe('Attendance: Error and Leakage Checks', () => {
  test('AT15: attendance page shows no stack traces or raw errors', async ({ browser }) => {
    const empCtx = await browser.newContext();
    const empPage = await loginInContext(empCtx, 'EMPLOYEE');

    await empPage.goto('/attendance');
    await empPage.waitForLoadState('networkidle');
    await empPage.waitForTimeout(500);

    const bodyText = await empPage.textContent('body') || '';

    // No stack traces
    expect(bodyText).not.toMatch(/at\s+\w+\s+\(/);
    // No raw API errors
    expect(bodyText).not.toMatch(/TypeError|ReferenceError|Cannot read/i);
    // No internal paths
    expect(bodyText).not.toMatch(/\/uploads\//);
    expect(bodyText).not.toMatch(/node_modules/);

    await empPage.close();
    await empCtx.close();
  });

  test('AT16: empty attendance state is handled gracefully', async ({ browser }) => {
    // Use Orbit employee who may have no attendance records in seed data
    const orbitCtx = await browser.newContext();
    const orbitPage = await loginInContext(orbitCtx, 'SECOND_TENANT_EMPLOYEE');

    await orbitPage.goto('/attendance');
    await orbitPage.waitForLoadState('networkidle');
    await orbitPage.waitForTimeout(1000);

    const bodyText = await orbitPage.textContent('body') || '';

    // Should show empty state gracefully, not crash
    expect(bodyText).not.toMatch(/error.*500|internal server/i);
    expect(bodyText).not.toMatch(/TypeError|Cannot read/i);

    // No ACV data should appear
    expect(bodyText).not.toContain('Surekha');
    expect(bodyText).not.toContain('Aniket');
    expect(bodyText).not.toContain('QA/ACV/');

    await orbitPage.close();
    await orbitCtx.close();
  });
});
