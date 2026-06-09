# Production Deployment Alignment Report

**Date:** 2026-06-09  
**Branch:** `codex/production-deployment-alignment`  
**Base accepted code:** `codex/hr-analytics-repair` at `f7545bcc7d6e84bdc2c5ad04d825c9f4fc4bd0ef`

## Objective

Align production with the accepted QA-hardened AuroraHR baseline before ACV controlled UAT.

## Accepted Baseline Included

The branch is based on `codex/hr-analytics-repair`, which already contains the accepted Codex chain:

| Accepted workstream | Commit | Included |
| --- | --- | --- |
| QA foundation hardening | `d463ef6c5d37b01e65f467f1e167a9112270abbd` | Yes |
| Document lifecycle test stability fixes | `a849bceca2c3d758ef156c8dca402aee0782e821` | Yes |
| ACV functional solidity sprint | `781b4d738fbcf002d3d3002c3729d9cfcf8314dc` | Yes |
| HR Analytics repair | `f7545bcc7d6e84bdc2c5ad04d825c9f4fc4bd0ef` | Yes |
| ACV Customer Zero UAT readiness docs | `bc76e283ce40378996cddf27ad9070e516aef2b2` | Cherry-picked with UAT gate wording resolved |
| ACV pilot production smoke docs | `5cfbc5bae7ce553d90259729f621d884881ad9e7` | Cherry-picked |

Experimental/unaccepted UI and Manu AI branches were intentionally excluded.

## Pre-Deployment Verification

Run from `/private/tmp/aurorahr-production-deployment-alignment`.

| Check | Command | Result |
| --- | --- | --- |
| Backend build | `npm --prefix backend run build` | Passed |
| Backend QA | `DB_USER=$(whoami) DB_PASSWORD='' TEST_DB_NAME=hrms_saas_test npm --prefix backend run test:qa` | Passed: 12 suites, 95 tests |
| Frontend build | `npm --prefix frontend-web run build` | Passed |

Note: the first default QA attempt failed locally because this machine's PostgreSQL does not have the default `postgres` role. The suite passed against the isolated `hrms_saas_test` database using the local macOS PostgreSQL role.

## Auth Hardening Status

The accepted baseline includes the production-critical auth fix:

| Scenario | Expected result | Covered |
| --- | --- | --- |
| Nonexistent email | `401 INVALID_CREDENTIALS` | Yes |
| Wrong password | `401 INVALID_CREDENTIALS` | Yes |
| Malformed email | `400 VALIDATION_ERROR` | Yes |
| Non-string email/password payload | `400 VALIDATION_ERROR` | Yes |
| Genuine unexpected login error | `500 SERVER_ERROR` | Existing fallback retained |

Production is known to be behind this baseline until deployment completes.

## Deployment Target

Existing deployment mechanism:

- Workflow: `.github/workflows/deploy-aurorahr.yml`
- Trigger: push to `main`/`master` for code changes, or manual `workflow_dispatch`
- Target: `https://aurorahr.in`
- Server secret: `PRODUCTION_SERVER_IP`
- SSH secret: `PRODUCTION_SSH_KEY`
- Frontend production API URL: `https://aurorahr.in/api/v1`
- Frontend socket URL: `https://aurorahr.in`

## Migration and Rollback Notes

The deployment workflow already performs:

1. Backend/frontend artifact build.
2. Production backend/frontend backup.
3. Production database backup via `pg_dump` before migrations.
4. `npm run migrate` on production backend.
5. `pm2` backend restart.
6. Frontend static deployment.
7. Rollback job on deployment failure.

No historical documents or production credentials are committed in this branch.

## Required Production Smoke After Deployment

After deployment, run safe smoke against `https://aurorahr.in`:

| Smoke item | Expected |
| --- | --- |
| Frontend loads | `200` |
| Health endpoint works | `200` |
| Protected endpoints reject unauthenticated access | `401` |
| Nonexistent email login | `401` |
| Wrong password login | `401` |
| Malformed login payload | `400` |
| Non-string login payload | `400`; no unsafe `500` |
| Security headers | Acceptable; no regression from prior smoke |

## Deployment Execution Update - 2026-06-09

PR #59 was merged first, then production deployment exposed existing production schema drift in pending TypeORM migrations. The deployment workflow rolled back cleanly after each failed migration attempt. The following follow-up migration-hardening PRs were merged to make pending migrations compatible with the current production schema without destructive database changes:

| PR | Purpose | Merge commit |
| --- | --- | --- |
| #60 | Harden digital library migration indexes/foreign keys | `e447f5e748e17279ad6f6f55026fe653f7fd51e9` |
| #61 | Harden remaining operational tables migration table/index creation | `85c3b996b3a7af55aef052f76ee97738677a941c` |
| #62 | Harden tenant settings backfill enum casts | `015a0165f28f3b4cdcccd9fc9c6ad1d685051752` |
| #63 | Use production billing-cycle enum name | `6b3ac4e7e0e8d7dc824012ab97485dcc61a073bf` |
| #64 | Harden company documents migration indexes/foreign keys | `9b7a797715367d13528009a981b4e0526347d9a9` |
| #65 | Harden employee documents migration indexes/foreign keys | `dce3779775f43c68978442434c7f27652d9b5a15` |

Final deployment workflow:

| Item | Result |
| --- | --- |
| Workflow run | `27226832082` |
| Deployed commit | `dce3779775f43c68978442434c7f27652d9b5a15` |
| Backend build | Passed |
| Frontend build | Passed |
| Server deploy | Passed |
| Workflow health check | Passed |
| Workflow authenticated API smoke | Passed |
| Workflow frontend smoke | Passed |
| Rollback | Not triggered |

## Independent Production Smoke - 2026-06-09

Safe unauthenticated smoke was run against `https://aurorahr.in` after deployment.

| Smoke item | Result |
| --- | --- |
| Frontend `/` | `200` |
| Health `/health` | `200` |
| Protected `/api/v1/auth/me` without token | `401` |
| Protected `/api/v1/employees` without token | `401` |
| Nonexistent email login | `401 INVALID_CREDENTIALS` |
| Malformed email login payload | `400 VALIDATION_ERROR` |
| Non-string email/password login payload | `400 VALIDATION_ERROR` |
| Security headers on `/health` | Present: CSP, HSTS, X-Frame-Options, no-sniff, Referrer-Policy |

Wrong-password smoke for an existing account was not run because no disposable production test credential was provided for this deployment-verification task. Do not use real employee credentials for automated smoke unless explicitly approved.

## Deployment Gate Verdict

**Production aligned with the accepted QA-hardened baseline.**

**ACV authenticated smoke:** May begin after a disposable ACV production UAT credential is provided or Chinar personally tests with approved credentials.

**ACV controlled UAT:** May begin for controlled/manual UAT. Remaining non-blocking risks below should stay visible during UAT.

## Remaining Blockers

| Blocker | Status |
| --- | --- |
| Production currently behind QA-hardened baseline | Closed: deployed commit `dce3779775f43c68978442434c7f27652d9b5a15` |
| Auth malformed/non-string payload unsafe `500` on current production | Closed: post-deployment smoke returns controlled `400` |
| ACV authenticated smoke | Pending disposable/approved ACV credentials |
| Historical document restoration | Parked by product decision |
| HR Connect/collaboration expanded QA | Pending later QA sprint |
| Responsive/browser E2E expansion | Claude-owned, ongoing/pending as separate stream |

## Recommended Next Step

Start ACV controlled manual UAT on production. If automated authenticated production smoke is needed, first create a disposable UAT user and run only non-destructive checks.
