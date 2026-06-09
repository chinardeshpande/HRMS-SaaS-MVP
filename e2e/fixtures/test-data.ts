/**
 * Expected seed data constants for E2E assertions.
 * Must match backend/tests/setup/seedTestData.ts values.
 */

export const ACV_TENANT = {
  name: 'ACV Solutions Pvt Ltd',
  subdomain: 'acv-qa',
};

export const ORBIT_TENANT = {
  name: 'Orbit QA Isolation Ltd',
  subdomain: 'orbit-qa',
};

export const SEED_EMPLOYEES = {
  OWNER: { code: 'QA/ACV/0001', firstName: 'Chinar', lastName: 'Owner' },
  HR_ADMIN: { code: 'QA/ACV/0002', firstName: 'Anupama', lastName: 'Bhat' },
  MANAGER: { code: 'QA/ACV/0003', firstName: 'Aniket', lastName: 'Manager' },
  EMPLOYEE: { code: 'QA/ACV/0004', firstName: 'Surekha', lastName: 'Employee' },
};

export const SEED_DEPARTMENTS = ['Management', 'HR Operations', 'Technology'];

export const SEED_PAYSLIP = {
  month: 5,
  year: 2026,
  netPay: 52000,
  grossEarnings: 60000,
};

/** Routes that require specific roles */
export const ADMIN_ONLY_ROUTES = [
  '/settings',
  '/compensation',
  '/reports',
  '/master-data',
  '/departments',
  '/designations',
  '/transfer',
  '/promote',
];

export const MANAGER_PLUS_ROUTES = [
  '/employees',
  '/documents',
  '/performance',
  '/probation',
  '/exit',
];

export const ALL_USER_ROUTES = [
  '/dashboard',
  '/attendance',
  '/leave',
  '/hr-connect',
  '/calendar',
  '/org-chart',
  '/edit-profile',
  '/my-hr-documents',
];
