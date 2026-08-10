#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('../../e2e/node_modules/playwright');

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:5180';
const API_URL = process.env.QA_API_URL || 'http://127.0.0.1:3200/api/v1';
const RUN_DATE = process.env.QA_RUN_DATE || new Date().toISOString().slice(0, 10);
const OUT_DIR = process.env.QA_OUT_DIR || `/private/tmp/aurahrms-role-evidence-${RUN_DATE}`;
const SHOTS_DIR = path.join(OUT_DIR, 'screenshots');
const RAW_VIDEO_DIR = path.join(OUT_DIR, 'raw-video');
const PASSWORD = 'ACV@2026!';

const personas = [
  {
    key: 'system-admin',
    label: 'System administrator',
    email: 'system.admin@acv.test',
    dashboard: 'Owner Implementation Console',
    allowed: [
      ['/employees', /Employee Register|Employees/i, 'employee-register'],
      ['/settings', /Settings/i, 'settings'],
      ['/reports', /Reports|Analytics/i, 'reports'],
    ],
  },
  {
    key: 'hr-admin',
    label: 'HR administrator',
    email: 'hr.admin@acv.test',
    dashboard: 'HR Operations',
    allowed: [
      ['/employees', /Employee Register|Employees/i, 'employee-register'],
      ['/onboarding', /Onboarding/i, 'onboarding'],
      ['/attendance', /Attendance/i, 'attendance'],
      ['/leave', /Leave/i, 'leave'],
    ],
  },
  {
    key: 'manager',
    label: 'People manager',
    email: 'manager@acv.test',
    dashboard: 'Manager Team Work Queue',
    allowed: [
      ['/employees', /Employee Register|Employees/i, 'team-register'],
      ['/leave', /Leave/i, 'team-leave'],
      ['/performance', /Performance/i, 'performance'],
    ],
    denied: [
      ['/settings', /available to HR administrators|not available for your role/i, 'settings-denied'],
      ['/reports', /not available for your role/i, 'reports-denied'],
    ],
  },
  {
    key: 'employee',
    label: 'Employee',
    email: 'employee@acv.test',
    dashboard: 'Employee My HR',
    allowed: [
      ['/attendance', /Attendance/i, 'my-attendance'],
      ['/leave', /Leave/i, 'my-leave'],
      ['/my-hr-documents', /My HR Documents/i, 'my-documents'],
      ['/hr-connect', /HR Connect/i, 'hr-connect'],
    ],
    denied: [
      ['/employees', /not available for your role/i, 'employees-denied'],
      ['/settings', /available to HR administrators|not available for your role/i, 'settings-denied'],
    ],
  },
  {
    key: 'orbit-admin',
    label: 'Isolation-tenant administrator',
    email: 'admin@orbit.test',
    dashboard: 'Owner Implementation Console',
    allowed: [['/employees', /Orbit/i, 'isolated-register']],
    absent: [/Surekha Employee/i, /Aniket Manager/i, /Anupama Bhat/i],
  },
];

const results = [];
const screenshots = [];
const rawVideos = [];

function slug(value) {
  return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(900);
}

async function capture(page, persona, id, title) {
  const filename = `${persona}-${id}.png`;
  const filePath = path.join(SHOTS_DIR, filename);
  await page.screenshot({ path: filePath, fullPage: true });
  screenshots.push({ persona, id, title, path: `screenshots/${filename}` });
}

function record(persona, id, title, outcome, detail) {
  results.push({ persona, id, title, outcome, detail });
}

async function assertBody(page, expected, absent = []) {
  const body = await page.locator('body').innerText();
  if (!expected.test(body)) throw new Error(`Expected content not found: ${expected}`);
  for (const forbidden of absent) {
    if (forbidden.test(body)) throw new Error(`Forbidden content found: ${forbidden}`);
  }
  return body;
}

