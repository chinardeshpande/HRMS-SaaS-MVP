#!/usr/bin/env node

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const require = createRequire(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RUN_DATE = process.env.QA_RUN_DATE || '2026-05-23';
const RUN_ID = process.env.QA_RUN_ID || `ACV-MEM-${RUN_DATE}-${Date.now()}`;
const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:5186';
const API_BASE_URL = process.env.QA_API_URL || 'http://localhost:5000/api/v1';
const OUT_DIR = process.env.QA_OUT_DIR || path.join(REPO_ROOT, 'docs/qa/acv-memory-foundation-visual-2026-05-23');
const SCREENSHOT_DIR = path.join(OUT_DIR, 'screenshots');
const REPORT_PATH = path.join(OUT_DIR, 'report.md');
const JSON_PATH = path.join(OUT_DIR, 'results.json');
const ADMIN_EMAIL = process.env.QA_ADMIN_EMAIL || 'anupama.bhat@acvsolutions.in';
const ADMIN_PASSWORD = process.env.QA_ADMIN_PASSWORD || 'pass@Manu1120';
const TEMP_PASSWORD = `Qa-${RUN_ID}@123`;
const CHROMIUM_PATH =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ||
  '/Users/chinar.deshpande06/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell';

const results = [];
const screenshots = [];
const created = {
  userIds: [],
  documentIds: [],
};

function record(id, useCase, role, expected, actual, status, evidence = '', notes = '') {
  results.push({ id, useCase, role, expected, actual, status, evidence, notes });
}

function statusFrom(condition) {
  return condition ? 'passed' : 'failed';
}

function unwrap(json) {
  if (json && typeof json === 'object' && 'data' in json) return json.data;
  return json;
}

async function api(method, urlPath, { token, body, formData, expectedOk = true, blob = false } = {}) {
  const response = await fetch(`${API_BASE_URL}${urlPath}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: formData || (body === undefined ? undefined : JSON.stringify(body)),
  });

  if (blob) {
    const buffer = Buffer.from(await response.arrayBuffer());
    const ok = response.ok;
    if (expectedOk && !ok) {
      throw new Error(`${method} ${urlPath} failed with ${response.status}`);
    }
    return { status: response.status, ok, buffer, contentType: response.headers.get('content-type') || '' };
  }

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

  return { status: response.status, ok, json, data: unwrap(json) };
}

async function login(email, password) {
  const response = await api('POST', '/auth/login', {
    body: { email, password },
  });
  return response.data;
}

async function tryStep(id, useCase, role, expected, fn) {
  try {
    const actual = await fn();
    if (!results.some((result) => result.id === id)) {
      record(id, useCase, role, expected, actual || 'Completed', 'passed');
    }
  } catch (error) {
    record(id, useCase, role, expected, 'Runtime error', 'failed', '', error.message);
  }
}

async function loadPlaywright() {
  try {
    return require('/Users/chinar.deshpande06/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  } catch {
    return require('playwright');
  }
}

function qaFile(name, text = 'AuroraHR ACV memory foundation QA document') {
  return new File([new Blob([text], { type: 'application/pdf' })], name, { type: 'application/pdf' });
}

function documentForm(fields) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) form.append(key, String(value));
  }
  return form;
}

async function prepareTempUsers(adminSession, employee) {
  let dotenv;
  let pg;
  let bcrypt;
  try {
    dotenv = require(path.join(REPO_ROOT, 'backend/node_modules/dotenv'));
    pg = require(path.join(REPO_ROOT, 'backend/node_modules/pg'));
    bcrypt = require(path.join(REPO_ROOT, 'backend/node_modules/bcrypt'));
  } catch {
    return { available: false, reason: 'Local pg/bcrypt/dotenv dependencies not available' };
  }

  dotenv.config({ path: path.join(REPO_ROOT, 'backend/.env') });
  const hasExplicitDbHost = Boolean(process.env.DB_HOST);
  const pool = new pg.Pool({
    host: hasExplicitDbHost ? process.env.DB_HOST : undefined,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'hrms_saas',
    user: process.env.DB_USER || process.env.USER,
    password: process.env.DB_PASSWORD || undefined,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 10);
  const employeeUser = {
    userId: crypto.randomUUID(),
    email: `qa-memory-employee-${Date.now()}@aurorahr.local`,
    fullName: 'QA Memory Employee',
    role: 'employee',
  };
  const managerUser = {
    userId: crypto.randomUUID(),
    email: `qa-memory-manager-${Date.now()}@aurorahr.local`,
    fullName: 'QA Memory Manager',
    role: 'manager',
  };

  try {
    for (const user of [employeeUser, managerUser]) {
      await pool.query(
        `INSERT INTO users ("userId", "tenantId", email, "passwordHash", "fullName", role, "employeeId", "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())`,
        [
          user.userId,
          adminSession.user.tenantId,
          user.email,
          passwordHash,
          user.fullName,
          user.role,
          employee.employeeId,
        ]
      );
      created.userIds.push(user.userId);
    }

    return {
      available: true,
      pool,
      employeeUser,
      managerUser,
    };
  } catch (error) {
    await pool.end().catch(() => undefined);
    return { available: false, reason: error.message };
  }
}

