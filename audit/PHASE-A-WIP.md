# Mission 2 — Phase A WORK-IN-PROGRESS (parked for MacBook migration)

**Parked:** 2026-06-13 · **Reason:** all Product Development paused until the
shift to the new MacBook (personal M5 Max). **Nothing deployed, no prod DB
touched.** Resume this on the new machine.

This note + `audit/MISSION2-HANDOVER.md` + `CLAUDE.md` +
`AURORAHR-LAUNCH-READINESS.md` + `audit/BASELINE.md` + `audit/RESTORE-DRILL.md`
are the full context. **The §6 architecture decision is RESOLVED** (see below) —
do not re-litigate it.

---

## ⏩ Where we are

Branch `hardening` is **pushed to `origin/hardening`** (so it survived the
machine shift). Commits on top of the handoff baseline `a589ffd`:

| Commit | Phase | State |
|--------|-------|-------|
| `f61971c` | **A0** shared AsyncLocalStorage tenant context | done, tsc-clean |
| `7d586a9` | **A1** wire tenant isolation into every authed entry point | done, tsc-clean |
| `1669728` | **A2a + A2b + A2c** both isolation layers | ⚠️ **tsc-clean but UNTESTED** |

### §6 decision (RESOLVED by Chinar): **"Both, fully."**
Build *both* the app-side global scope (RLS-independent) *and* the
session-var + RLS layer — maximum redundancy; either layer alone must stop a
cross-tenant access. That is exactly what A2a + A2b implement.

---

## What each commit did

### A0 — `backend/src/middleware/tenantContext.ts` (new)
- One `AsyncLocalStorage` store feeding BOTH isolation layers.
- `tenantContextMiddleware` mounted once on the apiRouter (`app.ts`); enters an
  empty store per request. `authenticate` (`middleware/auth.ts`) populates it
  **before** its own user/tenant lookups, from the signature-verified JWT.
- `withoutTenantScope(reason, fn)` / `runAsSuperAdmin` = the **A2c** escape
  hatch; every use emits a `TENANT_SCOPE_BYPASS` warn log.
- `tenantIsolation` (`middleware/tenant.ts`) now asserts `req.tenantId` AND ALS
  integrity (fail-closed `TENANT_CONTEXT_MISMATCH`).
- Deleted dead `optionalAuth` (both copies) — it set tenantId from an unverified
  JWT, a latent spoofing hazard.

### A1 — wire isolation into every authenticated entry point
- **33 route files**: `tenantIsolation` runs after `authenticate` everywhere
  (router-level where `router.use(authenticate)` existed, per-route otherwise).
  Verified: 35 route files scanned, 0 `authenticate` without `tenantIsolation`.
  - Public-by-design (left open): `healthRoutes`, `registrationRoutes`, plus the
    public sub-routes of `authRoutes` (login/refresh), `demoRoutes`
    (personas/login), `invitationRoutes` (accept/verify by token).
- **Socket.IO** (`services/socketService.ts`): handshake now does the same
  active-user + active-tenant DB checks as HTTP auth (was raw JWT decode only);
  DB-touching handlers wrapped in `runWithTenant()`; **fixed a real
  cross-tenant presence leak** (`user_status_change` was `io.emit()` to ALL
  tenants → now scoped to a `tenant:{id}` room).
- **Cron** (`jobs/taskEscalation.ts`): cross-tenant runs wrapped in
  `withoutTenantScope()`.

### A2a — `backend/src/database/tenantScope.ts` (new)
- Patches `Repository.prototype` (installed in `config/database.ts` via
  `installTenantScope()`), so EVERY repository — including those from
  `manager.getRepository()` inside transactions — is tenant-filtered by default.
- Per-call modes: **bypass** (raw, logged) / **scoped** (inject tenantId; an
  explicit mismatching tenantId throws) / **unscoped** (no context → allowed
  only if criteria/entity already carries an explicit tenantId — e.g. the JWT-
  scoped auth lookups).
