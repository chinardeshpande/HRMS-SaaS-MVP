# Role-Based Personas Production Readiness Visual QA

Run date: 2026-05-11
Run id: ROLE-PERSONA-HARDENING-2026-05-11-1778513478852
Target: http://127.0.0.1:5180
API: https://aurorahr.in/api/v1

## Executive Summary

- Passed: 54
- Failed: 0
- Production-readiness verdict: Production-ready for the tested role-based persona dashboard/access surface.

## Scope

This exercise validates the role-based persona layer for AuroraHR: dashboard content, navigation, direct URL access, self-service journeys, manager/HR approval journeys, owner implementation controls, API authorization, mobile rendering, API failure fallback, and concurrent dashboard load behavior.

## Personas And Data

| Persona | Business role | Expected product focus |
| --- | --- | --- |
| admin | Owner / first company administrator | Implementation, setup, subscription, master data, reporting, and global controls. |
| hr | HR operations manager | Employee operations, lifecycle work, approvals, reports, settings, and HR interventions. |
| manager | People manager / approver | Team availability, team approvals, performance, exits, and team documents. |
| employee | Individual employee | Attendance, leave, HR documents, HR Connect, personal updates, and self-service only. |

## Business Process Narrative

A company owner should see implementation and commercial-readiness controls. HR should see organization-wide operations and approval queues without owner-only billing controls. A manager should see team work queues and direct-report workflows without HR/admin setup surfaces. An employee should land in a narrow self-service workspace showing leave, attendance, HR documents, messages, and HR Connect without admin, HR, or team approval features. The test logs in as each demo persona, verifies API authorization first, opens the browser routes directly, exercises dashboard calls to action, captures visual proof only after assertions pass, then stress-loads dashboards concurrently.

## Test Outcomes

