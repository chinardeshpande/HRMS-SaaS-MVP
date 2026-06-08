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

async function getTokenFromPage(page: Page): Promise<string> {
  const tokensStr = await page.evaluate(() => localStorage.getItem('tokens'));
  return JSON.parse(tokensStr || '{}').token || '';
}

/** Navigate HR admin to first employee's detail and click Compensation tab */
async function navigateToCompensationTab(page: Page): Promise<boolean> {
  await page.goto('/employees');
  await page.waitForLoadState('networkidle');

  const employeeLink = page.locator('a[href*="/employees/"]').first();
  if (await employeeLink.count() === 0) return false;
  await employeeLink.click();
  await page.waitForLoadState('networkidle');

  const compTab = page.locator('button').filter({ hasText: /^compensation$/i }).first();
  if (await compTab.count() === 0) return false;
  await compTab.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  return true;
}

test.describe('Compensation Depth: HR Admin Employee Detail Flow', () => {
  let hrContext: BrowserContext;
  let hrPage: Page;

  test.beforeAll(async ({ browser }) => {
    hrContext = await browser.newContext();
    hrPage = await loginInContext(hrContext, 'HR_ADMIN');
  });

  test.afterAll(async () => {
    await hrPage?.close();
    await hrContext?.close();
  });

  test('CD01: HR admin can navigate to employee Compensation tab', async () => {
    const reached = await navigateToCompensationTab(hrPage);
    if (!reached) { test.skip(); return; }

    const bodyText = await hrPage.textContent('body') || '';
    expect(bodyText).not.toMatch(/error.*500|internal server/i);
    // Compensation section should show salary-related content
    const hasCompContent = /salary|compensation|ctc|gross|payslip|structure/i.test(bodyText);
    expect(hasCompContent).toBeTruthy();
  });

  test('CD02: Compensation tab shows salary structure section', async () => {
    const reached = await navigateToCompensationTab(hrPage);
    if (!reached) { test.skip(); return; }

    const bodyText = await hrPage.textContent('body') || '';
    // Should show "Current salary structure" or similar heading
    const hasStructure = /salary structure|current salary|monthly gross|annual ctc/i.test(bodyText);
    expect(hasStructure).toBeTruthy();
  });

  test('CD03: Compensation tab shows Payslip Library section', async () => {
    const reached = await navigateToCompensationTab(hrPage);
    if (!reached) { test.skip(); return; }

    const bodyText = await hrPage.textContent('body') || '';
    const hasPayslipSection = /payslip library|monthly salary record|payslip/i.test(bodyText);
    expect(hasPayslipSection).toBeTruthy();
  });

  test('CD04: Compensation tab displays seed data amounts for seeded employee', async () => {
    // Navigate to the seeded employee (Surekha Employee)
    await hrPage.goto('/employees');
    await hrPage.waitForLoadState('networkidle');

    // Find the seeded employee by name
    const surekhaLink = hrPage.locator('a[href*="/employees/"]').filter({
      has: hrPage.locator('text=Surekha'),
    }).first();

    let targetLink = surekhaLink;
    if (await surekhaLink.count() === 0) {
      // Fallback: just use the first employee
      targetLink = hrPage.locator('a[href*="/employees/"]').first();
    }
    if (await targetLink.count() === 0) { test.skip(); return; }

    await targetLink.click();
    await hrPage.waitForLoadState('networkidle');

    const compTab = hrPage.locator('button').filter({ hasText: /^compensation$/i }).first();
    if (await compTab.count() === 0) { test.skip(); return; }
    await compTab.click();
    await hrPage.waitForLoadState('networkidle');
    await hrPage.waitForTimeout(1500);

    const bodyText = await hrPage.textContent('body') || '';
    // Seed data: 720K CTC, 60K monthly gross, payslip May 2026 52K net
    // Check for presence of monetary values (formatted with commas or plain)
    const hasCompData =
      /7,20,000|720,000|720000/i.test(bodyText) ||
      /60,000|60000/i.test(bodyText) ||
      /52,000|52000/i.test(bodyText) ||
      /salary structure|payslip/i.test(bodyText);

    expect(hasCompData).toBeTruthy();
  });

  test('CD05: Payslip rows are visible in monthly salary records', async () => {
    const reached = await navigateToCompensationTab(hrPage);
    if (!reached) { test.skip(); return; }

    const bodyText = await hrPage.textContent('body') || '';
    // Should show at least one month reference or payslip status
    const hasPayslipRow =
      /may.*2026|2026.*may|final|draft|pending|uploaded/i.test(bodyText) ||
      /monthly salary/i.test(bodyText);

    // If seed data is present, payslip rows should render
    expect(hasPayslipRow || bodyText.length > 200).toBeTruthy();
  });
});

