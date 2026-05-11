# Role Access Matrix QA - 2026-05-11

Run ID: ROLE-ACCESS-2026-05-11-1778511569895
Target: https://aurorahr.in
API: https://aurorahr.in/api/v1

## Outcome

- Passed: 23
- Failed: 0

## Scope

This run verifies the central route/nav access contract and the tightened ticket authentication boundary across employee, manager, HR, and system-admin-equivalent demo sessions.

## Results

| ID | Scenario | Persona | Status | Evidence | Notes |
| --- | --- | --- | --- | --- | --- |
| ALLOW_ADMIN_DASHBOARD | admin can access /dashboard | admin | passed | docs/qa/role-dashboard-personas-production-2026-05-11/screenshots/admin-dashboard.png |  |
| ALLOW_EMPLOYEE_DASHBOARD | employee can access /dashboard | employee | passed | docs/qa/role-dashboard-personas-production-2026-05-11/screenshots/employee-dashboard.png |  |
| ALLOW_EMPLOYEE_ATTENDANCE | employee can access /attendance | employee | passed | docs/qa/role-dashboard-personas-production-2026-05-11/screenshots/employee-attendance.png |  |
| ALLOW_EMPLOYEE_LEAVE | employee can access /leave | employee | passed | docs/qa/role-dashboard-personas-production-2026-05-11/screenshots/employee-leave.png |  |
| ALLOW_EMPLOYEE_MY_DOCUMENTS | employee can access /my-hr-documents | employee | passed | docs/qa/role-dashboard-personas-production-2026-05-11/screenshots/employee-my_documents.png |  |
| DENY_EMPLOYEE_SETTINGS | employee is denied /settings | employee | passed | docs/qa/role-dashboard-personas-production-2026-05-11/screenshots/employee-denied-settings.png |  |
| DENY_EMPLOYEE_EMPLOYEES | employee is denied /employees | employee | passed | docs/qa/role-dashboard-personas-production-2026-05-11/screenshots/employee-denied-employees.png |  |
| NAV_EMPLOYEE_EXCLUDES | employee navigation excludes restricted modules | employee | passed | Settings, Employees, Reports, Onboarding, Master Data |  |
| ALLOW_MANAGER_DASHBOARD | manager can access /dashboard | manager | passed | docs/qa/role-dashboard-personas-production-2026-05-11/screenshots/manager-dashboard.png |  |
| ALLOW_MANAGER_EMPLOYEES | manager can access /employees | manager | passed | docs/qa/role-dashboard-personas-production-2026-05-11/screenshots/manager-employees.png |  |
| ALLOW_MANAGER_PERFORMANCE | manager can access /performance | manager | passed | docs/qa/role-dashboard-personas-production-2026-05-11/screenshots/manager-performance.png |  |
| ALLOW_MANAGER_EXIT | manager can access /exit | manager | passed | docs/qa/role-dashboard-personas-production-2026-05-11/screenshots/manager-exit.png |  |
| DENY_MANAGER_SETTINGS | manager is denied /settings | manager | passed | docs/qa/role-dashboard-personas-production-2026-05-11/screenshots/manager-denied-settings.png |  |
| NAV_MANAGER_EXCLUDES | manager navigation excludes restricted modules | manager | passed | Settings, Reports, Onboarding, Master Data |  |
| ALLOW_HR_DASHBOARD | hr can access /dashboard | hr | passed | docs/qa/role-dashboard-personas-production-2026-05-11/screenshots/hr-dashboard.png |  |
| ALLOW_HR_SETTINGS | hr can access /settings | hr | passed | docs/qa/role-dashboard-personas-production-2026-05-11/screenshots/hr-settings.png |  |
| ALLOW_HR_REPORTS | hr can access /reports | hr | passed | docs/qa/role-dashboard-personas-production-2026-05-11/screenshots/hr-reports.png |  |
| ALLOW_HR_ONBOARDING | hr can access /onboarding | hr | passed | docs/qa/role-dashboard-personas-production-2026-05-11/screenshots/hr-onboarding.png |  |
| API_TICKETS_UNAUTH_DENIED | Unauthenticated ticket list is denied | public | passed | status=401 |  |
| API_TICKETS_EMPLOYEE_ALL_DENIED | Employee cannot list all tenant tickets | employee | passed | status=403 |  |
| API_TICKETS_EMPLOYEE_MY_ALLOWED | Employee can list own tickets | employee | passed | status=200 |  |
| API_TICKETS_HR_ALL_ALLOWED | HR can list tenant tickets | hr | passed | status=200 |  |
| API_SETTINGS_HR_SUBSCRIPTION_DENIED | HR admin cannot access owner subscription settings | hr | passed | status=403 |  |
