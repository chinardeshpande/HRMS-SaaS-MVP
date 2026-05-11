#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RUN_DATE = process.env.QA_RUN_DATE || '2026-05-11';
const RUN_ID = process.env.QA_RUN_ID || `ROLE-PERSONA-HARDENING-${RUN_DATE}-${Date.now()}`;
const BASE_URL = process.env.QA_BASE_URL || 'https://aurorahr.in';
const API_BASE_URL = process.env.QA_API_URL || 'https://aurorahr.in/api/v1';
const OUT_DIR = process.env.QA_OUT_DIR || path.join(REPO_ROOT, `docs/qa/role-persona-hardening-${RUN_DATE}`);
const SCREENSHOT_DIR = path.join(OUT_DIR, 'screenshots');
const REPORT_PATH = path.join(OUT_DIR, 'report.md');
const JSON_PATH = path.join(OUT_DIR, 'results.json');

const results = [];
const screenshots = [];

const personas = {
  admin: {
    label: 'Owner / System Admin',
    dashboardTitle: 'Owner Implementation Console',
    expectedDashboard: ['Implementation Checklist', 'Owner Controls', 'Owner Settings'],
    expectedNav: ['Dashboard', 'Employees', 'Onboarding', 'Attendance', 'Leave Management', 'Reports', 'Settings'],
    forbiddenDashboard: ['Employee My HR', 'Manager Team Work Queue', 'HR Action Queue'],
    forbiddenNav: [],
  },
  hr: {
    label: 'HR Operations',
    dashboardTitle: 'HR Operations',
    expectedDashboard: ['HR Action Queue', 'Operations Focus', 'Active Employees', 'Pending Approvals'],
    expectedNav: ['Dashboard', 'Employees', 'Onboarding', 'Attendance', 'Leave Management', 'Reports', 'Settings'],
    forbiddenDashboard: ['Owner Controls', 'Employee My HR', 'Team Action Queue'],
    forbiddenNav: [],
  },
  manager: {
    label: 'Manager / Approver',
    dashboardTitle: 'Manager Team Work Queue',
    expectedDashboard: ['Team Action Queue', 'Team Health', 'Team Members', 'Pending Approvals'],
    expectedNav: ['Dashboard', 'Employees', 'Attendance', 'Leave Management', 'Performance', 'Exit Management', 'Documents'],
    forbiddenDashboard: ['Owner Controls', 'Implementation Checklist', 'HR Action Queue', 'Employee My HR'],
    forbiddenNav: ['Settings', 'Reports', 'Onboarding', 'Master Data'],
  },
  employee: {
    label: 'Individual Employee',
    dashboardTitle: 'Employee My HR',
    expectedDashboard: ['My Self-Service', 'Leave Balance', 'Week Hours', 'Month Hours', 'My Leave Balances', 'HR Connect Wall'],
    expectedNav: ['Dashboard', 'Attendance', 'Leave Management', 'Calendar', 'HR Connect', 'Org Chart', 'My HR Documents'],
    forbiddenDashboard: ['Add Employees', 'Configure Settings', 'Owner Controls', 'Implementation Checklist', 'Team Action Queue', 'HR Action Queue'],
    forbiddenNav: ['Employees', 'Performance', 'Exit Management', 'Documents', 'Settings', 'Reports', 'Onboarding', 'Master Data'],
  },
};

const deniedRoutes = {
  employee: [
    ['/employees', 'not available for your role'],
    ['/performance', 'not available for your role'],
    ['/exit', 'not available for your role'],
    ['/documents', 'not available for your role'],
    ['/settings', 'Settings are available to HR administrators'],
    ['/reports', 'not available for your role'],
    ['/onboarding', 'not available for your role'],
    ['/departments', 'not available for your role'],
    ['/designations', 'not available for your role'],
  ],
  manager: [
    ['/settings', 'Settings are available to HR administrators'],
    ['/reports', 'not available for your role'],
    ['/onboarding', 'not available for your role'],
    ['/departments', 'not available for your role'],
    ['/designations', 'not available for your role'],
  ],
  hr: [],
  admin: [],
};

function record(id, useCase, role, expected, actual, status, evidence = '', notes = '') {
  results.push({ id, useCase, role, expected, actual, status, evidence, notes });
}

