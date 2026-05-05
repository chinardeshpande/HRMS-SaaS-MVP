#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const REPORT_DIR = path.join(REPO_ROOT, 'docs/qa/hr-lifecycle-visual-2026-05-05');
const RESULTS_PATH = path.join(REPORT_DIR, 'results.json');
const HTML_PATH = path.join(REPORT_DIR, 'hr-lifecycle-visual-report.html');
const PDF_PATH = path.join(REPORT_DIR, 'hr-lifecycle-visual-report.pdf');

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
  const data = await fs.readFile(path.join(REPORT_DIR, relativePath));
  return `data:image/png;base64,${data.toString('base64')}`;
}

async function buildHtml(data) {
  const passed = data.results.filter(r => r.status === 'passed').length;
  const failed = data.results.filter(r => r.status === 'failed').length;
  const byRole = groupBy(data.results, 'role');
  const byModule = {
    Onboarding: data.results.filter(r => r.id.includes('ONB')),
    Performance: data.results.filter(r => r.id.includes('PERF')),
    Exit: data.results.filter(r => r.id.includes('EXIT')),
  };
  const screenshots = [];
  for (const shot of data.screenshots) screenshots.push({ ...shot, dataUri: await imageDataUri(shot.path) });

  const metricCards = Object.entries(byModule).map(([module, rows]) => `
    <div class="metric">
      <span>${escapeHtml(module)}</span>
      <strong>${rows.filter(r => r.status === 'passed').length}/${rows.length}</strong>
      <small>${rows.some(r => r.status === 'failed') ? 'fixes applied in branch' : 'passed'}</small>
    </div>
  `).join('');

  const roleCards = Object.entries(byRole).map(([role, rows]) => `
    <div class="role-card">
      <span>${escapeHtml(role)}</span>
      <strong>${rows.filter(r => r.status === 'passed').length}/${rows.length}</strong>
    </div>
  `).join('');

  const resultRows = data.results.map(r => `
    <tr>
      <td><code>${escapeHtml(r.id)}</code></td>
      <td>${escapeHtml(r.title)}</td>
      <td>${escapeHtml(r.role)}</td>
      <td><span class="badge ${r.status}">${r.status === 'passed' ? 'Passed' : 'Needs Fix'}</span></td>
      <td>${escapeHtml(r.evidence)}</td>
      <td>${escapeHtml(r.notes)}</td>
    </tr>
  `).join('');

  const screenshotHtml = screenshots.map((shot, index) => `
    <section class="proof ${index > 0 ? 'page-break' : ''}">
      <div class="proof-head">
        <div>
          <p>${escapeHtml(shot.role)} evidence</p>
          <h2>${escapeHtml(shot.title)}</h2>
        </div>
        <code>${escapeHtml(shot.id)}</code>
      </div>
      <img src="${shot.dataUri}" alt="${escapeHtml(shot.title)}" />
    </section>
  `).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>HR Lifecycle Visual QA Report</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #f6f8fb; color: #172033; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 11px; }
    .page { min-height: 100vh; padding: 28px; background: linear-gradient(135deg, #fff 0%, #f7fbff 55%, #eef6ff 100%); }
    .cover { display: grid; grid-template-columns: 1.1fr .9fr; gap: 24px; align-items: stretch; }
    .hero, .panel, .section, .proof { background: #fff; border: 1px solid #dbeafe; border-radius: 18px; box-shadow: 0 16px 38px rgba(15, 23, 42, .07); }
    .hero { padding: 34px; }
    .brand { display: flex; align-items: center; gap: 12px; color: #0757c4; font-weight: 800; font-size: 18px; margin-bottom: 42px; }
    .logo { width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(135deg, #0b63ce, #ef4444); }
    h1 { margin: 0; color: #0f172a; font-size: 42px; line-height: 1.05; letter-spacing: 0; }
    .subtitle { color: #475569; font-size: 15px; line-height: 1.5; max-width: 760px; margin: 18px 0 28px; }
    .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 22px; }
    .metric, .role-card { padding: 16px; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc; }
    .metric span, .role-card span { display: block; color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; }
    .metric strong, .role-card strong { display: block; margin-top: 8px; color: #0f172a; font-size: 28px; line-height: 1; }
    .metric small { display: block; margin-top: 8px; color: #64748b; }
    .panel { padding: 28px; background: #111827; color: #dbeafe; }
    .panel h2 { color: #fff; margin: 0 0 14px; font-size: 21px; }
    .panel ul { padding: 0; margin: 0; display: grid; gap: 10px; list-style: none; }
    .panel li { padding: 12px; border-radius: 12px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); }
    .section { padding: 22px; margin-bottom: 18px; }
    .section h2, .proof h2 { margin: 0 0 12px; color: #0f172a; font-size: 21px; }
    table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
    th { text-align: left; padding: 8px; background: #eaf2ff; color: #334155; border-bottom: 1px solid #cbd5e1; }
    td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; color: #334155; vertical-align: top; }
    code { color: #0757c4; font-family: "SFMono-Regular", Consolas, monospace; white-space: nowrap; font-size: 9px; }
    .badge { display: inline-flex; padding: 4px 8px; border-radius: 999px; font-weight: 800; }
    .badge.passed { color: #166534; background: #dcfce7; }
    .badge.failed { color: #9a3412; background: #ffedd5; }
    .page-break { page-break-before: always; }
    .proof { min-height: 100vh; padding: 18px; }
    .proof-head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 14px; }
    .proof-head p { margin: 0 0 5px; color: #2563eb; font-size: 10px; font-weight: 800; text-transform: uppercase; }
    .proof img { width: 100%; max-height: 650px; object-fit: contain; border: 1px solid #cbd5e1; border-radius: 14px; background: #f8fafc; }
    .fixes { display: grid; gap: 10px; padding: 0; margin: 0; list-style: none; }
    .fixes li { padding: 11px 13px; border-left: 4px solid #2563eb; border-radius: 10px; background: #eff6ff; color: #1e3a8a; }
  </style>
</head>
<body>
  <main class="page cover">
    <section class="hero">
      <div class="brand"><span class="logo"></span>AuroraHR</div>
      <h1>Onboarding, Performance, and Exit Visual QA Report</h1>
      <p class="subtitle">Comprehensive role-based proof for key HR lifecycle modules, including HR operations, manager views, employee self-service, approvals, detail pages, and management reporting surfaces.</p>
      <div class="metrics">
        <div class="metric"><span>Total Checks</span><strong>${data.results.length}</strong><small>${escapeHtml(data.runId)}</small></div>
        <div class="metric"><span>Passed</span><strong>${passed}</strong><small>live demo tenant</small></div>
        <div class="metric"><span>Needs Fix</span><strong>${failed}</strong><small>fixed in branch</small></div>
      </div>
      <div class="metrics">${metricCards}</div>
    </section>
    <aside class="panel">
      <h2>Role Coverage</h2>
      <div class="metrics" style="grid-template-columns: repeat(2, 1fr);">${roleCards}</div>
      <h2 style="margin-top: 28px;">Workflow Coverage</h2>
      <ul>
        <li>Onboarding candidate pipeline, candidate detail, offer flow, probation tracker.</li>
        <li>Performance review list, review detail, goal creation, submission, approval, export.</li>
        <li>Exit cases, employee self-service, manager queue, HR pending approvals, case detail.</li>
      </ul>
    </aside>
  </main>

  <section class="page page-break">
    <section class="section">
      <h2>Production Hardening Applied</h2>
      <ul class="fixes">
        <li>Added employee-safe Performance endpoint and frontend path: <code>/performance/my-reviews</code>.</li>
        <li>Scoped manager Performance list to manager-owned reviews.</li>
        <li>Implemented Performance CSV export.</li>
        <li>Added employee-safe Exit endpoint and self-service resignation view: <code>/exit/my-case</code>.</li>
        <li>Fixed Onboarding and Exit department/designation display compatibility with current <code>name</code> fields.</li>
      </ul>
    </section>
    <section class="section">
      <h2>Complete Test Matrix</h2>
      <table>
        <thead><tr><th>ID</th><th>Area</th><th>Role</th><th>Status</th><th>Evidence</th><th>Notes</th></tr></thead>
        <tbody>${resultRows}</tbody>
      </table>
    </section>
  </section>

  ${screenshotHtml}
</body>
</html>`;
}

async function main() {
  const data = JSON.parse(await fs.readFile(RESULTS_PATH, 'utf8'));
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

main().catch(error => {
  console.error(error);
  process.exit(1);
});
