# Role Access Matrix QA - 2026-05-11

Run ID: ROLE-ACCESS-2026-05-11-1778498762572
Target: http://127.0.0.1:5178
API: https://aurorahr.in/api/v1

## Outcome

- Passed: 16
- Failed: 0

## Scope

This run verifies the central route/nav access contract and the tightened ticket authentication boundary across employee, manager, HR, and system-admin-equivalent demo sessions.

## Results

| ID | Scenario | Persona | Status | Evidence | Notes |
| --- | --- | --- | --- | --- | --- |
| ALLOW_EMPLOYEE_DASHBOARD | employee can access /dashboard | employee | passed | docs/qa/role-access-matrix-2026-05-11/screenshots/employee-dashboard.png |  |
| ALLOW_EMPLOYEE_ATTENDANCE | employee can access /attendance | employee | passed | docs/qa/role-access-matrix-2026-05-11/screenshots/employee-attendance.png |  |
| ALLOW_EMPLOYEE_LEAVE | employee can access /leave | employee | passed | docs/qa/role-access-matrix-2026-05-11/screenshots/employee-leave.png |  |
| ALLOW_EMPLOYEE_MY_DOCUMENTS | employee can access /my-hr-documents | employee | passed | docs/qa/role-access-matrix-2026-05-11/screenshots/employee-my_documents.png |  |
| DENY_EMPLOYEE_SETTINGS | employee is denied /settings | employee | passed | docs/qa/role-access-matrix-2026-05-11/screenshots/employee-denied-settings.png |  |
| DENY_EMPLOYEE_EMPLOYEES | employee is denied /employees | employee | passed | docs/qa/role-access-matrix-2026-05-11/screenshots/employee-denied-employees.png |  |
| NAV_EMPLOYEE_EXCLUDES | employee navigation excludes restricted modules | employee | passed | Settings, Employees, Reports, Onboarding, Master Data |  |
| ALLOW_MANAGER_EMPLOYEES | manager can access /employees | manager | passed | docs/qa/role-access-matrix-2026-05-11/screenshots/manager-employees.png |  |
| ALLOW_MANAGER_PERFORMANCE | manager can access /performance | manager | passed | docs/qa/role-access-matrix-2026-05-11/screenshots/manager-performance.png |  |
| ALLOW_MANAGER_EXIT | manager can access /exit | manager | passed | docs/qa/role-access-matrix-2026-05-11/screenshots/manager-exit.png |  |
| DENY_MANAGER_SETTINGS | manager is denied /settings | manager | passed | docs/qa/role-access-matrix-2026-05-11/screenshots/manager-denied-settings.png |  |
| NAV_MANAGER_EXCLUDES | manager navigation excludes restricted modules | manager | passed | Settings, Reports, Onboarding, Master Data |  |
| ALLOW_HR_SETTINGS | hr can access /settings | hr | passed | docs/qa/role-access-matrix-2026-05-11/screenshots/hr-settings.png |  |
| ALLOW_HR_REPORTS | hr can access /reports | hr | passed | docs/qa/role-access-matrix-2026-05-11/screenshots/hr-reports.png |  |
| ALLOW_HR_ONBOARDING | hr can access /onboarding | hr | passed | docs/qa/role-access-matrix-2026-05-11/screenshots/hr-onboarding.png |  |
| API_SKIPPED_LOCAL_UI_RUN | API authorization checks were skipped for local UI-only run | system | passed | QA_SKIP_API=true |  |