function safe(value) {
  return String(value ?? '').replaceAll('|', '/').replaceAll('\n', ' ');
}

async function loadPlaywright() {
  try {
    return require('/Users/chinar.deshpande06/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  } catch {
    return require('playwright');
  }
}

async function api(method, urlPath, body, token) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${urlPath}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  return { status: response.status, ok: response.ok && json?.success !== false, json };
}

async function demoSession(persona) {
  const response = await api('POST', '/demo/login', { persona });
  if (!response.ok) throw new Error(`Unable to create ${persona} demo session: ${response.status}`);
  return response.json.data;
}

async function installSession(page, session, overrideUser = {}) {
  await page.addInitScript(({ user, tokens, overrideUser }) => {
    window.localStorage.setItem('user', JSON.stringify({ ...user, ...overrideUser }));
    window.localStorage.setItem('tokens', JSON.stringify(tokens));
  }, { user: session.user, tokens: session.tokens, overrideUser });
}

async function visibleText(page) {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => undefined);
  await page.waitForTimeout(500);
  return (await page.locator('body').innerText({ timeout: 15000 })).trim();
}

async function screenshot(page, filename, id, title, role) {
  const screenshotPath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const ref = path.relative(REPO_ROOT, screenshotPath);
  screenshots.push({ id, title, role, path: ref });
  return ref;
}

function assertText(text, expectedTexts, forbiddenTexts = []) {
  const lowerText = text.toLowerCase();
  for (const expected of expectedTexts) {
    if (!lowerText.includes(expected.toLowerCase())) throw new Error(`Missing expected text: ${expected}`);
  }
  for (const forbidden of forbiddenTexts) {
    if (lowerText.includes(forbidden.toLowerCase())) throw new Error(`Forbidden text present: ${forbidden}`);
  }
  if (lowerText.includes('referenceerror') || lowerText.includes('typeerror') || lowerText.includes('this page could not be loaded')) {
    throw new Error('Dashboard rendered an application error boundary');
  }
}

async function newPage(browser, session, viewport = { width: 1440, height: 1100 }, overrideUser = {}) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  if (session) await installSession(page, session, overrideUser);
  return { context, page };
}

async function testDashboard(browser, persona, session) {
  const config = personas[persona];
  const { context, page } = await newPage(browser, session);
  try {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const text = await visibleText(page);
    assertText(text, [config.dashboardTitle, ...config.expectedDashboard], config.forbiddenDashboard);

    const nav = page.getByTestId('primary-navigation');
    for (const label of config.expectedNav) {
      const visible = await nav.getByRole('button', { name: new RegExp(`^${label}$`, 'i') }).first().isVisible().catch(() => false);
      if (!visible) throw new Error(`Expected nav item missing: ${label}`);
    }
    for (const label of config.forbiddenNav) {
      const visible = await nav.getByRole('button', { name: new RegExp(`^${label}$`, 'i') }).first().isVisible().catch(() => false);
      if (visible) throw new Error(`Forbidden nav item visible: ${label}`);
    }

    const evidence = await screenshot(page, `${persona}-dashboard-persona.png`, `DASH_${persona.toUpperCase()}`, `${config.label} dashboard`, persona);
    record(`DASH_${persona.toUpperCase()}`, `${config.label} sees the correct role dashboard and navigation`, persona, 'Role-specific dashboard, nav allow-list, and nav deny-list are correct', 'Dashboard matched expected role controls', 'passed', evidence);
  } catch (error) {
    record(`DASH_${persona.toUpperCase()}`, `${config.label} sees the correct role dashboard and navigation`, persona, 'Role-specific dashboard, nav allow-list, and nav deny-list are correct', error.message, 'failed');
  } finally {
    await context.close();
  }
}

async function testDeniedRoutes(browser, persona, session) {
  for (const [route, deniedText] of deniedRoutes[persona]) {
    const { context, page } = await newPage(browser, session);
    const id = `DENY_${persona.toUpperCase()}_${route.replaceAll('/', '_').replaceAll(':', '').toUpperCase()}`;
    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      const text = await visibleText(page);
      assertText(text, [deniedText, 'Back to Dashboard']);
      const evidence = await screenshot(page, `${persona}-denied-${route.replaceAll('/', '-') || 'root'}.png`, id, `${persona} denied ${route}`, persona);
      record(id, `${persona} cannot deep-link into restricted route ${route}`, persona, 'Permission-denied page with safe dashboard return', 'Restricted route denied in UI', 'passed', evidence);
    } catch (error) {
      record(id, `${persona} cannot deep-link into restricted route ${route}`, persona, 'Permission-denied page with safe dashboard return', error.message, 'failed');
    } finally {
      await context.close();
    }
  }
}

