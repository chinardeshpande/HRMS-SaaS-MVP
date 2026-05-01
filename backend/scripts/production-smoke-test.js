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
  const rows = await dataSource.query('select "tenantId" from users where email = $1', [email.toLowerCase()]);
  const tenantId = rows[0]?.tenantId;
  await dataSource.query('delete from users where email = $1', [email.toLowerCase()]);
  if (tenantId) {
    await syncSubscriptionCurrentUsers(tenantId);
  }
  console.log('CLEANUP deleted temporary smoke user');
}

async function createTemporaryUser(role) {
  const tempEmail = `codex-${role.replace(/_/g, '-')}-${Date.now()}@aurorahr.in`;
  const tenants = await dataSource.query(
    'select "tenantId" from tenants order by "createdAt" limit 1'
  );

  if (!tenants.length) {
    throw new Error('No tenant found for temporary smoke user');
  }

  const tenantId = tenants[0].tenantId;
  const passwordHash = await bcrypt.hash(password, 10);

  await dataSource.query(
    `insert into users (
      "tenantId",
      "email",
      "passwordHash",
      "fullName",
      "role",
      "isActive",
      "createdAt",
      "updatedAt"
    ) values ($1, $2, $3, $4, $5, true, now(), now())`,
    [tenantId, tempEmail.toLowerCase(), passwordHash, `Codex ${role} Smoke Test`, role]
  );

  return { email: tempEmail.toLowerCase(), tenantId };
}

async function deleteTemporaryUser(tempEmail) {
  if (!tempEmail) return;
  const rows = await dataSource.query('select "tenantId" from users where email = $1', [tempEmail.toLowerCase()]);
  const tenantId = rows[0]?.tenantId;
  await dataSource.query('delete from users where email = $1', [tempEmail.toLowerCase()]);
  if (tenantId) {
    await syncSubscriptionCurrentUsers(tenantId);
  }
}

async function syncSubscriptionCurrentUsers(tenantId) {
  const [activeUsers] = await dataSource.query(
    'select count(*)::int as count from users where "tenantId" = $1 and "isActive" = true',
    [tenantId]
  );

  await dataSource.query(
    'update subscriptions set "currentUsers" = $1, "updatedAt" = now() where "tenantId" = $2',
    [activeUsers.count, tenantId]
  );
}

async function authenticate() {
  return authenticateCredentials(email, password);
}

async function authenticateCredentials(loginEmail, loginPassword) {
  const { response, body } = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: loginEmail, password: loginPassword }),
  });
  const token = body?.data?.tokens?.token;

  if (response.status !== 200 || !token) {
    throw new Error(`Login failed: ${response.status} ${JSON.stringify(body).slice(0, 300)}`);
  }

  console.log(`OK ${response.status} /auth/login ${loginEmail}`);
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

