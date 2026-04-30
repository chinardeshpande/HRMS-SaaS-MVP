const crypto = require('crypto');
const bcrypt = require('bcrypt');
const dataSource = require('../dist/backend/src/data-source.js').default;

const baseUrl = process.env.SMOKE_TEST_BASE_URL || 'http://localhost:3000/api/v1';
const email = `codex-smoke-${Date.now()}@aurorahr.in`;
const password = crypto.randomBytes(24).toString('base64url');

const endpoints = [
  { path: '/auth/me', accept: [200] },
  { path: '/dashboard/stats', accept: [200] },
  { path: '/activities/recent', accept: [200] },
  { path: '/settings/subscription', accept: [200, 404] },
  { path: '/settings/organization', accept: [200, 404] },
  { path: '/settings/payments', accept: [200] },
  { path: '/payment-methods', accept: [200] },
  { path: '/digital-library', accept: [200] },
  { path: '/digital-library/stats', accept: [200] },
  { path: '/document-categories', accept: [200] },
];

async function readBody(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function createSmokeUser() {
  const tenants = await dataSource.query(
    'select "tenantId" from tenants order by "createdAt" limit 1'
  );

  if (!tenants.length) {
    throw new Error('No tenant found for production smoke test');
  }

  const tenantId = tenants[0].tenantId;
  const employees = await dataSource.query(
    'select "employeeId" from employees where "tenantId" = $1 order by "createdAt" limit 1',
    [tenantId]
  );
  const employeeId = employees[0]?.employeeId || null;
  const passwordHash = await bcrypt.hash(password, 10);

  await dataSource.query(
    `insert into users (
      "tenantId",
      "email",
      "passwordHash",
      "fullName",
      "role",
      "employeeId",
      "isActive",
      "createdAt",
      "updatedAt"
    ) values ($1, $2, $3, $4, $5, $6, true, now(), now())`,
    [tenantId, email.toLowerCase(), passwordHash, 'Codex Smoke Test', 'hr_admin', employeeId]
  );
}

async function deleteSmokeUser() {
  await dataSource.query('delete from users where email = $1', [email.toLowerCase()]);
  console.log('CLEANUP deleted temporary smoke user');
}

async function authenticate() {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await readBody(response);
  const token = body?.data?.tokens?.token;

  if (response.status !== 200 || !token) {
    throw new Error(`Login failed: ${response.status} ${JSON.stringify(body).slice(0, 300)}`);
  }

  console.log(`OK ${response.status} /auth/login`);
  return token;
}

async function runEndpointChecks(token) {
  let failed = false;

  for (const endpoint of endpoints) {
    const response = await fetch(`${baseUrl}${endpoint.path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await readBody(response);
    const ok = endpoint.accept.includes(response.status);

    console.log(`${ok ? 'OK' : 'FAIL'} ${response.status} ${endpoint.path}`);

    if (!ok || response.status >= 500) {
      failed = true;
      console.log(JSON.stringify(body).slice(0, 500));
    }
  }

  if (failed) {
    throw new Error('One or more authenticated smoke checks failed');
  }
}

async function main() {
  await dataSource.initialize();
  await createSmokeUser();

  try {
    const token = await authenticate();
    await runEndpointChecks(token);
  } finally {
    await deleteSmokeUser();
  }
}

main()
  .catch((error) => {
    console.error('SMOKE_ERROR', error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });
