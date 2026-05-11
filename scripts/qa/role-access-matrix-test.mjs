#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RUN_DATE = process.env.QA_RUN_DATE || '2026-05-11';
const RUN_ID = process.env.QA_RUN_ID || `ROLE-ACCESS-${RUN_DATE}-${Date.now()}`;
const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:5176';
const API_BASE_URL = process.env.QA_API_URL || 'https://aurorahr.in/api/v1';
const SKIP_API = process.env.QA_SKIP_API === 'true';
const OUT_DIR = process.env.QA_OUT_DIR || path.join(REPO_ROOT, 'docs/qa/role-access-matrix-2026-05-11');
const SCREENSHOT_DIR = path.join(OUT_DIR, 'screenshots');
const REPORT_PATH = path.join(OUT_DIR, 'report.md');
const JSON_PATH = path.join(OUT_DIR, 'results.json');

const results = [];

async function loadPlaywright() {
  try {
    return require('/Users/chinar.deshpande06/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  } catch {
    return require('playwright');
  }
}

function record(id, title, persona, status, evidence, notes = '') {
  results.push({ id, title, persona, status, evidence, notes });
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

  return {
    ok: response.ok && json?.success !== false,
    status: response.status,
    json,
  };
}

async function demoSession(persona) {
  const response = await api('POST', '/demo/login', { persona });
  if (!response.ok) {
    throw new Error(`Unable to create ${persona} demo session: ${response.status}`);
  }
  return response.json.data;
}

async function installSession(page, session) {
  await page.addInitScript(({ user, tokens }) => {
    window.localStorage.setItem('user', JSON.stringify(user));
    window.localStorage.setItem('tokens', JSON.stringify(tokens));
  }, { user: session.user, tokens: session.tokens });
}

async function visibleText(page) {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => undefined);
  await page.waitForTimeout(500);
  return (await page.locator('body').innerText({ timeout: 10000 })).trim();
}

async function assertAllowedRoute(browser, persona, session, route) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await installSession(page, session);

  try {
    const response = await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const text = await visibleText(page);
    const screenshotPath = path.join(SCREENSHOT_DIR, `${persona}-${route.id}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    if (!response || response.status() >= 500) {
      throw new Error(`Unexpected HTTP status ${response?.status() || 'missing'}`);
    }

    const expectedTexts = route.expectedTexts || [route.expectedText];
    for (const expectedText of expectedTexts) {
      if (!text.toLowerCase().includes(expectedText.toLowerCase())) {
        throw new Error(`Expected text not found: ${expectedText}`);
      }
    }

    const forbiddenTexts = route.forbiddenTexts || [];
    for (const forbiddenText of forbiddenTexts) {
      if (text.toLowerCase().includes(forbiddenText.toLowerCase())) {
        throw new Error(`Forbidden text found: ${forbiddenText}`);
      }
    }

    if (text.toLowerCase().includes('not available for your role')) {
      throw new Error('Allowed route rendered permission-denied state');
    }

    record(
      `ALLOW_${persona.toUpperCase()}_${route.id.toUpperCase()}`,
      `${persona} can access ${route.path}`,
      persona,
      'passed',
      path.relative(REPO_ROOT, screenshotPath)
    );
  } catch (error) {
    record(
      `ALLOW_${persona.toUpperCase()}_${route.id.toUpperCase()}`,
      `${persona} can access ${route.path}`,
      persona,
      'failed',
      route.path,
      error.message
    );
  } finally {
    await context.close();
  }
}

async function assertDeniedRoute(browser, persona, session, route) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await installSession(page, session);

  try {
    const response = await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const text = await visibleText(page);
    const screenshotPath = path.join(SCREENSHOT_DIR, `${persona}-denied-${route.id}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    if (!response || response.status() >= 500) {
      throw new Error(`Unexpected HTTP status ${response?.status() || 'missing'}`);
    }

    if (!text.toLowerCase().includes(route.deniedText.toLowerCase())) {
      throw new Error(`Denied text not found: ${route.deniedText}`);
    }

    record(
      `DENY_${persona.toUpperCase()}_${route.id.toUpperCase()}`,
      `${persona} is denied ${route.path}`,
      persona,
      'passed',
      path.relative(REPO_ROOT, screenshotPath)
    );
  } catch (error) {
    record(
      `DENY_${persona.toUpperCase()}_${route.id.toUpperCase()}`,
      `${persona} is denied ${route.path}`,
      persona,
      'failed',
      route.path,
      error.message
    );
  } finally {
    await context.close();
  }
}

