# ACV UAT Plan

## Objective

Validate ACV Solutions as a real AuroraHR tenant through role-based, production-grade UAT covering setup, employee lifecycle, documents, compensation, communications, dashboards, auditability, and responsive behavior.

## Test Personas

### Director/Admin

Primary responsibilities:

- tenant setup
- organization settings
- roles and permissions
- employee master oversight
- reports and dashboards
- subscription/settings oversight

### HR Manager

Primary responsibilities:

- employee data management
- documents
- lifecycle actions
- compensation history
- HR Connect operations
- implementation exception handling

### Manager

Primary responsibilities:

- team visibility
- approvals
- attendance/leave review
- team lifecycle inputs
- limited employee data access

### Employee

Primary responsibilities:

- self-service profile
- documents
- payslips
- leave/attendance
- HR Connect
- lifecycle requests where applicable

## UAT Tracks

### Track 1: Tenant Setup

- ACV tenant opens correctly.
- ACV organization details are visible.
- ACV branding appears where expected.
- Non-tenant system pages retain AuroraHR identity where appropriate.
- Admin can update organization settings.

### Track 2: Employee Master

- HR can create, edit, view, and deactivate employee records.
- Department/designation/reporting manager data is synchronized.
- Employee list reflects designation and department correctly.
- Employee profile tabs show current and historical data.
- Role restrictions prevent unauthorized access.

### Track 3: Master Data and Roles

- Departments and designations can be maintained.
- Roles and permissions match personas.
- Employee user cannot see admin-only features.
- Manager can see appropriate team views.
- HR Manager can manage global HR operations.

### Track 4: Documents

- HR uploads employee document.
- Employee views own document.
- Employee cannot access another employee's private document.
- HR verifies and archives employee documents.
- Employee document download creates an audit log.
- HR generates an HR document from a template.
- Company document vault supports company-level document storage.
- HR uploads a company document with category, expiry, issuing authority, and notes.
- HR verifies a company document.
- HR downloads a company document and audit log records the access.
- HR archives a company document.
- Manager/Employee cannot access company document vault APIs.
- Download/share/delete actions are auditable.

### Track 5: Compensation

- HR views salary structure.
- HR imports salary transaction history.
- HR uploads payslip.
- Employee previews and downloads own payslip.
- Missing payslip coverage is reportable.
- Manual compensation edits are auditable.
- No payroll computation or statutory filing behavior is present.

### Track 6: HR Connect and Communication

- HR posts announcement.
- Employee comments/replies where allowed.
- HR Connect comment flows do not blank-screen.
- System-generated outbound communication events are logged once implemented.
- Tenant SMTP send test succeeds once implemented.

### Track 7: Lifecycle

- Onboarding case can be managed.
- Probation due items are visible.
- Leave and attendance approvals follow reporting relationships.
- Performance lifecycle can be completed for selected employees.
- Exit workflow can be initiated and completed where role allows.

### Track 8: Reports and Dashboards

- Admin sees organization-level readiness dashboard.
- HR sees employee/document/compensation coverage.
- HR can run the Memory Readiness report from Reports & Analytics.
- Memory Readiness report shows employee master gaps, missing required documents, recommended document gaps, company document coverage, salary structure status, and payslip status.
- Memory Readiness report can be exported to CSV for implementation evidence.
- Manager sees team workload.
- Employee sees self-service dashboard.
- Reports respect tenant and role boundaries.

### Track 9: Responsive UI

Required devices/viewports:

- iPhone width
- small Android width
- tablet width
- laptop width
- desktop width

Coverage:

- landing page
- login
- dashboard
- employee detail
- compensation tab
- documents
- HR Connect
- reports
- settings

## Evidence Requirements

For each UAT run, capture:

- test date
- environment
- tenant
- persona
- browser/device
- steps
- expected result
- actual result
- screenshot path
- pass/fail
- defect link or gap ID

Evidence folder:

`docs/acv-implementation/ACV-Testing-Evidence/`

## Automated Regression Foundation (2026-06-04)

Original branch: `claude/acv-regression-test-foundation`  
Hardened branch: `codex/qa-foundation-hardening`  
Lifecycle expansion branch: `codex/document-lifecycle-api-tests`

A Jest + supertest integration test suite now covers 76 automated API-level checks against a dedicated synthetic test database:

| Area | Tests | Status |
|------|-------|--------|
| Health/Smoke | 3 | Automated |
| Auth (login/logout/me) | 15 | Automated |
| Tenant Isolation | 4 | Automated |
| RBAC (role boundaries) | 13 | Automated |
| Employee Register | 4 | Automated |
| Employee Detail | 4 | Automated |
| Document Access | 6 | Automated |
| Compensation/Payslip | 6 | Automated |
| Attendance Flow | 7 | Automated |
| Leave Flow | 9 | Automated |
| Document and Payslip Lifecycle | 6 | Automated |

Run: `cd backend && npm run test:qa`

Test accounts: see `backend/tests/helpers/testSetup.ts` and `backend/tests/setup/seedTestData.ts`. The account matrix uses synthetic `*.test` emails and does not require real ACV production/development data.

Full reports:

- `docs/qa/acv-regression-foundation-2026-06-04/report.md`
- `docs/qa/document-lifecycle-api-tests/report.md`

## Browser E2E Test Plan (2026-06-04)

Branch: `claude/acv-e2e-test-plan`

A Playwright-based browser E2E test plan covers ~60 planned tests across 11 spec files:

| Spec | Tests | Priority | UAT Track |
|------|-------|----------|-----------|
| `auth.spec.ts` | 7 | Critical | Track 1 |
| `rbac.spec.ts` | 10+ | Critical | Track 3 |
| `tenant-isolation.spec.ts` | 4 | Critical | Track 3 |
| `employees.spec.ts` | 6 | Critical | Track 2 |
| `documents.spec.ts` | 6 | Critical | Track 4 |
| `compensation.spec.ts` | 5 | Critical | Track 5 |
| `dashboard.spec.ts` | 6 | High | Track 8 |
| `leave.spec.ts` | 6 | High | Track 7 |
| `attendance.spec.ts` | 4 | High | Track 7 |
| `company-documents.spec.ts` | 3 | High | Track 4 |
| `hr-connect.spec.ts` | 3 | Medium | Track 6 |

**Status**: **IMPLEMENTED AND GREEN.** 101 E2E tests across 13 spec files, 89 passing in CI (12 conditional skips).

**Coverage bridge**: Each UAT track maps to both API tests (Jest) and browser E2E tests (Playwright). See `docs/acv-implementation/ACV-E2E-Test-Plan.md` Section 4 for the full mapping.

## UAT Readiness (2026-06-08)

**Verdict**: READY FOR CONTROLLED ACV UAT

See `docs/acv-implementation/ACV-UAT-Readiness-Pack.md` for the full readiness pack including:
- E2E coverage matrix
- Module readiness classification (GREEN/AMBER/GREY)
- Skipped-test register
- Manual UAT checklists for HR Admin, Manager, Employee
- Known limitations
- Evidence links to all CI runs

## Release Gate

ACV implementation should not be considered ready until:

- [x] P1 gaps are closed or explicitly accepted.
- [x] No tenant-isolation issue is open.
- [x] No employee data-loss issue is open.
- [x] No compensation data corruption issue is open.
- [x] No document access leak is open.
- [x] Role-based access tests pass.
- [ ] Production smoke test passes.
- [ ] Manual UAT checklists completed by ACV pilot users.