async function requestWithStatus(path, options, label, expectedStatus) {
  const result = await request(path, options);
  expectStatus(label, result.response, expectedStatus);
  return result.body?.data;
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

async function runSettingsWorkflow(token) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const authHeaders = { Authorization: `Bearer ${token}` };
  const suffix = Date.now();
  let previousDefaultPaymentMethodId;
  let createdPaymentMethodId;
  let originalSubscription;
  let originalOrganizationCustomFields;

  try {
    originalSubscription = await requestWithStatus(
      '/settings/subscription',
      { headers: authHeaders },
      'get subscription for settings workflow',
      200
    );

    await requestWithStatus(
      '/settings/subscription',
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({ autoRenew: !originalSubscription.autoRenew }),
      },
      'update subscription auto-renew',
      200
    );

    await requestWithStatus(
      '/settings/subscription',
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({ autoRenew: originalSubscription.autoRenew }),
      },
      'restore subscription auto-renew',
      200
    );
    originalSubscription = undefined;

    const organization = await requestWithStatus(
      '/settings/organization',
      { headers: authHeaders },
      'get organization settings for workflow',
      200
    );
    originalOrganizationCustomFields = organization.customFields || {};

    await requestWithStatus(
      '/settings/organization',
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          customFields: {
            ...originalOrganizationCustomFields,
            codexSmokeLastRunAt: new Date().toISOString(),
          },
        }),
      },
      'update organization custom fields',
      200
    );

    await requestWithStatus(
      '/settings/organization',
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({ customFields: originalOrganizationCustomFields }),
      },
      'restore organization custom fields',
      200
    );
    originalOrganizationCustomFields = undefined;

    const previousDefault = await request('/payment-methods/default', { headers: authHeaders });
    if (previousDefault.response.status === 200) {
      previousDefaultPaymentMethodId = previousDefault.body?.data?.paymentMethodId;
    } else if (previousDefault.response.status !== 404) {
      throw new Error(`get default payment method expected 200 or 404, received ${previousDefault.response.status}`);
    }
    console.log(`OK ${previousDefault.response.status} get default payment method before workflow`);

    const createdPaymentMethod = await requestWithStatus(
      '/payment-methods',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: 'credit_card',
          cardLast4: '4242',
          cardBrand: 'visa',
          expiryMonth: '12',
          expiryYear: '2030',
          cardholderName: 'Codex Smoke Test',
          nickname: `Codex Smoke Card ${suffix}`,
          billingCountry: 'India',
          isDefault: false,
        }),
      },
      'create payment method',
      201
    );
    createdPaymentMethodId = createdPaymentMethod.paymentMethodId;

    const defaultPaymentMethod = await requestWithStatus(
      `/payment-methods/${createdPaymentMethodId}/set-default`,
      { method: 'POST', headers: authHeaders },
      'set payment method default',
      200
    );

    if (defaultPaymentMethod.paymentMethodId !== createdPaymentMethodId || !defaultPaymentMethod.isDefault) {
      throw new Error('Created payment method was not marked as default');
    }

    await requestWithStatus(
      `/payment-methods/${createdPaymentMethodId}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({ nickname: `Codex Smoke Card Updated ${suffix}` }),
      },
      'update payment method',
      200
    );

    const paymentMethods = await requestWithStatus(
      '/payment-methods',
      { headers: authHeaders },
      'list payment methods after create',
      200
    );

    if (!paymentMethods.some((method) => method.paymentMethodId === createdPaymentMethodId)) {
      throw new Error('Created payment method was not returned by list endpoint');
    }

    if (previousDefaultPaymentMethodId) {
      await requestWithStatus(
        `/payment-methods/${previousDefaultPaymentMethodId}/set-default`,
        { method: 'POST', headers: authHeaders },
        'restore previous default payment method',
        200
      );
      previousDefaultPaymentMethodId = undefined;
    }

    await requestWithStatus(
      `/payment-methods/${createdPaymentMethodId}`,
      { method: 'DELETE', headers: authHeaders },
      'delete payment method',
      200
    );
    createdPaymentMethodId = undefined;
  } finally {
    if (previousDefaultPaymentMethodId) {
      await request(`/payment-methods/${previousDefaultPaymentMethodId}/set-default`, {
        method: 'POST',
        headers: authHeaders,
      }).catch(() => undefined);
    }

    if (createdPaymentMethodId) {
      await request(`/payment-methods/${createdPaymentMethodId}`, {
        method: 'DELETE',
        headers: authHeaders,
      }).catch(() => undefined);
    }

    if (originalSubscription) {
      await request('/settings/subscription', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ autoRenew: originalSubscription.autoRenew }),
      }).catch(() => undefined);
    }

    if (originalOrganizationCustomFields) {
      await request('/settings/organization', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ customFields: originalOrganizationCustomFields }),
      }).catch(() => undefined);
    }
  }
}

async function runAdminBoundaryWorkflow() {
  let employeeUser;
  let inactiveUser;

  try {
    employeeUser = await createTemporaryUser('employee');
    const employeeToken = await authenticateCredentials(employeeUser.email, password);

    const settingsAsEmployee = await request('/settings/subscription', {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    expectStatus('block employee settings access', settingsAsEmployee.response, 403);

    const onboardingAsEmployee = await request('/onboarding-wizard/progress', {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    expectStatus('block employee onboarding wizard access', onboardingAsEmployee.response, 403);

    const onboardingCandidatesAsEmployee = await request('/onboarding/candidates', {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    expectStatus('block employee onboarding candidate access', onboardingCandidatesAsEmployee.response, 403);

    const probationCasesAsEmployee = await request('/probation/cases', {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    expectStatus('block employee probation cases access', probationCasesAsEmployee.response, 403);

    const exitCasesAsEmployee = await request('/exit/cases', {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    expectStatus('block employee exit cases access', exitCasesAsEmployee.response, 403);

    const attendanceCompanyWideAsEmployee = await request('/attendance/company-wide', {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    expectStatus('block employee attendance company-wide access', attendanceCompanyWideAsEmployee.response, 403);

    const attendanceStatsAsEmployee = await request('/attendance/statistics', {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    expectStatus('block employee attendance statistics access', attendanceStatsAsEmployee.response, 403);

    const leaveAllRequestsAsEmployee = await request('/leave/all-requests', {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    expectStatus('block employee leave all-requests access', leaveAllRequestsAsEmployee.response, 403);

    inactiveUser = await createTemporaryUser('hr_admin');
    const inactiveToken = await authenticateCredentials(inactiveUser.email, password);
    await dataSource.query('update users set "isActive" = false where email = $1', [inactiveUser.email]);

    const inactiveMe = await request('/auth/me', {
      headers: { Authorization: `Bearer ${inactiveToken}` },
    });
    expectStatus('reject inactive user token', inactiveMe.response, 401);
  } finally {
    await deleteTemporaryUser(employeeUser?.email);
    await deleteTemporaryUser(inactiveUser?.email);
  }
}

async function runInvitationLifecycleWorkflow(token) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const suffix = Date.now();
  const invitedEmail = `codex-invite-${suffix}@aurorahr.in`;
  const invitedPassword = crypto.randomBytes(24).toString('base64url');
  let invitationId;
  let invitedToken;
  let invitedEmployeeId;

  try {
    const invitation = await requestWithStatus(
      '/invitations',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: invitedEmail,
          fullName: 'Codex Invited User',
          role: 'employee',
        }),
      },
      'send user invitation',
      201
    );
    invitationId = invitation.invitationId;

    const invitationRows = await dataSource.query(
      'select "invitationToken" from user_invitations where "invitationId" = $1',
      [invitationId]
    );
    const invitationToken = invitationRows[0]?.invitationToken;
    if (!invitationToken) {
      throw new Error('Invitation token was not persisted');
    }

    await requestWithStatus(
      `/invitations/accept/${invitationToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: invitedPassword }),
      },
      'accept user invitation',
      200
    );

    invitedToken = await authenticateCredentials(invitedEmail, invitedPassword);

    const invitedMe = await requestWithStatus(
      '/auth/me',
      { headers: { Authorization: `Bearer ${invitedToken}` } },
      'get invited user profile',
      200
    );
    invitedEmployeeId = invitedMe.employeeId;

    if (!invitedEmployeeId) {
      throw new Error('Accepted invitation did not link the user to an employee');
    }

    const users = await requestWithStatus(
      `/settings/users?status=active`,
      { headers: { Authorization: `Bearer ${token}` } },
      'list users after invitation acceptance',
      200
    );

    if (!users.users.some((user) => user.employeeId === invitedEmployeeId)) {
      throw new Error('Accepted invitation employee was not returned by user management');
    }

    await requestWithStatus(
      `/settings/users/${invitedEmployeeId}/deactivate`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
      'deactivate invited user',
      200
    );

    const blockedAfterDeactivate = await request('/auth/me', {
      headers: { Authorization: `Bearer ${invitedToken}` },
    });
    expectStatus('reject deactivated invited user token', blockedAfterDeactivate.response, 401);
  } finally {
    await dataSource.query('delete from users where email = $1', [invitedEmail]).catch(() => undefined);
    await dataSource.query('delete from employees where email = $1', [invitedEmail]).catch(() => undefined);
    if (invitationId) {
      await dataSource.query('delete from user_invitations where "invitationId" = $1', [invitationId]).catch(() => undefined);
    }
    const tenantRows = await dataSource.query(
      'select "tenantId" from users where email = $1',
      [email.toLowerCase()]
    ).catch(() => []);
    if (tenantRows[0]?.tenantId) {
      await syncSubscriptionCurrentUsers(tenantRows[0].tenantId).catch(() => undefined);
    }
  }
}

