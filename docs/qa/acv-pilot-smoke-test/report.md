# ACV Pilot Production Smoke Test

**Date**: 2026-06-08
**Branch**: `claude/production-smoke-test-acv-pilot`
**Target environment**: `https://aurorahr.in` (production)
**Test scope**: Infrastructure and unauthenticated checks only
**Authenticated testing**: NOT PERFORMED — requires ACV pilot credentials from Chinar

---

## 1. Smoke Test Plan

### Target environment

| Property | Value |
|----------|-------|
| URL | `https://aurorahr.in` |
| API | `https://aurorahr.in/api/v1` |
| Server | nginx/1.24.0 (Ubuntu) |
| Environment label | `production` |
| Last deploy | 2026-06-05 (based on Last-Modified header) |

### Test users required (from Chinar)

| Role | Expected email | Purpose |
|------|---------------|---------|
| System Admin / Tenant Owner | `chinar@acvsolutions.in` | Full access smoke test |
| HR Admin | ACV HR admin email | HR workflow smoke test |
| Manager | ACV manager email | Team view and approval smoke test |
| Employee | ACV employee email | Self-service smoke test |

**Note**: Synthetic test accounts (`*.acv.test`) are NOT available in production. Production smoke requires real ACV credentials.

### Safety rules

| Action | Permission |
|--------|-----------|
| Login/logout | SAFE — read-only session |
| View dashboard, employee list, detail pages | SAFE — read-only |
| View leave page, attendance page | SAFE — read-only |
| View documents, compensation tabs | SAFE — read-only |
| Navigate to denied routes | SAFE — tests access control |
| Upload test documents | AVOID unless approved by Chinar |
| Apply for leave | AVOID unless using a test employee |
| Clock in/out | AVOID unless approved |
| Change salary/compensation | PROHIBITED |
| Delete/archive employees | PROHIBITED |
| Modify tenant settings | PROHIBITED |
| Change passwords | PROHIBITED |

---

## 2. Executed Checks (Unauthenticated — Safe)

### Infrastructure

| # | Check | Result | Details |
|---|-------|--------|---------|
| S01 | Health endpoint responsive | **PASS** | `{"status":"healthy","environment":"production"}` |
| S02 | API welcome endpoint | **PASS** | `{"message":"Welcome to HRMS SaaS API","version":"v1"}` |
| S03 | Frontend loads (HTTP 200) | **PASS** | 2848 bytes, HTML served correctly |
| S04 | HTTPS active | **PASS** | Strict-Transport-Security header present |

### Authentication gate (all endpoints reject unauthenticated requests)

| # | Endpoint | Expected | Result |
|---|----------|----------|--------|
| S05 | `/api/v1/auth/me` | 401 | **PASS** |
| S06 | `/api/v1/employees` | 401 | **PASS** |
| S07 | `/api/v1/attendance/my-attendance` | 401 | **PASS** |
| S08 | `/api/v1/leave/my-requests` | 401 | **PASS** |
| S09 | `/api/v1/compensation` | 401 | **PASS** |
| S10 | `/api/v1/company-documents` | 401 | **PASS** |
| S11 | `/api/v1/departments` | 401 | **PASS** |
| S12 | `/api/v1/settings` | 401 | **PASS** |

### Security headers

| # | Header | Result |
|---|--------|--------|
| S13 | Content-Security-Policy | **PASS** — present on API responses |
| S14 | Strict-Transport-Security | **PASS** — `max-age=15552000; includeSubDomains` |
| S15 | X-Content-Type-Options | **PASS** — `nosniff` |
| S16 | Cross-Origin-Opener-Policy | **PASS** — `same-origin` |
| S17 | X-DNS-Prefetch-Control | **PASS** — `off` |
| S18 | Referrer-Policy | **PASS** — `no-referrer` |
| S19 | Server header | **ADVISORY** — `nginx/1.24.0 (Ubuntu)` exposed (consider hiding version) |
| S20 | Frontend security headers | **ADVISORY** — Static file responses from nginx lack Helmet headers (only API has them) |

### Login error handling

| # | Scenario | Expected | Result | Notes |
|---|----------|----------|--------|-------|
| S21 | Empty body `{}` | 400 | **PASS** — 400 `VALIDATION_ERROR` |
| S22 | Nonexistent email | 401 | **PASS** — 401 `INVALID_CREDENTIALS` |
| S23 | Malformed email | 400 | **ADVISORY** — Returns 401 instead of 400 | Auth hardening not yet deployed |
| S24 | Non-string payload | 400 | **FAIL** — Returns 500 `SERVER_ERROR` | Auth hardening not yet deployed |