async function testUnauthenticatedRedirect(browser) {
  const { context, page } = await newPage(browser, null);
  try {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await visibleText(page);
    if (!page.url().includes('/login')) throw new Error(`Expected /login redirect, got ${page.url()}`);
    const evidence = await screenshot(page, 'public-dashboard-redirect-login.png', 'AUTH_PUBLIC_REDIRECT', 'Public user is redirected to login', 'public');
    record('AUTH_PUBLIC_REDIRECT', 'Unauthenticated visitor cannot open the dashboard directly', 'public', 'Redirect to login', page.url(), 'passed', evidence);
  } catch (error) {
    record('AUTH_PUBLIC_REDIRECT', 'Unauthenticated visitor cannot open the dashboard directly', 'public', 'Redirect to login', error.message, 'failed');
  } finally {
    await context.close();
  }
}

async function testTamperedRole(browser, employeeSession) {
  const { context, page } = await newPage(browser, employeeSession, { width: 1440, height: 1100 }, { role: 'system_admin' });
  try {
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const text = await visibleText(page);
    assertText(text, ['Settings are available to HR administrators', 'Back to Dashboard']);
    const evidence = await screenshot(page, 'tampered-role-settings-denied.png', 'AUTH_TAMPERED_ROLE_DENIED', 'Tampered local role denied by route/session consistency', 'employee');
    record('AUTH_TAMPERED_ROLE_DENIED', 'Employee session with a tampered local role cannot enter admin settings', 'employee', 'Server/session role remains authoritative enough to deny settings', 'Settings denied', 'passed', evidence);
  } catch (error) {
    record('AUTH_TAMPERED_ROLE_DENIED', 'Employee session with a tampered local role cannot enter admin settings', 'employee', 'Server/session role remains authoritative enough to deny settings', error.message, 'failed');
  } finally {
    await context.close();
  }
}

async function testDashboardActions(browser, persona, session) {
  const actions = {
    admin: [
      ['Subscription and billing', '/settings', 'Settings'],
      ['Executive reports', '/reports', 'Reports'],
    ],
    hr: [
      ['Leave approvals', '/leave', 'Leave'],
      ['Attendance regularizations', '/attendance', 'Attendance'],
      ['Performance reviews', '/performance', 'Performance'],
    ],
    manager: [
      ['Leave approvals', '/leave', 'Leave'],
      ['Attendance regularizations', '/attendance', 'Attendance'],
      ['Performance reviews', '/performance', 'Performance'],
    ],
    employee: [
      ['Clock in/out and timesheet', '/attendance', 'Attendance'],
      ['Apply for leave', '/leave', 'Leave'],
      ['My HR documents', '/my-hr-documents', 'My HR Documents'],
      ['HR Connect', '/hr-connect', 'HR Connect'],
    ],
  }[persona];

  for (const [buttonName, expectedPath, expectedText] of actions) {
    const { context, page } = await newPage(browser, session);
    const id = `ACTION_${persona.toUpperCase()}_${buttonName.replaceAll(' ', '_').replaceAll('/', '_').toUpperCase()}`;
    try {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await visibleText(page);
      await page.getByRole('button', { name: new RegExp(buttonName, 'i') }).first().click({ timeout: 10000 });
      await page.waitForURL((url) => url.pathname.startsWith(expectedPath), { timeout: 15000 });
      const text = await visibleText(page);
      assertText(text, [expectedText]);
      const evidence = await screenshot(page, `${persona}-action-${buttonName.toLowerCase().replaceAll(' ', '-')}.png`, id, `${persona} dashboard action ${buttonName}`, persona);
      record(id, `${personas[persona].label} dashboard action "${buttonName}" opens the right journey`, persona, `Navigate to ${expectedPath}`, page.url(), 'passed', evidence);
    } catch (error) {
      record(id, `${personas[persona].label} dashboard action "${buttonName}" opens the right journey`, persona, `Navigate to ${expectedPath}`, error.message, 'failed');
    } finally {
      await context.close();
    }
  }
}