async function assertNavExcludes(browser, persona, session, labels) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await installSession(page, session);

  try {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await visibleText(page);

    const primaryNav = page.getByTestId('primary-navigation');
    for (const label of labels) {
      const visible = await primaryNav.getByRole('button', { name: new RegExp(`^${label}$`, 'i') }).first().isVisible().catch(() => false);
      if (visible) {
        throw new Error(`Navigation exposes forbidden label: ${label}`);
      }
    }

    record(`NAV_${persona.toUpperCase()}_EXCLUDES`, `${persona} navigation excludes restricted modules`, persona, 'passed', labels.join(', '));
  } catch (error) {
    record(`NAV_${persona.toUpperCase()}_EXCLUDES`, `${persona} navigation excludes restricted modules`, persona, 'failed', labels.join(', '), error.message);
  } finally {
    await context.close();
  }
}

async function assertApiStatus(id, title, persona, response, expectedStatuses) {
  const passed = expectedStatuses.includes(response.status);
  record(
    id,
    title,
    persona,
    passed ? 'passed' : 'failed',
    `status=${response.status}`,
    passed ? '' : `Expected one of ${expectedStatuses.join(', ')}`
  );
}

async function writeReport() {
  const passed = results.filter((result) => result.status === 'passed').length;
  const failed = results.filter((result) => result.status === 'failed').length;

  const markdown = [
    `# Role Access Matrix QA - ${RUN_DATE}`,
    '',
    `Run ID: ${RUN_ID}`,
    `Target: ${BASE_URL}`,
    `API: ${API_BASE_URL}`,
    '',
    '## Outcome',
    '',
    `- Passed: ${passed}`,
    `- Failed: ${failed}`,
    '',
    '## Scope',
    '',
    'This run verifies the central route/nav access contract and the tightened ticket authentication boundary across employee, manager, HR, and system-admin-equivalent demo sessions.',
    '',
    '## Results',
    '',
    '| ID | Scenario | Persona | Status | Evidence | Notes |',
    '| --- | --- | --- | --- | --- | --- |',
    ...results.map((result) => `| ${result.id} | ${result.title} | ${result.persona} | ${result.status} | ${String(result.evidence).replace(/\|/g, '\\|')} | ${String(result.notes || '').replace(/\|/g, '\\|')} |`),
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
  }, null, 2));
}

