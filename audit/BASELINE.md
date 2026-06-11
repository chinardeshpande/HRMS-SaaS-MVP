# AuroraHR — Baseline Audit (Mission 1 / Phase 0)

**Date:** 2026-06-11
**Auditor:** Claude Code (Launch-Readiness track)
**Repo audited:** `/Users/chinar.deshpande06/Documents/GitHub/HRMS-SaaS-MVP/` — branch `claude/aurorahr-qa-pause-handoff` @ `04bccf8`
**Mode:** Read-only. No code changed.

> **Scope note:** Two copies of this project exist on disk. The **canonical** one is the GitHub repo above (79 branches, full `claude/*` + `codex/*` history). The MyCodingJourney mirror (`current-projects/HRMS-SaaS-MVP`, branch `antigravity/acv-mobile-pilot-release-notes`) is a **separate, divergent git repo** and was *not* used as the audit source. The launch brief (`AURORAHR-LAUNCH-READINESS.md`) physically lives only in the mirror — see Open Questions.

---

## 0. TL;DR — the one finding that matters

**Multi-tenant isolation is enforced by developer discipline (manual `tenantId` in every WHERE clause), not by architecture.** The two architectural guards that exist in the codebase — `tenantIsolation` and `validateTenantAccess` middleware — are **dead code, wired into zero routes**. There is **no Row-Level Security, no global TypeORM filter, no tenant-scoped query subscriber.** The discipline is *mostly* good (the large majority of ~731 query sites do include `tenantId`), but "mostly" is not a security boundary, and the audit already found **confirmed cross-tenant gaps** (see §3). This is exactly the "#1 launch risk" the brief warned about. **Confidence: HIGH** — verified by reading the middleware, datasource, migrations, and a service-by-service query audit.

---

## 1. Stack & Dependency Health

| Layer | Tech | Version |
|-------|------|---------|
| Backend runtime | Node.js | engine `>=18.0.0` |
| Backend | Express | ^4.18.2 |
| | TypeORM | ^0.3.19 |
| | PostgreSQL driver (`pg`) | ^8.11.3 |
| | jsonwebtoken | ^9.0.2 |
| | bcrypt | ^6.0.0 |
| | helmet | ^7.1.0 |
| | express-rate-limit | ^7.1.5 |
| | **multer** | **^1.4.5-lts.1** ⚠ |
| Frontend | React | ^18.2.0 |
| | Vite | 5.x |
| | axios | ^1.16.1 |
| | MUI | ^5.15.3 |
| | Zustand | ^4.4.7 |
| Mobile | React Native / Expo | 0.73 / 50 |

**Code volume:** 24 controllers · 39 services · 71 models · 35 routes · 17 migrations (backend) · 78 pages (frontend).

**Dependency vulnerability scan — COULD NOT RUN.** `npm audit` is blocked in this environment by the corporate Netskope proxy (`403 Forbidden` from `registry.npmjs.org`, response body is a Netskope interstitial). This must be re-run on an unfiltered network (the personal Mac). Until then, dependency CVE status is **unknown**, with these version-based flags to verify:
- ⚠ **`multer ^1.4.5-lts.1`** — the multer 1.x line carries known advisories (DoS via malformed multipart). Multer 2.x is the maintained line. Treat as upgrade candidate.
- `express ^4.18.2` — 4.21+ ships security patches; minor-bump candidate.
- Others appear current; confirm with a real audit.

**Dead code / TODO census:** 12 `TODO`s, 0 FIXME/HACK/XXX. Launch-relevant ones:
- `services/registrationService.ts:104` & `:379` — `// TODO: Send verification email` → **email verification may not actually send.** Directly threatens Launch Gate #6 ("email verification must work reliably").
- `services/enhancedDocumentService.ts:497` — document email integration stubbed.
- `services/paymentMethodService.ts:136` — payment gateway stub (expected; out of scope this sprint).
- `middleware/tenant.ts:52` — subdomain tenant lookup never implemented.
- `frontend-web/src/context/AuthContext.tsx:206` — `// TODO: Replace with actual API call` (mock auth path still present).