async function runSubscriptionEnforcementWorkflow(token) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const tenantRows = await dataSource.query(
    'select "tenantId" from users where email = $1',
    [email.toLowerCase()]
  );
  const tenantId = tenantRows[0]?.tenantId;

  if (!tenantId) {
    throw new Error('Smoke user tenant was not found for subscription enforcement check');
  }

  const [subscription] = await dataSource.query(
    `select
      "subscriptionId",
      status,
      "maxUsers",
      "currentUsers",
      "trialEndDate",
      "updatedAt"
    from subscriptions
    where "tenantId" = $1
    limit 1`,
    [tenantId]
  );

  if (!subscription) {
    throw new Error('Subscription was not found for subscription enforcement check');
  }

  const suffix = Date.now();
  const limitEmail = `codex-limit-${suffix}@aurorahr.in`;
  const suspendedEmail = `codex-suspended-${suffix}@aurorahr.in`;

  try {
    const [activeUsers] = await dataSource.query(
      'select count(*)::int as count from users where "tenantId" = $1 and "isActive" = true',
      [tenantId]
    );

    await dataSource.query(
      `update subscriptions
       set status = 'active', "maxUsers" = $1, "currentUsers" = $1, "updatedAt" = now()
       where "tenantId" = $2`,
      [activeUsers.count, tenantId]
    );

    const limitResult = await request('/invitations', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: limitEmail,
        fullName: 'Codex Limit User',
        role: 'employee',
      }),
    });
    expectStatus('block invitation at subscription user limit', limitResult.response, 403);

    await dataSource.query(
      `update subscriptions
       set status = 'suspended', "maxUsers" = $1, "currentUsers" = $2, "updatedAt" = now()
       where "tenantId" = $3`,
      [activeUsers.count + 10, activeUsers.count, tenantId]
    );

    const suspendedResult = await request('/invitations', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: suspendedEmail,
        fullName: 'Codex Suspended User',
        role: 'employee',
      }),
    });
    expectStatus('block invitation for suspended subscription', suspendedResult.response, 403);
  } finally {
    await dataSource.query(
      `update subscriptions
       set status = $1,
           "maxUsers" = $2,
           "currentUsers" = $3,
           "trialEndDate" = $4,
           "updatedAt" = $5
       where "subscriptionId" = $6`,
      [
        subscription.status,
        subscription.maxUsers,
        subscription.currentUsers,
        subscription.trialEndDate,
        subscription.updatedAt,
        subscription.subscriptionId,
      ]
    ).catch(() => undefined);
    await dataSource.query('delete from user_invitations where email in ($1, $2)', [
      limitEmail,
      suspendedEmail,
    ]).catch(() => undefined);
  }
}

