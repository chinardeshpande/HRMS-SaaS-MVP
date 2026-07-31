# 01 — Current State (verified 2026-07-23)

Everything here was verified by inspecting the repo and probing the network on 2026-07-23.
Facts are marked **[verified]**. Inferences and unknowns are marked as such. Do not upgrade
an inference to a fact without checking.

---

## 1. The application

**[verified]** A polyglot monorepo, not a single app:

| Directory | What it is | Stack |
|---|---|---|
| `backend/` | REST API + WebSocket server | Node ≥18, Express 4.18, TypeScript, **TypeORM 0.3.19**, `pg` 8.11, Socket.IO 4.8 |
| `frontend-web/` | Web SPA | **Vite 5** + React 18, MUI 5, react-router 6, axios |
| `mobile-app/` | Mobile client | (not inspected in depth — treat as out of scope for v1 cutover) |
| `shared/types` | Shared TypeScript types | — |
| `e2e/` | End-to-end tests | Playwright |
| `docker/` | Legacy droplet Docker assets | `backend/Dockerfile`, `frontend/Dockerfile`, `nginx/*.conf` |

**[verified]** Backend entrypoint: `package.json` `main` = `dist/backend/src/server.js`, and
`docker/backend/Dockerfile` uses `CMD ["node", "dist/backend/src/server.js"]`.

> ⚠️ **Trap:** `backend/tsconfig.json` declares `"outDir": "./dist"` with
> `"include": ["src/**/*"]`, which would normally emit `dist/src/server.js` — **not**
> `dist/backend/src/server.js`. The two disagree. This resolves at build time depending on
> how tsc computes the common root. **Do not guess.** Run `npm ci && npm run build` in
> `backend/` and `find dist -name server.js` to establish the real path, then set the
> Docker `CMD` from the observed result. See `09-GOTCHAS.md` §B1.

**[verified]** Database access is via TypeORM with **discrete connection fields**, not a URL:

```ts
// backend/src/data-source.ts
host: process.env.DB_HOST || 'localhost',
port: parseInt(process.env.DB_PORT || '5432'),
username: process.env.DB_USER, password: process.env.DB_PASSWORD,
database: process.env.DB_NAME,
ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
synchronize: false,   // good — migrations only
```

This is **good news** for Cloud SQL: `pg` treats a `host` beginning with `/` as a Unix socket
directory, so `DB_HOST=/cloudsql/<PROJECT>:<REGION>:<INSTANCE>` works directly. AuraHRMS
therefore **avoids** the postgres-js URL-parsing gotcha that bit the CCC pilot.

**[verified]** Health endpoint already exists: `backend/src/app.ts:194` → `GET /health`
returning `{ status: 'healthy', ... }`. Verify it is unauthenticated and does not touch the
DB before relying on it as the Cloud Run probe (see `04-BLOCKERS.md` §4).

**[verified]** Socket.IO is real and wired: `backend/src/services/socketService.ts` creates a
`SocketIOServer` on path `/socket.io`; the frontend expects `VITE_SOCKET_URL`.

---

## 2. Current (dead) hosting

**[verified]** DNS `aurorahr.in` → A `64.227.173.175`, a DigitalOcean droplet named
`aurorahr-production` (per June 2026 records).

**[verified] The host is unreachable as of 2026-07-23:**

```
https://aurorahr.in        -> HTTP 000
https://www.aurorahr.in    -> HTTP 000
http://64.227.173.175/     -> HTTP 000
TCP 443 / 80 / 22          -> all closed or filtered
ICMP ping                  -> 2 packets sent, 0 received (100% loss)
https://www.google.com     -> HTTP 200   (control: local network is fine)
```

**[inference]** The droplet has been destroyed, powered off, or fully firewalled. From
outside these are indistinguishable. Note that in the June `chinardeshpande.tech` outage the
dead IP still answered ICMP; here even ICMP is dead, which leans toward *destroyed or powered
off* rather than *reassigned*.

**[unknown — Chinar must resolve in the DigitalOcean console]**
1. Does droplet `aurorahr-production` still exist?
2. Do automated backups or manual snapshots exist, and what is the newest restore point?
3. Can the Postgres database be dumped from it?
4. Can `uploads/` (employee documents) be retrieved from its disk?