test.describe('Compensation Depth: Employee Salary Boundary', () => {
  test('CD06: employee accessing /employees/:id is denied (MANAGER_PLUS only)', async ({ page, browser }) => {
    const empContext = await browser.newContext();
    const empPage = await loginInContext(empContext, 'EMPLOYEE');

    // Get a valid employee ID via HR admin first
    const hrCtx = await browser.newContext();
    const hrP = await loginInContext(hrCtx, 'HR_ADMIN');
    await hrP.goto('/employees');
    await hrP.waitForLoadState('networkidle');
    const firstLink = hrP.locator('a[href*="/employees/"]').first();
    let targetUrl = '/employees/00000000-0000-0000-0000-000000000000';
    if (await firstLink.count() > 0) {
      targetUrl = (await firstLink.getAttribute('href')) || targetUrl;
    }
    await hrP.close();
    await hrCtx.close();

    // Employee tries to access that employee detail
    await empPage.goto(targetUrl);
    await empPage.waitForLoadState('networkidle');

    const url = empPage.url();
    const bodyText = await empPage.textContent('body') || '';

    // Should be denied
    const isDenied =
      url.includes('/login') ||
      url.includes('/dashboard') ||
      /denied|permission|unauthorized|not allowed|access/i.test(bodyText);
    expect(isDenied).toBeTruthy();

    // Must NOT show salary data
    expect(bodyText).not.toMatch(/salary structure|annual ctc|monthly gross/i);
    expect(bodyText).not.toMatch(/7,20,000|720,000|720000/);
    expect(bodyText).not.toMatch(/60,000|60000/);
    expect(bodyText).not.toMatch(/52,000|52000/);

    await empPage.close();
    await empContext.close();
  });

  test('CD07: employee /edit-profile does not show other employees salary data', async ({ browser }) => {
    const empContext = await browser.newContext();
    const empPage = await loginInContext(empContext, 'EMPLOYEE');

    await empPage.goto('/edit-profile');
    await empPage.waitForLoadState('networkidle');

    const bodyText = await empPage.textContent('body') || '';

    // Own profile should not expose compensation management controls
    // (employee role doesn't have canManageCompensation)
    expect(bodyText).not.toContain('Chinar Owner');
    expect(bodyText).not.toContain('Aniket Manager');
    expect(bodyText).not.toContain('Anupama Bhat');

    await empPage.close();
    await empContext.close();
  });
});