async function testApprovalsDropdown(browser, persona, session) {
  if (!['hr', 'manager'].includes(persona)) return;
  const { context, page } = await newPage(browser, session);
  const id = `DROPDOWN_${persona.toUpperCase()}_APPROVALS`;
  try {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await visibleText(page);
    await page.locator('.stat-card').filter({ hasText: 'Pending Approvals' }).first().click({ timeout: 10000 });
    const text = await visibleText(page);
    assertText(text, ['Select Approval Type', 'Leave Approvals', 'Attendance Approvals', 'Appraisal Reviews']);
    const evidence = await screenshot(page, `${persona}-approvals-dropdown.png`, id, `${persona} approvals dropdown`, persona);
    record(id, `${personas[persona].label} can inspect approval categories from dashboard`, persona, 'Approval dropdown lists leave, attendance, and appraisal paths', 'Dropdown rendered expected categories', 'passed', evidence);
  } catch (error) {
    record(id, `${personas[persona].label} can inspect approval categories from dashboard`, persona, 'Approval dropdown lists leave, attendance, and appraisal paths', error.message, 'failed');
  } finally {
    await context.close();
  }
}

async function testMobileDashboard(browser, persona, session) {
  const { context, page } = await newPage(browser, session, { width: 390, height: 844 });
  const id = `MOBILE_${persona.toUpperCase()}_DASHBOARD`;
  try {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const text = await visibleText(page);
    assertText(text, [personas[persona].dashboardTitle], personas[persona].forbiddenDashboard);
    const evidence = await screenshot(page, `${persona}-mobile-dashboard.png`, id, `${persona} mobile dashboard`, persona);
    record(id, `${personas[persona].label} dashboard is usable on mobile viewport`, persona, 'Persona heading renders and restricted content stays hidden', 'Mobile dashboard rendered without error', 'passed', evidence);
  } catch (error) {
    record(id, `${personas[persona].label} dashboard is usable on mobile viewport`, persona, 'Persona heading renders and restricted content stays hidden', error.message, 'failed');
  } finally {
    await context.close();
  }
}

async function testApiFailureFallback(browser, employeeSession) {
  const { context, page } = await newPage(browser, employeeSession);
  const id = 'FAILURE_DASHBOARD_STATS_FALLBACK';
  try {
    await page.route(`${API_BASE_URL}/dashboard/stats`, (route) => {
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Synthetic QA failure' }) });
    });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const text = await visibleText(page);
    assertText(text, ['Employee My HR', 'My Self-Service'], ['Failed to load dashboard statistics', 'This page could not be loaded']);
    const evidence = await screenshot(page, 'employee-dashboard-api-fallback.png', id, 'Employee dashboard survives stats API failure', 'employee');
    record(id, 'Dashboard remains usable when dashboard stats API fails', 'employee', 'Fallback metrics render without blocking self-service', 'Dashboard rendered fallback self-service view', 'passed', evidence);
  } catch (error) {
    record(id, 'Dashboard remains usable when dashboard stats API fails', 'employee', 'Fallback metrics render without blocking self-service', error.message, 'failed');
  } finally {
    await context.close();
  }
}