**Deployment mechanism was:** GitHub Actions → droplet, via
`.github/workflows/deploy-aurorahr.yml` (build + test with a `postgres:15` service container,
then deploy). Also present: `deploy-staging.yml`, plus `ci-cd.yml.disabled` and
`deploy-production.yml.disabled`. Docker Compose files `docker-compose.yml` and
`docker-compose.production.yml` at root, and nginx configs in `docker/nginx/`.

---

## 3. Repository state

**[verified]**

| Ref | SHA | Note |
|---|---|---|
| `origin/main` | `5e9d208` | `fix(security): scope payment status updates to tenant (IDOR)` — last deployed state |
| local `main` | `5e9d208` | in sync with origin as of last fetch (**2026-06-11**) |
| `origin/hardening` | `028e01e` | ⚠️ **Mission 2 tenant-isolation work — built but NEVER RUNTIME-TESTED** |

Other remote branches exist from prior agent sessions (`codex/*`, `antigravity/*`,
`claude/*`) — e.g. `codex/production-schema-hardening`, `codex/production-migration-idempotency`
(already merged per git log), `antigravity/acv-mobile-pilot-hardening`.

**[verified]** Working tree is dirty: `clean-restart.sh` and `start.sh` modified; untracked
`.ua/` directory (an Understand-Anything artifact — should be gitignored).

**[verified]** The local checkout has not fetched since 2026-06-11. **Run `git fetch --all`
before trusting any branch comparison.**

### ⚠️ The `hardening` branch landmine

`origin/hardening` contains substantial multi-tenant isolation work (AsyncLocalStorage tenant
context; `tenantIsolation` wired into ~33 authed route files, Socket.IO and cron; app-side
repository scoping in `database/tenantScope.ts`; a `set_config` session-variable layer for
Postgres RLS in `database/tenantSession.ts`). It is TypeScript-clean but **nothing was ever
executed against a database**. It also has known unfinished items (by-ID fixes in
`performanceController.ts`, the RLS migration itself, and an adversarial test suite).

**Decision required from Chinar before Codex starts:** does the restart (a) merge and finish
`hardening`, (b) ship `main` to Cloud Run first and treat `hardening` as a follow-on, or
(c) abandon it? Recommendation is **(b)** — do not combine an untested security refactor with
a platform migration; that is two variables at once and makes any failure ambiguous.

---

## 4. Data and PII — the constraint that governs everything

**ACV Solutions is a real, onboarded, paying-relationship tenant with real employee PII.**
`ACV-India/HRMS-MVP/ACV Implementation Data/` contains the intake corpus: appointment letters,
offer letters, resumes, salary/increment letters, FNF statements, headcount reports, leave
policies, and an onboarding master workbook — i.e. exactly the data a data-protection
regulator cares about.

The backend has ACV-specific production import scripts (`acv:company-documents`,
`acv:leave-balances`, `acv:attendance`, `acv:customer-zero-cleanup`, `acv:validation-reports`),
which means **real ACV data was imported into the production database**.

Therefore:
- Production data is **never** copied to a laptop, a scratch directory, or a shared drive.
- Test/staging environments use synthetic or anonymised data only.
- Any database dump is treated as a controlled artifact: encrypted at rest, deleted after use.
- See `10-CODEX-OPERATING-RULES.md` for the hard rules.

---

## 5. Existing GCP estate

**[verified]** `gcloud` is installed and authenticated on this machine. Existing projects:

```
smyra-10271          (Smyra — live)
acv-solutions-63915  (ACV — exists; purpose to be confirmed before reuse)
gradient-cloud-81724 (Gradient)
ccc-pilot-25459      (CCC pilot — the proven Cloud Run reference)
chinar-portfolio     (portfolio — Cloud Run + LB reference)
```

**There is no AuraHRMS project yet.** Per the platform standard, AuraHRMS gets its own
projects, one per environment (`aurahrms-staging`, `aurahrms-prod`) — see
`02-GOLDEN-PATH-SOP.md` §7. Do **not** deploy AuraHRMS into `ccc-pilot-25459` or
`acv-solutions-63915` without an explicit decision from Chinar; `acv-solutions-63915` in
particular may already hold unrelated ACV resources.

**Billing:** one central account (`01FFEC-2708FA-A00DFF`). A $300 trial was noted as expiring
~20 Sep 2026 — **verify current billing status before assuming free headroom**, as the trial
may since have been consumed or converted.
