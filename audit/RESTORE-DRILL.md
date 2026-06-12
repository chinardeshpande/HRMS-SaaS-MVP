# AuroraHR — Production Restore Drill (Mission 2 setup)

**Date:** 2026-06-11 · **Operator:** Claude Code (hardening track)
**Purpose:** Stand up a faithful, isolated copy of production for Mission 2
(tenant-isolation architecture + RLS + adversarial proof) **without ever
touching prod** — per CLAUDE.md rule 2. This restore doubles as the restore-drill
deliverable.

## Inputs
- **Dump:** `/Users/chinar.deshpande06/aurorahr-prod-20260611.dump` — 785,962 bytes, PostgreSQL **custom format** (PGDMP v1.15-0), source DB `hrms_saas`, produced on prod **PG 16.14**.
- Provided by Chinar (backup taken off-host). Claude Code did not access prod or prod credentials.

## Target environment
- **PostgreSQL 16.14** installed via Homebrew (`postgresql@16`, bottled) — an **exact match to prod 16.14**. (Local dev/CI is PG 15.15 → version skew logged as a **Mission 5** item.)
- Isolated cluster, **port 5433** (the existing PG15 dev cluster on 5432 is untouched):
  - Data dir: `/Users/chinar.deshpande06/aurorahr-restore-pg16/data`
  - Superuser: `chinar.deshpande06` (matches local `.env` `DB_USER`)
  - Start required `LC_ALL=en_US.UTF-8` (macOS "postmaster became multithreaded" locale fix).

## Procedure
```bash
brew install postgresql@16
initdb -D <datadir> -U chinar.deshpande06 --encoding=UTF8
LC_ALL=en_US.UTF-8 pg_ctl -D <datadir> -o "-p 5433 -k /tmp" -w start
createdb -p 5433 hrms_saas
pg_restore -p 5433 -d hrms_saas --no-owner --no-privileges aurorahr-prod-20260611.dump
```
- `--no-owner --no-privileges`: drops prod role/grant dependencies (e.g. `doadmin`) so the copy is owned by the local superuser.

## Result — CLEAN
- **`pg_restore` exit 0, zero errors/warnings.**
- **74 tables** restored; **71 carry a `tenantId` column** (the tenant-scoped surface).
- **6 tenants present:**

| companyName | tenantId | role in testing |
|---|---|---|
| ACV Solutions | `f5ed3bd0-d89f-4762-b212-c3b41d358fe8` | **LIVE customer — sentinel; must remain unreachable cross-tenant** |
| Acme Corporation | `da4dbd35-…` | attacker/victim fixture |
| Test Company | `0aa06209-…` | attacker/victim fixture |
| Success Co | `2287e79e-…` | fixture |
| Test Company Ltd | `d0da9764-…` | fixture |
| Campuslife | `99423726-…` | fixture |

- Row sanity: `users` 74, `employees` 165, `attendance` 4209, `leave_requests` 10, **`payment_history` 0** (note: no live payment rows — the IDOR hotfix had no real data exposed, consistent with the trace).

## Handling rules for this copy
- Contains **real ACV production data** → stays **local only**: never synced to the Drive bridge, never committed, never copied off-machine.
- Adversarial tests will use **non-ACV fixture tenants** (Acme ↔ Test Company) as attacker/victim, with **ACV as a read-only sentinel** that must always be unreachable cross-tenant.
- Cluster is disposable: `pg_ctl -D <datadir> stop` + remove datadir tears it down with no trace.

## Mission 5 follow-ups
- **Version skew:** dev/CI run PG 15; prod runs PG 16.14. Align CI to PG 16 before relying on it as a pre-prod gate.
- Formalize a scripted restore-drill (this run, parameterized) as the standing recovery procedure.
