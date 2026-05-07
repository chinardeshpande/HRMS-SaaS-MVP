# Frontend Route Resilience QA - 2026-05-07

Run ID: ROUTE-2026-05-07-1778150319637
Target: https://aurorahr.in

## Outcome

- Passed: 9
- Failed: 0

## Scope

This run verifies that high-use routes render meaningful content after route-level code splitting, that the controlled 404 page works, that employee navigation no longer exposes restricted Settings workflows, and that direct employee access to Settings shows a controlled permission state.

## Results

| ID | Scenario | Role | Status | Evidence | Notes |
| --- | --- | --- | --- | --- | --- |
| PUBLIC_404 | Unknown routes show a controlled not-found page | public | passed | 200, chars=88, docs/qa/frontend-route-resilience-2026-05-07/screenshots/public_404-public.png |  |
| PUBLIC_LOGIN | Login route renders without a blank screen | public | passed | 200, chars=715, docs/qa/frontend-route-resilience-2026-05-07/screenshots/public_login-public.png |  |
| HR_DASHBOARD | HR dashboard route renders after session restore | hr | passed | 200, chars=2430, docs/qa/frontend-route-resilience-2026-05-07/screenshots/hr_dashboard-hr.png |  |
| HR_ATTENDANCE | Attendance route renders after lazy chunk load | hr | passed | 200, chars=778, docs/qa/frontend-route-resilience-2026-05-07/screenshots/hr_attendance-hr.png |  |
| HR_LEAVE | Leave route renders after lazy chunk load | hr | passed | 200, chars=965, docs/qa/frontend-route-resilience-2026-05-07/screenshots/hr_leave-hr.png |  |
| HR_CONNECT | HR Connect route renders after lazy chunk load | employee | passed | 200, chars=1603, docs/qa/frontend-route-resilience-2026-05-07/screenshots/hr_connect-employee.png |  |
| EMPLOYEE_NAV | Employee navigation excludes restricted Settings workflow | employee | passed | 200, chars=2269, docs/qa/frontend-route-resilience-2026-05-07/screenshots/employee_nav-employee.png |  |
| EMPLOYEE_SETTINGS_DIRECT | Employee direct Settings access shows controlled permission state | employee | passed | 200, chars=613, docs/qa/frontend-route-resilience-2026-05-07/screenshots/employee_settings_direct-employee.png |  |
| HR_SETTINGS | HR can still access Settings after role-scoped navigation change | hr | passed | 200, chars=1262, docs/qa/frontend-route-resilience-2026-05-07/screenshots/hr_settings-hr.png |  |
