# ACV Customer Zero UAT Readiness Pack

**Date**: 2026-06-08
**Verdict**: READY FOR CONTROLLED ACV UAT

## Automated Test Summary

| Layer | Tests | Passed | Failed | Status |
|-------|-------|--------|--------|--------|
| Backend API (Jest) | 80 | 80 | 0 | GREEN |
| Browser E2E (Playwright) | 101 | 89 | 0 | GREEN (12 conditional skip) |
| **Total** | **181** | **169** | **0** | **GREEN** |

## Module Readiness

| Module | Browser E2E | API Tests | UAT Status |
|--------|------------|-----------|------------|
| Auth | 7 tests | 15 tests | **GREEN** |
| RBAC | 14 tests | 13 tests | **GREEN** |
| Tenant Isolation | 6 tests | 4 tests | **GREEN** |
| Employee Master | 4 tests | 8 tests | **GREEN** |
| Leave | 14 tests | 9 tests | **GREEN** |
| Attendance | 16 tests | 7 tests | **GREEN** |
| Documents | 20 tests | 16 tests | **GREEN** |
| Compensation/Payslips | 20 tests | 6 tests | **GREEN** |
| HR Connect | 0 | 0 | **AMBER** — manual UAT |
| Reports | 1 (access) | 0 | **AMBER** — manual UAT |
| Dashboard | 1 (load) | 0 | **AMBER** — manual UAT |
| Onboarding/Probation/Exit | 0 | 0 | GREY — parked |
| Manu AI | 0 | 0 | GREY — parked |
| Mobile | 0 | 0 | GREY — separate sprint |

## Critical HRMS Risks — All Verified

- **Tenant leakage**: 6 E2E + 4 API = no cross-tenant data visible
- **Role leakage**: 14 E2E + 13 API = unauthorized routes denied
- **Salary leakage**: 20 E2E + 6 API = no salary data in error responses
- **Document leakage**: 20 E2E + 16 API = employee docs isolated, company vault restricted
- **Auth bypass**: 7 E2E + 15 API = protected routes redirect, invalid tokens rejected

## UAT Entry Criteria — Met

- [x] Backend tests pass (80/80)
- [x] Browser E2E tests pass (89/101, 12 conditional)
- [x] CI pipelines green (backend + E2E)
- [x] No tenant-isolation issue open
- [x] No salary-leakage issue open
- [x] No document-leakage issue open
- [x] No role-access issue open
- [x] Login works for all 4 ACV roles
- [x] Leave lifecycle automated end-to-end
- [x] Attendance clock-in works
- [x] Document upload works

## Full Details

See: `docs/qa/playwright-e2e-uat-readiness-pack/report.md`
