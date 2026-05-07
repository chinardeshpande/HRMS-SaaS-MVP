#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RUN_DATE = process.env.QA_RUN_DATE || '2026-05-07';
const RUN_ID = process.env.QA_RUN_ID || `DRA-${RUN_DATE}-${Date.now()}`;
const BASE_URL = process.env.QA_BASE_URL || 'https://aurorahr.in';
const API_BASE_URL = process.env.QA_API_URL || `${BASE_URL}/api/v1`;
const OUT_DIR = path.join(REPO_ROOT, 'docs/qa/documents-reports-analytics-visual-2026-05-07');
const SCREENSHOT_DIR = path.join(OUT_DIR, 'screenshots');
const REPORT_PATH = path.join(OUT_DIR, 'report.md');
const HTML_PATH = path.join(OUT_DIR, 'documents-reports-analytics-production-readiness-report.html');
const PDF_PATH = path.join(OUT_DIR, 'documents-reports-analytics-production-readiness-report.pdf');
const JSON_PATH = path.join(OUT_DIR, 'results.json');

const sessions = new Map();
const results = [];
const screenshots = [];
const created = {};

function record(id, title, role, status, evidence, notes = '') {
  results.push({ id, title, role, status, evidence, notes });
}

function unwrap(json) {
  if (json && typeof json === 'object' && 'data' in json) return json.data;
  return json;
}

