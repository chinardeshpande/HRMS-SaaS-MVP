# ACV Testing Strategy

Date: 2026-06-04  
Branch: `codex/current-product-surface-inventory`  
Scope: strategy only. No tests were added or run in this branch.

## Objective

AuroraHR must be tested as a production multi-tenant HRMS, not as a demo. The strategy below is designed to divide work across Codex, Claude Code, Antigravity, and ChatGPT without losing traceability.

## Testing Principles

1. Test tenant isolation before feature polish.
2. Test role boundaries before convenience workflows.
3. Treat ACV Customer Zero data as real implementation data.
4. Separate “surface exists” from “surface works correctly.”
5. Capture evidence for every critical path: command output, API result, screenshot, video, or export.
6. Keep payroll processing and recruitment out of scope unless explicitly added later.

## Test Ownership Recommendation

| Workstream | Recommended owner | Reason |
| --- | --- | --- |
| Web app architecture, API contract fixes, backend defects | Codex | Repository-aware implementation and refactoring. |
| Automated web functional/regression tests | Claude Code or Codex | Either can run Playwright/API suites; avoid duplicate ownership. |
| Mobile app implementation and simulator testing | Antigravity if already 60% complete; Claude Code only after handoff pack | Minimize context loss in mobile sprint. |
| Cross-device visual QA and narrative QA reports | Claude Code or Codex with browser tooling | Needs repeatable screenshots and issue reports. |
| Strategy, prioritization, scenario generation, acceptance criteria | ChatGPT + user | Good fit for product judgment and broad test ideation. |
| Manu AI architecture and use-case library | Codex for implementation, ChatGPT for persona/use-case review, Claude/Antigravity for black-box QA | Requires both product intelligence and repo control. |

## Test Layers

### Layer 0: Static Inventory and Build Health

Required before any deployment:

- `backend` TypeScript build.
- `frontend-web` production build.
- `mobile-app` TypeScript/Jest checks if mobile code changes are included.
- Environment sanity: `.env` values, API base URLs, CORS, upload paths, production asset paths.

Evidence:

- Build logs.
- Git branch and commit hash.
- Dependency warnings.

### Layer 1: API Contract Tests

Priority modules:

- Auth and role context.
- Tenant settings and branding.
- Employee master.
- Employee documents and company documents.
- Compensation and payslips.
- Attendance and leave.
- Onboarding, probation, exit.
- HR Connect, chat, helpdesk, calendar.
- HR Analytics.
- Manu assistant.

Minimum checks per API:

- Auth required where expected.
- Tenant scoping.
- Role permission checks.
- Create/update/delete validation.
- Empty state behavior.
- Duplicate/idempotency behavior for imports.
- Audit log creation for sensitive operations.

### Layer 2: ACV Customer Zero Data Validation

Validation reports required:

- Employee master completeness.
- Active vs exited employee register.
- Manager mapping.
- Department/designation/location coverage.
- Employment history completeness.
- Current salary structure coverage.
- Salary transaction month coverage.
- Payslip attachment coverage.
- Employee document coverage by category.
- Company document coverage by category/status/expiry.
- Attendance coverage by month/source.
- Leave balance coverage and gender-specific eligibility.

Evidence:

- CSV/JSON reports.
- Screenshots from app views.
- Import dry-run/execution/idempotency reports.
- Manual missing-data register.

### Layer 3: Role-Based Browser Tests (Playwright E2E)

**Plan**: `docs/acv-implementation/ACV-E2E-Test-Plan.md`
**Status**: Plan complete, implementation pending Playwright installation.
**Framework**: Playwright (recommended)
**Estimated tests**: ~60 across 11 spec files

Required roles:

- System Admin / Tenant Owner.
- HR Admin / HR Manager.
- Manager.
- Employee.
- Second Tenant Admin (cross-tenant isolation).

Critical scenarios (mapped to E2E test IDs):

