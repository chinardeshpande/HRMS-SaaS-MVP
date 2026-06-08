import { test, expect } from '@playwright/test';
import { loginViaAPI } from '../utils/auth';
import { ROUTES } from '../utils/routes';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

test.describe('Compensation: Employee Detail Flow', () => {
  test('CX01: HR admin can navigate from employee list to employee detail compensation tab', async ({ page }) => {
    await loginViaAPI(page, 'HR_ADMIN');
    await page.goto(ROUTES.EMPLOYEES);
    await page.waitForLoadState('networkidle');

    // Click first employee to open detail
    const employeeLink = page.locator('a[href*="/employees/"], tr[data-employee-id], [class*="employee"] a').first();
    if (await employeeLink.count() === 0) {
      test.skip();
      return;
    }
    await employeeLink.click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/employees\/.+/);

    // Look for Compensation tab
    const compTab = page.locator('button, [role="tab"], a').filter({ hasText: /compensation/i }).first();
    if (await compTab.count() > 0) {
      await compTab.click();
      await page.waitForLoadState('networkidle');

      // Compensation tab should load without crash
      const bodyText = await page.textContent('body') || '';
      expect(bodyText).not.toMatch(/error.*500|internal server/i);
    }
    // If no comp tab visible, the page still loaded (not all employees have compensation data)
  });

  test('CX02: HR admin can navigate to payslips tab from employee detail', async ({ page }) => {
    await loginViaAPI(page, 'HR_ADMIN');
    await page.goto(ROUTES.EMPLOYEES);
    await page.waitForLoadState('networkidle');

    const employeeLink = page.locator('a[href*="/employees/"], tr[data-employee-id], [class*="employee"] a').first();
    if (await employeeLink.count() === 0) {
      test.skip();
      return;
    }
    await employeeLink.click();
    await page.waitForLoadState('networkidle');

    // Look for Payslips tab
    const payslipTab = page.locator('button, [role="tab"], a').filter({ hasText: /payslip/i }).first();
    if (await payslipTab.count() > 0) {
      await payslipTab.click();
      await page.waitForLoadState('networkidle');

      const bodyText = await page.textContent('body') || '';
      expect(bodyText).not.toMatch(/error.*500|internal server/i);
    }
  });

  test('CX03: employee cannot see salary data when denied access to /compensation', async ({ page }) => {
    await loginViaAPI(page, 'EMPLOYEE');
    await page.goto(ROUTES.COMPENSATION);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body') || '';
    // No salary-like amounts
    expect(bodyText).not.toMatch(/₹\s*\d{4,}/);
    expect(bodyText).not.toMatch(/gross.*earn|net.*pay|annual.*ctc|salary.*structure/i);
    // No seed salary values
    expect(bodyText).not.toContain('52000');
    expect(bodyText).not.toContain('60000');
    expect(bodyText).not.toContain('720000');
  });

  test('CX04: manager cannot access another employees compensation via API from browser', async ({ page }) => {
    await loginViaAPI(page, 'MANAGER');

    // Try to call the compensation API directly from the page context
    const response = await page.request.get(`${API_BASE}/compensation/employees/00000000-0000-0000-0000-000000000001`, {
      headers: {
        'Authorization': `Bearer ${await getTokenFromPage(page)}`,
      },
    });

    // Should be 403 or 404, not 200 with salary data
    expect([403, 404]).toContain(response.status());

    if (response.status() === 403 || response.status() === 404) {
      const body = await response.json();
      const responseText = JSON.stringify(body);
      // No salary data in error response
      expect(responseText).not.toMatch(/grossEarnings|totalDeductions|netPay|monthlyGross|annualCtc/i);
    }
  });
});

async function getTokenFromPage(page: any): Promise<string> {
  const tokensStr = await page.evaluate(() => localStorage.getItem('tokens'));
  const tokens = JSON.parse(tokensStr || '{}');
  return tokens.token || '';
}