| ID | Use case | Role | Expected | Actual | Status | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AUTH_ADMIN | Demo login succeeds for Owner / System Admin | admin | Authenticated demo session with user and token | demo.admin@aurorahr.in | passed | POST /demo/login |  |
| AUTH_HR | Demo login succeeds for HR Operations | hr | Authenticated demo session with user and token | demo.hr@aurorahr.in | passed | POST /demo/login |  |
| AUTH_MANAGER | Demo login succeeds for Manager / Approver | manager | Authenticated demo session with user and token | demo.manager@aurorahr.in | passed | POST /demo/login |  |
| AUTH_EMPLOYEE | Demo login succeeds for Individual Employee | employee | Authenticated demo session with user and token | demo.employee@aurorahr.in | passed | POST /demo/login |  |
| API_PUBLIC_DASHBOARD_DENIED | Public request cannot read dashboard stats | public | HTTP 401 | HTTP 401 | passed | /dashboard/stats status=401 |  |
| API_EMPLOYEE_DASHBOARD_ALLOWED | Employee can read own dashboard stats | employee | HTTP 200 | HTTP 200 | passed | /dashboard/stats status=200 |  |
| API_MANAGER_DASHBOARD_ALLOWED | Manager can read team dashboard stats | manager | HTTP 200 | HTTP 200 | passed | /dashboard/stats status=200 |  |
| API_HR_DASHBOARD_ALLOWED | HR can read operations dashboard stats | hr | HTTP 200 | HTTP 200 | passed | /dashboard/stats status=200 |  |
| API_ADMIN_DASHBOARD_ALLOWED | Owner can read implementation dashboard stats | admin | HTTP 200 | HTTP 200 | passed | /dashboard/stats status=200 |  |
| API_EMPLOYEE_TENANT_TICKETS_DENIED | Employee cannot list all tenant tickets | employee | HTTP 403 | HTTP 403 | passed | /helpdesk/tickets status=403 |  |
| API_EMPLOYEE_MY_TICKETS_ALLOWED | Employee can list own helpdesk tickets | employee | HTTP 200 | HTTP 200 | passed | /helpdesk/tickets/my status=200 |  |
| API_HR_TENANT_TICKETS_ALLOWED | HR can list tenant helpdesk tickets | hr | HTTP 200 | HTTP 200 | passed | /helpdesk/tickets status=200 |  |
| API_HR_SUBSCRIPTION_DENIED | HR cannot access owner subscription settings | hr | HTTP 403 | HTTP 403 | passed | /settings/subscription status=403 |  |
| API_ADMIN_SUBSCRIPTION_ALLOWED | Owner can access subscription settings | admin | HTTP 200 | HTTP 200 | passed | /settings/subscription status=200 |  |
| AUTH_PUBLIC_REDIRECT | Unauthenticated visitor cannot open the dashboard directly | public | Redirect to login | http://127.0.0.1:5180/login | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/public-dashboard-redirect-login.png |  |
| AUTH_TAMPERED_ROLE_DENIED | Employee session with a tampered local role cannot enter admin settings | employee | Server/session role remains authoritative enough to deny settings | Settings denied | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/tampered-role-settings-denied.png |  |
| DASH_ADMIN | Owner / System Admin sees the correct role dashboard and navigation | admin | Role-specific dashboard, nav allow-list, and nav deny-list are correct | Dashboard matched expected role controls | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/admin-dashboard-persona.png |  |
| ACTION_ADMIN_SUBSCRIPTION_AND_BILLING | Owner / System Admin dashboard action "Subscription and billing" opens the right journey | admin | Navigate to /settings | http://127.0.0.1:5180/settings | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/admin-action-subscription-and-billing.png |  |
| ACTION_ADMIN_EXECUTIVE_REPORTS | Owner / System Admin dashboard action "Executive reports" opens the right journey | admin | Navigate to /reports | http://127.0.0.1:5180/reports | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/admin-action-executive-reports.png |  |
| MOBILE_ADMIN_DASHBOARD | Owner / System Admin dashboard is usable on mobile viewport | admin | Persona heading renders and restricted content stays hidden | Mobile dashboard rendered without error | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/admin-mobile-dashboard.png |  |
| DASH_HR | HR Operations sees the correct role dashboard and navigation | hr | Role-specific dashboard, nav allow-list, and nav deny-list are correct | Dashboard matched expected role controls | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/hr-dashboard-persona.png |  |
| ACTION_HR_LEAVE_APPROVALS | HR Operations dashboard action "Leave approvals" opens the right journey | hr | Navigate to /leave | http://127.0.0.1:5180/leave?filter=pending | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/hr-action-leave-approvals.png |  |
| ACTION_HR_ATTENDANCE_REGULARIZATIONS | HR Operations dashboard action "Attendance regularizations" opens the right journey | hr | Navigate to /attendance | http://127.0.0.1:5180/attendance?filter=pending | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/hr-action-attendance-regularizations.png |  |
| ACTION_HR_PERFORMANCE_REVIEWS | HR Operations dashboard action "Performance reviews" opens the right journey | hr | Navigate to /performance | http://127.0.0.1:5180/performance | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/hr-action-performance-reviews.png |  |
| DROPDOWN_HR_APPROVALS | HR Operations can inspect approval categories from dashboard | hr | Approval dropdown lists leave, attendance, and appraisal paths | Dropdown rendered expected categories | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/hr-approvals-dropdown.png |  |
| MOBILE_HR_DASHBOARD | HR Operations dashboard is usable on mobile viewport | hr | Persona heading renders and restricted content stays hidden | Mobile dashboard rendered without error | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/hr-mobile-dashboard.png |  |
| DASH_MANAGER | Manager / Approver sees the correct role dashboard and navigation | manager | Role-specific dashboard, nav allow-list, and nav deny-list are correct | Dashboard matched expected role controls | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/manager-dashboard-persona.png |  |
| DENY_MANAGER__SETTINGS | manager cannot deep-link into restricted route /settings | manager | Permission-denied page with safe dashboard return | Restricted route denied in UI | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/manager-denied--settings.png |  |
| DENY_MANAGER__REPORTS | manager cannot deep-link into restricted route /reports | manager | Permission-denied page with safe dashboard return | Restricted route denied in UI | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/manager-denied--reports.png |  |
| DENY_MANAGER__ONBOARDING | manager cannot deep-link into restricted route /onboarding | manager | Permission-denied page with safe dashboard return | Restricted route denied in UI | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/manager-denied--onboarding.png |  |
| DENY_MANAGER__DEPARTMENTS | manager cannot deep-link into restricted route /departments | manager | Permission-denied page with safe dashboard return | Restricted route denied in UI | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/manager-denied--departments.png |  |
| DENY_MANAGER__DESIGNATIONS | manager cannot deep-link into restricted route /designations | manager | Permission-denied page with safe dashboard return | Restricted route denied in UI | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/manager-denied--designations.png |  |
| ACTION_MANAGER_LEAVE_APPROVALS | Manager / Approver dashboard action "Leave approvals" opens the right journey | manager | Navigate to /leave | http://127.0.0.1:5180/leave?filter=pending | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/manager-action-leave-approvals.png |  |
| ACTION_MANAGER_ATTENDANCE_REGULARIZATIONS | Manager / Approver dashboard action "Attendance regularizations" opens the right journey | manager | Navigate to /attendance | http://127.0.0.1:5180/attendance?filter=pending | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/manager-action-attendance-regularizations.png |  |
| ACTION_MANAGER_PERFORMANCE_REVIEWS | Manager / Approver dashboard action "Performance reviews" opens the right journey | manager | Navigate to /performance | http://127.0.0.1:5180/performance | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/manager-action-performance-reviews.png |  |
| DROPDOWN_MANAGER_APPROVALS | Manager / Approver can inspect approval categories from dashboard | manager | Approval dropdown lists leave, attendance, and appraisal paths | Dropdown rendered expected categories | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/manager-approvals-dropdown.png |  |
| MOBILE_MANAGER_DASHBOARD | Manager / Approver dashboard is usable on mobile viewport | manager | Persona heading renders and restricted content stays hidden | Mobile dashboard rendered without error | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/manager-mobile-dashboard.png |  |
| DASH_EMPLOYEE | Individual Employee sees the correct role dashboard and navigation | employee | Role-specific dashboard, nav allow-list, and nav deny-list are correct | Dashboard matched expected role controls | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-dashboard-persona.png |  |
| DENY_EMPLOYEE__EMPLOYEES | employee cannot deep-link into restricted route /employees | employee | Permission-denied page with safe dashboard return | Restricted route denied in UI | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-denied--employees.png |  |
| DENY_EMPLOYEE__PERFORMANCE | employee cannot deep-link into restricted route /performance | employee | Permission-denied page with safe dashboard return | Restricted route denied in UI | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-denied--performance.png |  |
| DENY_EMPLOYEE__EXIT | employee cannot deep-link into restricted route /exit | employee | Permission-denied page with safe dashboard return | Restricted route denied in UI | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-denied--exit.png |  |
| DENY_EMPLOYEE__DOCUMENTS | employee cannot deep-link into restricted route /documents | employee | Permission-denied page with safe dashboard return | Restricted route denied in UI | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-denied--documents.png |  |
| DENY_EMPLOYEE__SETTINGS | employee cannot deep-link into restricted route /settings | employee | Permission-denied page with safe dashboard return | Restricted route denied in UI | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-denied--settings.png |  |
| DENY_EMPLOYEE__REPORTS | employee cannot deep-link into restricted route /reports | employee | Permission-denied page with safe dashboard return | Restricted route denied in UI | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-denied--reports.png |  |
| DENY_EMPLOYEE__ONBOARDING | employee cannot deep-link into restricted route /onboarding | employee | Permission-denied page with safe dashboard return | Restricted route denied in UI | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-denied--onboarding.png |  |
| DENY_EMPLOYEE__DEPARTMENTS | employee cannot deep-link into restricted route /departments | employee | Permission-denied page with safe dashboard return | Restricted route denied in UI | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-denied--departments.png |  |
| DENY_EMPLOYEE__DESIGNATIONS | employee cannot deep-link into restricted route /designations | employee | Permission-denied page with safe dashboard return | Restricted route denied in UI | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-denied--designations.png |  |
| ACTION_EMPLOYEE_CLOCK_IN_OUT_AND_TIMESHEET | Individual Employee dashboard action "Clock in/out and timesheet" opens the right journey | employee | Navigate to /attendance | http://127.0.0.1:5180/attendance | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-action-clock-in/out-and-timesheet.png |  |
| ACTION_EMPLOYEE_APPLY_FOR_LEAVE | Individual Employee dashboard action "Apply for leave" opens the right journey | employee | Navigate to /leave | http://127.0.0.1:5180/leave | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-action-apply-for-leave.png |  |
| ACTION_EMPLOYEE_MY_HR_DOCUMENTS | Individual Employee dashboard action "My HR documents" opens the right journey | employee | Navigate to /my-hr-documents | http://127.0.0.1:5180/my-hr-documents | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-action-my-hr-documents.png |  |
| ACTION_EMPLOYEE_HR_CONNECT | Individual Employee dashboard action "HR Connect" opens the right journey | employee | Navigate to /hr-connect | http://127.0.0.1:5180/hr-connect | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-action-hr-connect.png |  |
| MOBILE_EMPLOYEE_DASHBOARD | Individual Employee dashboard is usable on mobile viewport | employee | Persona heading renders and restricted content stays hidden | Mobile dashboard rendered without error | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-mobile-dashboard.png |  |
| FAILURE_DASHBOARD_STATS_FALLBACK | Dashboard remains usable when dashboard stats API fails | employee | Fallback metrics render without blocking self-service | Dashboard rendered fallback self-service view | passed | docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-dashboard-api-fallback.png |  |
| STRESS_CONCURRENT_DASHBOARDS | Concurrent role dashboard loads remain stable across personas | all | 12 parallel dashboard loads render correct persona headings | All concurrent loads rendered correctly | passed | 12 browser contexts |  |

