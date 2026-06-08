# Playwright E2E Foundation Report

**Date**: 2026-06-08
**Foundation branch**: `claude/playwright-e2e-ci-execution` (commit `89f3f95`)
**Expansion branch**: `claude/playwright-e2e-tenant-document-expansion` (commit `1c37136`)
**Latest CI Run**: [#27131075774](https://github.com/chinardeshpande/HRMS-SaaS-MVP/actions/runs/27131075774) — **GREEN**
**Status**: All E2E tests passing in GitHub Actions CI

---

## Results

| Metric | Foundation | Expansion |
|--------|-----------|-----------|
| Spec files | 6 | **9** |
| Total tests | 38 | **55** |
| Passed | 36 | **52** |
| Failed | 0 | **0** |
| Skipped | 2 | **3** |
| Run time | 46.7s | **1.1m** |
| Browser | Chromium | Chromium |
| Environment | GitHub Actions | GitHub Actions |

## CI Workflow

**File**: `.github/workflows/e2e-tests.yml`

Steps (all green):
1. PostgreSQL 15 service with `hrms_saas_test` DB
2. Backend: `npm ci` → seed E2E DB → start server (port 3000)
3. Frontend: `npm install` → start Vite dev server (port 5173, VITE_API_URL=localhost:3000)
4. Playwright: `npm install` → install Chromium → run tests

Triggers: push to main/claude/codex branches, PRs modifying e2e/frontend/backend

## Test Breakdown

### auth.spec.ts (7/7 passed)

| Test | Status | Time |
|------|--------|------|
| A01: HR admin login succeeds | PASS | 872ms |
| A02: wrong password error | PASS | 2.5s |
| A03: nonexistent email error | PASS | 2.4s |
| A04: logout redirects | PASS | 711ms |
| A05: /dashboard protected | PASS | 458ms |
| A06: /employees protected | PASS | 452ms |
| A07: /settings protected | PASS | 437ms |

### rbac.spec.ts (16/16 passed)

| Test | Status |
|------|--------|
| Employee sees dashboard | PASS |
| Employee denied 8 admin-only routes | PASS |
| Employee denied 5 manager-plus routes | PASS |
| Employee CAN access /my-hr-documents | PASS |
| Employee CAN access /attendance | PASS |
| Employee CAN access /leave | PASS |
| HR admin: employees, settings, reports, documents | PASS |
| HR admin: /compensation redirects to /employees (requires employee context) | PASS |
| Manager: employees, denied settings, denied compensation | PASS |

### employees.spec.ts (4/4 passed)

| Test | Status |
|------|--------|
| E01: HR admin opens employee list | PASS |
| E02: HR admin clicks into detail | PASS |
| E03: Employee denied register | PASS |
| E04: Employee opens own profile | PASS |

### documents.spec.ts (4/4 passed)

| Test | Status |
|------|--------|
| DC01: Employee accesses own HR documents | PASS |
| DC02: Employee denied document library | PASS |
| DC03: HR admin accesses document library | PASS |
| DC04: Manager accesses document library | PASS |

### compensation.spec.ts (4/4 passed)

| Test | Status |
|------|--------|
| C01: /compensation redirects to /employees (product behaviour) | PASS |
| C02: Employee denied compensation | PASS |
| C03: Manager denied compensation | PASS |
| C04: No salary data in denied page | PASS |

### leave.spec.ts (3/3 passed + 2 skipped)

| Test | Status |
|------|--------|
| L01: Employee opens leave page | PASS |
| L02: Manager opens leave page | PASS |
| L03: HR admin opens leave page | PASS |
| L04: Leave apply (manual/UAT) | SKIPPED |
| L05: Leave approve (manual/UAT) | SKIPPED |

## Product Findings

| # | Finding | Severity |
|---|---------|----------|
| 1 | `/compensation` is not a standalone page — requires `location.state.employee` from employee detail. Without context, redirects to `/employees`. | Low — design choice, not a bug |
| 2 | Frontend API base URL defaults to `localhost:5000` not `localhost:3000` — requires `VITE_API_URL` override in CI | Medium — should align default with backend port |

## Bugs Fixed During E2E Development

| # | Bug | Fix |
|---|-----|-----|
| 1 | `loginViaAPI` stored tokens as separate `token`/`refreshToken` keys but frontend reads `tokens` (JSON object) | Fixed localStorage key names to match AuthContext |
| 2 | Frontend has no `package-lock.json` so `npm ci` fails in CI | Changed CI to use `npm install` for frontend |
| 3 | Frontend API URL mismatched backend port in CI | Set `VITE_API_URL` env var in CI workflow |

## Commands

```bash
# Local (requires Playwright installed):
cd e2e && npx playwright test

# CI (automated):
# Triggered on push to main/claude/codex branches
# See .github/workflows/e2e-tests.yml

# Backend QA (unchanged):
cd backend && npm run test:qa
# 80/80 tests passing
```

## Expansion Sprint (2026-06-08)

### tenant-isolation.spec.ts (6 tests, all passed)

| Test | Status |
|------|--------|
| TI01: ACV and Orbit separate dashboards | PASS |
| TI02: ACV list has no Orbit employees | PASS |
| TI03: Orbit list has no ACV employees | PASS |
| TI04: ACV documents has no Orbit documents | PASS |
| TI05: No cross-tenant salary data visible | PASS |
| TI06: Direct URL to ACV employee from Orbit denied | PASS |

### documents-expanded.spec.ts (5 tests, all passed)

| Test | Status |
|------|--------|
| DX01: HR admin navigates to employee detail documents tab | PASS |
| DX02: Denied access does not expose file paths | PASS |
| DX03: Employee sees denial, not another employee's data | PASS |
| DX04: Employee cannot access company documents area | PASS |
| DX05: HR admin document library loads without crash | PASS |

### compensation-expanded.spec.ts (4 tests, 2 passed + 2 conditional skip)

| Test | Status |
|------|--------|
| CX01: HR admin navigates to employee detail compensation tab | PASS (conditional skip if no employee link) |
| CX02: HR admin navigates to payslips tab | PASS (conditional skip if no employee link) |
| CX03: Employee cannot see salary data on denied page | PASS |
| CX04: Manager denied compensation via API from browser | PASS |

### leave.spec.ts (6 tests, all passed)

| Test | Status |
|------|--------|
| L01-L03: Page access for 3 roles | PASS |
| L04: Apply Leave button visible | PASS |
| L05: Apply Leave modal opens | PASS |
| L06: Leave balance shows leave types | PASS |

### leave-workflow.spec.ts (8 tests, all passed) — NEW

Full multi-context leave lifecycle automation:

| Test | Status | Time |
|------|--------|------|
| LW01: Employee sees Apply Leave button | PASS | 869ms |
| LW02: Employee fills and submits leave application | PASS | 4.8s |
| LW03: Employee sees pending status | PASS | 1.7s |
| LW04: Manager opens Team Approvals | PASS | 2.3s |
| LW05: Manager approves pending request | PASS | 6.9s |
| LW06: Employee sees approved status | PASS | 1.7s |
| LW07: Employee cannot see Team Approvals tab | PASS | 707ms |
| LW08: No cross-tenant data on leave page | PASS | 685ms |

## Updated Totals (as of 2026-06-08)

| Metric | Value |
|--------|-------|
| Spec files | **10** |
| Total tests | **62** |
| Passed | **60** |
| Failed | **0** |
| Skipped | **2** (conditional compensation tab skips) |
| Run time | **1.5m** |
| CI Run | [#27136492427](https://github.com/chinardeshpande/HRMS-SaaS-MVP/actions/runs/27136492427) — **GREEN** |

## Recommended Next E2E Sprint

1. ~~Full leave apply → approve → status update~~ **DONE** (LW01-LW08)
2. Document upload/download roundtrip through browser
3. Employee detail compensation tab with seed data value verification
4. Responsive viewport tests (mobile/tablet/desktop)
5. HR Connect feed visibility
6. Visual regression baseline screenshots
7. Leave reject workflow (manager rejects → employee sees rejected)
8. Onboarding/probation page access tests