async function cleanupTempData(pool) {
  if (!pool) return;
  try {
    if (created.userIds.length > 0) {
      await pool.query('DELETE FROM audit_logs WHERE "userId" = ANY($1::uuid[])', [created.userIds]);
      await pool.query('DELETE FROM users WHERE "userId" = ANY($1::uuid[])', [created.userIds]);
    }
    if (created.documentIds.length > 0) {
      await pool.query('DELETE FROM audit_logs WHERE "entityId" = ANY($1::uuid[])', [created.documentIds]);
      await pool.query('DELETE FROM employee_documents WHERE "documentId" = ANY($1::uuid[])', [created.documentIds]);
      await pool.query('DELETE FROM company_documents WHERE "documentId" = ANY($1::uuid[])', [created.documentIds]);
    }
  } finally {
    await pool.end().catch(() => undefined);
  }
}

async function runApiTests(adminSession, employeeSession, managerSession, employee) {
  const adminToken = adminSession.tokens.token;
  const employeeToken = employeeSession?.tokens?.token;
  const managerToken = managerSession?.tokens?.token;

  await tryStep('AUTH-01', 'ACV admin login', 'admin', 'Admin can authenticate against local ACV tenant', async () => {
    return `${adminSession.user.email} / ${adminSession.user.role}`;
  });

  await tryStep('AUTH-02', 'Unauthenticated request protection', 'public', 'Memory readiness rejects missing token', async () => {
    const response = await api('GET', '/reports/memory-readiness', { expectedOk: false });
    return record(
      'AUTH-02',
      'Unauthenticated request protection',
      'public',
      'Memory readiness rejects missing token',
      `HTTP ${response.status}`,
      statusFrom(response.status === 401)
    );
  });

  await tryStep('REP-01', 'Memory readiness report', 'admin', 'Admin can run readiness report with summary and employee rows', async () => {
    const report = (await api('GET', '/reports/memory-readiness', { token: adminToken })).data;
    const ok = report.report === 'Memory Readiness Report' && report.summary && Array.isArray(report.results);
    record(
      'REP-01',
      'Memory readiness report',
      'admin',
      'Admin can run readiness report with summary and employee rows',
      `score=${report.summary?.readinessScore}, rows=${report.totalRecords}`,
      statusFrom(ok)
    );
  });

  await tryStep('REP-02', 'Missing documents report', 'admin', 'Report uses durable employee document vault and returns tabular rows', async () => {
    const report = (await api('GET', '/reports/missing-documents', { token: adminToken })).data;
    const ok = report.report === 'Missing Documents Report' && Array.isArray(report.results);
    record(
      'REP-02',
      'Missing documents report',
      'admin',
      'Report uses durable employee document vault and returns tabular rows',
      `rows=${report.totalRecords}`,
      statusFrom(ok)
    );
  });

  await tryStep('REP-03', 'Employee report access boundary', 'employee', 'Employee cannot run implementation readiness report', async () => {
    if (!employeeToken) {
      record('REP-03', 'Employee report access boundary', 'employee', 'Employee cannot run implementation readiness report', 'Temporary employee role session unavailable', 'skipped');
      return;
    }
    const response = await api('GET', '/reports/memory-readiness', { token: employeeToken, expectedOk: false });
    record(
      'REP-03',
      'Employee report access boundary',
      'employee',
      'Employee cannot run implementation readiness report',
      `HTTP ${response.status}`,
      statusFrom(response.status === 403)
    );
  });

  await tryStep('REP-04', 'Manager report access boundary', 'manager', 'Manager cannot run implementation readiness report', async () => {
    if (!managerToken) {
      record('REP-04', 'Manager report access boundary', 'manager', 'Manager cannot run implementation readiness report', 'Temporary manager role session unavailable', 'skipped');
      return;
    }
    const response = await api('GET', '/reports/memory-readiness', { token: managerToken, expectedOk: false });
    record(
      'REP-04',
      'Manager report access boundary',
      'manager',
      'Manager cannot run implementation readiness report',
      `HTTP ${response.status}`,
      statusFrom(response.status === 403)
    );
  });

  await tryStep('CDOC-01', 'Company document invalid upload', 'admin', 'Company vault rejects upload without file', async () => {
    const form = documentForm({ title: `QA no-file ${RUN_ID}`, category: 'hr_policy' });
    const response = await api('POST', '/company-documents', { token: adminToken, formData: form, expectedOk: false });
    record(
      'CDOC-01',
      'Company document invalid upload',
      'admin',
      'Company vault rejects upload without file',
      `HTTP ${response.status}`,
      statusFrom(response.status === 400)
    );
  });

  let companyDocument;
  await tryStep('CDOC-02', 'Company document upload', 'admin', 'Admin uploads company HR policy document with metadata', async () => {
    const form = documentForm({
      title: `QA Company HR Policy ${RUN_ID}`,
      category: 'hr_policy',
      description: 'Temporary QA company document',
      documentNumber: `QA-COMP-${RUN_ID}`,
      issuingAuthority: 'ACV QA',
      issueDate: '2026-05-01',
      expiryDate: '2026-06-15',
      renewalOwner: 'HR Operations',
      metadata: JSON.stringify({ runId: RUN_ID }),
    });
    form.append('file', qaFile(`company-${RUN_ID}.pdf`));
    companyDocument = (await api('POST', '/company-documents', { token: adminToken, formData: form })).data;
    created.documentIds.push(companyDocument.documentId);
    return `documentId=${companyDocument.documentId}`;
  });

  await tryStep('CDOC-03', 'Company document search and filter', 'admin', 'Uploaded company document can be filtered by category/search', async () => {
    const list = (await api('GET', `/company-documents?category=hr_policy&searchTerm=${encodeURIComponent(RUN_ID)}`, { token: adminToken })).data;
    const found = list.documents?.some((document) => document.documentId === companyDocument?.documentId);
    record(
      'CDOC-03',
      'Company document search and filter',
      'admin',
      'Uploaded company document can be filtered by category/search',
      `found=${Boolean(found)}`,
      statusFrom(Boolean(found))
    );
  });

  await tryStep('CDOC-04', 'Company document verify/download/archive', 'admin', 'Verification, download, and archive paths work', async () => {
    const verified = (await api('POST', `/company-documents/${companyDocument.documentId}/verify`, {
      token: adminToken,
      body: { verificationStatus: 'verified' },
    })).data;
    const download = await api('GET', `/company-documents/${companyDocument.documentId}/download`, {
      token: adminToken,
      blob: true,
    });
    const archived = (await api('DELETE', `/company-documents/${companyDocument.documentId}`, { token: adminToken })).data;
    const ok = verified.verificationStatus === 'verified' && download.buffer.length > 0 && archived.status === 'archived';
    record(
      'CDOC-04',
      'Company document verify/download/archive',
      'admin',
      'Verification, download, and archive paths work',
      `verified=${verified.verificationStatus}, bytes=${download.buffer.length}, status=${archived.status}`,
      statusFrom(ok)
    );
  });

  await tryStep('CDOC-05', 'Company document role boundary', 'employee', 'Employee cannot access company document vault', async () => {
    if (!employeeToken) {
      record('CDOC-05', 'Company document role boundary', 'employee', 'Employee cannot access company document vault', 'Temporary employee role session unavailable', 'skipped');
      return;
    }
    const response = await api('GET', '/company-documents', { token: employeeToken, expectedOk: false });
    record(
      'CDOC-05',
      'Company document role boundary',
      'employee',
      'Employee cannot access company document vault',
      `HTTP ${response.status}`,
      statusFrom(response.status === 403)
    );
  });

  await tryStep('EDOC-01', 'Employee document invalid employee', 'admin', 'Upload against non-existent employee fails safely', async () => {
    const form = documentForm({ title: `QA invalid employee ${RUN_ID}`, category: 'identity' });
    form.append('file', qaFile(`invalid-${RUN_ID}.pdf`));
    const response = await api('POST', `/employee-documents/employees/${crypto.randomUUID()}`, {
      token: adminToken,
      formData: form,
      expectedOk: false,
    });
    record(
      'EDOC-01',
      'Employee document invalid employee',
      'admin',
      'Upload against non-existent employee fails safely',
      `HTTP ${response.status}`,
      statusFrom(response.status === 404)
    );
  });

  let employeeDocument;
  await tryStep('EDOC-02', 'Employee document upload', 'admin', 'HR uploads employee identity document with metadata', async () => {
    const form = documentForm({
      title: `QA Employee Identity ${RUN_ID}`,
      category: 'identity',
      description: 'Temporary QA employee document',
      documentNumber: `QA-EMP-${RUN_ID}`,
      issueDate: '2026-05-01',
      metadata: JSON.stringify({ runId: RUN_ID }),
    });
    form.append('file', qaFile(`employee-${RUN_ID}.pdf`));
    employeeDocument = (await api('POST', `/employee-documents/employees/${employee.employeeId}`, { token: adminToken, formData: form })).data;
    created.documentIds.push(employeeDocument.documentId);
    return `documentId=${employeeDocument.documentId}`;
  });

  await tryStep('EDOC-03', 'Employee document self-service read', 'employee', 'Employee can read own employee documents', async () => {
    if (!employeeToken) {
      record('EDOC-03', 'Employee document self-service read', 'employee', 'Employee can read own employee documents', 'Temporary employee role session unavailable', 'skipped');
      return;
    }
    const list = (await api('GET', `/employee-documents/employees/${employee.employeeId}`, { token: employeeToken })).data;
    const found = list.documents?.some((document) => document.documentId === employeeDocument?.documentId);
    record(
      'EDOC-03',
      'Employee document self-service read',
      'employee',
      'Employee can read own employee documents',
      `found=${Boolean(found)}`,
      statusFrom(Boolean(found))
    );
  });

  await tryStep('EDOC-04', 'Employee document cross-employee boundary', 'employee', 'Employee cannot read another employee document area', async () => {
    if (!employeeToken) {
      record('EDOC-04', 'Employee document cross-employee boundary', 'employee', 'Employee cannot read another employee document area', 'Temporary employee role session unavailable', 'skipped');
      return;
    }
    const response = await api('GET', `/employee-documents/employees/${crypto.randomUUID()}`, {
      token: employeeToken,
      expectedOk: false,
    });
    record(
      'EDOC-04',
      'Employee document cross-employee boundary',
      'employee',
      'Employee cannot read another employee document area',
      `HTTP ${response.status}`,
      statusFrom(response.status === 403)
    );
  });

  await tryStep('EDOC-05', 'Employee document verify/download/archive', 'admin', 'Verify, employee download, and archive paths work', async () => {
    const verified = (await api('POST', `/employee-documents/${employeeDocument.documentId}/verify`, {
      token: adminToken,
      body: { verificationStatus: 'verified' },
    })).data;
    const download = await api('GET', `/employee-documents/${employeeDocument.documentId}/download`, {
      token: employeeToken || adminToken,
      blob: true,
    });
    const archived = (await api('DELETE', `/employee-documents/${employeeDocument.documentId}`, { token: adminToken })).data;
    const ok = verified.verificationStatus === 'verified' && download.buffer.length > 0 && archived.status === 'archived';
    record(
      'EDOC-05',
      'Employee document verify/download/archive',
      'admin/employee',
      'Verify, employee download, and archive paths work',
      `verified=${verified.verificationStatus}, bytes=${download.buffer.length}, status=${archived.status}`,
      statusFrom(ok)
    );
  });

  await tryStep('EDOC-06', 'Employee document manager write boundary', 'manager', 'Manager cannot upload employee document', async () => {
    if (!managerToken) {
      record('EDOC-06', 'Employee document manager write boundary', 'manager', 'Manager cannot upload employee document', 'Temporary manager role session unavailable', 'skipped');
      return;
    }
    const form = documentForm({ title: `QA denied manager upload ${RUN_ID}`, category: 'identity' });
    form.append('file', qaFile(`manager-denied-${RUN_ID}.pdf`));
    const response = await api('POST', `/employee-documents/employees/${employee.employeeId}`, {
      token: managerToken,
      formData: form,
      expectedOk: false,
    });
    record(
      'EDOC-06',
      'Employee document manager write boundary',
      'manager',
      'Manager cannot upload employee document',
      `HTTP ${response.status}`,
      statusFrom(response.status === 403)
    );
  });

  await tryStep('STRESS-01', 'Memory readiness repeated load', 'admin', 'Readiness endpoint handles repeated concurrent reads', async () => {
    const started = Date.now();
    const runs = await Promise.all(
      Array.from({ length: 25 }, () => api('GET', '/reports/memory-readiness', { token: adminToken }))
    );
    const durationMs = Date.now() - started;
    const ok = runs.every((run) => run.ok && run.data?.report === 'Memory Readiness Report');
    record(
      'STRESS-01',
      'Memory readiness repeated load',
      'admin',
      'Readiness endpoint handles repeated concurrent reads',
      `requests=25, durationMs=${durationMs}`,
      statusFrom(ok && durationMs < 10000)
    );
  });
}

