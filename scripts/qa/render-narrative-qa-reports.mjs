#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

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

function statusLabel(status) {
  if (status === 'not-run') return 'Not Run';
  return status === 'passed' ? 'Passed' : 'Needs Fix';
}

function findResult(data, id) {
  return data.results.find((result) => result.id === id);
}

async function imageDataUri(reportDir, relativePath) {
  if (!relativePath) return '';
  const data = await fs.readFile(path.join(reportDir, relativePath));
  return `data:image/png;base64,${data.toString('base64')}`;
}

function resultSummary(data) {
  const passed = data.results.filter((r) => r.status === 'passed').length;
  const failed = data.results.filter((r) => r.status === 'failed').length;
  return { passed, failed, total: data.results.length };
}

function getResultLine(result) {
  if (!result) return { status: 'not-run', evidence: 'Not run', notes: '' };
  return {
    status: result.status,
    evidence: result.evidence || '',
    notes: result.notes || '',
  };
}

async function buildNarrativeHtml(config) {
  const data = JSON.parse(await fs.readFile(config.resultsPath, 'utf8'));
  const summary = resultSummary(data);

  const scenarioHtml = [];
  for (const scenario of config.scenarios) {
    const linkedResults = scenario.resultIds.map((id) => ({ id, result: findResult(data, id) }));
    const primaryResult = linkedResults.find(({ result }) => result)?.result;
    const screenshotResult = scenario.screenshotId ? findResult(data, scenario.screenshotId) : null;
    const imageUri = screenshotResult?.evidence?.startsWith('screenshots/')
      ? await imageDataUri(config.reportDir, screenshotResult.evidence)
      : '';

    scenarioHtml.push(`
      <section class="scenario">
        <div class="scenario-head">
          <div>
            <p class="eyebrow">${escapeHtml(scenario.module)} / ${escapeHtml(scenario.persona)}</p>
            <h2>${escapeHtml(scenario.title)}</h2>
          </div>
          <span class="badge ${primaryResult?.status || 'passed'}">${statusLabel(primaryResult?.status || 'passed')}</span>
        </div>

        <div class="story-grid">
          <div>
            <h3>HR Process Being Tested</h3>
            <p>${escapeHtml(scenario.process)}</p>
          </div>
          <div>
            <h3>Sample Data and Persona</h3>
            <p>${escapeHtml(scenario.data)}</p>
          </div>
        </div>

        <div class="steps">
          <h3>Product Navigation</h3>
          <ol>
            ${scenario.navigation.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}
          </ol>
        </div>

        <div class="story-grid">
          <div>
            <h3>Expected Outcome</h3>
            <p>${escapeHtml(scenario.expected)}</p>
          </div>
          <div>
            <h3>Actual Outcome</h3>
            <p>${escapeHtml(scenario.actual)}</p>
          </div>
        </div>

        <table class="mini-table">
          <thead><tr><th>Check</th><th>Status</th><th>Evidence</th><th>Notes</th></tr></thead>
          <tbody>
            ${linkedResults.map(({ id, result }) => {
              const line = getResultLine(result);
              return `<tr><td><code>${escapeHtml(id)}</code></td><td><span class="badge ${escapeHtml(line.status)}">${escapeHtml(statusLabel(line.status))}</span></td><td>${escapeHtml(line.evidence)}</td><td>${escapeHtml(line.notes)}</td></tr>`;
            }).join('')}
          </tbody>
        </table>

        ${imageUri ? `<figure><img src="${imageUri}" alt="${escapeHtml(scenario.title)}" /><figcaption>${escapeHtml(scenario.screenshotCaption || scenario.title)}</figcaption></figure>` : ''}
      </section>
    `);
  }

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(config.title)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #152033; background: #f4f7fb; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 11px; line-height: 1.45; }
    .page { min-height: 100vh; padding: 30px; background: linear-gradient(135deg, #ffffff 0%, #f8fbff 52%, #eef6ff 100%); }
    .cover { display: grid; grid-template-columns: 1.1fr .9fr; gap: 24px; align-items: stretch; }
    .hero, .panel, .scenario, .summary { background: #fff; border: 1px solid #dbeafe; border-radius: 18px; box-shadow: 0 16px 36px rgba(15, 23, 42, .07); }
    .hero { padding: 34px; }
    .brand { display: flex; align-items: center; gap: 12px; color: #0757c4; font-weight: 800; font-size: 18px; margin-bottom: 36px; }
    .logo { width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(135deg, #0b63ce, #8b5cf6); }
    h1 { margin: 0; color: #0f172a; font-size: 36px; line-height: 1.05; letter-spacing: 0; }
    .subtitle { margin: 16px 0 26px; color: #475569; font-size: 14px; max-width: 760px; }
    .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .metric { padding: 16px; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc; }
    .metric span { display: block; color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; }
    .metric strong { display: block; margin-top: 8px; color: #0f172a; font-size: 28px; line-height: 1; }
    .panel { padding: 28px; background: #111827; color: #dbeafe; }
    .panel h2 { margin: 0 0 12px; color: #fff; font-size: 20px; }
    .panel p, .panel li { color: #dbeafe; }
    .panel ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 10px; }
    .panel li { padding: 12px; border-radius: 12px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); }
    .summary { padding: 24px; margin-bottom: 18px; }
    .summary h2, .scenario h2 { color: #0f172a; margin: 0 0 12px; font-size: 21px; }
    .scenario { padding: 24px; margin-bottom: 20px; page-break-inside: avoid; }
    .scenario-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
    .eyebrow { margin: 0 0 5px; color: #2563eb; font-size: 10px; font-weight: 800; text-transform: uppercase; }
    .story-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 14px; }
    h3 { margin: 0 0 6px; color: #334155; font-size: 12px; text-transform: uppercase; }
    p { margin: 0; color: #334155; }
    .steps { margin-bottom: 14px; padding: 14px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
    ol { margin: 0; padding-left: 18px; color: #334155; }
    li { margin: 4px 0; }
    .mini-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 9px; }
    th { text-align: left; background: #eaf2ff; color: #334155; padding: 7px; border-bottom: 1px solid #cbd5e1; }
    td { padding: 7px; border-bottom: 1px solid #e2e8f0; vertical-align: top; color: #334155; }
    code { color: #0757c4; font-family: "SFMono-Regular", Consolas, monospace; white-space: nowrap; font-size: 9px; }
    .badge { display: inline-flex; padding: 4px 8px; border-radius: 999px; font-size: 9px; font-weight: 800; }
    .badge.passed { color: #166534; background: #dcfce7; }
    .badge.failed { color: #9a3412; background: #ffedd5; }
    .badge.not-run { color: #475569; background: #e2e8f0; }
    figure { margin: 16px 0 0; page-break-inside: avoid; }
    img { width: 100%; max-height: 500px; object-fit: contain; border: 1px solid #cbd5e1; border-radius: 14px; background: #f8fafc; }
    figcaption { margin-top: 6px; color: #64748b; font-size: 10px; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  <main class="page cover">
    <section class="hero">
      <div class="brand"><span class="logo"></span>AuroraHR</div>
      <h1>${escapeHtml(config.title)}</h1>
      <p class="subtitle">${escapeHtml(config.subtitle)}</p>
      <div class="metrics">
        <div class="metric"><span>Total Checks</span><strong>${summary.total}</strong></div>
        <div class="metric"><span>Passed</span><strong>${summary.passed}</strong></div>
        <div class="metric"><span>Needs Fix</span><strong>${summary.failed}</strong></div>
      </div>
    </section>
    <aside class="panel">
      <h2>How To Read This Document</h2>
      <ul>
        <li>Each scenario is written as a realistic HR workflow, not just a technical check.</li>
        <li>Navigation steps show how a user reaches the feature in AuroraHR.</li>
        <li>Expected and actual outcomes make the product behavior auditable.</li>
        <li>Screenshots are embedded as proof for investor, customer, and internal QA review.</li>
        ${config.verificationBoundary ? `<li>${escapeHtml(config.verificationBoundary)}</li>` : ''}
      </ul>
    </aside>
  </main>

  <section class="page page-break">
    <section class="summary">
      <h2>Executive Narrative</h2>
      <p>${escapeHtml(config.executiveNarrative)}</p>
    </section>
    ${scenarioHtml.join('\n')}
  </section>
</body>
</html>`;
}

async function renderReport(config) {
  const html = await buildNarrativeHtml(config);
  await fs.writeFile(config.htmlPath, html, 'utf8');

  const playwright = await loadPlaywright();
  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 1600 }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({
      path: config.pdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });
  } finally {
    await browser.close();
  }
}

const attendanceLeaveDir = path.join(REPO_ROOT, 'docs/qa/attendance-leave-visual-2026-05-05');
const lifecycleDir = path.join(REPO_ROOT, 'docs/qa/hr-lifecycle-visual-2026-05-05');

const attendanceLeaveScenarios = [
  {
    module: 'Attendance',
    persona: 'Employee',
    title: 'Daily attendance self-service and monthly attendance history',
    process: 'Employees need a simple daily check-in/check-out experience and a transparent monthly record of their attendance, late marks, work hours, and exceptions.',
    data: 'Persona: Neha Shah, demo employee. Date range: May 2026. The run also exercised clock-in and clock-out guard behavior so repeat submissions do not corrupt attendance.',
    navigation: ['Log in as demo.employee@aurorahr.in.', 'Open Attendance from the left navigation.', 'Review the Today attendance card, monthly selector, status cards, and attendance table.', 'Use Export when a monthly attendance file is required.'],
    expected: 'The employee should see only their own attendance, current day status, monthly records, and available self-service actions.',
    actual: 'The employee view rendered correctly and the backend clock endpoints behaved safely for repeated execution.',
    resultIds: ['ATT_DAILY_01', 'VIS_ATT_EMP_01'],
    screenshotId: 'VIS_ATT_EMP_01',
  },
  {
    module: 'Attendance',
    persona: 'Employee and Manager',
    title: 'Attendance regularization request and approval',
    process: 'When an employee forgets to punch in/out or works from an alternate location, they should request regularization. The manager or HR should approve or reject with an auditable outcome.',
    data: 'Two regularization requests were created for the demo employee. One was approved by the manager and one was rejected by HR.',
    navigation: ['Employee opens Attendance.', 'Employee opens Request Regularization.', 'Employee enters date, requested check-in/check-out, and reason.', 'Manager opens Attendance > Requests.', 'Manager approves; HR can intervene and reject other pending requests.'],
    expected: 'Pending regularizations should appear in the approver queue and approval should update the attendance record.',
    actual: 'Regularization creation, manager approval, and HR rejection all passed.',
    resultIds: ['ATT_REG_01', 'ATT_REG_02', 'ATT_REG_03', 'ATT_REG_04', 'VIS_ATT_EMP_02', 'VIS_ATT_MGR_02', 'VIS_ATT_HR_04'],
    screenshotId: 'VIS_ATT_MGR_02',
  },
  {
    module: 'Leave',
    persona: 'Employee',
    title: 'Employee leave balance review and leave application',
    process: 'Employees need to understand leave balances before applying and then submit a leave request with dates, type, and reason.',
    data: 'Persona: Neha Shah. The visual run shows casual, sick, and earned leave balances plus pending, approved, and rejected requests.',
    navigation: ['Log in as employee.', 'Open Leave Management.', 'Review balance cards and request history.', 'Click Apply Leave to open the application modal.'],
    expected: 'The employee should see available leave balances and create a request without seeing team or HR-only data.',
    actual: 'Leave balances, request history, and apply leave modal rendered correctly.',
    resultIds: ['LEAVE_DATA_01', 'LEAVE_DATA_02', 'VIS_LEAVE_EMP_01', 'VIS_LEAVE_EMP_02'],
    screenshotId: 'VIS_LEAVE_EMP_01',
  },
  {
    module: 'Leave',
    persona: 'Manager and HR',
    title: 'Manager approval and HR intervention',
    process: 'Managers approve routine leave requests for their team. HR should be able to intervene for exceptions, policy control, or rejected cases.',
    data: 'One employee casual leave was approved by the manager. One sick leave request was rejected by HR to verify intervention controls.',
    navigation: ['Manager opens Leave Management > Team Approvals.', 'Manager reviews pending request and approves.', 'HR opens Leave Management > Team Approvals/all requests.', 'HR rejects another pending request with comments.'],
    expected: 'Approvers should see only actionable team/company requests based on role and record decisions with comments.',
    actual: 'Manager approval and HR rejection both passed and were visible in the role-specific UI.',
    resultIds: ['LEAVE_APPROVAL_01', 'LEAVE_APPROVAL_02', 'VIS_LEAVE_MGR_01', 'VIS_LEAVE_HR_01'],
    screenshotId: 'VIS_LEAVE_MGR_01',
  },
  {
    module: 'Attendance',
    persona: 'HR',
    title: 'Company attendance control, mass update, and sync',
    process: 'HR needs a daily company view for exceptions, and operational tools to correct attendance in bulk or import device/file attendance data.',
    data: 'The run verified HR company attendance and backend bulk update. Later hardening wired mass update and CSV sync to real persistence and removed mock device data.',
    navigation: ['Log in as HR.', 'Open Attendance > Company.', 'Review daily company attendance cards and table.', 'Open Mass Update for bulk corrections.', 'Open Sync for device/file import.'],
    expected: 'HR should see company-wide controls and any correction/import should persist through backend APIs with audit fields.',
    actual: 'The visual controls rendered on the live baseline. Initial QA identified UI-only mass/sync behavior; this branch hardened both workflows. A post-deploy strict re-run is required to visually prove the persisted mass/sync behavior.',
    resultIds: ['ATT_BULK_01', 'VIS_ATT_HR_01', 'VIS_ATT_HR_02', 'VIS_ATT_HR_03'],
    screenshotId: 'VIS_ATT_HR_02',
  },
  {
    module: 'Reports',
    persona: 'HR and Leadership',
    title: 'Attendance and leave reporting',
    process: 'HR and leadership need date-range reporting to understand attendance health, leave usage, department-level patterns, and exceptions.',
    data: 'The test queried attendance statistics, department attendance, and leave statistics for the demo tenant.',
    navigation: ['HR opens Attendance.', 'HR selects Reports after the production hardening update.', 'HR chooses date range and reviews summary cards, department breakdown, leave summary, and CSV export.'],
    expected: 'Reporting APIs and UI should return accurate department and leave metrics without query failures.',
    actual: 'Initial production test exposed a bad department column. This branch fixes the query and adds the Reports tab. The existing leadership screenshots are live-baseline evidence, not post-fix proof of the new Reports tab.',
    resultIds: ['REPORT_DATA_01', 'VIS_ATT_ADMIN_01', 'VIS_LEAVE_ADMIN_01'],
    screenshotId: 'VIS_ATT_ADMIN_01',
  },
];

const lifecycleScenarios = [
  {
    module: 'Onboarding',
    persona: 'HR',
    title: 'Candidate pipeline and offer progression',
    process: 'HR needs to create candidates, move them through offer and acceptance stages, and see the pipeline clearly for recruiting and joining readiness.',
    data: 'Aarav Mehta was created as a QA candidate with expected joining date, offered salary, and offer acceptance activity.',
    navigation: ['Log in as HR.', 'Open Onboarding.', 'Review candidate pipeline cards and table.', 'Create or open a candidate.', 'Send offer and record acceptance.'],
    expected: 'The candidate should appear in the pipeline with current status, salary, expected join date, and detail navigation.',
    actual: 'Candidate creation, offer send/accept API flow, pipeline view, and candidate detail page passed.',
    resultIds: ['ONB_API_01', 'ONB_API_02', 'ONB_API_03', 'VIS_ONB_HR_01', 'VIS_ONB_HR_03'],
    screenshotId: 'VIS_ONB_HR_01',
  },
  {
    module: 'Onboarding / Probation',
    persona: 'HR',
    title: 'Probation tracker and at-risk management',
    process: 'After joining, HR and managers need visibility into probation cases, review progress, due dates, and at-risk employees.',
    data: 'Demo tenant included probation cases with status, progress, and risk indicators. The test retrieved cases and statistics.',
    navigation: ['Log in as HR.', 'Open Onboarding.', 'Switch to Probation Tracker.', 'Review probation counts, at-risk toggle, progress, days left, and case list.'],
    expected: 'HR should see active probation population, review status, at-risk cases, and drill-down paths.',
    actual: 'Probation statistics and tracker UI rendered correctly.',
    resultIds: ['ONB_API_04', 'VIS_ONB_HR_02'],
    screenshotId: 'VIS_ONB_HR_02',
  },
  {
    module: 'Performance',
    persona: 'HR and Manager',
    title: 'Performance review setup, goal creation, and manager approval',
    process: 'Performance management starts with HR creating a review cycle, employees adding goals/KPIs, and managers approving goals before review checkpoints.',
    data: 'A QA review was created for the demo employee with the demo manager as reviewer. A goal and KPI were created and the approval path was exercised.',
    navigation: ['HR opens Performance Management.', 'HR creates or reviews performance cycle.', 'Employee adds goals and KPIs.', 'Manager opens Performance Management and reviews scoped queue.', 'Manager approves goals.'],
    expected: 'Reviews should be visible according to role, goals should move through approval, and managers should only see their review queue.',
    actual: 'HR review retrieval, manager scoped queue, review creation, goal creation, and approval path passed. Manager scoping was hardened in this branch.',
    resultIds: ['PERF_API_01', 'PERF_API_02', 'PERF_API_04', 'VIS_PERF_HR_01', 'VIS_PERF_HR_02', 'VIS_PERF_MGR_01'],
    screenshotId: 'VIS_PERF_HR_01',
  },
  {
    module: 'Performance',
    persona: 'Employee',
    title: 'Employee performance self-service',
    process: 'Employees need to view their own performance reviews and goals without requiring HR/manager privileges or seeing other employees.',
    data: 'Persona: Neha Shah, demo employee. Initial production API lacked the employee-safe route.',
    navigation: ['Log in as employee.', 'Open Performance.', 'Review personal performance dashboard, cycles, and goal/review status.'],
    expected: 'Employee should access only their own review data through a safe self-service endpoint.',
    actual: 'Initial live API returned route not found, and the captured employee screenshot should be treated as baseline defect evidence rather than proof of the fix. This branch adds `/performance/my-reviews` and routes employees to it. Post-deploy visual QA must re-run and assert employee-only performance controls.',
    resultIds: ['PERF_API_03', 'VIS_PERF_EMP_01'],
    screenshotId: 'VIS_PERF_EMP_01',
  },
  {
    module: 'Exit',
    persona: 'Employee',
    title: 'Employee resignation self-service',
    process: 'Employees need a clean path to submit resignation, provide last working date and reason, and track approval/offboarding status.',
    data: 'Persona: Neha Shah. Initial production API lacked an employee-safe exit case route.',
    navigation: ['Log in as employee.', 'Open Exit Management.', 'If no case exists, click Submit Resignation.', 'Enter reason, details, last working date, and notice period.', 'Track status after submission.'],
    expected: 'Employee should not need manager/HR permissions to submit or view their own resignation case.',
    actual: 'Initial live API returned route not found, and the captured employee screenshot does not show Submit Resignation. That screenshot confirms the production gap; it is not proof of the branch fix. This branch adds `/exit/my-case` and employee resignation self-service UI. Post-deploy visual QA must re-run and assert Submit Resignation or My Resignation Status is visible.',
    resultIds: ['EXIT_API_02', 'VIS_EXIT_EMP_01'],
    screenshotId: 'VIS_EXIT_EMP_01',
  },
  {
    module: 'Exit',
    persona: 'Manager and HR',
    title: 'Exit approvals, case management, and leadership view',
    process: 'Managers and HR need to see exit cases, approve/reject resignation requests, manage clearances/assets/interviews/settlements, and track pipeline status.',
    data: 'The demo tenant included exit cases and statistics. HR and manager dashboards were captured, including pending approvals and case detail.',
    navigation: ['Manager opens Exit Management to see approval queue.', 'HR opens Exit Management to see all cases and statistics.', 'HR switches to Pending Approvals.', 'HR opens an exit case detail page for workflow follow-up.'],
    expected: 'Manager and HR should see appropriate case lists and management views with status, dates, and drill-down.',
    actual: 'HR statistics/cases, manager exit view, pending approvals, and case detail rendered correctly.',
    resultIds: ['EXIT_API_01', 'EXIT_API_03', 'VIS_EXIT_HR_01', 'VIS_EXIT_HR_02', 'VIS_EXIT_HR_03', 'VIS_EXIT_MGR_01', 'VIS_EXIT_ADMIN_01'],
    screenshotId: 'VIS_EXIT_HR_01',
  },
];

await renderReport({
  title: 'Attendance and Leave Management Narrative QA Report',
  subtitle: 'A storytelling walkthrough of the Attendance and Leave QA exercise, linking HR use cases, demo data, product navigation, expected behavior, actual evidence, and production hardening.',
  verificationBoundary: 'Important boundary: live baseline screenshots and branch remediation are separated. Branch fixes require a post-deploy strict visual re-run before they are claimed as production-proven.',
  executiveNarrative: 'This document follows the daily employee and HR operating rhythm: employees record attendance and apply for leave, managers approve exceptions, HR intervenes where required, and leadership reviews company-level health. The first QA pass proved the core workflows and surfaced reporting and operational control gaps. Subsequent hardening connected mass updates and sync to backend persistence, added reporting UI, and fixed the department reporting query.',
  reportDir: attendanceLeaveDir,
  resultsPath: path.join(attendanceLeaveDir, 'results.json'),
  htmlPath: path.join(attendanceLeaveDir, 'attendance-leave-narrative-report.html'),
  pdfPath: path.join(attendanceLeaveDir, 'attendance-leave-narrative-report.pdf'),
  scenarios: attendanceLeaveScenarios,
});

await renderReport({
  title: 'HR Lifecycle Narrative QA Report',
  subtitle: 'A storytelling walkthrough of Onboarding, Probation, Performance Management, and Exit testing across HR, manager, employee, and admin personas.',
  verificationBoundary: 'Important boundary: the employee Performance and Exit screenshots were captured from live production before the branch fixes. They prove the production gap; they do not prove the fix until the branch is deployed and strict visual QA is re-run.',
  executiveNarrative: 'This document follows the broader employee lifecycle: hiring and onboarding, probation tracking, performance review cycles, and eventual exit/offboarding. The QA pass validated several HR and manager workflows, but it also revealed missing employee self-service surfaces for Performance and Exit. Those gaps have been repaired in this PR branch with employee-safe APIs and UI paths; production proof requires deployment followed by strict visual re-verification.',
  reportDir: lifecycleDir,
  resultsPath: path.join(lifecycleDir, 'results.json'),
  htmlPath: path.join(lifecycleDir, 'hr-lifecycle-narrative-report.html'),
  pdfPath: path.join(lifecycleDir, 'hr-lifecycle-narrative-report.pdf'),
  scenarios: lifecycleScenarios,
});

console.log('Narrative QA reports generated.');