---

## 2. Architecture Map

**Three apps:** `backend/` (Express/TypeORM REST API on :3000), `frontend-web/` (React/Vite SPA on :5173), `mobile-app/` (Expo).

**Backend = classic layered:** Routes → Controllers → Services → TypeORM Repositories → PostgreSQL. Real-time via Socket.IO. Single shared Postgres database.

**Tenancy model: shared database, shared schema, row-level discrimination by a `tenantId` column on every domain table.** Not schema-per-tenant, not DB-per-tenant. (See §3 for how — and whether — that discrimination is enforced.)

**Data stores:** one PostgreSQL instance (71 entities, full employee lifecycle: auth, employee master, attendance, leave, onboarding/probation/exit FSMs, performance, compensation/payroll, documents, digital library, HR-Connect social, chat, calendar, settings, reporting). File uploads currently to local disk (`multer`), S3 wiring present in prod config but storage backend not confirmed live.

**API surface:** REST under `/api/v1/`, 35 route files. Swagger at `/api/docs` (on by default in dev).

---

## 3. Multi-Tenant Isolation — THE Critical Finding

### What enforces isolation?

**Answer: nothing architectural. It is convention — a `tenantId` hand-written into each query's WHERE clause, service by service.** Confidence: **HIGH**.

**Evidence — the guards that should enforce it are dead code:**

- `backend/src/middleware/tenant.ts:9-28` — `tenantIsolation` middleware only checks `req.tenantId` exists, then calls `next()`. Its own comments admit the enforcement is unbuilt:
  - `tenant.ts:24` — *"This will be used by TypeORM to filter queries"* (it is not)
  - `tenant.ts:25-26` — *"You can also set it as a PostgreSQL session variable for Row-Level Security"* (it does not)
- `backend/src/middleware/tenant.ts:71-90` — `validateTenantAccess` compares a requested tenantId param to the user's — a real guard, but **used in 0 routes** (grep across `routes/` = 0 hits for both `tenantIsolation` and `validateTenantAccess`).
- `backend/src/config/database.ts:178` — `subscribers: []` (no tenant-injecting subscriber).
- **No Row-Level Security anywhere** — grep across `migrations/` and `config/` for `ROW LEVEL SECURITY` / `CREATE POLICY` / `current_setting` / `set_config` / `app.current_tenant` = **0 hits**.

**Evidence — isolation works only because services manually remember `tenantId`:**

- The discipline is real and *usually* present. Example, `services/leaveService.ts`: `:94` `where: { employeeId, tenantId }`, `:115-120`, `:137` `.andWhere('leave.tenantId = :tenantId', { tenantId })`, `:191`. Across `services/` + `controllers/`, `tenantId` is referenced ~1635 times against ~731 query sites — most queries are scoped.
- **But "most" ≠ "all." Confirmed gaps found in the service-by-service audit:**

| Severity | Location | Issue |
|---|---|---|
| **HIGH (live IDOR)** | `services/settingsService.ts:230` | `updatePaymentStatus` does `findOne({ where: { paymentId } })` then `save` — **no tenantId**. Reachable via `controllers/settingsController.ts:413`, route `PUT /payments/:paymentId/status`. Role-gated (`ownerOnly`) but **not tenant-gated** → any tenant owner can flip *another tenant's* payment-history status by guessing/iterating `paymentId`. |
| **HIGH (method)** | `services/onboardingService.ts:512` | `getStateTransitionHistory` reads `StatusTransition where: { candidateId }` only. Live route `GET /candidates/:candidateId/history`; currently shielded because `onboardingController.ts:269` calls `getCandidateById(candidateId, tenantId)` first — but the method is one refactor from leaking. |
| **MED (write-injection)** | `controllers/performanceController.ts:541,657,808` | `submit360Feedback` / `createKPI` / `createActionItem` write child rows using a parent `reviewId`/`goalId` from the URL **without verifying the parent belongs to the caller's tenant** → cross-tenant write injection. |
| **MED (latent)** | `notificationService.ts:84,92`; `onboardingService.ts:298,448`; `probationService.ts:45` | Unscoped by-ID reads/writes; not currently wired to routes, but will leak the moment they are. |
| **LOW/dead** | `documentGenerationService.ts:402,431`; `ExitFSMService.ts:120`; `exitService.ts:218-298` | Unscoped by-ID lookups; currently dead code or guarded by tenant-scoped callers. Harden before relying on them. |