- Login/logout/protected routes/expired token (A01-A07).
- Dashboard per-role widget rendering (D01-D06).
- Employee register visibility and denial (E01-E06).
- Employee detail tabs and role-based access (E03-E04).
- Document preview/download/access boundaries (DC01-DC06).
- Salary/payslip visibility and restrictions (C01-C05).
- Attendance self-service and company/team views (AT01-AT04).
- Leave apply/approve workflow (L01-L06).
- Company document vault access (CD01-CD03).
- RBAC route denial across all roles (rbac.spec.ts).
- Cross-tenant browser isolation (tenant-isolation.spec.ts).
- HR Connect feed, groups, comments, reactions.
- Chat/helpdesk/calendar.
- Settings/business rules/policies/users.
- HR Analytics report build, column selection, grouping, charts, saved reports.
- Manu tray/modal/guardrails.

### Layer 4: Visual and Responsive QA

Breakpoints:

- Mobile: 360x800, 390x844, 430x932.
- Tablet: 768x1024, 820x1180.
- Desktop: 1366x768, 1440x900, 1920x1080.

Checks:

- No clipped content.
- No horizontal overflow unless intentional data-grid scroll.
- Header/sidebar/action rows align correctly.
- Tables degrade into cards where needed.
- Modals fit and scroll internally.
- Manu tray does not block primary workflows.
- Lavender visual style is consistently applied and legacy dark-blue solid blocks are removed or tokenized.

### Layer 5: Collaboration and Multi-User Tests

Untested/high-risk areas:

- HR Connect real-time behavior.
- Chat conversations, unread counts, file uploads.
- Groups and membership changes.
- Helpdesk ticket lifecycle.
- Calendar reminders and event visibility.
- Video call component.
- Notifications.
- Concurrent actions such as two managers approving/acting on the same item.

Required evidence:

- Two-browser or multi-session test logs.
- API concurrency behavior.
- Socket/realtime verification where applicable.

### Layer 6: Manu AI Tests

Use `docs/qa/manu-hr-operations-angel-2026-06-03/use-case-library.md` as the baseline.

Minimum acceptance before production-grade claim:

- 50 assistant API tests.
- 12 visual rendering tests across tray, modal, guided workflow, refusal, and confirmation states.
- Admin/HR/Manager/Employee role boundary tests.
- Exact, ambiguous, and no-match employee resolution tests.
- At least 5 real data-backed use cases per core module.
- No sensitive mutation without explicit confirmation.
- No salary data leakage to unauthorized roles.
- No generic fallback for supported questions.

## Regression Test Foundation (2026-06-04)

Original branch: `claude/acv-regression-test-foundation`  
Hardened branch: `codex/qa-foundation-hardening`

### Architecture

- **Framework**: Jest 29 + supertest + ts-jest (already in `devDependencies`)
- **Test type**: API-level integration tests via supertest against the Express app
- **Database**: Tests require a running PostgreSQL test database. Default DB: `hrms_saas_test`
- **Isolation**: Jest global setup resets the dedicated test database and refuses destructive reset unless the DB name contains `test`, unless `ALLOW_NON_TEST_DB_FOR_TESTS=true` is explicitly set
- **Seed data**: Synthetic seed matrix is reset and loaded per run; real ACV employee data is not required
- **Config**: `backend/jest.config.ts`
- **Test root**: `backend/tests/integration/`
- **Helpers**: `backend/tests/helpers/testSetup.ts`

### Test Account Matrix

| Role | Email | DB Role | Verified |
|------|-------|---------|----------|
| System Admin | `system.admin@acv.test` | `system_admin` | Synthetic seed |
| HR Admin | `hr.admin@acv.test` | `hr_admin` | Synthetic seed |
| Manager | `manager@acv.test` | `manager` | Synthetic seed |
| Employee | `employee@acv.test` | `employee` | Synthetic seed |
| Second Tenant Admin | `admin@orbit.test` | `system_admin` | Synthetic seed |

### Coverage (76 tests, all passing on `codex/document-lifecycle-api-tests`)

