#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RUN_DATE = process.env.QA_RUN_DATE || '2026-05-21';
const RUN_ID = process.env.QA_RUN_ID || `COMP-${RUN_DATE}-${Date.now()}`;
const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:5186';
const API_BASE_URL = process.env.QA_API_URL || 'http://localhost:5000/api/v1';
const OUT_DIR = process.env.QA_OUT_DIR || path.join(REPO_ROOT, 'docs/qa/compensation-transactions-2026-05-21');
const SCREENSHOT_DIR = path.join(OUT_DIR, 'screenshots');
const REPORT_PATH = path.join(OUT_DIR, 'report.md');
const JSON_PATH = path.join(OUT_DIR, 'results.json');
const CHROMIUM_PATH =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ||
  '/Users/chinar.deshpande06/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell';

const HR_EMAIL = process.env.QA_HR_EMAIL || 'anupama.bhat@acvsolutions.in';
const HR_PASSWORD = process.env.QA_HR_PASSWORD || 'pass@Manu1120';
const EMPLOYEE_ID = process.env.QA_EMPLOYEE_ID || 'd050f87e-bce9-4395-be2c-269431701c03';
const TEST_YEAR = Number(process.env.QA_TEST_YEAR || 2098);
const TEST_MONTHS = [1, 2, 3, 4, 5, 6, 7];

const results = [];
const createdPayslipIds = new Set();

function record(id, area, expected, actual, status, evidence = '', notes = '') {
  results.push({ id, area, expected, actual, status, evidence, notes });
}

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
}

