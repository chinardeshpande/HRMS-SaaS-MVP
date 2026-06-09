/**
 * Test account matrix — mirrors backend/tests/setup/seedTestData.ts
 *
 * These accounts are created by the backend globalSetup seed against
 * the dedicated test database (hrms_saas_test).
 *
 * IMPORTANT: If the frontend dev server connects to the dev DB (hrms_saas),
 * these synthetic accounts will NOT exist. You must either:
 *   1. Point the frontend proxy at a backend running against hrms_saas_test, or
 *   2. Seed these accounts into the dev DB with a separate script.
 */

export const TEST_PASSWORD = 'ACV@2026!';

export const USERS = {
  SYSTEM_ADMIN: {
    email: 'system.admin@acv.test',
    password: TEST_PASSWORD,
    role: 'system_admin',
    label: 'System Admin (ACV Tenant Owner)',
    tenant: 'ACV Solutions Pvt Ltd',
  },
  HR_ADMIN: {
    email: 'hr.admin@acv.test',
    password: TEST_PASSWORD,
    role: 'hr_admin',
    label: 'HR Admin',
    tenant: 'ACV Solutions Pvt Ltd',
  },
  MANAGER: {
    email: 'manager@acv.test',
    password: TEST_PASSWORD,
    role: 'manager',
    label: 'Manager',
    tenant: 'ACV Solutions Pvt Ltd',
  },
  EMPLOYEE: {
    email: 'employee@acv.test',
    password: TEST_PASSWORD,
    role: 'employee',
    label: 'Employee',
    tenant: 'ACV Solutions Pvt Ltd',
  },
  SECOND_TENANT_ADMIN: {
    email: 'admin@orbit.test',
    password: TEST_PASSWORD,
    role: 'system_admin',
    label: 'Second Tenant Admin',
    tenant: 'Orbit QA Isolation Ltd',
  },
  SECOND_TENANT_EMPLOYEE: {
    email: 'employee@orbit.test',
    password: TEST_PASSWORD,
    role: 'employee',
    label: 'Second Tenant Employee',
    tenant: 'Orbit QA Isolation Ltd',
  },
} as const;

export type UserKey = keyof typeof USERS;
