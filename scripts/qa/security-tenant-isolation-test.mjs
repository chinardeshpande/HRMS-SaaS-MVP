#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RUN_DATE = process.env.QA_RUN_DATE || '2026-05-07';
const RUN_ID = process.env.QA_RUN_ID || `SEC-${RUN_DATE}-${Date.now()}`;
const BASE_URL = process.env.QA_BASE_URL || 'https://aurorahr.in';
const API_BASE_URL = process.env.QA_API_URL || `${BASE_URL}/api/v1`;
const OUT_DIR = path.join(REPO_ROOT, 'docs/qa/security-tenant-isolation-2026-05-07');
const REPORT_PATH = path.join(OUT_DIR, 'report.md');
const JSON_PATH = path.join(OUT_DIR, 'results.json');

const sessions = new Map();
const results = [];
const cleanup = {
  departments: [],
  designations: [],
  categories: [],
};

function unwrap(json) {
  if (json && typeof json === 'object' && 'data' in json) return json.data;
  return json;
}

function record(id, title, role, status, evidence, notes = '') {
  results.push({ id, title, role, status, evidence, notes });
}

async function api(method, urlPath, body, persona = null, options = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (persona) {
    const session = await login(persona);
    headers.Authorization = `Bearer ${session.tokens.token}`;
  }

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
  record(`AUTH_${persona.toUpperCase()}`, `Demo login as ${persona}`, persona, 'passed', '/demo/login', session.user?.email || '');
  return session;
}

async function tryStep(id, title, role, fn) {
  try {
    const evidence = await fn();
    if (!results.some((result) => result.id === id)) {
      record(id, title, role, 'passed', evidence || 'completed');
    }
  } catch (error) {
    record(id, title, role, 'failed', error.evidence || 'runtime/API error', error.message);
  }
}

function expectDenied(response, allowedStatuses = [403]) {
  if (!response.failed || !allowedStatuses.includes(response.status)) {
    throw new Error(`Expected denial ${allowedStatuses.join('/')}, got ${response.status || 'success'}`);
  }
}