async function runIdentityUniquenessCheck() {
  const duplicates = await dataSource.query(
    'select lower(email) as email from users group by lower(email) having count(*) > 1'
  );

  if (duplicates.length > 0) {
    throw new Error(`Duplicate login emails detected: ${duplicates.length}`);
  }

  console.log('OK 0 duplicate login emails');
}

async function runTenantBaselineCheck() {
  const [settingsBaseline] = await dataSource.query(`
    select
      count(*)::int as tenants,
      coalesce(sum(case when s."tenantId" is null then 1 else 0 end), 0)::int as missing_subscriptions,
      coalesce(sum(case when os."tenantId" is null then 1 else 0 end), 0)::int as missing_org_settings
    from tenants t
    left join subscriptions s on s."tenantId" = t."tenantId"
    left join organization_settings os on os."tenantId" = t."tenantId"
  `);
  const [roleBaseline] = await dataSource.query(`
    select count(*)::int as tenants_missing_roles
    from tenants t
    where not exists (
      select 1 from roles r where r."tenantId" = t."tenantId"
    )
  `);

  if (
    settingsBaseline.missing_subscriptions > 0 ||
    settingsBaseline.missing_org_settings > 0 ||
    roleBaseline.tenants_missing_roles > 0
  ) {
    throw new Error(
      `Tenant baseline incomplete: ${JSON.stringify({ ...settingsBaseline, ...roleBaseline })}`
    );
  }

  console.log(`OK ${settingsBaseline.tenants} tenants have settings and roles baseline`);
}

async function main() {
  await dataSource.initialize();
  await createSmokeUser();

  try {
    const token = await authenticate();
    await runEndpointChecks(token);
    await runDigitalLibraryWorkflow(token);
    await runSettingsWorkflow(token);
    await runAdminBoundaryWorkflow();
    await runInvitationLifecycleWorkflow(token);
    await runSubscriptionEnforcementWorkflow(token);
    await runIdentityUniquenessCheck();
    await runTenantBaselineCheck();
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