| Suite | Count | Critical Risk |
|-------|-------|---------------|
| Health/Smoke | 3 | Build health |
| Auth login/me | 15 | Authentication and account enumeration |
| Tenant Isolation | 4 | Tenant leakage |
| RBAC | 13 | Role leakage |
| Employee Register | 4 | Data visibility |
| Employee Detail | 4 | Data visibility |
| Document Access | 6 | Document leakage |
| Compensation/Payslip | 6 | Salary leakage |
| Attendance | 7 | Role boundaries |
| Leave | 9 | Role boundaries |
| Document and Payslip Lifecycle | 10 | Upload/download/audit lifecycle + gap closures |

### Bugs Found

1. Login returned 500 instead of 401 for nonexistent email. Fixed in `authController.ts`.
2. Inactive and ambiguous duplicate-account login paths returned distinguishable errors. Fixed to generic 401 `INVALID_CREDENTIALS` while preserving server-side diagnostic intent.
3. Seed data lacked a second-tenant employee-role user. Added `employee@orbit.test` for cross-tenant employee tests.
4. Several seeded-account tests could silently pass when auth setup failed. Replaced scaffold skips with hard `requireAuth(...)` failures.

### Document and Payslip Lifecycle API Expansion (2026-06-04)

Branch: `codex/document-lifecycle-api-tests`

Additional backend API tests now cover:

- Employee document upload, list, download roundtrip, update, verify, archive, and audit events.
- Employee document self-access, cross-employee denial, missing-document handling, and cross-tenant denial.
- Company document upload, list, download roundtrip, update, verify, archive, and audit events.
- Company document HR-only access, cross-tenant denial, missing-document handling, and missing-file handling.
- Payslip creation, payslip attachment upload, HR download, employee self-download, missing attachment handling, missing file handling, and download audit event.
- Compensation/payslip access denial for manager and second-tenant employee roles.

Audit coverage verified by API tests:

- `employee_document.upload`
- `employee_document.download`
- `employee_document.update`
- `employee_document.verify`
- `employee_document.archive`
- `company_document.upload`
- `company_document.download`
- `company_document.update`
- `company_document.verify`
- `company_document.archive`
- `payslip_attachment.download`

### Run

```bash
cd backend
npm run test:qa
npm run test:qa:coverage
```

Detailed local setup is documented in `backend/TESTING.md`.

## Immediate Test Backlog

### P0 Before Next Production Push

- Login: ACV admin and at least one employee/manager role.
- Employee register: active/exited filters, detail page, CRUD permissions.
- Documents: company vault and employee documents preview/download/upload/verify/delete.
- Compensation: salary structure, transaction history, payslip library, payslip attachment preview/download.
- Attendance: My Attendance and Company Attendance current/date-range views.
- Leave: My Leaves, Company Leaves, Team Approvals, gender-specific maternity/paternity logic.
- Dashboard: data cards, HR Connect feed, calendar reminders.
- HR Analytics: acknowledge current defects; do not promote as complete until repaired.
- Manu: ensure assistant does not claim unsupported capabilities.

### P1 Implementation-Grade Tests

- ACV migration validation reports.
- Document and salary audit-log coverage.
- Tenant branding in generated documents.
- Profile photo upload regression.
- Mobile API compatibility for employee/attendance/leave/document basics.

### P2 Full Product Surface Tests

- Onboarding to probation to confirmation journey.
- Performance review lifecycle.
- Exit/FNF/clearance lifecycle.
- HR Connect/chat/helpdesk/calendar multi-user scenarios.
- Subscription/registration/payment method settings.
- Mobile visual and navigation parity.

## Evidence Storage Standard

Use:

```text
docs/qa/<feature-or-module>-YYYY-MM-DD/
```

Each run should contain:

- `report.md`
- `results.json` where practical.
- `screenshots/` for visual QA.
- `artifacts/` for downloaded exports or generated files.
- Environment, branch, commit, frontend URL, API URL, test accounts used.

## Release Gate

A production release should not be approved only on build success. Minimum gate:

1. Build pass for changed apps.
2. P0 smoke pass.
3. ACV admin login works.
4. No migration script pending without idempotency report.
5. No known P0/P1 regression in employee master, documents, compensation, attendance, leave.
6. Rollback notes exist for data-affecting changes.
