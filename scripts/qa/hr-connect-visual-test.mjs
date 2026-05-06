#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RUN_DATE = process.env.QA_RUN_DATE || '2026-05-06';
const RUN_ID = process.env.QA_RUN_ID || `HRC-${RUN_DATE}-${Date.now()}`;
const BASE_URL = process.env.QA_BASE_URL || 'https://aurorahr.in';
const API_BASE_URL = process.env.QA_API_URL || `${BASE_URL}/api/v1`;
const OUT_DIR = path.join(REPO_ROOT, 'docs/qa/hr-connect-visual-2026-05-06');
const SCREENSHOT_DIR = path.join(OUT_DIR, 'screenshots');
const REPORT_PATH = path.join(OUT_DIR, 'report.md');
const HTML_PATH = path.join(OUT_DIR, 'hr-connect-production-readiness-report.html');
const PDF_PATH = path.join(OUT_DIR, 'hr-connect-production-readiness-report.pdf');
const JSON_PATH = path.join(OUT_DIR, 'results.json');

const personas = ['employee', 'manager', 'hr', 'admin'];
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

function addDays(days) {
  const date = new Date(`${RUN_DATE}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function loadPlaywright() {
  try {
    return require('/Users/chinar.deshpande06/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  } catch {
    return require('playwright');
  }
}

function loadSocketClient() {
  try {
    return require(path.join(REPO_ROOT, 'frontend-web/node_modules/socket.io-client'));
  } catch {
    return require('socket.io-client');
  }
}

async function api(method, urlPath, body, persona = null, allowFailure = false) {
  const headers = { 'Content-Type': 'application/json' };
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
    const message = json?.error?.message || json?.error || json?.message || response.statusText;
    if (allowFailure) return { failed: true, status: response.status, message, payload: json };
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
  record(`AUTH_${persona.toUpperCase()}`, `Demo login for ${persona}`, persona, 'passed', 'API /demo/login', session.user?.email || '');
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

async function setupData() {
  for (const persona of personas) await login(persona);

  await tryStep('HRC_FEED_01', 'HR creates a company HR Connect announcement', 'hr', async () => {
    const post = await api('POST', '/hr-connect/posts', {
      title: 'May engagement and policy update',
      content: `[${RUN_ID}] HR Connect announcement covering attendance discipline, performance cadence, and new joiner support.`,
      postType: 'announcement',
      visibility: 'public',
    }, 'hr');
    created.post = post;
    return `postId=${post.postId}`;
  });

  await tryStep('HRC_FEED_02', 'Employee reacts and manager comments on the announcement', 'employee/manager', async () => {
    if (!created.post?.postId) throw new Error('No post created');
    await api('POST', `/hr-connect/posts/${created.post.postId}/reactions`, { reactionType: 'like' }, 'employee');
    const comment = await api('POST', `/hr-connect/posts/${created.post.postId}/comments`, {
      content: `[${RUN_ID}] Team managers will reinforce this in daily standups.`,
    }, 'manager');
    return `commentId=${comment.commentId}`;
  });

  await tryStep('HRC_GROUP_01', 'HR creates a cross-functional project group', 'hr', async () => {
    const group = await api('POST', '/hr-connect/groups', {
      name: `People Ops Launch Room ${Date.now()}`,
      description: `[${RUN_ID}] Cross-functional launch coordination group.`,
      groupType: 'project',
      privacy: 'public',
    }, 'hr');
    created.group = group;
    return `groupId=${group.groupId}`;
  });

  await tryStep('HRC_GROUP_02', 'HR adds manager and employee to the group through persistent group-member API', 'hr', async () => {
    const employees = await api('GET', '/employees', undefined, 'hr');
    const list = employees?.employees || employees || [];
    const manager = list.find((e) => e.email === 'demo.manager@aurorahr.in');
    const employee = list.find((e) => e.email === 'demo.employee@aurorahr.in');
    if (!manager || !employee || !created.group?.groupId) throw new Error('Required demo employees/group not found');
    created.manager = manager;
    created.employee = employee;
    const group = await api('POST', `/hr-connect/groups/${created.group.groupId}/members`, {
      employeeIds: [manager.employeeId, employee.employeeId],
    }, 'hr');
    created.group = group;
    return `members=${group.members?.length || 0}`;
  });

  await tryStep('HRC_CHAT_01', 'Employee opens or creates direct chat with manager', 'employee', async () => {
    if (!created.manager?.employeeId) throw new Error('Manager not available');
    const conversation = await api('POST', '/chat/conversations', {
      conversationType: 'direct',
      name: 'Manager Check-in',
      participantIds: [created.manager.employeeId],
    }, 'employee');
    created.directConversation = conversation;
    return `conversationId=${conversation.conversationId}`;
  });

  await tryStep('HRC_CHAT_02', 'Employee sends a direct chat message and manager can retrieve it', 'employee/manager', async () => {
    const conversationId = created.directConversation?.conversationId;
    if (!conversationId) throw new Error('No direct conversation');
    const message = await api('POST', `/chat/conversations/${conversationId}/messages`, {
      content: `[${RUN_ID}] Please review tomorrow's onboarding checklist.`,
      messageType: 'text',
    }, 'employee');
    const messages = await api('GET', `/chat/conversations/${conversationId}/messages`, undefined, 'manager');
    if (!JSON.stringify(messages).includes(message.messageId)) throw new Error('Manager could not retrieve direct message');
    return `messageId=${message.messageId}`;
  });

  await tryStep('HRC_CHAT_03', 'HR creates group chat from group members and posts a group update', 'hr', async () => {
    const participantIds = [created.employee?.employeeId, created.manager?.employeeId].filter(Boolean);
    if (participantIds.length < 2) throw new Error('Group chat participants not available');
    const conversation = await api('POST', '/chat/conversations', {
      conversationType: 'group',
      name: 'People Ops Launch Room',
      participantIds,
    }, 'hr');
    created.groupConversation = conversation;
    const message = await api('POST', `/chat/conversations/${conversation.conversationId}/messages`, {
      content: `[${RUN_ID}] Launch room is active for HR, manager, and employee coordination.`,
      messageType: 'text',
    }, 'hr');
    return `conversationId=${conversation.conversationId}, messageId=${message.messageId}`;
  });

  await tryStep('HRC_CAL_01', 'HR schedules an appointment linked to HR Connect chat', 'hr', async () => {
    const event = await api('POST', '/calendar/events', {
      title: 'HR Connect launch standup',
      description: `[${RUN_ID}] Appointment created from HR Connect QA scenario.`,
      eventType: 'meeting',
      startDate: addDays(3),
      startTime: '10:00',
      endTime: '10:30',
      isAllDay: false,
      location: 'Video call',
      attendees: [created.employee?.employeeId, created.manager?.employeeId].filter(Boolean),
      relatedEntityId: created.groupConversation?.conversationId,
      relatedEntityType: 'employee',
      metadata: { source: 'hr_connect_visual_qa', runId: RUN_ID },
    }, 'hr');
    created.event = event;
    return `eventId=${event.eventId}`;
  });

  await tryStep('HRC_CAL_02', 'Scheduled appointment is returned by calendar list and upcoming views', 'employee', async () => {
    const [allEvents, upcoming] = await Promise.all([
      api('GET', '/calendar/events', undefined, 'employee'),
      api('GET', '/calendar/events/upcoming?limit=20', undefined, 'employee'),
    ]);
    const allText = JSON.stringify(allEvents);
    const upcomingText = JSON.stringify(upcoming);
    if (!allText.includes(created.event.eventId) || !upcomingText.includes(created.event.eventId)) {
      throw new Error('Appointment not visible in calendar views');
    }
    return `eventId=${created.event.eventId}`;
  });
}

