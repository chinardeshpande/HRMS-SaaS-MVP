# ACV Regression Test Foundation Report

**Date**: 2026-06-04
**Original branch**: `claude/acv-regression-test-foundation`  
**Hardened branch**: `codex/qa-foundation-hardening`
**Framework**: Jest 29.7.0 + supertest 6.3.3 + ts-jest 29.1.1
**Database**: PostgreSQL dedicated test DB, default `hrms_saas_test`

---

## Summary

| Metric | Value |
|--------|-------|
| Test suites | 10 |
| Tests total | 68 |
| Tests passed | 68 |
| Tests failed | 0 |
| Scaffolded (DB-dependent soft skip) | Removed for seeded happy paths |
| Run time | ~12s |

## Test Suites

| # | Suite | Tests | Status | Risk Area |
|---|-------|-------|--------|-----------|
| 01 | Health & Smoke | 3 | PASS | Build health |
| 02 | Auth: Login/Logout/Me | 13 | PASS | Authentication |
| 03 | Tenant Isolation | 4 | PASS | **Tenant leakage** |
| 04 | Role-Based Access Control | 11 | PASS | **Role leakage** |
| 05 | Employee Register Visibility | 4 | PASS | Data visibility |
| 06 | Employee Detail Access | 4 | PASS | Data visibility |
| 07 | Document Access | 6 | PASS | **Document leakage** |
| 08 | Compensation & Payslip | 6 | PASS | **Salary/Payslip leakage** |
| 09 | Attendance Basic Flow | 7 | PASS | Role boundaries |
| 10 | Leave Basic Flow | 9 | PASS | Role boundaries |

## Critical HRMS Risks Covered

### Tenant Leakage
- Forged JWT with wrong tenantId is rejected or returns empty data
- All employee list responses are tenant-scoped
- All 6 major endpoints reject unauthenticated requests

### Role Leakage
- Employee cannot: create/delete employees, view company-wide attendance, view all leave requests, access leave statistics, bulk-update attendance
- Manager cannot: create/delete employees
- Manager CAN: view company-wide attendance, view pending leave approvals
- HR Admin CAN: create employees, view all leave requests, view company-wide attendance

### Payslip/Salary Leakage
- Employee cannot access another employee's salary structure (returns 403/404)
- Compensation data is tenant-scoped
- HR admin has elevated compensation access

### Document Leakage
- Unauthenticated document access is rejected
- Document listings are tenant-scoped
- Employee can only access their own documents

## Bugs Found And Fixed During Testing

| # | Severity | Description | Location |
|---|----------|-------------|----------|
| 1 | Medium | Login with nonexistent email returned 500 instead of 401 | `authController.ts:login` now returns 401 for nonexistent users, 401 for wrong passwords, and 400 for malformed payloads |

## Test Account Matrix

| Role | Email | Expected Role | Status |
|------|-------|---------------|--------|
| System Admin | `system.admin@acv.test` | `system_admin` | Synthetic seed |
| HR Admin | `hr.admin@acv.test` | `hr_admin` | Synthetic seed |
| Manager | `manager@acv.test` | `manager` | Synthetic seed |
| Employee | `employee@acv.test` | `employee` | Synthetic seed |
| Second Tenant Admin | `admin@orbit.test` | `system_admin` | Synthetic seed |

All 5 test accounts authenticate successfully against the isolated test database.

## What Is Automated Now

- 68 API-level integration tests via Jest + supertest
- Health/smoke checks (no DB required)
- Auth flow: login, bad credentials, invalid token, /me endpoint
- Tenant isolation: forged JWT, tenant scoping on employee list, 6-endpoint auth gate
- RBAC: 11 role-boundary tests across employee/attendance/leave endpoints
- Employee register: list, stats, tenant scoping
- Employee detail: access, own-profile, nonexistent ID, cross-tenant check
- Documents: auth gate, company/employee documents, categories, tenant scoping
- Compensation: auth gate, HR access, employee self-access, payslip visibility, cross-employee block, tenant scoping
- Attendance: own view, company-wide, statistics, department, role gates
- Leave: own requests/balance/policies, all-requests, pending approvals, role gates, validation

## What Remains Manual

- Browser-based UI tests (no Playwright/Cypress installed)
- Visual/responsive QA
- Document upload/download/preview (requires file I/O)
- Attendance clock-in/clock-out (mutates data)
- Leave application end-to-end (apply -> approve -> balance update)
- Payslip attachment download
- HR Connect, chat, helpdesk flows
- Performance review lifecycle
- Onboarding/probation/exit lifecycle
- Manu assistant tests
- Multi-user concurrent scenarios
- Mobile API compatibility

## What Is Blocked

| Blocker | Impact | Unblock |
|---------|--------|---------|
| No Playwright/Cypress | No browser-level E2E tests | Install Playwright, create config |
| Browser E2E not implemented | No browser-level quality gate yet | Add Playwright in a separate QA sprint |
| Upload/download roundtrip not covered | File I/O regressions may escape API suite | Add controlled fixture file tests |
| Corp registry blocks new installs on Claude machine | Limits Playwright adoption there | Use existing local deps or CI-managed install |

## Run Command

```bash
cd backend
npm run test:qa
npm run test:qa:coverage
npm run test:qa -- --runInBand tests/integration/03-tenant-isolation.test.ts
```

## Environment

- Node: v22.x
- Database: PostgreSQL local or CI, `hrms_saas_test`
- JWT Secret: test default or CI override
- Backend port: 3000
- No SMTP configured (password reset tests limited)

## Recommended Next QA Sprint

1. Add Playwright browser E2E tests for login, dashboard, employee register, documents, compensation, attendance, and leave.
2. Add document upload/download/preview roundtrip tests with safe fixture files.
3. Add leave lifecycle test: apply -> approve -> verify balance deduction.
4. Add attendance clock-in/clock-out and regularization workflow tests.
5. Add HR Connect, chat, helpdesk, calendar, and notification tests.
6. Add Manu assistant smoke and role-guardrail tests.