async function testApiAuthorization(sessions) {
  const cases = [
    ['API_PUBLIC_DASHBOARD_DENIED', 'Public request cannot read dashboard stats', 'public', '/dashboard/stats', undefined, [401]],
    ['API_EMPLOYEE_DASHBOARD_ALLOWED', 'Employee can read own dashboard stats', 'employee', '/dashboard/stats', sessions.employee.tokens.token, [200]],
    ['API_MANAGER_DASHBOARD_ALLOWED', 'Manager can read team dashboard stats', 'manager', '/dashboard/stats', sessions.manager.tokens.token, [200]],
    ['API_HR_DASHBOARD_ALLOWED', 'HR can read operations dashboard stats', 'hr', '/dashboard/stats', sessions.hr.tokens.token, [200]],
    ['API_ADMIN_DASHBOARD_ALLOWED', 'Owner can read implementation dashboard stats', 'admin', '/dashboard/stats', sessions.admin.tokens.token, [200]],
    ['API_EMPLOYEE_TENANT_TICKETS_DENIED', 'Employee cannot list all tenant tickets', 'employee', '/helpdesk/tickets', sessions.employee.tokens.token, [403]],
    ['API_EMPLOYEE_MY_TICKETS_ALLOWED', 'Employee can list own helpdesk tickets', 'employee', '/helpdesk/tickets/my', sessions.employee.tokens.token, [200]],
    ['API_HR_TENANT_TICKETS_ALLOWED', 'HR can list tenant helpdesk tickets', 'hr', '/helpdesk/tickets', sessions.hr.tokens.token, [200]],
    ['API_HR_SUBSCRIPTION_DENIED', 'HR cannot access owner subscription settings', 'hr', '/settings/subscription', sessions.hr.tokens.token, [403]],
    ['API_ADMIN_SUBSCRIPTION_ALLOWED', 'Owner can access subscription settings', 'admin', '/settings/subscription', sessions.admin.tokens.token, [200]],
  ];

  for (const [id, title, role, endpoint, token, expectedStatuses] of cases) {
    const response = await api('GET', endpoint, undefined, token);
    const passed = expectedStatuses.includes(response.status);
    record(id, title, role, `HTTP ${expectedStatuses.join(' or ')}`, `HTTP ${response.status}`, passed ? 'passed' : 'failed', `${endpoint} status=${response.status}`, passed ? '' : JSON.stringify(response.json).slice(0, 200));
  }
}

