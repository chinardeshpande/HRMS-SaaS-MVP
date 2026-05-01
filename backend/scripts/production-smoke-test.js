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
  { path: '/settings/subscription', accept: [200] },
  { path: '/settings/organization', accept: [200] },
  { path: '/settings/payments', accept: [200] },
  { path: '/payment-methods', accept: [200] },
  { path: '/digital-library', accept: [200] },
  { path: '/digital-library/stats', accept: [200] },
  { path: '/document-categories', accept: [200] },
];

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const parsedBody = await readBody(response);

  return { response, body: parsedBody };
}

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
  const { response, body } = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
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
    const { response, body } = await request(endpoint.path, {
      headers: { Authorization: `Bearer ${token}` },
    });
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

function expectStatus(label, response, expectedStatus) {
  if (response.status !== expectedStatus) {
    throw new Error(`${label} expected ${expectedStatus}, received ${response.status}`);
  }

  console.log(`OK ${response.status} ${label}`);
}

async function runDigitalLibraryWorkflow(token) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const suffix = Date.now();
  const categoryName = `Codex Smoke ${suffix}`;
  let categoryId;
  let libraryId;

  try {
    const createCategory = await request('/document-categories', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: `  ${categoryName}  `,
        description: 'Created by production smoke test',
      }),
    });
    expectStatus('create document category', createCategory.response, 201);
    categoryId = createCategory.body?.data?.categoryId;

    const saveLibraryItem = await request('/digital-library/save', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fileName: `codex-smoke-${suffix}.pdf`,
        fileUrl: `/uploads/smoke/codex-smoke-${suffix}.pdf`,
        fileType: 'application/pdf',
        fileSize: 1024,
        sourceType: 'smoke-test',
        sourceId: crypto.randomUUID(),
        category: categoryName,
        tags: ['smoke', 'digital-library'],
        description: 'Temporary Digital Library workflow smoke item',
      }),
    });
    expectStatus('save digital library item', saveLibraryItem.response, 201);
    libraryId = saveLibraryItem.body?.data?.libraryId;

    const listByCategory = await request(
      `/digital-library?category=${encodeURIComponent(categoryName)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expectStatus('list digital library items by category', listByCategory.response, 200);
    const categoryItems = listByCategory.body?.data?.items || [];
    if (!categoryItems.some((item) => item.libraryId === libraryId)) {
      throw new Error('Saved Digital Library item was not returned by category filter');
    }

    const listBySearch = await request(
      `/digital-library?searchTerm=${encodeURIComponent(`codex-smoke-${suffix}`)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expectStatus('search digital library items', listBySearch.response, 200);
    const searchItems = listBySearch.body?.data?.items || [];
    if (!searchItems.some((item) => item.libraryId === libraryId)) {
      throw new Error('Saved Digital Library item was not returned by search filter');
    }

    const updateLibraryItem = await request(`/digital-library/${libraryId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        description: 'Updated by production smoke test',
        tags: ['smoke', 'updated'],
      }),
    });
    expectStatus('update digital library item', updateLibraryItem.response, 200);

    const downloadLibraryItem = await request(`/digital-library/${libraryId}/download`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    expectStatus('download digital library item', downloadLibraryItem.response, 200);
    if (downloadLibraryItem.body?.data?.fileUrl !== `/uploads/smoke/codex-smoke-${suffix}.pdf`) {
      throw new Error('Downloaded Digital Library file URL did not match saved URL');
    }

    const deleteLibraryItem = await request(`/digital-library/${libraryId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    expectStatus('delete digital library item', deleteLibraryItem.response, 200);
    libraryId = undefined;

    const deleteCategory = await request(`/document-categories/${categoryId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    expectStatus('delete document category', deleteCategory.response, 200);
    categoryId = undefined;
  } finally {
    if (libraryId) {
      await request(`/digital-library/${libraryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }

    if (categoryId) {
      await request(`/document-categories/${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }
  }
}

async function main() {
  await dataSource.initialize();
  await createSmokeUser();

  try {
    const token = await authenticate();
    await runEndpointChecks(token);
    await runDigitalLibraryWorkflow(token);
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