async function login(page, persona) {
  await page.goto(`${BASE_URL}/login`);
  await page.locator('input[type="email"], input[name="email"]').fill(persona.email);
  await page.locator('input[type="password"], input[name="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: /sign in|login/i }).click();
  await page.waitForURL(/\/(dashboard|onboarding-wizard)/, { timeout: 15000 });
  if (page.url().includes('/onboarding-wizard')) await page.goto(`${BASE_URL}/dashboard`);
  await settle(page);
  await assertBody(page, new RegExp(persona.dashboard, 'i'));
  await capture(page, persona.key, 'dashboard', `${persona.label} dashboard`);
  record(persona.key, 'login', `${persona.label} login`, 'passed', 'Authenticated and reached the correct role dashboard');
}

async function runPersona(browser, persona) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: RAW_VIDEO_DIR, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  const video = page.video();
  try {
    await login(page, persona);
    for (const [route, expected, id] of persona.allowed || []) {
      await page.goto(`${BASE_URL}${route}`);
      await settle(page);
      await assertBody(page, expected, persona.absent || []);
      await capture(page, persona.key, id, `${persona.label}: ${route}`);
      record(persona.key, id, `${persona.label} can open ${route}`, 'passed', 'Expected role content rendered');
    }
    for (const [route, expected, id] of persona.denied || []) {
      await page.goto(`${BASE_URL}${route}`);
      await settle(page);
      await assertBody(page, expected);
      await capture(page, persona.key, id, `${persona.label}: access denied for ${route}`);
      record(persona.key, id, `${persona.label} is denied ${route}`, 'passed', 'Permission boundary rendered safely');
    }
  } catch (error) {
    record(persona.key, 'journey', `${persona.label} journey`, 'failed', error.message);
    await capture(page, persona.key, 'failure', `${persona.label} failure state`).catch(() => undefined);
  } finally {
    await context.close();
    const recordedPath = await video.path();
    const destination = path.join(RAW_VIDEO_DIR, `${persona.key}.webm`);
    await fs.copyFile(recordedPath, destination);
    rawVideos.push({ persona: persona.key, path: `raw-video/${persona.key}.webm` });
  }
}

async function verifyApiBoundaries() {
  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'employee@acv.test', password: PASSWORD }),
  });
  const loginBody = await loginResponse.json();
  const token = loginBody?.data?.tokens?.token;
  if (!token) throw new Error('Employee API login did not return a token');
  for (const [pathName, expected] of [['/employees', 200], ['/settings/subscription', 403]]) {
    const response = await fetch(`${API_URL}${pathName}`, { headers: { Authorization: `Bearer ${token}` } });
    let passed = response.status === expected;
    let detail = `HTTP ${response.status}; expected ${expected}`;
    if (pathName === '/employees' && passed) {
      const body = await response.json();
      const employees = body?.data?.employees || body?.data || [];
      passed = Array.isArray(employees) && employees.length === 1 && employees[0]?.email === 'employee@acv.test';
      detail += passed ? '; response filtered to the employee’s own record' : '; response was not restricted to the employee’s own record';
    }
    record('employee', `api-${slug(pathName)}`, `Employee API boundary ${pathName}`, passed ? 'passed' : 'failed', detail);
  }
}

async function writeReport() {
  const passed = results.filter((item) => item.outcome === 'passed').length;
  const failed = results.filter((item) => item.outcome === 'failed').length;
  const lines = [
    `# AuraHR role and login acceptance evidence — ${RUN_DATE}`,
    '',
    `Target: ${BASE_URL}`,
    `API: ${API_URL}`,
    '',
    'Synthetic data only. No production account, document, employee record, or credential was used.',
    '',
    '## Outcome',
    '',
    `- Passed: ${passed}`,
    `- Failed: ${failed}`,
    `- Personas: ${personas.length}`,
    `- Screenshots: ${screenshots.length}`,
    `- Raw screen recordings: ${rawVideos.length}`,
    '',
    '## Results',
    '',
    '| Persona | Scenario | Outcome | Evidence |',
    '| --- | --- | --- | --- |',
    ...results.map((item) => `| ${item.persona} | ${item.title} | ${item.outcome} | ${String(item.detail).replaceAll('|', '/')} |`),
    '',
    '## Screenshot evidence',
    '',
    ...screenshots.flatMap((shot) => [`### ${shot.title}`, '', `![${shot.title}](${shot.path})`, '']),
    '## Recording manifest',
    '',
    ...rawVideos.map((video) => `- ${video.persona}: ${video.path}`),
    '',
    'The composed narrated walkthrough is generated by `scripts/qa/compose-role-evidence-video.sh`.',
  ];
  await fs.writeFile(path.join(OUT_DIR, 'report.md'), lines.join('\n'));
  await fs.writeFile(path.join(OUT_DIR, 'results.json'), JSON.stringify({ runDate: RUN_DATE, baseUrl: BASE_URL, apiUrl: API_URL, summary: { passed, failed }, results, screenshots, rawVideos }, null, 2));
  if (failed) process.exitCode = 1;
  console.log(`Role evidence complete: ${passed} passed, ${failed} failed`);
  console.log(OUT_DIR);
}

await fs.mkdir(SHOTS_DIR, { recursive: true });
await fs.mkdir(RAW_VIDEO_DIR, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const publicContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const publicPage = await publicContext.newPage();
  await publicPage.goto(`${BASE_URL}/dashboard`);
  await publicPage.waitForURL(/\/login/, { timeout: 10000 });
  await capture(publicPage, 'public', 'protected-redirect', 'Unauthenticated access redirects to login');
  record('public', 'protected-redirect', 'Unauthenticated dashboard access', 'passed', 'Redirected to login');
  await publicContext.close();
  await verifyApiBoundaries();
  for (const persona of personas) await runPersona(browser, persona);
} finally {
  await browser.close();
}
await writeReport();