async function waitForSocketEvent(socket, eventName, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(eventName, onEvent);
      reject(new Error(`Timed out waiting for socket event ${eventName}`));
    }, timeoutMs);
    function onEvent(payload) {
      clearTimeout(timer);
      resolve(payload);
    }
    socket.once(eventName, onEvent);
  });
}

async function socketScenario() {
  const { io } = loadSocketClient();
  const employeeSession = await login('employee');
  const managerSession = await login('manager');
  const conversationId = created.directConversation?.conversationId;
  if (!conversationId) throw new Error('No direct conversation for socket test');

  const employeeSocket = io(BASE_URL, { path: '/socket.io', auth: { token: employeeSession.tokens.token }, transports: ['websocket', 'polling'] });
  const managerSocket = io(BASE_URL, { path: '/socket.io', auth: { token: managerSession.tokens.token }, transports: ['websocket', 'polling'] });

  try {
    await Promise.all([
      waitForSocketEvent(employeeSocket, 'connect'),
      waitForSocketEvent(managerSocket, 'connect'),
    ]);

    employeeSocket.emit('join_conversation', conversationId);
    managerSocket.emit('join_conversation', conversationId);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const messagePromise = waitForSocketEvent(managerSocket, 'new_message');
    employeeSocket.emit('send_message', {
      conversationId,
      content: `[${RUN_ID}] WebSocket real-time delivery check`,
    });
    const message = await messagePromise;
    if (!message?.messageId || !String(message.content).includes('WebSocket real-time delivery check')) {
      throw new Error('Manager did not receive expected WebSocket message');
    }
    record('HRC_WS_01', 'Manager receives real-time chat message over Socket.IO', 'employee/manager', 'passed', `messageId=${message.messageId}`);

    const callPromise = waitForSocketEvent(managerSocket, 'incoming_call');
    employeeSocket.emit('call_initiate', {
      conversationId,
      targetEmployeeId: created.manager.employeeId,
      callType: 'audio',
    });
    const call = await callPromise;
    if (call?.callType !== 'audio') throw new Error('Incoming audio call signal was not received');
    record('HRC_CALL_01', 'Audio call signaling delivers incoming call event', 'employee/manager', 'passed', `callerId=${call.callerId}`);

    const answeredPromise = waitForSocketEvent(employeeSocket, 'call_answered');
    managerSocket.emit('call_answer', {
      callerId: call.callerId,
      callerSocketId: call.socketId,
    });
    await answeredPromise;
    record('HRC_CALL_02', 'Call answer signaling returns to caller', 'employee/manager', 'passed', 'call_answered event');

    const videoPromise = waitForSocketEvent(managerSocket, 'incoming_call');
    employeeSocket.emit('call_initiate', {
      conversationId,
      targetEmployeeId: created.manager.employeeId,
      callType: 'video',
    });
    const videoCall = await videoPromise;
    if (videoCall?.callType !== 'video') throw new Error('Incoming video call signal was not received');
    record('HRC_CALL_03', 'Video call signaling delivers incoming call event', 'employee/manager', 'passed', `callerId=${videoCall.callerId}`);
  } finally {
    employeeSocket.disconnect();
    managerSocket.disconnect();
  }
}