## API Proof

- API_PUBLIC_DASHBOARD_DENIED: Public request cannot read dashboard stats. Expected HTTP 401; actual HTTP 401; status passed.
- API_EMPLOYEE_DASHBOARD_ALLOWED: Employee can read own dashboard stats. Expected HTTP 200; actual HTTP 200; status passed.
- API_MANAGER_DASHBOARD_ALLOWED: Manager can read team dashboard stats. Expected HTTP 200; actual HTTP 200; status passed.
- API_HR_DASHBOARD_ALLOWED: HR can read operations dashboard stats. Expected HTTP 200; actual HTTP 200; status passed.
- API_ADMIN_DASHBOARD_ALLOWED: Owner can read implementation dashboard stats. Expected HTTP 200; actual HTTP 200; status passed.
- API_EMPLOYEE_TENANT_TICKETS_DENIED: Employee cannot list all tenant tickets. Expected HTTP 403; actual HTTP 403; status passed.
- API_EMPLOYEE_MY_TICKETS_ALLOWED: Employee can list own helpdesk tickets. Expected HTTP 200; actual HTTP 200; status passed.
- API_HR_TENANT_TICKETS_ALLOWED: HR can list tenant helpdesk tickets. Expected HTTP 200; actual HTTP 200; status passed.
- API_HR_SUBSCRIPTION_DENIED: HR cannot access owner subscription settings. Expected HTTP 403; actual HTTP 403; status passed.
- API_ADMIN_SUBSCRIPTION_ALLOWED: Owner can access subscription settings. Expected HTTP 200; actual HTTP 200; status passed.

