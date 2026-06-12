# Mission 2 — Session Handover (for the fresh Fable session)

**Written:** 2026-06-11 by the outgoing Opus session. The incoming session has
**no memory of the prior conversation** — this doc + `CLAUDE.md` +
`AURORAHR-LAUNCH-READINESS.md` + `audit/BASELINE.md` + `audit/RESTORE-DRILL.md`
are the complete context.

---

## ⏩ START HERE — immediate state & next action

- **Mission 2 = Tenant Isolation: architecture fix + RLS + adversarial proof.** Branch: **`hardening`**. Nothing merges to main, nothing deploys this mission.
- **Step 0 (housekeeping): DONE.** CLAUDE.md tracked on hardening; antigravity mirror verified clean and **frozen** (renamed `…/current-projects/HRMS-SaaS-MVP-archive`).
- **Restore drill: DONE & CLEAN.** A PG16.14 copy of prod is **running locally on port 5433** (see §3). Documented in `audit/RESTORE-DRILL.md`.
- **⛔ PENDING DECISION (blocks Phase A coding):** Chinar must pick the global-tenant-scope architecture — see **§6**. Phase A implementation should not start until this is answered.
- After each Phase, give a brief interim MISSION-STATUS and wait for course-correction (Chinar's instruction). End mission with `audit/TEST-REPORT.md` + bridge sync + MISSION-STATUS incl. ACV impact line.

---

## 1. Program context (one paragraph)
AuroraHR (HRMS-SaaS-MVP) is a live multi-tenant HR SaaS at https://www.aurorahr.in. **ACV Solutions is a real, onboarded customer** with real PII in prod. The launch-readiness program (see `AURORAHR-LAUNCH-READINESS.md`) runs Missions 1–6. **Mission 1** (baseline audit) found tenant isolation is enforced by *convention, not architecture* — and a **live cross-tenant payment IDOR** which has already been **fixed and deployed** (commit `5e9d208`, live on prod). **Mission 2** makes isolation architectural.

## 2. Branch / ref state
- `origin/main = 5e9d208` (deployed, healthy — includes the IDOR hotfix). **Do not touch in M2.**
- `origin/hardening = 99b6094` — the Mission 2 home. Contains:
  - `5e9d208` IDOR fix → `bf7f960` (launch brief + `audit/BASELINE.md`) → `99b6094` (`CLAUDE.md`, machine path sanitized to `<DRIVE_BRIDGE_PATH>`).
- The primary working tree is checked out on `claude/aurorahr-qa-pause-handoff` (legacy) and has **untracked** `CLAUDE.md` + `audit/` with the real local content. **To work on `hardening`, use a worktree** — a `hardening` worktree already exists at **`/private/tmp/aurora-hardening`** (`git worktree list`). Branch-switching the primary tree fails (untracked `assistant*` files collide with main's tracked versions).
- Many `codex/*` worktrees exist under `/private/tmp/` — that's parallel Codex dev; leave alone. `/private/tmp/hrms-prod-restore` holds the `main` label (stale `2506990`); don't disturb it.

## 3. The PG16 restored prod copy (test target) — RUNNING NOW
- **Engine:** PostgreSQL **16.14** (Homebrew `postgresql@16`, keg-only) — exact prod match. Binaries: `/opt/homebrew/opt/postgresql@16/bin/`.
- **Cluster:** data dir `/Users/chinar.deshpande06/aurorahr-restore-pg16/data`, **port 5433**, socket `/tmp`, superuser `chinar.deshpande06`, DB **`hrms_saas`**. (Dev PG15 cluster on 5432 is untouched.)
- **Restart after reboot (note the macOS locale fix — required):**
  ```bash
  export LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8
  /opt/homebrew/opt/postgresql@16/bin/pg_ctl -D /Users/chinar.deshpande06/aurorahr-restore-pg16/data \
    -l /Users/chinar.deshpande06/aurorahr-restore-pg16/pg.log -o "-p 5433 -k /tmp" -w start
  ```
  Connect: `/opt/homebrew/opt/postgresql@16/bin/psql -h localhost -p 5433 -U chinar.deshpande06 -d hrms_saas`
  Teardown: `pg_ctl -D <datadir> stop` then remove the datadir.
- **Source dump:** `/Users/chinar.deshpande06/aurorahr-prod-20260611.dump` (custom format, 768K, PG16.14). Re-restore: `createdb -p 5433 hrms_saas && pg_restore -p 5433 -d hrms_saas --no-owner --no-privileges <dump>`.
- **⚠️ This DB holds REAL ACV prod data.** Keep it local: never sync to the bridge, never commit, never copy off-machine.
- **Tenant map** (full table in `audit/RESTORE-DRILL.md`): 6 tenants, 74 tables (71 tenant-scoped).
  - **ACV Solutions = `f5ed3bd0-d89f-4762-b212-c3b41d358fe8`** → use as a **read-only sentinel** (must remain unreachable cross-tenant; never use as attack target/victim that mutates).
  - Fixtures for attacker/victim: **Acme Corporation `da4dbd35-…`**, **Test Company `0aa06209-…`** (+ Success Co, Test Company Ltd, Campuslife).
  - `payment_history` has 0 rows (IDOR exposed no live data).

## 4. Mission 2 spec (from `AURORAHR-LAUNCH-READINESS.md` + Chinar's mission message)
**Phase A — architectural fix:**
1. Wire `tenantIsolation`/`validateTenantAccess` (`backend/src/middleware/tenant.ts`) into ALL authenticated routes (currently dead code, 0 route uses).
2. Global TypeORM tenant scope — every query tenant-filtered by default; unscoped access = explicit, **logged** escape hatch (super-admin only).
3. Fix `performanceController` write-injection trio + all latent unscoped by-ID methods from Mission 1 (see §5).

**Phase B — RLS backstop:**
4. Postgres RLS policies on every tenant-scoped table. Set tenant context via **`SET LOCAL`** inside transactions (connection-pool safe). **Verify pooling behavior with an explicit test.**

**Phase C — adversarial proof:**
5. Adversarial suite: IDOR on every by-ID endpoint, cross-tenant token replay, search/export/report leakage, RBAC escalation. **Every test must FAIL against pre-fix code** (verify on a throwaway branch) **and PASS post-fix.** → `audit/TEST-REPORT.md`.

## 5. Phase A3 — the specific must-fix list (evidence in `audit/BASELINE.md` §3)
- **Write-injection (verify parent tenant ownership before child insert):** `backend/src/controllers/performanceController.ts:541` (`submit360Feedback`, parent `reviewId`), `:657` (`createKPI`, parent `goalId`), `:808` (`createActionItem`, parent `reviewId`).
- **Unscoped by-ID methods (add `tenantId` to the WHERE):**
  - `services/onboardingService.ts:512` (`getStateTransitionHistory` — HIGH, live route, currently controller-guarded), `:298` (`initiateBGV`), `:448` (`markJoined`)
  - `services/notificationService.ts:84` (`getNotifications`), `:92` (`markAsRead`)
  - `services/probationService.ts:45` (`createReview`)
  - `services/documentGenerationService.ts:402`, `:431` (dead code — harden anyway)
  - `services/ExitFSMService.ts:120`; `services/exitService.ts:218–298` (guarded; harden for defense-in-depth)
  - `services/OnboardingFSMService.ts:179`, `services/ProbationFSMService.ts:93` (defense-in-depth)
- Note: with Phase B RLS in place, these become defense-in-depth — but fix them regardless (the brief asks for both).
- **Auth provenance is sound** (verified): `req.tenantId` comes only from the signature-verified JWT + active-user DB check (`middleware/auth.ts:58,60-66,90`). No client-injectable tenant path. Safe foundation for scoping.

## 6. ⛔ PENDING DECISION — Phase A global-scope architecture
TypeORM 0.3 has **no native global query filter**. Outgoing session proposed (and recommends):
- **AsyncLocalStorage** tenant context (set by middleware from `req.tenantId`).
- Per-request **`SET LOCAL app.current_tenant_id`** via a TypeORM transaction/QueryRunner wrapper (pool-safe; ties into B4).
- **RLS (Phase B) is the real enforcement:** `USING (tenantId = current_setting('app.current_tenant_id')::uuid)`. A forgotten WHERE still returns only tenant rows = architecture, not convention.
- **Escape hatch:** explicit `runAsSuperAdmin()/withoutTenantScope()`, **logged** each use (bypass flag or BYPASSRLS role).
- Wire `tenantIsolation` on all authed routes (A1); fix §5 directly (A3).

**The fork put to Chinar (unanswered):** proceed with **session-var + RLS as one coherent layer** (A2 and B4 built/tested together) — *recommended*; **OR** build the app-side global scope **fully independent of RLS** (more code, weaker guarantee, but survives RLS being disabled). The new session should get this answer before coding Phase A.

## 7. Rules in force (full text in `CLAUDE.md`)
- Work only on `hardening`. **Nothing merges to main; nothing deploys in Mission 2.**
- **Never touch prod DB directly** — all Phase A/B build+test against the **5433 restored copy** (§3). The restore was the restore drill.
- **ACV protection:** ACV is the live customer; treat as sentinel. Every MISSION-STATUS ends with `ACV tenant impact: none / [desc]`.
- **No prod deploy without a fresh verified backup** (Chinar confirms backup in the GO message).
- **Drive bridge (markdown audit reports ONLY):** at mission end copy `audit/*.md` → `/Users/chinar.deshpande06/Temp/MyCodingJourney/current-projects/HRMS-SaaS-MVP/AuroraHR-Audit`. **Never** copy `.env`/dumps/credentials/source. (This is the real local path; the committed CLAUDE.md shows a placeholder.)
- New external dependencies / schema migrations: ask first.

## 8. Environment gotchas
- **Netskope proxy blocks `registry.npmjs.org` (403)** → `npm install`/`npm audit` fail locally. Homebrew + GitHub + `git push` work. CI's `npm audit` works (run there). Dependency-CVE scan from Mission 1 is still owed on an unfiltered network (Mission 5 / personal Mac).
- **PG16 start needs `LC_ALL=en_US.UTF-8`** or it dies with "postmaster became multithreaded."
- **Version skew:** prod/restore = PG16.14; dev/CI = PG15.15. Logged as a **Mission 5** item (align CI to PG16).
- Editing plain `.ts` won't hot-reload under some setups — restart the backend after logic edits.
- Three repo copies existed; the antigravity mirror is now frozen (`-archive`). The Drive folder at `/Users/.../Temp/MyCodingJourney/.../HRMS-SaaS-MVP` is itself a full clone — only its `AuroraHR-Audit/` subfolder is the bridge; leave its repo content alone.
- `backend/.env` (local, gitignored) points at the **dev PG15** DB (localhost:5432, `hrms_saas`). For M2 testing, point a test config at **5433/`hrms_saas`** instead. The jest harness defaults to `hrms_saas_test` unless `TEST_DB_NAME` is set — pin DB targets explicitly so dev/prod-copy data is never seeded over.

## 9. Artifacts & bridge status
- `audit/` (canonical working tree, untracked on claude branch; committed copies on hardening): `BASELINE.md` (Risks #1–12), `RESTORE-DRILL.md`, this `MISSION2-HANDOVER.md`.
- Bridge currently holds `BASELINE.md` only. `RESTORE-DRILL.md` + `TEST-REPORT.md` sync at Mission 2 end.
- Outgoing model: Opus 4.6 (1M). Incoming: **Fable** (per Chinar). Commit trailer used: `Co-Authored-By: Claude Opus 4.6 (1M context)` — update as appropriate.

---
**Resume command for the new session:** read `CLAUDE.md`, `AURORAHR-LAUNCH-READINESS.md`, `audit/BASELINE.md`, `audit/RESTORE-DRILL.md`, and this file; confirm the PG16 cluster on 5433 is up; then get Chinar's answer to §6 and start Phase A on the `hardening` worktree.