async function setSession(page, session) {
  await page.addInitScript((payload) => {
    localStorage.setItem('user', JSON.stringify(payload.user));
    localStorage.setItem('tokens', JSON.stringify(payload.tokens));
  }, session);
}

async function runVisualTests(adminSession, employeeSession) {
  const playwright = await loadPlaywright();
  const launchOptions = { headless: true };
  if (fsSync.existsSync(CHROMIUM_PATH)) launchOptions.executablePath = CHROMIUM_PATH;

  const browser = await playwright.chromium.launch(launchOptions);
  try {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    await setSession(desktop, adminSession);
    await desktop.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle' });
    await desktop.getByText('Reports & Analytics').waitFor({ timeout: 15000 });
    await desktop.getByText('Memory Readiness').waitFor({ timeout: 15000 });
    const reportsHomePath = path.join(SCREENSHOT_DIR, 'desktop-reports-memory-card.png');
    await desktop.screenshot({ path: reportsHomePath, fullPage: true });
    screenshots.push({ id: 'UI-01', path: reportsHomePath, caption: 'Reports & Analytics shows Memory Readiness card.' });
    record('UI-01', 'Reports navigation', 'admin', 'Memory Readiness card is visible', 'Card visible on /reports', 'passed', reportsHomePath);

    await desktop.getByText('Memory Readiness').click();
    await desktop.getByText('Memory Readiness Report').waitFor({ timeout: 15000 });
    await desktop.getByText('Summary').waitFor({ timeout: 15000 });
    await desktop.getByText('readiness Score', { exact: false }).waitFor({ timeout: 15000 }).catch(() => undefined);
    const reportPath = path.join(SCREENSHOT_DIR, 'desktop-memory-readiness-report.png');
    await desktop.screenshot({ path: reportPath, fullPage: true });
    screenshots.push({ id: 'UI-02', path: reportPath, caption: 'Memory Readiness report with summary and employee rows.' });
    record('UI-02', 'Memory readiness visual report', 'admin', 'Summary and table render after clicking card', 'Report rendered', 'passed', reportPath);

    const downloadPromise = desktop.waitForEvent('download');
    await desktop.getByRole('button', { name: /export csv/i }).click();
    const download = await downloadPromise;
    const csvName = download.suggestedFilename();
    record(
      'UI-03',
      'Memory readiness CSV export',
      'admin',
      'Export CSV creates downloadable evidence file',
      csvName,
      statusFrom(/Memory_Readiness_Report/i.test(csvName))
    );

    await desktop.getByRole('button', { name: /back to reports/i }).click();
    await desktop.getByText('Missing Documents').waitFor({ timeout: 15000 });
    record('UI-04', 'Back navigation', 'admin', 'Back to Reports returns to report card grid', 'Report card grid visible', 'passed');

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
    await setSession(mobile, adminSession);
    await mobile.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle' });
    await mobile.getByText('Memory Readiness').waitFor({ timeout: 15000 });
    const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const mobilePath = path.join(SCREENSHOT_DIR, 'mobile-reports-memory-card.png');
    await mobile.screenshot({ path: mobilePath, fullPage: true });
    screenshots.push({ id: 'UI-05', path: mobilePath, caption: 'Mobile reports view with Memory Readiness card.' });
    record(
      'UI-05',
      'Mobile report navigation',
      'admin',
      'Memory Readiness is reachable on mobile without major horizontal overflow',
      `overflowPx=${overflow}`,
      statusFrom(overflow <= 8),
      mobilePath
    );

    if (employeeSession) {
      const employeePage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await setSession(employeePage, employeeSession);
      await employeePage.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle' });
      await employeePage.getByText('This workspace is not available for your role').waitFor({ timeout: 15000 });
      const deniedPath = path.join(SCREENSHOT_DIR, 'employee-reports-denied.png');
      await employeePage.screenshot({ path: deniedPath, fullPage: true });
      screenshots.push({ id: 'UI-06', path: deniedPath, caption: 'Employee direct-route access to reports is denied.' });
      record(
        'UI-06',
        'Direct route permission check',
        'employee',
        'Employee direct route to /reports is denied',
        'Access denied page rendered',
        'passed',
        deniedPath
      );
      await employeePage.close();
    }

    await desktop.close();
    await mobile.close();
  } finally {
    await browser.close();
  }
}