## Visual Proof

### AUTH_PUBLIC_REDIRECT - Public user is redirected to login

Role: public

![AUTH_PUBLIC_REDIRECT](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/public-dashboard-redirect-login.png)

### AUTH_TAMPERED_ROLE_DENIED - Tampered local role denied by route/session consistency

Role: employee

![AUTH_TAMPERED_ROLE_DENIED](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/tampered-role-settings-denied.png)

### DASH_ADMIN - Owner / System Admin dashboard

Role: admin

![DASH_ADMIN](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/admin-dashboard-persona.png)

### ACTION_ADMIN_SUBSCRIPTION_AND_BILLING - admin dashboard action Subscription and billing

Role: admin

![ACTION_ADMIN_SUBSCRIPTION_AND_BILLING](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/admin-action-subscription-and-billing.png)

### ACTION_ADMIN_EXECUTIVE_REPORTS - admin dashboard action Executive reports

Role: admin

![ACTION_ADMIN_EXECUTIVE_REPORTS](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/admin-action-executive-reports.png)

### MOBILE_ADMIN_DASHBOARD - admin mobile dashboard

Role: admin

![MOBILE_ADMIN_DASHBOARD](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/admin-mobile-dashboard.png)

### DASH_HR - HR Operations dashboard

Role: hr

