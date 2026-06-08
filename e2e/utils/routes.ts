/**
 * Route helpers for E2E navigation.
 */

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  EMPLOYEES: '/employees',
  EMPLOYEE_DETAIL: (id: string) => `/employees/${id}`,
  ATTENDANCE: '/attendance',
  LEAVE: '/leave',
  DOCUMENTS: '/documents',
  MY_HR_DOCUMENTS: '/my-hr-documents',
  COMPENSATION: '/compensation',
  SETTINGS: '/settings',
  REPORTS: '/reports',
  HR_CONNECT: '/hr-connect',
  CALENDAR: '/calendar',
  ORG_CHART: '/org-chart',
  EDIT_PROFILE: '/edit-profile',
  MASTER_DATA: '/master-data',
} as const;