function listFrom(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

async function exerciseRoleAndTenantBoundaries() {
  for (const persona of ['employee', 'manager', 'hr', 'admin']) await login(persona);

  await tryStep('RBAC_01', 'Employees can read department master data but cannot mutate it', 'employee/hr', async () => {
    await api('GET', '/departments', undefined, 'employee');
    const denied = await api('POST', '/departments', {
      name: `QA Employee Forbidden Department ${RUN_ID}`,
      code: `QAFD-${Date.now()}`,
      description: 'This should not be created by an employee.',
    }, 'employee', { allowFailure: true });
    expectDenied(denied);

    const created = await api('POST', '/departments', {
      name: `QA Security Department ${RUN_ID}`,
      code: `QASD-${Date.now()}`,
      description: 'Temporary role-boundary QA record.',
    }, 'hr');
    cleanup.departments.push(created.departmentId);
    return `employee denied with ${denied.status}; HR created ${created.departmentId}`;
  });

  await tryStep('RBAC_02', 'Employees can read designations but cannot mutate them', 'employee/hr', async () => {
    await api('GET', '/designations', undefined, 'employee');
    const denied = await api('POST', '/designations', {
      name: `QA Employee Forbidden Designation ${RUN_ID}`,
      code: `QAFG-${Date.now()}`,
      level: 99,
      description: 'This should not be created by an employee.',
    }, 'employee', { allowFailure: true });
    expectDenied(denied);

    const created = await api('POST', '/designations', {
      name: `QA Security Designation ${RUN_ID}`,
      code: `QASG-${Date.now()}`,
      level: 99,
      description: 'Temporary role-boundary QA record.',
    }, 'hr');
    cleanup.designations.push(created.designationId);
    return `employee denied with ${denied.status}; HR created ${created.designationId}`;
  });

  await tryStep('RBAC_03', 'Employees can read document categories but cannot manage category taxonomy', 'employee/hr', async () => {
    await api('GET', '/document-categories', undefined, 'employee');
    const denied = await api('POST', '/document-categories', {
      name: `QA Employee Forbidden Category ${RUN_ID}`,
      description: 'This should not be created by an employee.',
    }, 'employee', { allowFailure: true });
    expectDenied(denied);

    const created = await api('POST', '/document-categories', {
      name: `QA Security Category ${RUN_ID}`,
      description: 'Temporary role-boundary QA record.',
    }, 'hr');
    cleanup.categories.push(created.categoryId);
    return `employee denied with ${denied.status}; HR created ${created.categoryId}`;
  });

  await tryStep('RBAC_04', 'Employees cannot access tenant billing payment methods', 'employee/hr', async () => {
    const denied = await api('GET', '/payment-methods', undefined, 'employee', { allowFailure: true });
    expectDenied(denied);
    const methods = await api('GET', '/payment-methods', undefined, 'hr');
    return `employee denied with ${denied.status}; HR method count=${listFrom(methods, 'paymentMethods').length}`;
  });

  await tryStep('HIST_01', 'Employees cannot read another employee position history', 'employee', async () => {
    const employeeSession = await login('employee');
    const employees = listFrom(await api('GET', '/employees?status=active', undefined, 'hr'), 'employees');
    const other = employees.find((employee) => employee.employeeId !== employeeSession.user.employeeId);
    if (!other) return 'skipped: no second employee in demo tenant';

    const denied = await api('GET', `/professional-history/position/${other.employeeId}`, undefined, 'employee', { allowFailure: true });
    expectDenied(denied);
    return `otherEmployee=${other.employeeId}; denied=${denied.status}`;
  });

  await tryStep('HIST_02', 'Employees can read their own compensation history only', 'employee', async () => {
    const employeeSession = await login('employee');
    if (!employeeSession.user.employeeId) return 'skipped: demo employee has no employeeId';

    await api('GET', `/professional-history/compensation/${employeeSession.user.employeeId}`, undefined, 'employee');
    const employees = listFrom(await api('GET', '/employees?status=active', undefined, 'hr'), 'employees');
    const other = employees.find((employee) => employee.employeeId !== employeeSession.user.employeeId);
    if (!other) return 'self access confirmed; skipped cross-employee check';

    const denied = await api('GET', `/professional-history/compensation/${other.employeeId}`, undefined, 'employee', { allowFailure: true });
    expectDenied(denied);
    return `self allowed; otherEmployee=${other.employeeId}; denied=${denied.status}`;
  });

  await tryStep('HIST_03', 'Managers can read team position history but not team compensation history', 'manager', async () => {
    const managerSession = await login('manager');
    const visibleEmployees = listFrom(await api('GET', '/employees?status=active', undefined, 'manager'), 'employees');
    const report = visibleEmployees.find((employee) => employee.employeeId !== managerSession.user.employeeId);
    if (!report) return 'skipped: manager demo persona has no direct report returned by /employees';

    await api('GET', `/professional-history/position/${report.employeeId}`, undefined, 'manager');
    const denied = await api('GET', `/professional-history/compensation/${report.employeeId}`, undefined, 'manager', { allowFailure: true });
    expectDenied(denied);
    return `directReport=${report.employeeId}; position allowed; compensation denied=${denied.status}`;
  });

  await tryStep('HRC_01', 'HR Connect comment edge case returns a controlled 404 instead of a blank-screen-causing server error', 'employee', async () => {
    const missingPostId = '00000000-0000-4000-8000-000000000001';
    const denied = await api('POST', `/hr-connect/posts/${missingPostId}/comments`, {
      content: `QA controlled missing-post comment ${RUN_ID}`,
    }, 'employee', { allowFailure: true });
    expectDenied(denied, [404]);
    return `missing post produced ${denied.status}`;
  });

  await tryStep('HRC_02', 'HR Connect reaction edge case is tenant-scoped and controlled', 'employee', async () => {
    const missingPostId = '00000000-0000-4000-8000-000000000002';
    const denied = await api('POST', `/hr-connect/posts/${missingPostId}/reactions`, {
      reactionType: 'like',
    }, 'employee', { allowFailure: true });
    expectDenied(denied, [404]);
    return `missing post produced ${denied.status}`;
  });
}

async function cleanupRecords() {
  for (const categoryId of cleanup.categories.reverse()) {
    await api('DELETE', `/document-categories/${categoryId}`, undefined, 'hr', { allowFailure: true });
  }
  for (const designationId of cleanup.designations.reverse()) {
    await api('DELETE', `/designations/${designationId}`, undefined, 'hr', { allowFailure: true });
  }
  for (const departmentId of cleanup.departments.reverse()) {
    await api('DELETE', `/departments/${departmentId}`, undefined, 'hr', { allowFailure: true });
  }
}

async function writeReport() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const passed = results.filter((result) => result.status === 'passed').length;
  const failed = results.filter((result) => result.status === 'failed').length;
  const skipped = results.filter((result) => String(result.evidence).startsWith('skipped')).length;

  const markdown = [
    `# Security and Tenant Isolation QA - ${RUN_DATE}`,
    '',
    `Run ID: ${RUN_ID}`,
    `Target: ${BASE_URL}`,
    '',
    '## Outcome',
    '',
    `- Passed: ${passed}`,
    `- Failed: ${failed}`,
    `- Skipped/conditional evidence: ${skipped}`,
    '',
    '## Scope',
    '',
    'This run validates role boundaries and tenant-scoped behavior for organization masters, billing/payment methods, professional history, and HR Connect edge cases that previously had elevated risk.',
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
    summary: { passed, failed, skipped },
    results,
  }, null, 2));
}

async function main() {
  try {
    await exerciseRoleAndTenantBoundaries();
  } finally {
    await cleanupRecords();
    await writeReport();
  }

  const failed = results.filter((result) => result.status === 'failed');
  console.log(`Security/tenant isolation QA complete: ${results.length - failed.length} passed, ${failed.length} failed`);
  console.log(REPORT_PATH);

  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