![DASH_HR](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/hr-dashboard-persona.png)

### ACTION_HR_LEAVE_APPROVALS - hr dashboard action Leave approvals

Role: hr

![ACTION_HR_LEAVE_APPROVALS](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/hr-action-leave-approvals.png)

### ACTION_HR_ATTENDANCE_REGULARIZATIONS - hr dashboard action Attendance regularizations

Role: hr

![ACTION_HR_ATTENDANCE_REGULARIZATIONS](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/hr-action-attendance-regularizations.png)

### ACTION_HR_PERFORMANCE_REVIEWS - hr dashboard action Performance reviews

Role: hr

![ACTION_HR_PERFORMANCE_REVIEWS](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/hr-action-performance-reviews.png)

### DROPDOWN_HR_APPROVALS - hr approvals dropdown

Role: hr

![DROPDOWN_HR_APPROVALS](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/hr-approvals-dropdown.png)

### MOBILE_HR_DASHBOARD - hr mobile dashboard

Role: hr

![MOBILE_HR_DASHBOARD](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/hr-mobile-dashboard.png)

### DASH_MANAGER - Manager / Approver dashboard

Role: manager

![DASH_MANAGER](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/manager-dashboard-persona.png)

### DENY_MANAGER__SETTINGS - manager denied /settings

Role: manager

![DENY_MANAGER__SETTINGS](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/manager-denied--settings.png)

### DENY_MANAGER__REPORTS - manager denied /reports

Role: manager

![DENY_MANAGER__REPORTS](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/manager-denied--reports.png)

### DENY_MANAGER__ONBOARDING - manager denied /onboarding

Role: manager

![DENY_MANAGER__ONBOARDING](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/manager-denied--onboarding.png)

### DENY_MANAGER__DEPARTMENTS - manager denied /departments

Role: manager

![DENY_MANAGER__DEPARTMENTS](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/manager-denied--departments.png)

### DENY_MANAGER__DESIGNATIONS - manager denied /designations

Role: manager

![DENY_MANAGER__DESIGNATIONS](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/manager-denied--designations.png)

### ACTION_MANAGER_LEAVE_APPROVALS - manager dashboard action Leave approvals

Role: manager

![ACTION_MANAGER_LEAVE_APPROVALS](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/manager-action-leave-approvals.png)

### ACTION_MANAGER_ATTENDANCE_REGULARIZATIONS - manager dashboard action Attendance regularizations

Role: manager

![ACTION_MANAGER_ATTENDANCE_REGULARIZATIONS](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/manager-action-attendance-regularizations.png)

### ACTION_MANAGER_PERFORMANCE_REVIEWS - manager dashboard action Performance reviews

Role: manager

![ACTION_MANAGER_PERFORMANCE_REVIEWS](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/manager-action-performance-reviews.png)

### DROPDOWN_MANAGER_APPROVALS - manager approvals dropdown

Role: manager

![DROPDOWN_MANAGER_APPROVALS](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/manager-approvals-dropdown.png)

### MOBILE_MANAGER_DASHBOARD - manager mobile dashboard

Role: manager

![MOBILE_MANAGER_DASHBOARD](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/manager-mobile-dashboard.png)

### DASH_EMPLOYEE - Individual Employee dashboard

Role: employee

![DASH_EMPLOYEE](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-dashboard-persona.png)

