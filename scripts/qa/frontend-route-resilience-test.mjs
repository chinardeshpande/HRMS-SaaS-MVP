#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RUN_DATE = process.env.QA_RUN_DATE || '2026-05-07';
const RUN_ID = process.env.QA_RUN_ID || `ROUTE-${RUN_DATE}-${Date.now()}`;
const BASE_URL = process.env.QA_BASE_URL || 'https://aurorahr.in';
const API_BASE_URL = process.env.QA_API_URL || `${BASE_URL}/api/v1`;
const OUT_DIR = process.env.QA_OUT_DIR || path.join(REPO_ROOT, 'docs/qa/frontend-route-resilience-2026-05-07');
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

function record(id, title, role, status, evidence, notes = '') {
  results.push({ id, title, role, status, evidence, notes });
}

async function api(method, urlPath, body) {
  const response = await fetch(`${API_BASE_URL}${urlPath}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!response.ok || json?.success === false) {
    throw new Error(json?.error?.message || json?.message || `${method} ${urlPath} failed with ${response.status}`);
  }

  return json?.data || json;
}

async function demoSession(persona) {
  return api('POST', '/demo/login', { persona });
}

async function installSession(page, session) {
  await page.addInitScript(({ user, tokens }) => {
    window.localStorage.setItem('user', JSON.stringify(user));
    window.localStorage.setItem('tokens', JSON.stringify(tokens));
  }, { user: session.user, tokens: session.tokens });
}

async function checkRoute(page, route) {
  const response = await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => undefined);
  await page.waitForTimeout(750);

  const bodyText = (await page.locator('body').innerText({ timeout: 10000 })).trim();
  const screenshotName = `${route.id.toLowerCase()}-${route.role || 'public'}.png`;
  const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  if (!response || response.status() >= 500) {
    throw new Error(`HTTP status ${response?.status() || 'missing response'}`);
  }

  if (bodyText.length < (route.minTextLength || 40)) {
    throw new Error(`Rendered body text too short: ${bodyText.length}`);
  }

  for (const expected of route.expectText || []) {
    if (!bodyText.toLowerCase().includes(expected.toLowerCase())) {
      throw new Error(`Expected text not found: ${expected}`);
    }
  }

  for (const forbidden of route.forbidText || []) {
    if (bodyText.toLowerCase().includes(forbidden.toLowerCase())) {
      throw new Error(`Forbidden text appeared: ${forbidden}`);
    }
  }

  return {
    screenshot: path.relative(REPO_ROOT, screenshotPath),
    chars: bodyText.length,
    status: response.status(),
  };
}

async function runScenario(browser, route, sessions) {
  const context = await browser.newContext({
    viewport: { width: route.width || 1440, height: route.height || 1000 },
  });
  const page = await context.newPage();

  try {
    if (route.role) {
      await installSession(page, sessions[route.role]);
    }

    const evidence = await checkRoute(page, route);

    if (route.checkNavExcludes) {
      for (const label of route.checkNavExcludes) {
        const visible = await page.getByRole('link', { name: label }).first().isVisible().catch(() => false);
        if (visible) {
          throw new Error(`Navigation still exposes forbidden item: ${label}`);
        }
      }
    }

    record(route.id, route.title, route.role || 'public', 'passed', `${evidence.status}, chars=${evidence.chars}, ${evidence.screenshot}`);
  } catch (error) {
    record(route.id, route.title, route.role || 'public', 'failed', 'route rendered incorrectly', error.message);
  } finally {
    await context.close();
  }
}

async function writeReport() {
  const passed = results.filter((result) => result.status === 'passed').length;
  const failed = results.filter((result) => result.status === 'failed').length;

  const markdown = [
    `# Frontend Route Resilience QA - ${RUN_DATE}`,
    '',
    `Run ID: ${RUN_ID}`,
    `Target: ${BASE_URL}`,
    '',
    '## Outcome',
    '',
    `- Passed: ${passed}`,
    `- Failed: ${failed}`,
    '',
    '## Scope',
    '',
    'This run verifies that high-use routes render meaningful content after route-level code splitting, that the controlled 404 page works, and that employee navigation no longer exposes restricted Settings workflows.',
    '',
    '## Results',
    '',
    '| ID | Scenario | Role | Status | Evidence | Notes |',
    '| --- | --- | --- | --- | --- | --- |',
    ...results.map((result) => `| ${result.id} | ${result.title} | ${result.role} | ${result.status} | ${String(result.evidence).replace(/\|/g, '\\|')} | ${String(result.notes || '').replace(/\|/g, '\\|')} |`),
    '',
  ].join('\n');

  await fs.writeFile(REPORT_PATH, markdown);
  await fs.writeFile(JSON_PATH, JSON.stringify({
    runId: RUN_ID,
    target: BASE_URL,
    generatedAt: new Date().toISOString(),
    summary: { passed, failed },
    results,
  }, null, 2));
}

async function main() {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

  const playwright = await loadPlaywright();
  const browser = await playwright.chromium.launch({ headless: true });

  const sessions = {
    employee: await demoSession('employee'),
    manager: await demoSession('manager'),
    hr: await demoSession('hr'),
  };

  const routes = [
    {
      id: 'PUBLIC_404',
      title: 'Unknown routes show a controlled not-found page',
      path: '/definitely-not-a-real-route',
      expectText: ['Page not found'],
    },
    {
      id: 'PUBLIC_LOGIN',
      title: 'Login route renders without a blank screen',
      path: '/login',
      expectText: ['Welcome back'],
    },
    {
      id: 'HR_DASHBOARD',
      title: 'HR dashboard route renders after session restore',
      role: 'hr',
      path: '/dashboard',
      expectText: ['Dashboard'],
    },
    {
      id: 'HR_ATTENDANCE',
      title: 'Attendance route renders after lazy chunk load',
      role: 'hr',
      path: '/attendance',
      expectText: ['Attendance'],
    },
    {
      id: 'HR_LEAVE',
      title: 'Leave route renders after lazy chunk load',
      role: 'hr',
      path: '/leave',
      expectText: ['Leave'],
    },
    {
      id: 'HR_CONNECT',
      title: 'HR Connect route renders after lazy chunk load',
      role: 'employee',
      path: '/hr-connect',
      expectText: ['HR Connect'],
    },
    {
      id: 'EMPLOYEE_NAV',
      title: 'Employee navigation excludes restricted Settings workflow',
      role: 'employee',
      path: '/dashboard',
      expectText: ['Dashboard'],
      checkNavExcludes: ['Settings'],
    },
    {
      id: 'HR_SETTINGS',
      title: 'HR can still access Settings after role-scoped navigation change',
      role: 'hr',
      path: '/settings',
      expectText: ['Settings'],
    },
  ];

  for (const route of routes) {
    await runScenario(browser, route, sessions);
  }

  await browser.close();
  await writeReport();

  const failed = results.filter((result) => result.status === 'failed');
  console.log(`Frontend route resilience QA complete: ${results.length - failed.length} passed, ${failed.length} failed`);
  console.log(REPORT_PATH);

  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
