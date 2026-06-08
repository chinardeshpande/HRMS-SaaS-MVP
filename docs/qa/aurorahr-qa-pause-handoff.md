# AuroraHR QA/E2E Stream — Pause Handoff

**Date**: 2026-06-08
**Status**: Paused
**Resume trigger**: Chinar decides to proceed with ACV UAT or resumes QA work

---

## Completed Branches

| # | Branch | Commit | What |
|---|--------|--------|------|
| 1 | `claude/acv-regression-test-foundation` | `f7bcda5` | 65 Jest API tests (auth, RBAC, tenant, employee, docs, comp, attendance, leave) |
| 2 | `claude/acv-e2e-test-plan` | `1b97a8b` | E2E strategy doc with 46 test cases, Playwright structure proposal |
| 3 | `claude/document-lifecycle-test-review-plan` | `67f6375` | Review checklist for document/payslip lifecycle (13 critical checks) |
| 4 | `claude/playwright-e2e-foundation` | `fb09e0f` | Playwright scaffold (38 tests, 6 specs, fixtures, config) |
| 5 | `claude/playwright-e2e-ci-execution` | `89f3f95` | GitHub Actions E2E workflow — first green CI run (36 passed) |
| 6 | `claude/playwright-e2e-tenant-document-expansion` | `1c37136` | Tenant isolation + document expansion (52 passed) |
| 7 | `claude/playwright-e2e-leave-workflow` | `790cd3b` | Full leave apply → approve → verify (60 passed) |
| 8 | `claude/playwright-e2e-document-roundtrip` | `e589208` | Document upload/list/access roundtrip (67 passed) |
| 9 | `claude/playwright-e2e-compensation-depth` | `a146186` | Compensation tab + salary leak checks (73 passed) |
| 10 | `claude/playwright-e2e-attendance-workflow` | `e16e986` | Attendance clock-in + role views (89 passed) |
| 11 | `claude/playwright-e2e-uat-readiness-pack` | `bc76e28` | UAT readiness evidence pack |
| 12 | `claude/production-smoke-test-acv-pilot` | `5cfbc5b` | Production smoke (20 pass, 1 fail, 11 need credentials) |

Codex branches reviewed by Claude:
- `codex/qa-foundation-hardening` (`2fd4f7a`) — PASS
- `codex/document-lifecycle-api-tests` (`e3e7efc`) — PASS
- `codex/document-lifecycle-test-stability-fixes` (`a849bce`) — PASS

---

## Current Coverage

| Layer | Tests | Status |
|-------|-------|--------|
| Backend API (Jest) | 80 | All pass |
| Browser E2E (Playwright) | 101 (89 pass, 12 conditional skip) | All pass in CI |
| **Total** | **181** | **GREEN** |

---

## UAT Readiness Verdict

**READY FOR CONTROLLED ACV UAT** — subject to:
1. Deploy auth hardening to production (non-string payload returns 500)
2. Chinar completes authenticated smoke (manual checklist or provides credentials)

---

## Amber Areas (Manual UAT Needed)

- HR Connect (feed/comment/react)
- HR Analytics / Reports (report building)
- Dashboard widget data verification
- Document/payslip actual file download trigger
- Leave reject workflow
- Responsive UI (mobile/tablet)

---

## When Claude Resumes — Do This

1. **If Chinar completed manual UAT**: review results, close remaining gaps
2. **If credentials provided**: run Playwright against production for authenticated smoke
3. **If staging deployed**: run full E2E suite against staging
4. **Then**: HR Connect E2E → responsive viewport tests → leave reject → visual regression

---

## Codex Expected To Finish

- Merge `codex/qa-foundation-hardening` + `codex/document-lifecycle-api-tests` to main
- Deploy auth hardening to production
- Fix HR Analytics defects (Amber module)

---

## Do Not Do Yet

- Do not run Playwright against production without credentials
- Do not add new product features under QA branches
- Do not restore historical ACV documents (data-migration, not QA)
- Do not start Manu AI testing (not ready)
- Do not start mobile E2E (separate sprint)