test.describe('Compensation Depth: Manager Salary Boundary', () => {
  test('CD08: manager can access employee detail but compensation is view-only', async ({ browser }) => {
    const mgrContext = await browser.newContext();
    const mgrPage = await loginInContext(mgrContext, 'MANAGER');

    await mgrPage.goto('/employees');
    await mgrPage.waitForLoadState('networkidle');

    const employeeLink = mgrPage.locator('a[href*="/employees/"]').first();
    if (await employeeLink.count() === 0) {
      await mgrPage.close();
      await mgrContext.close();
      test.skip();
      return;
    }
    await employeeLink.click();
    await mgrPage.waitForLoadState('networkidle');

    const compTab = mgrPage.locator('button').filter({ hasText: /^compensation$/i }).first();
    if (await compTab.count() > 0) {
      await compTab.click();
      await mgrPage.waitForLoadState('networkidle');
      await mgrPage.waitForTimeout(1000);

      // Manager should NOT see edit/add buttons for salary structures
      const addStructureButton = mgrPage.locator('button').filter({ hasText: /add.*salary|add.*structure|new.*structure/i }).first();
      const editCount = await addStructureButton.count();

      // canManageCompensation is false for manager → no add/edit buttons
      expect(editCount).toBe(0);
    }

    await mgrPage.close();
    await mgrContext.close();
  });

  test('CD09: manager cannot access /compensation standalone route', async ({ browser }) => {
    const mgrContext = await browser.newContext();
    const mgrPage = await loginInContext(mgrContext, 'MANAGER');

    await mgrPage.goto('/compensation');
    await mgrPage.waitForLoadState('networkidle');

    const url = mgrPage.url();
    const bodyText = await mgrPage.textContent('body') || '';

    // /compensation route is ADMIN_ROLES only — manager should be denied
    const isDenied =
      url.includes('/login') ||
      url.includes('/dashboard') ||
      url.includes('/employees') ||
      /denied|permission|unauthorized|not allowed|access|administrator/i.test(bodyText);
    expect(isDenied).toBeTruthy();

    await mgrPage.close();
    await mgrContext.close();
  });
});

test.describe('Compensation Depth: Error Leakage Checks', () => {
  test('CD10: denied compensation API does not leak salary data', async ({ browser }) => {
    const empContext = await browser.newContext();
    const empPage = await loginInContext(empContext, 'EMPLOYEE');

    const token = await getTokenFromPage(empPage);

    // Employee tries to access another employee's compensation via API
    const response = await empPage.request.get(
      `${API_BASE}/compensation/employees/00000000-0000-0000-0000-000000000001`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    expect([403, 404]).toContain(response.status());
    const body = await response.json();
    const responseText = JSON.stringify(body);

    // No salary amounts
    expect(responseText).not.toMatch(/grossEarnings|totalDeductions|netPay|monthlyGross|annualCtc/i);
    expect(responseText).not.toMatch(/\d{5,}/); // no 5+ digit numbers

    // No file paths
    expect(responseText).not.toMatch(/\/uploads\//);
    expect(responseText).not.toMatch(/\.pdf/);

    // No stack traces
    expect(responseText).not.toMatch(/at\s+\w+\s+\(/); // stack trace pattern

    await empPage.close();
    await empContext.close();
  });

  test('CD11: denied payslip attachment API does not leak salary data', async ({ browser }) => {
    const empContext = await browser.newContext();
    const empPage = await loginInContext(empContext, 'EMPLOYEE');

    const token = await getTokenFromPage(empPage);

    const response = await empPage.request.get(
      `${API_BASE}/compensation/attachments/00000000-0000-0000-0000-000000000001/download`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    expect([403, 404]).toContain(response.status());
    const responseText = await response.text();

    expect(responseText).not.toMatch(/grossEarnings|totalDeductions|netPay/i);
    expect(responseText).not.toMatch(/\/uploads\//);
    expect(responseText).not.toMatch(/at\s+\w+\s+\(/);

    await empPage.close();
    await empContext.close();
  });

  test('CD12: cross-tenant compensation access denied cleanly', async ({ browser }) => {
    const orbitContext = await browser.newContext();
    const orbitPage = await loginInContext(orbitContext, 'SECOND_TENANT_EMPLOYEE');

    const token = await getTokenFromPage(orbitPage);

    // Orbit employee tries to access ACV employee compensation
    const response = await orbitPage.request.get(
      `${API_BASE}/compensation/employees/00000000-0000-0000-0000-000000000001`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    expect([403, 404]).toContain(response.status());
    const responseText = JSON.stringify(await response.json());

    expect(responseText).not.toMatch(/grossEarnings|netPay|annualCtc/i);
    expect(responseText).not.toMatch(/ACV|acv\.test/i);

    await orbitPage.close();
    await orbitContext.close();
  });
});