---

## 3. Deployment Gap Findings

| # | Finding | Severity | Root cause |
|---|---------|----------|------------|
| DG1 | Non-string login payload returns 500 instead of 400 | Medium | Auth hardening (`2fd4f7a`) not deployed to production |
| DG2 | Malformed email returns 401 instead of 400 | Low | Same — email regex validation not in production |
| DG3 | Nginx server version exposed in headers | Low | Nginx config should add `server_tokens off` |
| DG4 | Frontend static files lack security headers | Low | Nginx config should add Helmet-equivalent headers for static assets |

**Recommendation**: Deploy `codex/qa-foundation-hardening` (or main merge of it) to production before ACV UAT begins. This closes DG1 and DG2.

---

## 4. UAT Gate Checklist

### Infrastructure (Claude-verified — no credentials needed)

| Gate | Status |
|------|--------|
| Backend health | **PASS** |
| API responsive | **PASS** |
| Frontend loads | **PASS** |
| HTTPS active | **PASS** |
| All endpoints require auth | **PASS** (8/8 endpoints) |
| Security headers on API | **PASS** |
| Login errors are safe | **PASS** (no data leakage) |
| Auth hardening deployed | **NOT YET** — deploy before UAT |

### Authenticated (requires Chinar — not yet tested)

| Gate | Status | Action needed |
|------|--------|---------------|
| HR Admin login | NOT TESTED | Chinar provides credentials or tests |
| Employee login | NOT TESTED | Chinar provides credentials or tests |
| Manager login | NOT TESTED | Chinar provides credentials or tests |
| Dashboard loads per role | NOT TESTED | Chinar tests or provides browser access |
| Employee list renders | NOT TESTED | |
| Leave page works | NOT TESTED | |
| Attendance page works | NOT TESTED | |
| Documents accessible | NOT TESTED | |
| Compensation visible for HR | NOT TESTED | |
| Role denial works | NOT TESTED | |
| No cross-tenant leakage | NOT TESTED | |
| Production smoke pass | **BLOCKED** — needs credentials | |

---

## 5. What Chinar Needs To Do

### Option A: Chinar runs the manual UAT checklist

1. Login as HR Admin at `https://aurorahr.in/login`
2. Walk through the HR Admin checklist from `ACV-UAT-Readiness-Pack.md`
3. Login as Manager, walk through Manager checklist
4. Login as Employee, walk through Employee checklist
5. Report results in `docs/qa/acv-pilot-smoke-test/uat-results.md`

### Option B: Chinar provides temporary pilot credentials for Claude

1. Provide ACV HR Admin email/password
2. Provide ACV Employee email/password
3. Claude runs authenticated browser smoke checks via Playwright against production
4. **Risk**: Production data visible — screenshots must be redacted

### Option C: Deploy test branch to staging environment

1. Create a staging/pilot environment with test DB
2. Seed synthetic ACV data
3. Claude runs full E2E suite against staging
4. **Preferred** — no real data risk

---

## 6. Evidence

### Screenshots

Not captured — authenticated access not available.

### API response captures

All unauthenticated checks captured in this report. No PII exposed. No credentials used.

### Artifacts location

```
docs/qa/acv-pilot-smoke-test/report.md  — this file
```

---

## 7. Summary

| Category | Checks | Pass | Fail | Advisory | Not tested |
|----------|--------|------|------|----------|------------|
| Infrastructure | 4 | 4 | 0 | 0 | 0 |
| Auth gate | 8 | 8 | 0 | 0 | 0 |
| Security headers | 8 | 6 | 0 | 2 | 0 |
| Login error handling | 4 | 2 | 1 | 1 | 0 |
| Authenticated flows | 11 | 0 | 0 | 0 | 11 |
| **Total** | **35** | **20** | **1** | **3** | **11** |

### Verdict

**INFRASTRUCTURE PASS. AUTHENTICATED SMOKE BLOCKED — needs ACV credentials or staging deploy.**

The production environment is healthy, secured, and correctly rejects unauthenticated access. One non-critical failure (DG1: non-string payload returns 500) is a known fix pending deployment. The auth hardening branch should be deployed before UAT begins.

To complete the UAT release gate, Chinar must either:
1. Run the manual UAT checklists (Option A) — fastest
2. Provide temporary credentials for Claude smoke checks (Option B)
3. Deploy to staging with test data for full automated smoke (Option C — safest)