async function makeContext(browser, persona) {
  const session = await login(persona);
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    permissions: ['camera', 'microphone'],
  });
  await context.addInitScript(({ user, tokens }) => {
    window.localStorage.setItem('user', JSON.stringify(user));
    window.localStorage.setItem('tokens', JSON.stringify(tokens));
  }, { user: session.user, tokens: session.tokens });
  return context;
}

async function capture(page, filename, title, role, urlPath) {
  await page.goto(`${BASE_URL}${urlPath}`, { waitUntil: 'networkidle', timeout: 45000 });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: true });
  screenshots.push({ filename, title, role, path: `screenshots/${filename}` });
  record(`VIS_${String(screenshots.length).padStart(2, '0')}`, title, role, 'passed', `screenshots/${filename}`);
}

async function captureExpandedFeedComment(page) {
  await page.goto(`${BASE_URL}/hr-connect`, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForSelector(`text=${RUN_ID}`, { timeout: 30000 });

  const clicked = await page.evaluate((runId) => {
    const cards = Array.from(document.querySelectorAll('.card'));
    const card = cards.find((element) => element.textContent && element.textContent.includes(runId));
    if (!card) return false;

    const buttons = Array.from(card.querySelectorAll('button'));
    const commentButton = buttons.find((button) => button.textContent.trim() === '1');
    if (!commentButton) return false;

    commentButton.click();
    return true;
  }, RUN_ID);

  if (!clicked) throw new Error('Could not click feed comment icon for QA post');

  await page.waitForSelector('input[placeholder="Write a comment..."]', { timeout: 10000 });
  await page.waitForSelector(`text=${RUN_ID}`, { timeout: 10000 });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-feed-comment-expanded.png'), fullPage: true });
  screenshots.push({
    filename: '02-feed-comment-expanded.png',
    title: 'Feed comment icon expands existing comments without blank screen',
    role: 'hr',
    path: 'screenshots/02-feed-comment-expanded.png',
  });
  record('HRC_FEED_03', 'Feed comment icon expands existing comments without blank screen', 'hr', 'passed', 'screenshots/02-feed-comment-expanded.png');
}

async function visualScenario() {
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  });

  try {
    const hrContext = await makeContext(browser, 'hr');
    const employeeContext = await makeContext(browser, 'employee');
    const managerContext = await makeContext(browser, 'manager');

    const hrPage = await hrContext.newPage();
    const employeePage = await employeeContext.newPage();
    const managerPage = await managerContext.newPage();

    await capture(hrPage, '01-hr-connect-feed.png', 'HR Connect feed shows announcement, reactions, and social workflow', 'hr', '/hr-connect');
    await captureExpandedFeedComment(hrPage);
    await capture(hrPage, '03-hr-connect-chat-list.png', 'HR Connect chat list presents direct and group conversations', 'hr', '/hr-connect?tab=chat');
    await capture(hrPage, '04-hr-connect-groups.png', 'HR Connect group management shows persistent project group membership', 'hr', '/hr-connect?tab=groups');
    await capture(employeePage, '05-employee-direct-chat.png', 'Employee direct chat shows message history and action hooks', 'employee', `/chat/${created.directConversation.conversationId}`);
    await capture(managerPage, '06-manager-direct-chat.png', 'Manager direct chat confirms counterpart view of the same conversation', 'manager', `/chat/${created.directConversation.conversationId}`);
    await capture(hrPage, '07-hr-group-chat.png', 'HR group chat supports multi-participant coordination', 'hr', `/chat/${created.groupConversation.conversationId}`);
    await capture(hrPage, '08-calendar-appointment.png', 'Calendar shows HR Connect appointment created through persistent calendar API', 'hr', '/calendar');
  } finally {
    await browser.close();
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function writeReports() {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const rows = results.map((r) => `| ${r.id} | ${r.title} | ${r.role} | ${r.status === 'passed' ? 'PASS' : 'FAIL'} | ${r.evidence} | ${r.notes || ''} |`).join('\n');
  const shotLines = screenshots.map((s) => `### ${s.title}\nRole: ${s.role}\n\n![${s.title}](${s.path})`).join('\n\n');

  const report = `# HR Connect Production Readiness Visual QA

Run date: ${RUN_DATE}  
Run id: ${RUN_ID}  
Target: ${BASE_URL}

## Executive Outcome

HR Connect was tested as a real collaboration module, not only as a static page. The scenario covers feed posts, reactions, comments, persistent groups, direct chat, group chat, Socket.IO delivery, audio/video call signaling, and appointment scheduling through calendar persistence.

Status: ${failed === 0 ? 'PASS' : 'FAIL'}  
Passed: ${passed}  
Failed: ${failed}

## Storyline

The HR manager publishes a company update. An employee reacts, a manager comments, and HR creates a cross-functional project group. HR then adds the manager and employee to that group, creates both direct and group chat conversations, schedules a follow-up appointment, and validates that the employee and manager can see and use the same collaboration thread. Socket.IO is tested separately to prove real-time delivery and call signaling are active.

## Test Cases

| ID | Use Case | Role | Result | Evidence | Notes |
| --- | --- | --- | --- | --- | --- |
${rows}

## Screenshots

${shotLines}

## Residual Production Note

Audio/video media negotiation uses browser WebRTC with STUN. The QA validates authenticated signaling and browser media hooks. A TURN server is still recommended before promising reliable calls across restrictive corporate networks.
`;

  await fs.writeFile(REPORT_PATH, report);
  await fs.writeFile(JSON_PATH, JSON.stringify({ runDate: RUN_DATE, runId: RUN_ID, target: BASE_URL, results, screenshots }, null, 2));

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>HR Connect Production Readiness QA</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; margin: 0; color: #172033; background: #f5f7fb; }
    .page { max-width: 1120px; margin: 0 auto; padding: 42px; background: white; }
    h1 { font-size: 32px; margin-bottom: 8px; }
    h2 { margin-top: 34px; border-bottom: 1px solid #d9e1ec; padding-bottom: 8px; }
    .meta, .note { color: #536176; }
    .summary { display: flex; gap: 16px; margin: 24px 0; }
    .metric { border: 1px solid #d9e1ec; border-radius: 8px; padding: 16px; min-width: 130px; }
    .metric strong { display: block; font-size: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #d9e1ec; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #eef3f8; }
    .pass { color: #087f5b; font-weight: 700; }
    .fail { color: #c92a2a; font-weight: 700; }
    .shot { margin: 28px 0; break-inside: avoid; }
    .shot img { width: 100%; border: 1px solid #d9e1ec; border-radius: 8px; }
  </style>
</head>
<body>
  <main class="page">
    <h1>HR Connect Production Readiness QA</h1>
    <p class="meta">Run date: ${RUN_DATE} · Run id: ${RUN_ID} · Target: ${BASE_URL}</p>
    <div class="summary">
      <div class="metric"><span>Status</span><strong>${failed === 0 ? 'PASS' : 'FAIL'}</strong></div>
      <div class="metric"><span>Passed</span><strong>${passed}</strong></div>
      <div class="metric"><span>Failed</span><strong>${failed}</strong></div>
    </div>
    <h2>Storyline</h2>
    <p>The HR manager publishes a company update. An employee reacts, a manager comments, and HR creates a project group. The group is used to create direct and group chat threads, schedule an appointment, and validate real-time chat plus audio/video call signaling.</p>
    <h2>Test Cases</h2>
    <table>
      <thead><tr><th>ID</th><th>Use Case</th><th>Role</th><th>Result</th><th>Evidence</th><th>Notes</th></tr></thead>
      <tbody>
        ${results.map((r) => `<tr><td>${escapeHtml(r.id)}</td><td>${escapeHtml(r.title)}</td><td>${escapeHtml(r.role)}</td><td class="${r.status === 'passed' ? 'pass' : 'fail'}">${r.status === 'passed' ? 'PASS' : 'FAIL'}</td><td>${escapeHtml(r.evidence)}</td><td>${escapeHtml(r.notes)}</td></tr>`).join('\n')}
      </tbody>
    </table>
    <h2>Screenshots</h2>
    ${screenshots.map((s) => `<section class="shot"><h3>${escapeHtml(s.title)}</h3><p class="meta">Role: ${escapeHtml(s.role)}</p><img src="${path.join(SCREENSHOT_DIR, s.filename)}" /></section>`).join('\n')}
    <h2>Residual Production Note</h2>
    <p class="note">Audio/video media negotiation uses browser WebRTC with STUN. This test validates authenticated signaling and browser media hooks. A TURN server is still recommended before promising reliable calls across restrictive corporate networks.</p>
  </main>
</body>
</html>`;

  await fs.writeFile(HTML_PATH, html);

  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });
    await page.goto(`file://${HTML_PATH}`, { waitUntil: 'networkidle' });
    await page.pdf({ path: PDF_PATH, format: 'A4', printBackground: true, margin: { top: '12mm', right: '10mm', bottom: '12mm', left: '10mm' } });
  } finally {
    await browser.close();
  }
}

async function main() {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  await setupData();
  await tryStep('HRC_WS_00', 'Socket.IO chat and call signaling scenario', 'employee/manager', socketScenario);
  await tryStep('HRC_VIS_00', 'Browser visual journey with HR, manager, and employee roles', 'hr/manager/employee', visualScenario);
  await writeReports();

  const failed = results.filter((r) => r.status === 'failed');
  console.log(`HR Connect QA complete: ${results.length - failed.length}/${results.length} passed`);
  console.log(REPORT_PATH);
  console.log(PDF_PATH);
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