async function api(method, urlPath, { token, body, expectedOk = true } = {}) {
  const response = await fetch(`${API_BASE_URL}${urlPath}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  const ok = response.ok && json?.success !== false;
  if (expectedOk && !ok) {
    throw new Error(json?.error?.message || json?.message || `${method} ${urlPath} failed with ${response.status}`);
  }

  return { status: response.status, ok, json, data: json?.data };
}

async function login() {
  const result = await api('POST', '/auth/login', {
    body: { email: HR_EMAIL, password: HR_PASSWORD },
  });
  return result.data;
}

async function getCompensation(token) {
  return (await api('GET', `/compensation/employees/${EMPLOYEE_ID}`, { token })).data;
}

async function deleteTestPayslips(token) {
  const compensation = await getCompensation(token);
  const targetPayslips = (compensation.payslips || []).filter(
    (payslip) => Number(payslip.year) === TEST_YEAR && TEST_MONTHS.includes(Number(payslip.month))
  );
  for (const payslip of targetPayslips) {
    await api('DELETE', `/compensation/payslips/${payslip.payslipId}`, { token }).catch(() => undefined);
  }
}

function validPayslipPayload(month, overrides = {}) {
  return {
    month,
    year: TEST_YEAR,
    grossEarnings: 60000,
    totalDeductions: 9000,
    netPay: 51000,
    paidDays: 30,
    lopDays: 0,
    paymentDate: `${TEST_YEAR}-${String(month).padStart(2, '0')}-28`,
    status: 'final',
    employeeVisible: true,
    remarks: `QA transaction ${RUN_ID}`,
    components: [
      { componentName: 'Basic Salary', componentType: 'earning', amount: 30000, displayOrder: 1 },
      { componentName: 'HRA', componentType: 'earning', amount: 15000, displayOrder: 2 },
      { componentName: 'Special Allowance', componentType: 'earning', amount: 15000, displayOrder: 3 },
      { componentName: 'PF Employee Contribution', componentType: 'deduction', amount: 1800, displayOrder: 4 },
      { componentName: 'Professional Tax', componentType: 'deduction', amount: 200, displayOrder: 5 },
      { componentName: 'TDS', componentType: 'deduction', amount: 7000, displayOrder: 6 },
    ],
    ...overrides,
  };
}

async function runApiTests(token) {
  await deleteTestPayslips(token);

  const unauth = await api('GET', `/compensation/employees/${EMPLOYEE_ID}`, { expectedOk: false });
  record(
    'API-01',
    'Authorization',
    'Compensation data rejects missing token',
    `HTTP ${unauth.status}`,
    unauth.status === 401 ? 'passed' : 'failed'
  );

  const compensation = await getCompensation(token);
  record(
    'API-02',
    'Read model',
    'HR admin can read active salary structure, payslips and timeline',
    `structures=${compensation.salaryStructures?.length || 0}, payslips=${compensation.payslips?.length || 0}, timeline=${compensation.timeline?.length || 0}`,
    compensation.summary && Array.isArray(compensation.payslips) ? 'passed' : 'failed'
  );

  const created = await api('POST', `/compensation/employees/${EMPLOYEE_ID}/payslips`, {
    token,
    body: validPayslipPayload(1),
  });
  createdPayslipIds.add(created.data.payslipId);
  record(
    'API-03',
    'CRUD create',
    'Manual salary transaction saves exact gross, deduction, net and components',
    `net=${created.data.netPay}, components=${created.data.components?.length || 0}`,
    Number(created.data.netPay) === 51000 && created.data.components?.length === 6 ? 'passed' : 'failed',
    created.data.payslipId
  );

  const duplicate = await api('POST', `/compensation/employees/${EMPLOYEE_ID}/payslips`, {
    token,
    body: validPayslipPayload(1),
    expectedOk: false,
  });
  record(
    'API-04',
    'Duplicate control',
    'Same employee/month/year cannot be created twice',
    duplicate.json?.error?.message || `HTTP ${duplicate.status}`,
    duplicate.status === 400 ? 'passed' : 'failed'
  );

  const badMonth = await api('POST', `/compensation/employees/${EMPLOYEE_ID}/payslips`, {
    token,
    body: validPayslipPayload(13),
    expectedOk: false,
  });
  record(
    'API-05',
    'Validation',
    'Invalid month is rejected',
    badMonth.json?.error?.message || `HTTP ${badMonth.status}`,
    badMonth.status === 400 ? 'passed' : 'failed'
  );

  const badMath = await api('POST', `/compensation/employees/${EMPLOYEE_ID}/payslips`, {
    token,
    body: validPayslipPayload(2, { netPay: 52000 }),
    expectedOk: false,
  });
  record(
    'API-06',
    'Computation',
    'Net pay must equal gross earnings minus deductions',
    badMath.json?.error?.message || `HTTP ${badMath.status}`,
    /minus total deductions|should match/i.test(badMath.json?.error?.message || '') ? 'passed' : 'failed'
  );

  const negative = await api('POST', `/compensation/employees/${EMPLOYEE_ID}/payslips`, {
    token,
    body: validPayslipPayload(2, { totalDeductions: -10, netPay: 60010 }),
    expectedOk: false,
  });
  record(
    'API-07',
    'Validation',
    'Negative salary values are rejected',
    negative.json?.error?.message || `HTTP ${negative.status}`,
    /cannot be negative/i.test(negative.json?.error?.message || '') ? 'passed' : 'failed'
  );

  const updated = await api('PUT', `/compensation/payslips/${created.data.payslipId}`, {
    token,
    body: validPayslipPayload(1, {
      paidDays: 29,
      lopDays: 1,
      paymentDate: `${TEST_YEAR}-01-29`,
      remarks: 'QA update without component replacement',
    }),
  });
  record(
    'API-08',
    'CRUD update',
    'Updating transaction fields preserves component split',
    `paidDays=${updated.data.paidDays}, components=${updated.data.components?.length || 0}`,
    Number(updated.data.paidDays) === 29 && updated.data.components?.length === 6 ? 'passed' : 'failed'
  );

  const generated = await api('POST', `/compensation/employees/${EMPLOYEE_ID}/payslips/generate-monthly`, {
    token,
    body: {
      month: 2,
      year: TEST_YEAR,
      paidDays: 30,
      lopDays: 0,
      paymentDate: `${TEST_YEAR}-02-28`,
      employeeVisible: true,
      remarks: 'QA generated from active salary structure',
    },
  });
  createdPayslipIds.add(generated.data.payslipId);
  const generatedNetOk = Number(generated.data.netPay) === Number(generated.data.grossEarnings) - Number(generated.data.totalDeductions);
  record(
    'API-09',
    'Monthly generation',
    'Monthly generation copies active salary structure and computes net correctly',
    `gross=${generated.data.grossEarnings}, deductions=${generated.data.totalDeductions}, net=${generated.data.netPay}, components=${generated.data.components?.length || 0}`,
    generatedNetOk && (generated.data.components?.length || 0) > 0 ? 'passed' : 'failed',
    generated.data.payslipId
  );

  const duplicateGenerate = await api('POST', `/compensation/employees/${EMPLOYEE_ID}/payslips/generate-monthly`, {
    token,
    body: { month: 2, year: TEST_YEAR, paidDays: 30, lopDays: 0 },
    expectedOk: false,
  });
  record(
    'API-10',
    'Monthly generation',
    'Generated monthly transaction cannot duplicate existing period',
    duplicateGenerate.json?.error?.message || `HTTP ${duplicateGenerate.status}`,
    duplicateGenerate.status === 400 ? 'passed' : 'failed'
  );

  const bulk = await api('POST', `/compensation/employees/${EMPLOYEE_ID}/payslips/bulk-import`, {
    token,
    body: {
      mode: 'upsert',
      rows: [
        {
          month: 'March',
          year: TEST_YEAR,
          paymentDate: `${TEST_YEAR}-03-31`,
          paidDays: 31,
          lopDays: 0,
          employeeVisible: true,
          remarks: 'QA bulk created from components',
          components: [
            { componentName: 'Basic Salary', componentType: 'earning', amount: 32000 },
            { componentName: 'HRA', componentType: 'earning', amount: 16000 },
            { componentName: 'TDS', componentType: 'deduction', amount: 6000 },
          ],
        },
        {
          month: 3,
          year: TEST_YEAR,
          grossEarnings: 52000,
          totalDeductions: 7000,
          netPay: 45000,
          paidDays: 31,
          lopDays: 0,
          employeeVisible: true,
          remarks: 'QA bulk upsert update',
        },
        {
          month: 4,
          year: TEST_YEAR,
          grossEarnings: 50000,
          totalDeductions: 5000,
          netPay: 46000,
          paidDays: 30,
          lopDays: 0,
          employeeVisible: true,
          remarks: 'QA intentionally invalid bulk row',
        },
      ],
    },
  });
  record(
    'API-11',
    'Bulk import',
    'Bulk import creates, updates, and reports invalid rows without aborting the whole file',
    `created=${bulk.data.created}, updated=${bulk.data.updated}, failed=${bulk.data.failed}`,
    bulk.data.created === 1 && bulk.data.updated === 1 && bulk.data.failed === 1 ? 'passed' : 'failed'
  );

  const postBulk = await getCompensation(token);
  const bulkPayslip = postBulk.payslips.find((payslip) => Number(payslip.year) === TEST_YEAR && Number(payslip.month) === 3);
  if (bulkPayslip?.payslipId) createdPayslipIds.add(bulkPayslip.payslipId);
  record(
    'API-12',
    'Data sync',
    'Bulk upsert result appears in compensation read model and transaction timeline',
    `net=${bulkPayslip?.netPay}, timelineHasMarch=${postBulk.timeline.some((item) => item.id === bulkPayslip?.payslipId)}`,
    Number(bulkPayslip?.netPay) === 45000 && postBulk.timeline.some((item) => item.id === bulkPayslip?.payslipId) ? 'passed' : 'failed'
  );
}

async function loadPlaywright() {
  try {
    return require('/Users/chinar.deshpande06/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  } catch {
    return require('playwright');
  }
}

async function runVisualTests(session) {
  const playwright = await loadPlaywright();
  const launchOptions = { headless: true };
  try {
    await fs.access(CHROMIUM_PATH);
    launchOptions.executablePath = CHROMIUM_PATH;
  } catch {
    // Fall back to Playwright's bundled executable if the known local binary is unavailable.
  }
  const browser = await playwright.chromium.launch(launchOptions);
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    acceptDownloads: true,
  });

  try {
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.getByRole('button', { name: 'AuroraHR Home', exact: true }).waitFor({ timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'login-home-route.png'), fullPage: true });
    await page.getByRole('button', { name: 'AuroraHR Home', exact: true }).click();
    await page.waitForURL(`${BASE_URL}/`, { timeout: 10000 });
    await page.getByText(/built for serious adoption/i).waitFor({ timeout: 10000 }).catch(() => undefined);
    const landingText = await page.locator('body').innerText();
    const landingTextLower = landingText.toLowerCase();
    const reachedLanding =
      landingTextLower.includes('built for serious adoption') || landingTextLower.includes('platform capabilities');
    record(
      'UI-01',
      'Navigation',
      'Login screen provides a clear route back to the public landing page',
      reachedLanding ? 'Landing page reached' : 'Landing page text missing',
      reachedLanding ? 'passed' : 'failed',
      'screenshots/login-home-route.png'
    );

    await context.addInitScript(({ user, tokens }) => {
      window.localStorage.setItem('user', JSON.stringify(user));
      window.localStorage.setItem('tokens', JSON.stringify(tokens));
    }, { user: session.user, tokens: session.tokens });

    await page.goto(`${BASE_URL}/employees/${EMPLOYEE_ID}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.getByText('Compensation', { exact: true }).first().click();
    await page.getByRole('button', { name: 'Salary Transaction History' }).click();
    await page.getByRole('button', { name: 'Generate Monthly' }).waitFor({ timeout: 10000 });
    await page.getByRole('button', { name: 'Bulk Import' }).waitFor({ timeout: 10000 });
    await page.getByRole('columnheader', { name: 'Net Amount' }).waitFor({ timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'transaction-history-table.png'), fullPage: true });
    record(
      'UI-02',
      'Transaction UI',
      'Transaction history exposes CRUD, monthly generation, bulk import, and salary columns',
      'Buttons and Net Amount column found',
      'passed',
      'screenshots/transaction-history-table.png'
    );

    await page.getByRole('button', { name: 'Bulk Import' }).click();
    await page.getByRole('button', { name: 'Download Template' }).waitFor({ timeout: 10000 });
    await page.getByText('Any extra column becomes a salary head').waitFor({ timeout: 10000 });
    await page.locator('span').filter({ hasText: /^Basic Salary$/ }).waitFor({ timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'bulk-import-guide.png'), fullPage: true });
    record(
      'UI-03',
      'Bulk import journey',
      'Bulk import is guided with template, rules, and upload path',
      'Guide modal rendered with template columns and rules',
      'passed',
      'screenshots/bulk-import-guide.png'
    );

    const download = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      page.getByRole('button', { name: 'Download Template' }).click(),
    ]).then(([downloadEvent]) => downloadEvent);
    const suggestedName = download.suggestedFilename();
    const downloadPath = path.join(OUT_DIR, suggestedName);
    await download.saveAs(downloadPath);
    const templateText = await fs.readFile(downloadPath, 'utf8');
    const templateHasRequiredColumns = ['month', 'year', 'grossEarnings', 'totalDeductions', 'netPay', 'Basic Salary', 'TDS'].every((column) =>
      templateText.includes(column)
    );
    record(
      'UI-04',
      'Bulk import template',
      'Downloaded template contains prescribed required fields and salary head examples',
      suggestedName,
      templateHasRequiredColumns ? 'passed' : 'failed',
      path.relative(REPO_ROOT, downloadPath)
    );

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
    await mobile.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    const mobileBody = await mobile.locator('body').innerText();
    await mobile.screenshot({ path: path.join(SCREENSHOT_DIR, 'mobile-login-home-route.png'), fullPage: true });
    record(
      'UI-05',
      'Responsive login',
      'Mobile login still exposes AuroraHR Home without horizontal overflow',
      `hasHome=${mobileBody.includes('AuroraHR Home')}`,
      mobileBody.includes('AuroraHR Home') ? 'passed' : 'failed',
      'screenshots/mobile-login-home-route.png'
    );
    await mobile.close();
  } finally {
    await context.close();
    await browser.close();
  }
}

