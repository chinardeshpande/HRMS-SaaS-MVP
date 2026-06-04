# ACV Regression Test Foundation Report

**Date**: 2026-06-04
**Branch**: `claude/acv-regression-test-foundation`
**Framework**: Jest 29.7.0 + supertest 6.3.3 + ts-jest 29.1.1
**Database**: PostgreSQL (local, `hrms_saas`)

---

## Summary

| Metric | Value |
|--------|-------|
| Test suites | 10 |
| Tests total | 65 |
| Tests passed | 65 |
| Tests failed | 0 |
| Scaffolded (DB-dependent soft skip) | ~8 tests conditionally skip if accounts missing |
| Run time | ~10s |

## Test Suites

| # | Suite | Tests | Status | Risk Area |
|---|-------|-------|--------|-----------|
| 01 | Health & Smoke | 3 | PASS | Build health |
| 02 | Auth: Login/Logout/Me | 10 | PASS | Authentication |
| 03 | Tenant Isolation | 3 | PASS | **Tenant leakage** |
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

## Bugs Found During Testing

| # | Severity | Description | Location |
|---|----------|-------------|----------|
| 1 | Medium | Login with nonexistent email returns 500 instead of 401 | `authController.ts:login` — bcrypt.compare throws when user is null |

## Test Account Matrix

| Role | Email | Expected Role | Status |
|------|-------|---------------|--------|
| System Admin (Tenant Owner) | `chinar@acvsolutions.in` | `system_admin` | Verified — login works |
| HR Admin | `hr@acvsolutions.in` | `hr_admin` | Verified — login works |
| Manager | `manager@acvsolutions.in` | `manager` | Verified — login works |
| Employee | `employee@acvsolutions.in` | `employee` | Verified — login works |

All 4 test accounts authenticate successfully against the local database.

## What Is Automated Now

- 65 API-level integration tests via Jest + supertest
- Health/smoke checks (no DB required)
- Auth flow: login, bad credentials, invalid token, /me endpoint
- Tenant isolation: forged JWT, tenant scoping on employee list, 6-endpoint auth gate
- RBAC: 11 role-boundary tests across employee/attendance/leave endpoints
- Employee register: list, stats, tenant scoping
- Employee detail: access, own-profile, nonexistent ID, cross-tenant check
- Documents: auth gate, company/employee documents, categories, tenant scoping
- Compensation: auth gate, HR access, employee self-access, cross-employee block, tenant scoping
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
| No test database isolation | Tests run against local dev DB | Add test DB or transaction rollback wrapper |
| No CI pipeline for tests | Tests only run locally | Add Jest step to GitHub Actions |
| Corp registry blocks `npm install` | Cannot add new deps on this machine | Use personal machine or registry override |

## Run Command

```bash
cd backend
npx jest --config jest.config.ts --no-coverage          # all tests
npx jest --config jest.config.ts --testPathPattern="03"  # single suite
npm test                                                  # with coverage
```

## Environment

- Node: v22.x
- Database: PostgreSQL local, `hrms_saas`
- JWT Secret: development default
- Backend port: 3000
- No SMTP configured (password reset tests limited)

## Recommended Next QA Sprint

1. **Fix Bug #1**: Login 500 for nonexistent users
2. **Add test DB isolation**: Wrap integration tests in transactions or use a test-specific DB
3. **Install Playwright**: Browser E2E tests for login flow, dashboard, employee CRUD
4. **Add to CI**: GitHub Actions step to run `npm test` on PR
5. **Expand compensation tests**: Payslip download, salary history, share log
6. **Leave lifecycle test**: Apply -> approve -> verify balance deduction
7. **Document upload test**: Upload, verify, download roundtrip
8. **Manu assistant smoke test**: Basic query, role guardrails