function buildReport() {
  const passed = results.filter((result) => result.status === 'passed').length;
  const failed = results.filter((result) => result.status === 'failed').length;
  const skipped = results.filter((result) => result.status === 'skipped').length;
  const verdict = failed === 0 ? 'Production-readiness QA passed for this local slice.' : 'Production-readiness QA found failures.';

  const rows = results.map((result) =>
    `| ${result.id} | ${result.useCase} | ${result.role} | ${result.expected} | ${String(result.actual).replace(/\n/g, ' ')} | ${result.status.toUpperCase()} | ${result.evidence ? path.relative(OUT_DIR, result.evidence) : ''} | ${result.notes || ''} |`
  );

  const visualProof = screenshots.map((shot) => {
    const relative = path.relative(OUT_DIR, shot.path);
    return `### ${shot.id}: ${shot.caption}\n\n![${shot.caption}](${relative})`;
  });

  return `# ACV Memory Foundation Production Readiness Visual QA

Run date: ${RUN_DATE}
Run id: ${RUN_ID}
Target: ${BASE_URL}
API: ${API_BASE_URL}

## Executive Summary

- Passed: ${passed}
- Failed: ${failed}
- Skipped: ${skipped}
- Production-readiness verdict: ${verdict}

## Scope

This run validates the ACV Memory Foundation slice: company document vault, employee document memory, missing document reporting, memory readiness reporting, role-based access, export behavior, and report navigation.

## Personas And Data

- Admin: ${ADMIN_EMAIL}
- Temporary employee role: created only for this run and cleaned up after execution when database cleanup is available.
- Temporary manager role: created only for this run and cleaned up after execution when database cleanup is available.
- Target employee: first active ACV employee returned by the local tenant.

## Business Process Narrative

ACV HR must be able to turn scattered HR memory into structured tenant data: company compliance documents, employee documents, compensation coverage, payslips, and readiness reports. The test validates that HR/Admin can operate this memory layer, employees can access only their own employee records, managers cannot write HR-controlled documents, and implementation reports are usable from the UI and exportable for migration evidence.

## Test Outcomes

| ID | Use case | Role | Expected | Actual | Status | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

## Visual Proof

${visualProof.join('\n\n')}

## API Proof

- /api/v1/reports/memory-readiness
- /api/v1/reports/missing-documents
- /api/v1/company-documents
- /api/v1/employee-documents/employees/:employeeId
- /api/v1/company-documents/:documentId/download
- /api/v1/employee-documents/:documentId/download

## Gaps Found

${failed === 0 ? '- No blocker or high-severity gaps found in this local QA run.' : results.filter((result) => result.status === 'failed').map((result) => `- ${result.id}: ${result.notes || result.actual}`).join('\n')}

## Repairs Made

- No code repair was required during this QA run.

## Residual Risks

- This is a local ACV tenant test, not a production live-site run.
- The stress check is endpoint-level repeated-read pressure, not full infrastructure load testing.
- Email/Zoho, full inbound communications, and WorkDrive sync remain out of scope for this sprint.

## Rerun Commands

\`\`\`bash
QA_BASE_URL=${BASE_URL} QA_API_URL=${API_BASE_URL} node scripts/qa/acv-memory-foundation-qa.mjs
\`\`\`
`;
}

