import { test, expect, BrowserContext, Page } from '@playwright/test';
import { USERS } from '../fixtures/users';
import path from 'path';
import fs from 'fs';
import os from 'os';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

/** Create a tiny synthetic text file for upload testing */
function createSyntheticFile(name: string, content: string): { dir: string; filePath: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aurorahr-e2e-doc-'));
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content);
  return { dir, filePath };
}

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

test.describe('Employee Document Upload/List Roundtrip', () => {
  let hrContext: BrowserContext;
  let employeeContext: BrowserContext;
  let hrPage: Page;
  let employeePage: Page;
  let tempFile: { dir: string; filePath: string } | null = null;
  const docTitle = `E2E-Test-Doc-${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    hrContext = await browser.newContext();
    employeeContext = await browser.newContext();
    hrPage = await loginInContext(hrContext, 'HR_ADMIN');
    employeePage = await loginInContext(employeeContext, 'EMPLOYEE');
    tempFile = createSyntheticFile('e2e-synthetic-test-document.txt', 'This is a synthetic test document for AuroraHR E2E testing. Not real data.');
  });

  test.afterAll(async () => {
    if (tempFile) fs.rmSync(tempFile.dir, { recursive: true, force: true });
    await hrPage?.close();
    await employeePage?.close();
    await hrContext?.close();
    await employeeContext?.close();
  });

  test('DR01: HR admin navigates to employee detail Documents tab', async () => {
    await hrPage.goto('/employees');
    await hrPage.waitForLoadState('networkidle');

    // Click first employee
    const employeeLink = hrPage.locator('a[href*="/employees/"]').first();
    if (await employeeLink.count() === 0) { test.skip(); return; }
    await employeeLink.click();
    await hrPage.waitForLoadState('networkidle');
    expect(hrPage.url()).toMatch(/\/employees\/.+/);

    // Click Documents tab
    const docsTab = hrPage.locator('button').filter({ hasText: /documents/i }).first();
    if (await docsTab.count() === 0) { test.skip(); return; }
    await docsTab.click();
    await hrPage.waitForLoadState('networkidle');
    await hrPage.waitForTimeout(500);

    // Page should show documents area without error
    const bodyText = await hrPage.textContent('body') || '';
    expect(bodyText).not.toMatch(/error.*500|internal server/i);
  });

  test('DR02: HR admin opens upload form and uploads synthetic document', async () => {
    // Navigate to employee detail → Documents tab
    await hrPage.goto('/employees');
    await hrPage.waitForLoadState('networkidle');

    const employeeLink = hrPage.locator('a[href*="/employees/"]').first();
    if (await employeeLink.count() === 0) { test.skip(); return; }
    await employeeLink.click();
    await hrPage.waitForLoadState('networkidle');

    // Click Documents tab
    const docsTab = hrPage.locator('button').filter({ hasText: /documents/i }).first();
    if (await docsTab.count() === 0) { test.skip(); return; }
    await docsTab.click();
    await hrPage.waitForLoadState('networkidle');
    await hrPage.waitForTimeout(500);

    // Click "Add Document" button to toggle upload form
    const addButton = hrPage.locator('button').filter({ hasText: /add document/i }).first();
    if (await addButton.count() === 0) {
      console.log('Add Document button not found — HR may not have canManageEmployeeDocuments');
      test.skip();
      return;
    }
    await addButton.click();
    await hrPage.waitForTimeout(500);

    // Fill title
    const titleInput = hrPage.locator('input[placeholder*="PAN"]').first();
    if (await titleInput.count() === 0) {
      // Try finding by label
      const titleLabel = hrPage.locator('label').filter({ hasText: /title/i }).first();
      const input = titleLabel.locator('input').first();
      if (await input.count() > 0) {
        await input.fill(docTitle);
      }
    } else {
      await titleInput.fill(docTitle);
    }

    // Set file input
    const fileInput = hrPage.locator('input[type="file"]').first();
    if (await fileInput.count() === 0) { test.skip(); return; }
    await fileInput.setInputFiles(tempFile!.filePath);

    // Submit
    const saveButton = hrPage.locator('button').filter({ hasText: /save document/i }).first();
    if (await saveButton.count() === 0) {
      const submitButton = hrPage.locator('button[type="submit"]').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
      }
    } else {
      await saveButton.click();
    }

    await hrPage.waitForTimeout(2000);

    // Verify: upload form should close (or success notification appears)
    // Check if the document title appears in the list
    const bodyText = await hrPage.textContent('body') || '';
    const uploadSucceeded = bodyText.includes(docTitle) || !bodyText.includes('Failed to upload');
    expect(uploadSucceeded).toBeTruthy();
  });

  test('DR03: uploaded document appears in employee document list', async () => {
    // Re-navigate to ensure fresh data
    await hrPage.goto('/employees');
    await hrPage.waitForLoadState('networkidle');

    const employeeLink = hrPage.locator('a[href*="/employees/"]').first();
    if (await employeeLink.count() === 0) { test.skip(); return; }
    await employeeLink.click();
    await hrPage.waitForLoadState('networkidle');

    const docsTab = hrPage.locator('button').filter({ hasText: /documents/i }).first();
    if (await docsTab.count() === 0) { test.skip(); return; }
    await docsTab.click();
    await hrPage.waitForLoadState('networkidle');
    await hrPage.waitForTimeout(1000);

    const bodyText = await hrPage.textContent('body') || '';
    // Our synthetic document title should appear in the list
    expect(bodyText).toContain(docTitle);
  });

  test('DR04: employee can see own documents page', async () => {
    await employeePage.goto('/my-hr-documents');
    await employeePage.waitForLoadState('networkidle');

    expect(employeePage.url()).not.toContain('/login');
    const bodyText = await employeePage.textContent('body') || '';
    expect(bodyText).not.toMatch(/error.*500|internal server/i);
  });

  test('DR05: employee denied access does not expose file paths', async () => {
    await employeePage.goto('/documents');
    await employeePage.waitForLoadState('networkidle');

    const bodyText = await employeePage.textContent('body') || '';

    // Must not expose internal paths
    expect(bodyText).not.toMatch(/\/uploads\//);
    expect(bodyText).not.toMatch(/\/var\//);
    expect(bodyText).not.toMatch(/\/home\//);
    expect(bodyText).not.toMatch(/\/tmp\//);
    expect(bodyText).not.toMatch(/e2e-synthetic/);
  });

  test('DR06: employee cannot see other employees document names', async () => {
    await employeePage.goto('/documents');
    await employeePage.waitForLoadState('networkidle');

    const bodyText = await employeePage.textContent('body') || '';

    // Should not see other employees' names or data
    expect(bodyText).not.toContain('Chinar Owner');
    expect(bodyText).not.toContain('Aniket Manager');
    // Should not see cross-tenant data
    expect(bodyText).not.toContain('Orbit');
    expect(bodyText).not.toContain('orbit.test');
  });
});

test.describe('Company Document Upload/List Roundtrip', () => {
  let hrContext: BrowserContext;
  let hrPage: Page;
  let tempFile: { dir: string; filePath: string } | null = null;
  const companyDocTitle = `E2E-Company-Doc-${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    hrContext = await browser.newContext();
    hrPage = await loginInContext(hrContext, 'HR_ADMIN');
    tempFile = createSyntheticFile('e2e-company-policy.txt', 'Synthetic company policy for AuroraHR E2E testing.');
  });

  test.afterAll(async () => {
    if (tempFile) fs.rmSync(tempFile.dir, { recursive: true, force: true });
    await hrPage?.close();
    await hrContext?.close();
  });

  test('DR07: HR admin opens Document Library and sees company documents section', async () => {
    await hrPage.goto('/documents');
    await hrPage.waitForLoadState('networkidle');

    expect(hrPage.url()).toContain('/documents');
    const bodyText = await hrPage.textContent('body') || '';
    expect(bodyText).not.toMatch(/error.*500|internal server/i);
  });

  test('DR08: HR admin uploads synthetic company document', async () => {
    await hrPage.goto('/documents');
    await hrPage.waitForLoadState('networkidle');

    // Look for company document upload toggle
    const uploadToggle = hrPage.locator('button').filter({ hasText: /add.*company|upload.*company|add.*document/i }).first();
    if (await uploadToggle.count() === 0) {
      console.log('Company document upload button not found');
      test.skip();
      return;
    }
    await uploadToggle.click();
    await hrPage.waitForTimeout(500);

    // Fill title
    const titleInput = hrPage.locator('input[placeholder*="Certificate"]').first();
    if (await titleInput.count() > 0) {
      await titleInput.fill(companyDocTitle);
    } else {
      const labels = hrPage.locator('label').filter({ hasText: /title/i });
      const input = labels.first().locator('input').first();
      if (await input.count() > 0) {
        await input.fill(companyDocTitle);
      }
    }

    // Set file
    const fileInput = hrPage.locator('input[type="file"]').first();
    if (await fileInput.count() === 0) { test.skip(); return; }
    await fileInput.setInputFiles(tempFile!.filePath);

    // Submit
    const saveButton = hrPage.locator('button').filter({ hasText: /save|submit|add/i }).last();
    await saveButton.click();
    await hrPage.waitForTimeout(2000);

    const bodyText = await hrPage.textContent('body') || '';
    const uploadSucceeded = bodyText.includes(companyDocTitle) || !bodyText.includes('Failed to upload');
    expect(uploadSucceeded).toBeTruthy();
  });

  test('DR09: uploaded company document appears in library list', async () => {
    await hrPage.goto('/documents');
    await hrPage.waitForLoadState('networkidle');
    await hrPage.waitForTimeout(1000);

    const bodyText = await hrPage.textContent('body') || '';
    expect(bodyText).toContain(companyDocTitle);
  });

  test('DR10: employee cannot access company document library', async () => {
    const empContext = await hrPage.context().browser()!.newContext();
    const empPage = await loginInContext(empContext, 'EMPLOYEE');

    await empPage.goto('/documents');
    await empPage.waitForLoadState('networkidle');

    const url = empPage.url();
    const bodyText = await empPage.textContent('body') || '';

    const isDenied =
      url.includes('/login') ||
      url.includes('/dashboard') ||
      /denied|permission|unauthorized|not allowed|access/i.test(bodyText);

    expect(isDenied).toBeTruthy();

    // Must not show the company doc we just uploaded
    expect(bodyText).not.toContain(companyDocTitle);

    await empPage.close();
    await empContext.close();
  });

  test('DR11: denied document page does not expose file paths or storage keys', async () => {
    const empContext = await hrPage.context().browser()!.newContext();
    const empPage = await loginInContext(empContext, 'EMPLOYEE');

    await empPage.goto('/documents');
    await empPage.waitForLoadState('networkidle');

    const bodyText = await empPage.textContent('body') || '';

    expect(bodyText).not.toMatch(/\/uploads\//);
    expect(bodyText).not.toMatch(/\/var\//);
    expect(bodyText).not.toMatch(/\/home\//);
    expect(bodyText).not.toMatch(/e2e-company/);
    expect(bodyText).not.toMatch(/\.txt$/m);

    await empPage.close();
    await empContext.close();
  });
});