async function main() {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

  const sessions = {
    admin: await demoSession('admin'),
    employee: await demoSession('employee'),
    manager: await demoSession('manager'),
    hr: await demoSession('hr'),
  };

  const playwright = await loadPlaywright();
  const browser = await playwright.chromium.launch({ headless: true });

  await assertAllowedRoute(browser, 'admin', sessions.admin, { id: 'dashboard', path: '/dashboard', expectedText: 'Dashboard', expectedTexts: ['Owner Implementation Console', 'Implementation Checklist'] });

  await assertAllowedRoute(browser, 'employee', sessions.employee, {
    id: 'dashboard',
    path: '/dashboard',
    expectedText: 'Dashboard',
    expectedTexts: ['Employee My HR', 'My Self-Service'],
    forbiddenTexts: ['Add Employees', 'Configure Settings', 'Owner Controls', 'Implementation Checklist'],
  });
  await assertAllowedRoute(browser, 'employee', sessions.employee, { id: 'attendance', path: '/attendance', expectedText: 'Attendance' });
  await assertAllowedRoute(browser, 'employee', sessions.employee, { id: 'leave', path: '/leave', expectedText: 'Leave' });
  await assertAllowedRoute(browser, 'employee', sessions.employee, { id: 'my_documents', path: '/my-hr-documents', expectedText: 'My HR Documents' });
  await assertDeniedRoute(browser, 'employee', sessions.employee, { id: 'settings', path: '/settings', deniedText: 'Settings are available to HR administrators' });
  await assertDeniedRoute(browser, 'employee', sessions.employee, { id: 'employees', path: '/employees', deniedText: 'not available for your role' });
  await assertNavExcludes(browser, 'employee', sessions.employee, ['Settings', 'Employees', 'Reports', 'Onboarding', 'Master Data']);

  await assertAllowedRoute(browser, 'manager', sessions.manager, {
    id: 'dashboard',
    path: '/dashboard',
    expectedText: 'Dashboard',
    expectedTexts: ['Manager Team Work Queue', 'Team Action Queue'],
    forbiddenTexts: ['Owner Controls', 'Implementation Checklist'],
  });
  await assertAllowedRoute(browser, 'manager', sessions.manager, { id: 'employees', path: '/employees', expectedText: 'Employees' });
  await assertAllowedRoute(browser, 'manager', sessions.manager, { id: 'performance', path: '/performance', expectedText: 'Performance' });
  await assertAllowedRoute(browser, 'manager', sessions.manager, { id: 'exit', path: '/exit', expectedText: 'Exit' });
  await assertDeniedRoute(browser, 'manager', sessions.manager, { id: 'settings', path: '/settings', deniedText: 'Settings are available to HR administrators' });
  await assertNavExcludes(browser, 'manager', sessions.manager, ['Settings', 'Reports', 'Onboarding', 'Master Data']);

  await assertAllowedRoute(browser, 'hr', sessions.hr, { id: 'dashboard', path: '/dashboard', expectedText: 'Dashboard', expectedTexts: ['HR Operations', 'HR Action Queue'] });
  await assertAllowedRoute(browser, 'hr', sessions.hr, { id: 'settings', path: '/settings', expectedText: 'Settings' });
  await assertAllowedRoute(browser, 'hr', sessions.hr, { id: 'reports', path: '/reports', expectedText: 'Reports' });
  await assertAllowedRoute(browser, 'hr', sessions.hr, { id: 'onboarding', path: '/onboarding', expectedText: 'Onboarding' });

  await browser.close();

  if (SKIP_API) {
    record('API_SKIPPED_LOCAL_UI_RUN', 'API authorization checks were skipped for local UI-only run', 'system', 'passed', 'QA_SKIP_API=true');
    await writeReport();

    const failed = results.filter((result) => result.status === 'failed');
    console.log(`Role access matrix QA complete: ${results.length - failed.length} passed, ${failed.length} failed`);
    console.log(REPORT_PATH);

    if (failed.length) {
      process.exitCode = 1;
    }
    return;
  }

  const unauthTickets = await api('GET', '/helpdesk/tickets');
  await assertApiStatus('API_TICKETS_UNAUTH_DENIED', 'Unauthenticated ticket list is denied', 'public', unauthTickets, [401]);

  const employeeTickets = await api('GET', '/helpdesk/tickets', undefined, sessions.employee.tokens.token);
  await assertApiStatus('API_TICKETS_EMPLOYEE_ALL_DENIED', 'Employee cannot list all tenant tickets', 'employee', employeeTickets, [403]);

  const employeeMyTickets = await api('GET', '/helpdesk/tickets/my', undefined, sessions.employee.tokens.token);
  await assertApiStatus('API_TICKETS_EMPLOYEE_MY_ALLOWED', 'Employee can list own tickets', 'employee', employeeMyTickets, [200]);

  const hrTickets = await api('GET', '/helpdesk/tickets', undefined, sessions.hr.tokens.token);
  await assertApiStatus('API_TICKETS_HR_ALL_ALLOWED', 'HR can list tenant tickets', 'hr', hrTickets, [200]);

  const hrSubscription = await api('GET', '/settings/subscription', undefined, sessions.hr.tokens.token);
  await assertApiStatus('API_SETTINGS_HR_SUBSCRIPTION_DENIED', 'HR admin cannot access owner subscription settings', 'hr', hrSubscription, [403]);

  await writeReport();

  const failed = results.filter((result) => result.status === 'failed');
  console.log(`Role access matrix QA complete: ${results.length - failed.length} passed, ${failed.length} failed`);
  console.log(REPORT_PATH);

  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