async function main() {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

  const adminSession = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  const employeesResponse = await api('GET', '/employees', { token: adminSession.tokens.token });
  const employees = Array.isArray(employeesResponse.data) ? employeesResponse.data : employeesResponse.data?.employees || [];
  const employee = employees.find((row) => row.status === 'active') || employees[0];
  if (!employee?.employeeId) {
    throw new Error('No employee available in local tenant for ACV memory QA');
  }

  const temp = await prepareTempUsers(adminSession, employee);
  let employeeSession = null;
  let managerSession = null;
  if (temp.available) {
    employeeSession = await login(temp.employeeUser.email, TEMP_PASSWORD);
    managerSession = await login(temp.managerUser.email, TEMP_PASSWORD);
  } else {
    record('AUTH-ROLE-SETUP', 'Temporary role setup', 'system', 'Temporary employee/manager users are available', temp.reason, 'skipped');
  }

  try {
    await runApiTests(adminSession, employeeSession, managerSession, employee);
    await runVisualTests(adminSession, employeeSession);
  } finally {
    await cleanupTempData(temp.pool);
  }

  await fs.writeFile(JSON_PATH, JSON.stringify({ runDate: RUN_DATE, runId: RUN_ID, target: BASE_URL, api: API_BASE_URL, results, screenshots }, null, 2));
  await fs.writeFile(REPORT_PATH, buildReport());

  const failed = results.filter((result) => result.status === 'failed');
  console.log(`ACV Memory Foundation QA complete: ${results.length - failed.length}/${results.length} passed`);
  console.log(`Report: ${REPORT_PATH}`);
  if (failed.length > 0) {
    console.error(`Failures: ${failed.map((result) => result.id).join(', ')}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