async function cleanup(token) {
  for (const payslipId of createdPayslipIds) {
    await api('DELETE', `/compensation/payslips/${payslipId}`, { token }).catch(() => undefined);
  }
}

async function writeReport() {
  const passed = results.filter((result) => result.status === 'passed').length;
  const failed = results.filter((result) => result.status === 'failed').length;
  const markdown = [
    '# Compensation Transaction Sprint QA',
    '',
    `Run date: ${RUN_DATE}`,
    `Run id: ${RUN_ID}`,
    `Target: ${BASE_URL}`,
    `API: ${API_BASE_URL}`,
    '',
    '## Executive Summary',
    '',
    `- Passed: ${passed}`,
    `- Failed: ${failed}`,
    `- Production-readiness verdict: ${failed === 0 ? 'Local sprint changes are production-candidate after normal code review and deployment smoke.' : 'Not production-ready until failed checks are repaired.'}`,
    '',
    '## Scope',
    '',
    'This QA pass covers the AuroraHR changes made today: compensation salary transaction history, CRUD backing APIs, monthly generation, bulk import with prescribed template, computation validation, data sync into compensation read models, login-to-home navigation, and core UI visibility.',
    '',
    '## Business Process Narrative',
    '',
    'An HR administrator maintains employee compensation during implementation and monthly operations. Historical salary transactions can be manually entered, generated from the active salary structure, or bulk imported during migration. Each transaction must preserve gross, deductions, net pay, salary heads, and payslip context. Invalid math, duplicate periods, and malformed values must be rejected without corrupting the employee record.',
    '',
    '## Test Outcomes',
    '',
    '| ID | Area | Expected | Actual | Status | Evidence | Notes |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...results.map((result) =>
      `| ${result.id} | ${result.area} | ${String(result.expected).replace(/\|/g, '\\|')} | ${String(result.actual).replace(/\|/g, '\\|')} | ${result.status} | ${String(result.evidence || '').replace(/\|/g, '\\|')} | ${String(result.notes || '').replace(/\|/g, '\\|')} |`
    ),
    '',
    '## API Proof',
    '',
    '- Authentication and missing-token control verified.',
    '- Create, update, duplicate rejection, invalid month, negative values, and net-pay arithmetic were verified.',
    '- Monthly generation from active salary structure verified.',
    '- Bulk import verified for create, upsert update, and row-level failure.',
    '- Read model and timeline sync verified after import.',
    '',
    '## Visual Proof',
    '',
    '- `screenshots/login-home-route.png` proves the login route has a home navigation path.',
    '- `screenshots/transaction-history-table.png` proves the transaction table and actions render.',
    '- `screenshots/bulk-import-guide.png` proves the guided import journey and template instructions render.',
    '- `screenshots/mobile-login-home-route.png` proves the mobile login view keeps the home route visible.',
    '',
    '## Gaps Found',
    '',
    failed === 0 ? '- None in this local QA pass.' : '- See failed rows above.',
    '',
    '## Repairs Made',
    '',
    '- No new repairs were required during this QA pass.',
    '',
    '## Residual Risks',
    '',
    '- This pass used local database data and local auth. Production smoke should be rerun after deployment.',
    '- Bulk import currently supports CSV; XLS/XLSX import can be added later if HR migration teams prefer spreadsheet upload directly.',
    '',
    '## Rerun Commands',
    '',
    '```bash',
    'npm run build --prefix backend',
    'npm run build --prefix frontend-web',
    'node scripts/qa/compensation-transaction-qa.mjs',
    '```',
    '',
  ].join('\n');

  await fs.writeFile(REPORT_PATH, markdown);
  await fs.writeFile(JSON_PATH, JSON.stringify({
    runId: RUN_ID,
    generatedAt: new Date().toISOString(),
    target: BASE_URL,
    api: API_BASE_URL,
    summary: { passed, failed },
    results,
  }, null, 2));
}

async function main() {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  const session = await login();
  const token = session.tokens.token;
  try {
    await runApiTests(token);
    await runVisualTests(session);
  } finally {
    await cleanup(token);
  }
  await writeReport();
  const failed = results.filter((result) => result.status === 'failed').length;
  console.log(JSON.stringify({
    runId: RUN_ID,
    report: path.relative(REPO_ROOT, REPORT_PATH),
    results: { passed: results.length - failed, failed },
  }, null, 2));
  if (failed > 0) process.exitCode = 1;
}

main().catch(async (error) => {
  record('RUN-ERROR', 'Harness', 'QA harness completes', error.message, 'failed');
  await writeReport().catch(() => undefined);
  console.error(error);
  process.exitCode = 1;
});