### DENY_EMPLOYEE__EMPLOYEES - employee denied /employees

Role: employee

![DENY_EMPLOYEE__EMPLOYEES](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-denied--employees.png)

### DENY_EMPLOYEE__PERFORMANCE - employee denied /performance

Role: employee

![DENY_EMPLOYEE__PERFORMANCE](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-denied--performance.png)

### DENY_EMPLOYEE__EXIT - employee denied /exit

Role: employee

![DENY_EMPLOYEE__EXIT](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-denied--exit.png)

### DENY_EMPLOYEE__DOCUMENTS - employee denied /documents

Role: employee

![DENY_EMPLOYEE__DOCUMENTS](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-denied--documents.png)

### DENY_EMPLOYEE__SETTINGS - employee denied /settings

Role: employee

![DENY_EMPLOYEE__SETTINGS](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-denied--settings.png)

### DENY_EMPLOYEE__REPORTS - employee denied /reports

Role: employee

![DENY_EMPLOYEE__REPORTS](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-denied--reports.png)

### DENY_EMPLOYEE__ONBOARDING - employee denied /onboarding

Role: employee

![DENY_EMPLOYEE__ONBOARDING](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-denied--onboarding.png)

### DENY_EMPLOYEE__DEPARTMENTS - employee denied /departments

Role: employee

![DENY_EMPLOYEE__DEPARTMENTS](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-denied--departments.png)

### DENY_EMPLOYEE__DESIGNATIONS - employee denied /designations

Role: employee

![DENY_EMPLOYEE__DESIGNATIONS](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-denied--designations.png)

### ACTION_EMPLOYEE_CLOCK_IN_OUT_AND_TIMESHEET - employee dashboard action Clock in/out and timesheet

Role: employee

![ACTION_EMPLOYEE_CLOCK_IN_OUT_AND_TIMESHEET](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-action-clock-in/out-and-timesheet.png)

### ACTION_EMPLOYEE_APPLY_FOR_LEAVE - employee dashboard action Apply for leave

Role: employee

![ACTION_EMPLOYEE_APPLY_FOR_LEAVE](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-action-apply-for-leave.png)

### ACTION_EMPLOYEE_MY_HR_DOCUMENTS - employee dashboard action My HR documents

Role: employee

![ACTION_EMPLOYEE_MY_HR_DOCUMENTS](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-action-my-hr-documents.png)

### ACTION_EMPLOYEE_HR_CONNECT - employee dashboard action HR Connect

Role: employee

![ACTION_EMPLOYEE_HR_CONNECT](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-action-hr-connect.png)

### MOBILE_EMPLOYEE_DASHBOARD - employee mobile dashboard

Role: employee

![MOBILE_EMPLOYEE_DASHBOARD](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-mobile-dashboard.png)

### FAILURE_DASHBOARD_STATS_FALLBACK - Employee dashboard survives stats API failure

Role: employee

![FAILURE_DASHBOARD_STATS_FALLBACK](docs/qa/role-persona-hardening-local-2026-05-11/screenshots/employee-dashboard-api-fallback.png)


## Gaps Found

- No production-blocking gaps were found in this pass.

## Repairs Made

- This pass adds a broader hardening script and evidence report. If failures are found in a rerun, the failed scenario IDs identify the exact UI/API boundary to repair.

## Rerun Results

- Latest run: 54 passed, 0 failed.

## Residual Risks

- This validates the current demo personas and live production route/API contract. It does not yet create a fresh tenant and mutate role assignments end-to-end inside the settings UI.
- Subscription payment-gateway enforcement is only covered at the owner-vs-HR access boundary here; full billing lifecycle testing remains a separate module-level pass.
- Fine-grained custom permissions inside user-created roles are not yet enforced beyond the current system roles and route allow-lists.

## Rerun Commands

```bash
QA_BASE_URL=http://127.0.0.1:5180 QA_API_URL=https://aurorahr.in/api/v1 QA_OUT_DIR=docs/qa/role-persona-hardening-local-2026-05-11 node scripts/qa/role-persona-production-hardening-test.mjs
```