async function testConcurrentDashboardLoad(browser, sessions) {
  const loadOne = async (persona, index) => {
    const { context, page } = await newPage(browser, sessions[persona], { width: 1280, height: 900 });
    try {
      await page.goto(`${BASE_URL}/dashboard?stress=${index}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      const text = await visibleText(page);
      assertText(text, [personas[persona].dashboardTitle], personas[persona].forbiddenDashboard);
      return { persona, ok: true };
    } catch (error) {
      return { persona, ok: false, error: error.message };
    } finally {
      await context.close();
    }
  };

  const batch = [];
  for (let i = 0; i < 3; i += 1) {
    for (const persona of Object.keys(personas)) batch.push(loadOne(persona, i));
  }
  const outcomes = await Promise.all(batch);
  const failed = outcomes.filter((outcome) => !outcome.ok);
  record(
    'STRESS_CONCURRENT_DASHBOARDS',
    'Concurrent role dashboard loads remain stable across personas',
    'all',
    '12 parallel dashboard loads render correct persona headings',
    failed.length ? failed.map((item) => `${item.persona}: ${item.error}`).join('; ') : 'All concurrent loads rendered correctly',
    failed.length ? 'failed' : 'passed',
    '12 browser contexts'
  );
}

async function writeReport() {
  const passed = results.filter((result) => result.status === 'passed').length;
  const failed = results.filter((result) => result.status === 'failed').length;
  const verdict = failed === 0
    ? 'Production-ready for the tested role-based persona dashboard/access surface.'
    : 'Not production-ready until failed role/access scenarios are repaired and rerun.';

  const markdown = [
    '# Role-Based Personas Production Readiness Visual QA',
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
    `- Production-readiness verdict: ${verdict}`,
    '',
    '## Scope',
    '',
    'This exercise validates the role-based persona layer for AuroraHR: dashboard content, navigation, direct URL access, self-service journeys, manager/HR approval journeys, owner implementation controls, API authorization, mobile rendering, API failure fallback, and concurrent dashboard load behavior.',
    '',
    '## Personas And Data',
    '',
    '| Persona | Business role | Expected product focus |',
    '| --- | --- | --- |',
    '| admin | Owner / first company administrator | Implementation, setup, subscription, master data, reporting, and global controls. |',
    '| hr | HR operations manager | Employee operations, lifecycle work, approvals, reports, settings, and HR interventions. |',
    '| manager | People manager / approver | Team availability, team approvals, performance, exits, and team documents. |',
    '| employee | Individual employee | Attendance, leave, HR documents, HR Connect, personal updates, and self-service only. |',
    '',
    '## Business Process Narrative',
    '',
    'A company owner should see implementation and commercial-readiness controls. HR should see organization-wide operations and approval queues without owner-only billing controls. A manager should see team work queues and direct-report workflows without HR/admin setup surfaces. An employee should land in a narrow self-service workspace showing leave, attendance, HR documents, messages, and HR Connect without admin, HR, or team approval features. The test logs in as each demo persona, verifies API authorization first, opens the browser routes directly, exercises dashboard calls to action, captures visual proof only after assertions pass, then stress-loads dashboards concurrently.',
    '',
    '## Test Outcomes',
    '',
    '| ID | Use case | Role | Expected | Actual | Status | Evidence | Notes |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...results.map((result) => `| ${safe(result.id)} | ${safe(result.useCase)} | ${safe(result.role)} | ${safe(result.expected)} | ${safe(result.actual)} | ${safe(result.status)} | ${safe(result.evidence)} | ${safe(result.notes)} |`),
    '',
    '## API Proof',
    '',
    ...results
      .filter((result) => result.id.startsWith('API_'))
      .map((result) => `- ${result.id}: ${result.useCase}. Expected ${result.expected}; actual ${result.actual}; status ${result.status}.`),
    '',
    '## Visual Proof',
    '',
    ...screenshots.map((shot) => `### ${shot.id} - ${shot.title}\n\nRole: ${shot.role}\n\n![${shot.id}](${shot.path})\n`),
    '',
    '## Gaps Found',
    '',
    failed === 0
      ? '- No production-blocking gaps were found in this pass.'
      : results.filter((result) => result.status === 'failed').map((result) => `- ${result.id}: ${result.actual}`).join('\n'),
    '',
    '## Repairs Made',
    '',
    '- This pass adds a broader hardening script and evidence report. If failures are found in a rerun, the failed scenario IDs identify the exact UI/API boundary to repair.',
    '',
    '## Rerun Results',
    '',
    `- Latest run: ${passed} passed, ${failed} failed.`,
    '',
    '## Residual Risks',
    '',
    '- This validates the current demo personas and live production route/API contract. It does not yet create a fresh tenant and mutate role assignments end-to-end inside the settings UI.',
    '- Subscription payment-gateway enforcement is only covered at the owner-vs-HR access boundary here; full billing lifecycle testing remains a separate module-level pass.',
    '- Fine-grained custom permissions inside user-created roles are not yet enforced beyond the current system roles and route allow-lists.',
    '',
    '## Rerun Commands',
    '',
    '```bash',
    `QA_BASE_URL=${BASE_URL} QA_API_URL=${API_BASE_URL} QA_OUT_DIR=${path.relative(REPO_ROOT, OUT_DIR)} node scripts/qa/role-persona-production-hardening-test.mjs`,
    '```',
    '',
  ].join('\n');

  await fs.writeFile(REPORT_PATH, markdown);
  await fs.writeFile(JSON_PATH, JSON.stringify({
    runId: RUN_ID,
    target: BASE_URL,
    api: API_BASE_URL,
    generatedAt: new Date().toISOString(),
    summary: { passed, failed },
    results,
    screenshots,
  }, null, 2));
}

async function main() {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  const sessions = {};
  for (const persona of Object.keys(personas)) {
    sessions[persona] = await demoSession(persona);
    record(`AUTH_${persona.toUpperCase()}`, `Demo login succeeds for ${personas[persona].label}`, persona, 'Authenticated demo session with user and token', sessions[persona].user?.email || 'session created', 'passed', 'POST /demo/login');
  }

  await testApiAuthorization(sessions);

  const playwright = await loadPlaywright();
  const browser = await playwright.chromium.launch({ headless: true });

  await testUnauthenticatedRedirect(browser);
  await testTamperedRole(browser, sessions.employee);
  for (const persona of Object.keys(personas)) {
    await testDashboard(browser, persona, sessions[persona]);
    await testDeniedRoutes(browser, persona, sessions[persona]);
    await testDashboardActions(browser, persona, sessions[persona]);
    await testApprovalsDropdown(browser, persona, sessions[persona]);
    await testMobileDashboard(browser, persona, sessions[persona]);
  }
  await testApiFailureFallback(browser, sessions.employee);
  await testConcurrentDashboardLoad(browser, sessions);

  await browser.close();
  await writeReport();

  const failed = results.filter((result) => result.status === 'failed');
  console.log(`Role persona production hardening QA complete: ${results.length - failed.length} passed, ${failed.length} failed`);
  console.log(REPORT_PATH);
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