- Special cases: `Tenant` entity scoped on reads, exempt on create
  (registration); `Permission` (no tenantId col) exempt; `repository.query()`
  raw SQL blocked outside the hatch; `createQueryBuilder` guarded at terminal;
  `.stream()` rejected under scope.

### A2b — `backend/src/database/tenantSession.ts` (new)
- `set_config('app.current_tenant_id', <id>, is_local => true)` (pool-safe
  SET LOCAL equivalent) on the connection backing each scoped statement;
  `app.tenant_bypass='on'` for hatch flows. Routed via a stamped QueryRunner
  (reuses an active txn, else opens a short dedicated one). `AppDataSource.query`
  instance-wrapped in `config/database.ts` so raw analytics SQL is stamped too.
- **These vars are what Phase B RLS policies will key off of.**

### A2c — escape hatch applied at legitimate pre-tenant sites
auth login / password-reset request / reset redemption
(`controllers/authController.ts`); registration signup/verify/complete/resend/
check (`routes/registrationRoutes.ts`); demo session
(`services/demoService.ts`); invitation accept/verify
(`routes/invitationRoutes.ts`); dev seed (`scripts/seedTestData.ts`); cron jobs.

---

## ⛔ NOT done — resume checklist (in order)

1. **RUNTIME TEST A2a/A2b — nothing has been executed yet.** Start the PG16
   copy on **:5433** (commands in `MISSION2-HANDOVER.md` §3), point a test
   config at it, run the existing suite — especially
   `tests/integration/03-tenant-isolation.test.ts`,
   `12-payment-tenant-isolation.test.ts`, plus auth/login and a
   registration/demo/invitation path — to confirm the scope layer does not
   break **legitimate** queries (the riskiest regression: a forgotten code path
   that needs the escape hatch and now returns empty / throws).
   - **Pooling proof owed (B4):** explicit test that `SET LOCAL` never leaks a
     tenant id across pooled connections.
2. **A3 — the §5 must-fix list** (handover §5 / BASELINE §3): performance
   write-injection trio (`performanceController.ts:541,657,808`) + the unscoped
   by-ID methods. With A2a/A2b live these are defense-in-depth, but the brief
   asks for both — still fix them.
3. **Phase B — RLS migration**: `ENABLE ROW LEVEL SECURITY` + policies on every
   tenant-scoped table:
   `USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid
   OR current_setting('app.tenant_bypass', true) = 'on')`. Build + adversarially
   test against the :5433 copy. **Ask before running the migration anywhere.**
4. **Phase C — adversarial suite** → `audit/TEST-REPORT.md`: IDOR on every
   by-ID endpoint, cross-tenant token replay, search/export/report leakage,
   RBAC escalation. Each test must FAIL on pre-fix code (verify on a throwaway
   branch) and PASS post-fix.
5. **Mission end**: bridge-sync `audit/*.md` (markdown only) + MISSION-STATUS
   incl. ACV impact line.

---

## Environment notes for the new Mac

- `npm install` was Netskope-blocked on the work Mac; the new personal M5 Max
  should install cleanly. The work-Mac worktree used a **symlinked
  `backend/node_modules`** (from the primary checkout) excluded via
  `.git/info/exclude` — that symlink is meaningless on the new machine; just run
  a real `npm install` (or `yarn install`) in `backend/`.
- **The :5433 PG16 cluster and the `aurorahr-prod-20260611.dump` hold REAL ACV
  prod PII.** They are LOCAL to the old Mac by rule (never synced/committed).
  On the new Mac, take a **fresh** verified dump and restore locally for
  testing — do not copy the old PII dump around casually. (Restore steps:
  `MISSION2-HANDOVER.md` §3.)
- Resume by checking out `hardening` into a worktree (or directly) on the new
  Mac: `git fetch origin && git worktree add ../aurora-hardening hardening`.

## ACV tenant impact: none
Branch commits + push only. No deploy, no migration, no prod DB access this session.
