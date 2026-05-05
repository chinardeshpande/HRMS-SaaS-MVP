#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const REPORT_DIR = path.join(REPO_ROOT, 'docs/qa/attendance-leave-visual-2026-05-05');
const RESULTS_PATH = path.join(REPORT_DIR, 'results.json');
const HTML_PATH = path.join(REPORT_DIR, 'attendance-leave-visual-report.html');
const PDF_PATH = path.join(REPORT_DIR, 'attendance-leave-visual-report.pdf');

async function loadPlaywright() {
  try {
    return require('/Users/chinar.deshpande06/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  } catch {
    return require('playwright');
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function groupBy(items, key) {
  return items.reduce((acc, item) => {
    const group = item[key] || 'other';
    acc[group] = acc[group] || [];
    acc[group].push(item);
    return acc;
  }, {});
}

async function imageDataUri(relativePath) {
  const fullPath = path.join(REPORT_DIR, relativePath);
  const data = await fs.readFile(fullPath);
  return `data:image/png;base64,${data.toString('base64')}`;
}

function statusLabel(status) {
  return status === 'passed' ? 'Passed' : 'Needs Fix';
}

function statusClass(status) {
  return status === 'passed' ? 'passed' : 'failed';
}

async function buildHtml(data) {
  const passed = data.results.filter((r) => r.status === 'passed').length;
  const failed = data.results.filter((r) => r.status === 'failed').length;
  const apiChecks = data.results.filter((r) => !r.id.startsWith('VIS_'));
  const visualChecks = data.results.filter((r) => r.id.startsWith('VIS_'));
  const byRole = groupBy(data.results, 'role');
  const screenshotBlocks = [];

  for (const shot of data.screenshots) {
    screenshotBlocks.push({
      ...shot,
      dataUri: await imageDataUri(shot.path),
    });
  }

  const roleCards = Object.entries(byRole)
    .map(([role, rows]) => {
      const rolePassed = rows.filter((r) => r.status === 'passed').length;
      const roleFailed = rows.filter((r) => r.status === 'failed').length;
      return `
        <div class="metric role-card">
          <span class="metric-label">${escapeHtml(role)}</span>
          <strong>${rolePassed}/${rows.length}</strong>
          <small>${roleFailed ? `${roleFailed} needs fix` : 'all passed'}</small>
        </div>
      `;
    })
    .join('');

  const resultRows = data.results
    .map((result) => `
      <tr>
        <td><code>${escapeHtml(result.id)}</code></td>
        <td>${escapeHtml(result.title)}</td>
        <td><span class="role">${escapeHtml(result.role)}</span></td>
        <td><span class="badge ${statusClass(result.status)}">${statusLabel(result.status)}</span></td>
        <td>${escapeHtml(result.evidence)}</td>
        <td>${escapeHtml(result.notes)}</td>
      </tr>
    `)
    .join('');

  const visualRows = visualChecks
    .map((result) => `
      <li>
        <strong>${escapeHtml(result.id)}</strong>
        <span>${escapeHtml(result.title)}</span>
        <em>${escapeHtml(result.role)}</em>
      </li>
    `)
    .join('');

  const apiRows = apiChecks
    .map((result) => `
      <li class="${statusClass(result.status)}">
        <strong>${escapeHtml(result.id)}</strong>
        <span>${escapeHtml(result.title)}</span>
        <small>${escapeHtml(result.evidence)}${result.notes ? ` - ${escapeHtml(result.notes)}` : ''}</small>
      </li>
    `)
    .join('');

  const screenshotHtml = screenshotBlocks
    .map((shot, index) => `
      <section class="proof ${index > 0 ? 'page-break' : ''}">
        <div class="proof-heading">
          <div>
            <p class="eyebrow">${escapeHtml(shot.role)} proof</p>
            <h2>${escapeHtml(shot.title)}</h2>
          </div>
          <code>${escapeHtml(shot.id)}</code>
        </div>
        <img src="${shot.dataUri}" alt="${escapeHtml(shot.title)}" />
      </section>
    `)
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Attendance and Leave Management Visual QA Report</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 12mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      color: #14213d;
      background: #f6f8fb;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 12px;
      line-height: 1.45;
    }

    .page {
      min-height: 100vh;
      padding: 28px;
      background:
        radial-gradient(circle at 12% 18%, rgba(37, 99, 235, 0.14), transparent 28%),
        linear-gradient(135deg, #ffffff 0%, #f8fbff 42%, #eef6ff 100%);
    }

    .cover {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 28px;
      align-items: stretch;
      min-height: 680px;
    }

    .hero {
      padding: 34px;
      border: 1px solid #dbeafe;
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.86);
      box-shadow: 0 18px 45px rgba(30, 64, 175, 0.08);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 46px;
      color: #0757c4;
      font-weight: 800;
      letter-spacing: 0;
      font-size: 18px;
    }

    .logo {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: linear-gradient(135deg, #0b63ce, #8b5cf6);
    }

    h1 {
      margin: 0;
      max-width: 760px;
      color: #0f172a;
      font-size: 44px;
      line-height: 1.04;
      letter-spacing: 0;
    }

    .subtitle {
      max-width: 760px;
      margin: 18px 0 34px;
      color: #475569;
      font-size: 16px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-top: 30px;
    }

    .metric {
      padding: 18px;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      background: #ffffff;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
    }

    .metric-label {
      display: block;
      color: #64748b;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0;
    }

    .metric strong {
      display: block;
      margin-top: 8px;
      color: #0f172a;
      font-size: 28px;
      line-height: 1;
    }

    .metric small {
      display: block;
      margin-top: 8px;
      color: #64748b;
    }

    .side-panel {
      padding: 30px;
      border-radius: 22px;
      background: #0f172a;
      color: #e2e8f0;
      box-shadow: 0 22px 48px rgba(15, 23, 42, 0.22);
    }

    .side-panel h2 {
      margin-top: 0;
      color: #ffffff;
      font-size: 22px;
    }

    .checklist {
      display: grid;
      gap: 12px;
      margin: 20px 0 0;
      padding: 0;
      list-style: none;
    }

    .checklist li {
      padding: 12px 14px;
      border: 1px solid rgba(226, 232, 240, 0.18);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.06);
    }

    .section {
      margin-top: 22px;
      padding: 22px;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      background: #ffffff;
      box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
    }

    .section h2,
    .proof h2 {
      margin: 0 0 14px;
      color: #0f172a;
      font-size: 22px;
      letter-spacing: 0;
    }

    .two-column {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }

    .scenario-list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 8px;
    }

    .scenario-list li {
      display: grid;
      grid-template-columns: 96px 1fr 84px;
      gap: 10px;
      align-items: start;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #f8fafc;
    }

    .scenario-list li.failed {
      background: #fff7ed;
      border-color: #fed7aa;
    }

    code {
      color: #0757c4;
      font-family: "SFMono-Regular", Consolas, monospace;
      font-size: 10px;
      white-space: nowrap;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      overflow: hidden;
      border-radius: 12px;
      font-size: 10px;
    }

    th {
      padding: 9px;
      text-align: left;
      color: #334155;
      background: #eaf2ff;
      border-bottom: 1px solid #cbd5e1;
    }

    td {
      padding: 8px 9px;
      vertical-align: top;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }

    .badge,
    .role {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 58px;
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 800;
    }

    .role {
      color: #075985;
      background: #e0f2fe;
    }

    .badge.passed {
      color: #166534;
      background: #dcfce7;
    }

    .badge.failed {
      color: #9a3412;
      background: #ffedd5;
    }

    .page-break {
      page-break-before: always;
    }

    .proof {
      min-height: 100vh;
      padding: 18px;
      background: #ffffff;
      border: 1px solid #dbeafe;
      border-radius: 18px;
    }

    .proof-heading {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 14px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
    }

    .eyebrow {
      margin: 0 0 5px;
      color: #2563eb;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0;
    }

    .proof img {
      display: block;
      width: 100%;
      max-height: 650px;
      object-fit: contain;
      border: 1px solid #cbd5e1;
      border-radius: 14px;
      background: #f8fafc;
    }

    .gaps {
      display: grid;
      gap: 10px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .gaps li {
      padding: 12px 14px;
      border-left: 4px solid #f59e0b;
      border-radius: 10px;
      background: #fffbeb;
      color: #3f2e06;
    }
  </style>
</head>
<body>
  <main class="page cover">
    <section class="hero">
      <div class="brand"><span class="logo"></span>AuroraHR</div>
      <h1>Attendance and Leave Management Visual QA Report</h1>
      <p class="subtitle">Role-based browser evidence for employee self-service, manager approvals, HR interventions, leadership views, daily attendance updates, regularization, leave decisions, reports, and bulk update controls.</p>
      <div class="summary-grid">
        <div class="metric">
          <span class="metric-label">Checks executed</span>
          <strong>${data.results.length}</strong>
          <small>${escapeHtml(data.runId)}</small>
        </div>
        <div class="metric">
          <span class="metric-label">Passed</span>
          <strong>${passed}</strong>
          <small>Live demo tenant</small>
        </div>
        <div class="metric">
          <span class="metric-label">Needs fix</span>
          <strong>${failed}</strong>
          <small>Backend query fixed in branch</small>
        </div>
      </div>
      <div class="summary-grid">${roleCards}</div>
    </section>

    <aside class="side-panel">
      <h2>Run Metadata</h2>
      <ul class="checklist">
        <li><strong>Run date</strong><br />${escapeHtml(data.runDate)}</li>
        <li><strong>Application</strong><br />${escapeHtml(data.baseUrl)}</li>
        <li><strong>API</strong><br />${escapeHtml(data.apiBaseUrl)}</li>
        <li><strong>Visual screenshots</strong><br />${data.screenshots.length} embedded proof images</li>
      </ul>
      <h2 style="margin-top: 30px;">Coverage</h2>
      <ul class="checklist">
        <li>Employee attendance, leave balances, leave application, regularization.</li>
        <li>Manager attendance and leave approval queues.</li>
        <li>HR mass update, sync controls, intervention queues, report APIs.</li>
        <li>Leadership/admin elevated attendance and leave views.</li>
      </ul>
    </aside>
  </main>

  <section class="page page-break">
    <div class="two-column">
      <section class="section">
        <h2>API and Workflow Checks</h2>
        <ul class="scenario-list">${apiRows}</ul>
      </section>
      <section class="section">
        <h2>Visual Scenario Checks</h2>
        <ul class="scenario-list">${visualRows}</ul>
      </section>
    </div>
    <section class="section">
      <h2>Product Gaps Observed</h2>
      <ul class="gaps">
        <li>Attendance Mass Update UI opens a modal, but the current frontend handler is not wired to the real <code>/attendance/bulk-update</code> endpoint. The backend endpoint was verified separately.</li>
        <li>Attendance Sync UI currently uses mock preview/save behavior. Production-grade device/file import needs backend persistence and audit results.</li>
        <li>The live production <code>/attendance/by-department</code> report failed because it referenced a non-existent department column. This branch fixes the query to use <code>Department.name</code> while preserving the <code>departmentName</code> API alias.</li>
        <li>Attendance/Leave pages do not yet expose a polished monthly report export/dashboard experience beyond current CSV/table summaries.</li>
      </ul>
    </section>
  </section>

  <section class="page page-break">
    <section class="section">
      <h2>Complete Test Matrix</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Area</th>
            <th>Role</th>
            <th>Status</th>
            <th>Evidence</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>${resultRows}</tbody>
      </table>
    </section>
  </section>

  ${screenshotHtml}
</body>
</html>`;
}

async function main() {
  const raw = await fs.readFile(RESULTS_PATH, 'utf8');
  const data = JSON.parse(raw);
  const html = await buildHtml(data);
  await fs.writeFile(HTML_PATH, html, 'utf8');

  const playwright = await loadPlaywright();
  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 990 }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({
      path: PDF_PATH,
      format: 'A4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });
  } finally {
    await browser.close();
  }

  console.log(`HTML written to ${HTML_PATH}`);
  console.log(`PDF written to ${PDF_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
