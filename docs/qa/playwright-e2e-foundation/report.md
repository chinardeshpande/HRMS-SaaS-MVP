# Playwright E2E Foundation Report

**Date**: 2026-06-08
**Branch**: `claude/playwright-e2e-foundation`
**Status**: Scaffold complete. Tests NOT run. Playwright installation blocked.

---

## Summary

| Metric | Value |
|--------|-------|
| Spec files | 6 |
| Test cases | 38 (36 active + 2 skipped) |
| Tests run | 0 (Playwright not installed) |
| Framework | Playwright (proposed) |
| Browser | Chromium (proposed) |

## Blocker

```
npm error 403 403 Forbidden - GET https://registry.npmjs.org/playwright
```

The corporate network blocks npm registry access. Playwright cannot be installed on this machine.

### Unblock options

1. **Personal machine**: Install Playwright on a personal M5 Max (no corp proxy)
2. **CI only**: Add Playwright to GitHub Actions workflow (npm ci works in CI)
3. **VPN bypass**: If corp allows selective npm registry access via VPN
4. **Offline install**: Download Playwright .tgz from another machine, `npm install ./playwright-test-*.tgz`

## What Was Created

### E2E infrastructure

| File | Purpose |
|------|---------|
| `e2e/playwright.config.ts` | Playwright configuration (Chromium, screenshots on failure, traces on retry) |
| `e2e/fixtures/users.ts` | Test account matrix (mirrors backend seed data) |
| `e2e/fixtures/test-data.ts` | Expected data constants, route role mappings |
| `e2e/utils/auth.ts` | Login via UI, login via API + localStorage injection, logout, redirect assertion |
| `e2e/utils/routes.ts` | Route constants |
| `e2e/README.md` | Setup instructions, test structure, account matrix |

### Test specs (38 tests)

| Spec | Tests | Active | Skipped | Coverage |
|------|-------|--------|---------|----------|
| `auth.spec.ts` | 7 | 7 | 0 | Login success, wrong password, bad email, logout, protected routes |
| `rbac.spec.ts` | 16 | 16 | 0 | Employee denied admin/manager routes, HR admin full access, manager restrictions |
| `employees.spec.ts` | 4 | 4 | 0 | HR opens list, HR clicks detail, employee denied register, employee opens profile |
| `documents.spec.ts` | 4 | 4 | 0 | Employee own docs, employee denied library, HR/manager access library |
| `compensation.spec.ts` | 4 | 4 | 0 | HR access, employee denied, manager denied, no salary leak on denial |
| `leave.spec.ts` | 5 | 3 | 2 | Page access (3 roles), apply/approve skipped (manual/UAT) |

### Critical HRMS risks covered by E2E specs

| Risk | Spec | Test IDs |
|------|------|----------|
| Tenant leakage | (not in first pack — needs multi-context Playwright tests) | Future |
| Role leakage | `rbac.spec.ts` | 16 tests across all ADMIN_ONLY and MANAGER_PLUS routes |
| Document leakage | `documents.spec.ts` | DC01-DC04 |
| Salary leakage | `compensation.spec.ts` | C01-C04 (including no-salary-in-denial check) |
| Auth bypass | `auth.spec.ts` | A05-A07 (protected routes redirect) |

## Backend QA Command Verification

```bash
cd backend && npm run test:qa
# Test Suites: 11 passed, 11 total
# Tests: 80 passed, 80 total
```

Backend tests remain green and unaffected.

## Recommended Next Steps

1. **Install Playwright** on personal machine or CI
2. **Run the 36 active tests** — fix any selector/timing issues against the live UI
3. **Add tenant isolation E2E** — multi-context test with ACV + Orbit simultaneous logins
4. **Add leave workflow E2E** — apply → approve → verify status change
5. **Add document upload/download E2E** — file interaction through the browser
6. **Add CI workflow** for E2E tests (separate from backend tests due to browser download size)
7. **Add screenshot baseline** for visual regression (optional)