**Verdict, stated bluntly as requested:** Isolation relies on **convention, not architecture.** It is decent convention — the team is clearly disciplined — but a B2B HR product holding salary and PII cannot ship cross-tenant safety as a code-review habit. One forgotten WHERE clause = a breach, and the audit already found a *live, request-reachable* one (`settingsService.ts:230`). **This must be fixed before pilot onboarding**, ideally by adding a real architectural backstop (Postgres RLS keyed on a per-request session variable, and/or a TypeORM global tenant filter), then treating the manual WHERE clauses as defense-in-depth rather than the sole line.

---

## 4. Auth Flow

- **JWT bearer**, verified in `backend/src/middleware/auth.ts:37-102`. Token accepted from `Authorization: Bearer` **or `?token=` query param** (`auth.ts:47-51`) — the query-param path is a token-leakage risk (lands in logs/referrers); flag for hardening.
- On each request, `authenticate` re-loads the user (`auth.ts:60-66`, scoped by `userId` + `tenantId` + `isActive`) and the tenant (`auth.ts:72-78`, must be `active`), then sets `req.user` and `req.tenantId` (`auth.ts:81-90`). Good: tenant context is derived from the **verified token + live DB check**, not client input.
- **RBAC** via `authorize(...roles)` (`auth.ts:107-123`) — role check only; does not enforce tenant or row ownership.
- `optionalAuth` (`auth.ts:128-156`) trusts the JWT payload **without** the DB active-user/active-tenant recheck — acceptable for public endpoints, but verify which routes use it (a deactivated user's token still resolves here).
- Tokens: 24h access / 7d refresh; bcrypt password hashing. Default JWT secret fallback exists (`config.ts:84`) but is **blocked in production** by a startup throw (`config.ts:126-131`) and the env validator (`envValidator.ts:138`).

---

## 5. Deployment Path to aurorahr.in

**Pipeline:** `.github/workflows/deploy-aurorahr.yml`. Trigger: push to `main`/`master` (ignoring `**.md`, `docs/**`) or manual dispatch.

**Flow:** `build-and-test` job (Postgres 15 service) builds backend (`npm run build`) and frontend (`yarn build`, baking in `VITE_API_URL=https://aurorahr.in/api/v1`) → artifacts `scp`'d as **`root@${PRODUCTION_SERVER_IP}`** → over SSH: timestamped backup of current app, `npm ci --omit=dev`, **`pg_dump` of prod DB before migrations**, `npm run migrate`, `pm2 restart aurorahr-backend`, deploy frontend to `/var/www/hrms-app/frontend-web/dist`, keep last 3 backups → health-check loop on `/health` and `/`, authenticated backend smoke test, frontend smoke test. A `rollback` job (`if: failure()`) restores the last app backup + restarts PM2.

**Model:** single non-containerized VPS — Nginx static frontend + PM2 Node backend. (Docker assets exist but are used by the *staging* path, not prod — staging≠prod fidelity gap.)

**Both frontend and backend deploy** via this workflow (corrects the older CLAUDE.md note that said frontend-only).

**Maturity gaps (full detail in env/secrets audit):**
- ❌ **No test gate on the production deploy.** The `build-and-test` job only builds + `npm/yarn audit`; it runs **neither** the unit/QA (`backend-tests.yml`) **nor** E2E (`e2e-tests.yml`) suites. Those run as *separate, non-blocking* workflows — a red test run does **not** stop a deploy.
- ⚠ Rollback restores app code but **not** the DB migration (relies on migrations being backward-compatible; no automated `migrate:revert`).
- ⚠ Deploys as `root` over SSH.

---

## 6. Environment & Secrets

- **DB SSL cert validation disabled:** `database.ts:93` and `data-source.ts:14` hardcode `ssl: { rejectUnauthorized: false }`. The prod example defines `DB_SSL_REJECT_UNAUTHORIZED=true` (`.env.production.example:32`) but **the code never reads it** → operator expectation (verified TLS) silently unmet. **HIGH.**
- **`backend/.env.backup` is committed** to git (slips past `.gitignore`'s exact-match `.env`). Contents are placeholders (no live secret), but it is bad hygiene and a future-leak vector — `git rm --cached` it. Live `backend/.env` is correctly untracked.
- **Stale deploy artifacts committed:** `backend-deploy.tar.gz`, `frontend-deploy.tar.gz` (~2.5 MB) at repo root despite `*.tar.gz` being gitignored.
- **No hardcoded production secrets found** in tracked source — all via `process.env`; real secrets externalized to GitHub Actions secrets + untracked server `.env`. Seed scripts hardcode demo password `password123` (`createAdminUser.ts:28`, `clearAndSeedComprehensive.ts:57`) — fine for dev, never run against prod.
- **`synchronize` discrepancy:** `database.ts:94` uses `synchronize: config.nodeEnv === 'development'` (auto-syncs schema in dev), while `data-source.ts:15` is `false`. The CLAUDE.md claim "no synchronize" is only true for the migration path. Low risk but a real dev/prod config divergence.
- **Config drift:** examples reference `hrms-app.com` / `api.hrms-app.com`; production is `aurorahr.in` (single host, `/api/v1`). The real prod `.env` must diverge from the examples for all URL/CORS/socket vars. Many prod-only vars (S3, Sentry, Redis, refresh/session secrets) are absent from the dev example → manual setup steps.

---

## 7. Top 10 Launch Risks (ranked)

| # | Risk | Severity | Evidence | Gate blocked |
|---|------|----------|----------|--------------|
| 1 | **Tenant isolation is convention, not architecture** — no RLS/global filter; guards are dead code; a *live* IDOR exists | 🔴 Critical | `tenant.ts:9-28`, `database.ts:178`, `settingsService.ts:230`, 0 RLS in migrations | #1 |
| 2 | **Confirmed cross-tenant payment-status IDOR** (live, request-reachable write) | 🔴 Critical | `settingsService.ts:230` ← `settingsController.ts:413` | #1, #3 |
| 3 | **No test gate on production deploy** — unit/E2E suites are non-blocking | 🔴 High | `deploy-aurorahr.yml:25-120` | #2, #5 |
| 4 | **Cross-tenant write-injection** on performance child-records (no parent ownership check) | 🟠 High | `performanceController.ts:541,657,808` | #1, #3 |
| 5 | **DB SSL cert verification disabled**; the override env var is ignored by code | 🟠 High | `database.ts:93`, `data-source.ts:14` vs `.env.production.example:32` | #3 |
| 6 | **Dependency CVE status unknown** — `npm audit` blocked by Netskope; `multer 1.x` flagged | 🟠 High | 403 from registry; `package.json` multer `^1.4.5-lts.1` | #3 |
| 7 | **Email verification likely not sent** — registration stubbed | 🟠 High | `registrationService.ts:104,379` (TODO) | #6 |
| 8 | **JWT accepted via `?token=` query param** — token leakage to logs/referrers | 🟡 Medium | `auth.ts:49-51` | #3 |
| 9 | **Latent unscoped queries** waiting to be wired (notifications, onboarding, probation) | 🟡 Medium | `notificationService.ts:84,92`; `onboardingService.ts:298,448`; `probationService.ts:45` | #1 |
| 10 | **No DB-migration rollback / staging≠prod (Docker vs PM2)** + deploy as root | 🟡 Medium | `deploy-aurorahr.yml` rollback job; staging Docker path | #4, #5 |

**Recommended sequencing:** Risks #1/#2/#4/#9 are one workstream (tenant isolation) and must come first — they are existential and partly proven-exploitable. #3/#5/#6 are the security/CI baseline. #7 gates the front door. This maps cleanly onto Mission 2 (adversarial isolation suite) → Mission 4 (security/perf) → Mission 6 (conversion/registration).

## Risk #11 — Token leakage via query-param auth
Severity: Medium · Source: hotfix provenance trace, 2026-06-11
auth.ts:49 accepts `?token=` as an auth mechanism. Validly-signed
tokens can leak into server logs, proxy logs, browser history, and
Referer headers. Not a tenant-injection vector.
Remediation: remove query-param token acceptance; Bearer header only.
Owner: Mission 4 (Security).

## Risk #12 — Default JWT secret in dev/test environments
Severity: Low · Source: hotfix provenance trace, 2026-06-11
config.ts:47-49 throws on the default secret only when
NODE_ENV=production; dev/test run on a known default. Production is
protected today.
Remediation: per-developer .env secrets when environment separation
is formalized.
Owner: Mission 5 (DevOps).

---

## 8. Open Questions for Mission Control

1. **No `hardening` branch exists.** The protocol says "work only on branch `hardening`," but the canonical repo has none (only `codex/*-hardening` feature branches). Should I create `hardening` off `main`? Off the current `claude/aurorahr-qa-pause-handoff`? This blocks committing any audit output.
2. **`[Drive sync folder path]` is an unfilled placeholder** in the protocol. I cannot sync `audit/` to Drive without the actual path. Please provide it. (BASELINE.md is written to `audit/` in the repo for now.)
3. **Two divergent repos** — should the MyCodingJourney mirror be retired/reconciled, or is it intentionally separate (antigravity track)? The launch brief lives only there.
4. **`npm audit` needs an unfiltered network** (Netskope blocks it here). Run on the personal Mac, or shall I parse `package-lock.json` against a local advisory DB instead?
5. **Confirm audit target branch** — I audited `claude/aurorahr-qa-pause-handoff` (current checkout). If `main` is materially ahead/behind, the isolation findings should be re-confirmed there before fixes land.

---

## MISSION-STATUS — Mission 1 (Baseline Audit)

**Done:**
- Full read-only baseline of the canonical GitHub repo: stack/dependency inventory, architecture + tenancy map, auth flow, deployment path to aurorahr.in, env/secrets audit, dead-code/TODO census.
- **Critical deliverable met:** tenant-isolation mechanism identified with file:line evidence and HIGH confidence — it is *convention, not architecture*; the architectural guards are dead code; and a **live cross-tenant IDOR** (`settingsService.ts:230`) plus several other gaps were found via a service-by-service query audit.
- Ranked top-10 launch risks mapped to the launch gates.
- Output written to `audit/BASELINE.md`.

**Failed / could not complete:**
- **`npm audit` blocked by Netskope proxy** (403) — dependency CVE scan not performed. Documented as Risk #6; needs an unfiltered network.
- **Drive sync not performed** — `[Drive sync folder path]` placeholder was never filled in (Open Question #2).
- **Nothing committed** — no `hardening` branch exists to commit to (Open Question #1). BASELINE.md is on disk, uncommitted, on the current branch.

**Open questions for mission control:** see §8 (1–5). The two blocking ones: **create/confirm the `hardening` branch**, and **provide the Drive sync path**.

**Recommended next step:** Approve Mission 2 (adversarial tenant-isolation suite) — but **front-load the one confirmed live IDOR** (`settingsService.ts:230`) and the performance write-injection trio as the first fixes, since isolation is the existential gate and is already partly exploitable. Before Mission 2 starts: (a) create the `hardening` branch, (b) give me the Drive path, (c) decide whether the architectural fix is Postgres RLS, a TypeORM global filter, or both. I'd also recommend running `npm audit` on the personal Mac in parallel so Risk #6 is quantified before Mission 4.