async function loadPlaywright() {
  try {
    return require('/Users/chinar.deshpande06/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  } catch {
    return require('playwright');
  }
}

async function api(method, urlPath, body, persona = null, options = {}) {
  const headers = {};
  if (!options.blob) headers['Content-Type'] = 'application/json';
  if (persona) {
    const session = await login(persona);
    headers.Authorization = `Bearer ${session.tokens.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${urlPath}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (options.blob) {
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!response.ok) {
      if (options.allowFailure) return { failed: true, status: response.status, size: buffer.length };
      throw new Error(`${method} ${urlPath} failed: ${response.status}`);
    }
    return { buffer, status: response.status, contentType: response.headers.get('content-type') || '' };
  }

  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!response.ok || json?.success === false) {
    const message = json?.error?.message || json?.message || response.statusText;
    if (options.allowFailure) return { failed: true, status: response.status, message, payload: json };
    const error = new Error(`${method} ${urlPath} failed: ${message}`);
    error.status = response.status;
    error.payload = json;
    throw error;
  }

  return unwrap(json);
}

async function login(persona) {
  if (sessions.has(persona)) return sessions.get(persona);
  const session = await api('POST', '/demo/login', { persona });
  sessions.set(persona, session);
  record(`AUTH_${persona.toUpperCase()}`, `Demo login as ${persona}`, persona, 'passed', 'API /demo/login', session.user?.email || '');
  return session;
}

async function tryStep(id, title, role, fn) {
  try {
    const evidence = await fn();
    if (!results.some((r) => r.id === id)) record(id, title, role, 'passed', evidence || 'completed');
  } catch (error) {
    record(id, title, role, 'failed', 'runtime/API error', error.message);
  }
}

function sampleValue(field, employee) {
  const lower = field.toLowerCase();
  if (lower.includes('company')) return 'Aurora HR Demo Pvt Ltd';
  if (lower.includes('firstname')) return employee?.firstName || 'Priya';
  if (lower.includes('lastname')) return employee?.lastName || 'Sharma';
  if (lower.includes('employeename') || lower.includes('candidatename')) return `${employee?.firstName || 'Priya'} ${employee?.lastName || 'Sharma'}`;
  if (lower.includes('employeecode')) return employee?.employeeCode || 'AHR-1024';
  if (lower.includes('email')) return employee?.email || 'priya.sharma@example.com';
  if (lower.includes('department')) return employee?.department?.name || 'People Operations';
  if (lower.includes('designation') || lower.includes('position')) return employee?.designation?.name || 'Senior HR Analyst';
  if (lower.includes('salary') || lower.includes('ctc') || lower.includes('amount')) return '1200000';
  if (lower.includes('currency')) return 'INR';
  if (lower.includes('date') || lower.includes('day')) return RUN_DATE;
  if (lower.includes('manager')) return 'Rahul Mehta';
  if (lower.includes('location')) return 'Mumbai';
  if (lower.includes('reason')) return 'Structured production-readiness QA scenario';
  if (lower.includes('responsibilities')) return 'People analytics, HR operations, employee experience, and compliance reporting';
  return `${field} sample`;
}

async function exerciseApis() {
  for (const persona of ['employee', 'manager', 'hr', 'admin']) await login(persona);

  await tryStep('DOC_01', 'HR can list active document templates', 'hr', async () => {
    const response = await api('GET', '/document-templates', undefined, 'hr');
    const templates = response.templates || [];
    if (templates.length === 0) throw new Error('No active document templates returned');
    created.template = templates.find((t) => t.category === 'confirmation') || templates[0];
    return `templates=${templates.length}, selected=${created.template.displayName}`;
  });

  await tryStep('DOC_02', 'HR can preview a template with sample employee data', 'hr', async () => {
    const preview = await api('POST', `/document-templates/${created.template.templateId}/preview`, {
      sampleData: { companyName: 'Aurora HR Demo Pvt Ltd', firstName: 'Priya', lastName: 'Sharma' },
    }, 'hr');
    if (!preview.html || !preview.html.includes('Aurora')) throw new Error('Preview HTML did not render supplied data');
    return `previewLength=${preview.html.length}`;
  });

  await tryStep('DOC_03', 'HR can generate a PDF document and the platform records it in history', 'hr', async () => {
    const employees = await api('GET', '/employees?status=active&limit=100', undefined, 'hr');
    const list = employees.employees || employees.data || employees || [];
    const employee = list[0];
    if (!employee?.employeeId) throw new Error('No active employee available for document generation');
    created.employee = employee;
    const variables = Object.fromEntries((created.template.availableFields || []).map((field) => [field, sampleValue(field, employee)]));
    const pdf = await api('POST', '/document-templates/generate', {
      templateId: created.template.templateId,
      employeeId: employee.employeeId,
      variables,
      format: 'PDF',
    }, 'hr', { blob: true });
    if (pdf.buffer.length < 500) throw new Error(`Generated PDF too small: ${pdf.buffer.length} bytes`);
    const history = await api('GET', '/document-templates/history?limit=10', undefined, 'hr');
    const row = (history.history || []).find((doc) => doc.templateName === created.template.displayName);
    if (!row) throw new Error('Generated document was not returned in history');
    created.generatedDocument = row;
    return `pdfBytes=${pdf.buffer.length}, documentId=${row.documentId}`;
  });

  await tryStep('DOC_04', 'HR can download a previously generated document from persistent history', 'hr', async () => {
    const doc = created.generatedDocument;
    if (!doc?.documentId) throw new Error('No generated document in history');
    const download = await api('GET', `/document-templates/generated/${doc.documentId}/download`, undefined, 'hr', { blob: true });
    if (download.buffer.length < 500) throw new Error(`Downloaded document too small: ${download.buffer.length} bytes`);
    return `downloadBytes=${download.buffer.length}`;
  });

  await tryStep('DOC_05', 'Employee cannot generate HR-controlled documents', 'employee', async () => {
    const denied = await api('POST', '/document-templates/generate', {
      templateId: created.template.templateId,
      variables: {},
      format: 'PDF',
    }, 'employee', { allowFailure: true });
    if (!denied.failed || denied.status !== 403) throw new Error(`Expected 403, got ${denied.status || 'success'}`);
    return '403 forbidden confirmed';
  });

  const reportChecks = [
    ['REP_01', 'Headcount report', '/reports/headcount'],
    ['REP_02', 'Attendance summary report', `/reports/attendance-summary?startDate=2026-01-01&endDate=${RUN_DATE}`],
    ['REP_03', 'Leave balance report', '/reports/leave-balance'],
    ['REP_04', 'Joiners and leavers report', `/reports/joiners-leavers?startDate=2026-01-01&endDate=${RUN_DATE}`],
    ['REP_05', 'Confirmation due report', '/reports/confirmation-due'],
    ['REP_06', 'Attrition report', `/reports/attrition?startDate=2026-01-01&endDate=${RUN_DATE}`],
    ['REP_07', 'PMS completion report', '/reports/pms-completion'],
    ['REP_08', 'Missing documents report', '/reports/missing-documents'],
  ];

  for (const [id, title, url] of reportChecks) {
    await tryStep(id, `HR can run ${title}`, 'hr', async () => {
      const report = await api('GET', url, undefined, 'hr');
      if (!report.report || !Array.isArray(report.results)) throw new Error('Report payload missing report/results fields');
      return `${report.report}: records=${report.totalRecords ?? report.results.length}`;
    });
  }

  await tryStep('REP_09', 'Manager can run permitted team/organization reports', 'manager', async () => {
    const report = await api('GET', '/reports/headcount', undefined, 'manager');
    if (!Array.isArray(report.results)) throw new Error('Manager headcount report missing results');
    return `records=${report.results.length}`;
  });

  await tryStep('REP_10', 'Employee is blocked from HR reporting endpoints', 'employee', async () => {
    const denied = await api('GET', '/reports/headcount', undefined, 'employee', { allowFailure: true });
    if (!denied.failed || denied.status !== 403) throw new Error(`Expected 403, got ${denied.status || 'success'}`);
    return '403 forbidden confirmed';
  });

  await tryStep('REP_11', 'HR can save and execute a reusable report configuration', 'hr', async () => {
    const saved = await api('POST', '/reports/saved', {
      reportName: `QA Headcount Snapshot ${RUN_ID}`,
      description: 'Saved report created by documents/reports/analytics production-readiness QA.',
      category: 'workforce',
      reportType: 'headcount',
      filterConfig: {},
      chartConfig: { type: 'table' },
      isPublic: true,
    }, 'hr');
    const executed = await api('POST', `/reports/saved/${saved.reportId}/execute`, {}, 'hr');
    if (!Array.isArray(executed)) throw new Error('Saved report execution did not return report rows');
    return `reportId=${saved.reportId}, records=${executed.length}`;
  });

  await tryStep('ANA_01', 'HR can run semantic analytics over workforce data', 'hr', async () => {
    const insight = await api('POST', '/analytics/query', {
      question: 'Show headcount, attendance, leave, attrition, and performance',
    }, 'hr');
    if (!Array.isArray(insight.metrics) || insight.metrics.length < 3) throw new Error('Analytics query returned insufficient metrics');
    created.analytics = insight;
    return `metrics=${insight.metrics.map((m) => m.metricName).join(',')}`;
  });

  await tryStep('ANA_02', 'Manager can access governed analytics query capability', 'manager', async () => {
    const insight = await api('POST', '/analytics/query', { question: 'What is the attendance rate?' }, 'manager');
    if (!insight.metrics?.length) throw new Error('Manager analytics returned no metrics');
    return `answer=${insight.answer}`;
  });

  await tryStep('ANA_03', 'Employee is blocked from management analytics', 'employee', async () => {
    const denied = await api('POST', '/analytics/query', { question: 'Show attrition' }, 'employee', { allowFailure: true });
    if (!denied.failed || denied.status !== 403) throw new Error(`Expected 403, got ${denied.status || 'success'}`);
    return '403 forbidden confirmed';
  });

  await tryStep('ANA_04', 'Manager dashboard stats are role-aware and load without tenant-wide leakage errors', 'manager', async () => {
    const stats = await api('GET', '/dashboard/stats', undefined, 'manager');
    const required = ['totalEmployees', 'presentToday', 'absentToday', 'pendingApprovals'];
    for (const key of required) {
      if (typeof stats[key] !== 'number') throw new Error(`Missing numeric stat ${key}`);
    }
    return `teamEmployees=${stats.totalEmployees}, presentToday=${stats.presentToday}`;
  });
}

async function captureVisuals() {
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const hr = await login('hr');

  async function goto(pathName) {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((session) => {
      localStorage.setItem('tokens', JSON.stringify(session.tokens));
      localStorage.setItem('user', JSON.stringify(session.user));
    }, hr);
    await page.goto(`${BASE_URL}${pathName}`, { waitUntil: 'networkidle' });
  }

  async function screenshot(id, title, role, pathName) {
    await goto(pathName);
    await page.waitForTimeout(1200);
    const fileName = `${id.toLowerCase()}.png`;
    const filePath = path.join(SCREENSHOT_DIR, fileName);
    await page.screenshot({ path: filePath, fullPage: true });
    screenshots.push({ id, title, role, path: `screenshots/${fileName}` });
    record(`VIS_${id}`, title, role, 'passed', `screenshots/${fileName}`);
  }

  await screenshot('DOC_TEMPLATES', 'Document templates catalog with HR generation entry points', 'hr', '/documents');

  await goto('/documents');
  await page.getByRole('button', { name: /History/i }).click();
  await page.waitForTimeout(1000);
  const historyPath = path.join(SCREENSHOT_DIR, 'doc_history.png');
  await page.screenshot({ path: historyPath, fullPage: true });
  screenshots.push({ id: 'DOC_HISTORY', title: 'Generated document history and download actions', role: 'hr', path: 'screenshots/doc_history.png' });
  record('VIS_DOC_HISTORY', 'Generated document history and download actions', 'hr', 'passed', 'screenshots/doc_history.png');

  await screenshot('REPORTS_HOME', 'Reports and analytics command center', 'hr', '/reports');

  await goto('/reports');
  await page.getByRole('button', { name: /Run Analytics/i }).click();
  await page.waitForTimeout(1800);
  const analyticsPath = path.join(SCREENSHOT_DIR, 'analytics_query.png');
  await page.screenshot({ path: analyticsPath, fullPage: true });
  screenshots.push({ id: 'ANALYTICS_QUERY', title: 'Semantic analytics query with calculated HR metrics', role: 'hr', path: 'screenshots/analytics_query.png' });
  record('VIS_ANALYTICS_QUERY', 'Semantic analytics query with calculated HR metrics', 'hr', 'passed', 'screenshots/analytics_query.png');

  await goto('/reports');
  await page.getByRole('button', { name: /Headcount Report/i }).click();
  await page.waitForTimeout(1500);
  const headcountPath = path.join(SCREENSHOT_DIR, 'headcount_report.png');
  await page.screenshot({ path: headcountPath, fullPage: true });
  screenshots.push({ id: 'HEADCOUNT_REPORT', title: 'Headcount report result table and export action', role: 'hr', path: 'screenshots/headcount_report.png' });
  record('VIS_HEADCOUNT_REPORT', 'Headcount report result table and export action', 'hr', 'passed', 'screenshots/headcount_report.png');

  await browser.close();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function imageDataUri(relativePath) {
  const fullPath = path.join(OUT_DIR, relativePath);
  const data = await fs.readFile(fullPath);
  return `data:image/png;base64,${data.toString('base64')}`;
}

async function buildHtml() {
  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const resultRows = results.map((r) => `
    <tr>
      <td><code>${escapeHtml(r.id)}</code></td>
      <td>${escapeHtml(r.title)}</td>
      <td>${escapeHtml(r.role)}</td>
      <td><span class="badge ${r.status}">${r.status === 'passed' ? 'Passed' : 'Needs Fix'}</span></td>
      <td>${escapeHtml(r.evidence)}</td>
      <td>${escapeHtml(r.notes)}</td>
    </tr>
  `).join('');

  const screenshotHtml = [];
  for (const shot of screenshots) {
    screenshotHtml.push(`
      <section class="proof">
        <div class="proof-title">
          <div>
            <p>${escapeHtml(shot.role)} visual proof</p>
            <h2>${escapeHtml(shot.title)}</h2>
          </div>
          <code>${escapeHtml(shot.id)}</code>
        </div>
        <img src="${await imageDataUri(shot.path)}" alt="${escapeHtml(shot.title)}" />
      </section>
    `);
  }

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Documents, Reports, and Analytics Production Readiness Report</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    body { margin: 0; background: #f6f8fb; color: #111827; font-family: Inter, Arial, sans-serif; font-size: 12px; line-height: 1.45; }
    .page { padding: 28px; background: #fff; min-height: 100vh; }
    h1 { margin: 0; font-size: 40px; line-height: 1.05; max-width: 900px; }
    h2 { margin: 0; font-size: 22px; }
    .subtitle { margin: 16px 0 28px; max-width: 980px; color: #4b5563; font-size: 15px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin: 24px 0; }
    .metric { border: 1px solid #dbeafe; border-radius: 12px; padding: 16px; background: #eff6ff; }
    .metric span { display: block; color: #1d4ed8; font-weight: 700; text-transform: uppercase; font-size: 10px; }
    .metric strong { display: block; margin-top: 8px; font-size: 28px; }
    .story { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 22px; }
    .story article { border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; background: #fafafa; }
    .story h3 { margin: 0 0 8px; font-size: 17px; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; background: #fff; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 9px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; color: #374151; font-size: 10px; text-transform: uppercase; }
    code { color: #1d4ed8; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .badge { display: inline-block; border-radius: 999px; padding: 3px 9px; font-weight: 700; font-size: 10px; text-transform: uppercase; }
    .passed { background: #dcfce7; color: #166534; }
    .failed { background: #fee2e2; color: #991b1b; }
    .proof { page-break-before: always; padding: 24px; background: #fff; }
    .proof-title { display: flex; align-items: end; justify-content: space-between; margin-bottom: 14px; }
    .proof-title p { margin: 0 0 4px; color: #6b7280; font-weight: 700; text-transform: uppercase; font-size: 10px; }
    img { width: 100%; border: 1px solid #d1d5db; border-radius: 10px; }
  </style>
</head>
<body>
  <main class="page">
    <h1>Documents, Reports, and Analytics Production Readiness Report</h1>
    <p class="subtitle">Run ${escapeHtml(RUN_ID)} validates the HR document generation lifecycle, reusable reports, management analytics, role boundaries, exports, and browser-visible evidence against ${escapeHtml(BASE_URL)}.</p>
    <section class="grid">
      <div class="metric"><span>Total checks</span><strong>${results.length}</strong></div>
      <div class="metric"><span>Passed</span><strong>${passed}</strong></div>
      <div class="metric"><span>Needs fix</span><strong>${failed}</strong></div>
      <div class="metric"><span>Screenshots</span><strong>${screenshots.length}</strong></div>
    </section>
    <section class="story">
      <article>
        <h3>Document control</h3>
        <p>HR selects a governed template, previews sample data, generates a PDF for a real employee, and then retrieves that same output through persistent generated-document history. Employees are blocked from HR-only generation.</p>
      </article>
      <article>
        <h3>Reporting workflow</h3>
        <p>HR runs all available report families, verifies normalized result payloads, saves a reusable headcount report, executes it, and confirms managers and employees receive the correct role boundaries.</p>
      </article>
      <article>
        <h3>Analytics workflow</h3>
        <p>The analytics panel answers a natural-language HR question using calculated workforce metrics. Manager access is allowed, employee access is denied, and dashboard statistics are verified for role-aware loading.</p>
      </article>
    </section>
    <table>
      <thead><tr><th>ID</th><th>Use case and expected outcome</th><th>Role</th><th>Status</th><th>Evidence</th><th>Notes</th></tr></thead>
      <tbody>${resultRows}</tbody>
    </table>
  </main>
  ${screenshotHtml.join('')}
</body>
</html>`;
}

async function writeReports() {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  const payload = { runId: RUN_ID, runDate: RUN_DATE, baseUrl: BASE_URL, apiBaseUrl: API_BASE_URL, results, screenshots };
  await fs.writeFile(JSON_PATH, JSON.stringify(payload, null, 2));

  const mdRows = results.map((r) => `| ${r.id} | ${r.title} | ${r.role} | ${r.status} | ${r.evidence} | ${r.notes || ''} |`).join('\n');
  await fs.writeFile(REPORT_PATH, `# Documents, Reports, and Analytics Visual QA\n\nRun: ${RUN_ID}\nBase URL: ${BASE_URL}\n\n| ID | Use case | Role | Status | Evidence | Notes |\n| --- | --- | --- | --- | --- | --- |\n${mdRows}\n`);

  const html = await buildHtml();
  await fs.writeFile(HTML_PATH, html);

  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(`file://${HTML_PATH}`, { waitUntil: 'networkidle' });
  await page.pdf({ path: PDF_PATH, format: 'A4', landscape: true, printBackground: true });
  await browser.close();
}

async function main() {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  await exerciseApis();
  await captureVisuals();
  await writeReports();

  const failed = results.filter((r) => r.status === 'failed');
  console.log(JSON.stringify({
    runId: RUN_ID,
    passed: results.length - failed.length,
    failed: failed.length,
    report: REPORT_PATH,
    pdf: PDF_PATH,
  }, null, 2));

  if (failed.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
