# AuroraHR — DevOps Handover Kit (single-file bundle)

> Generated 2026-07-28 11:59 IST by concatenating the docs/devops-handover/ kit.
> This is a PORTABLE copy for pasting into ChatGPT/Codex when it cannot read the repo directly.
> The authoritative source is the individual files in docs/devops-handover/ in the repo.

---


<!-- ================================================================= -->
<!-- FILE: docs/devops-handover/README.md -->
<!-- ================================================================= -->

# AuroraHR — Hosting & DevOps Handover Kit

**Version:** 1.0 · **Written:** 2026-07-23 · **Author:** Claude Code (Opus 4.8), from a proven
GCP Cloud Run recipe shipped on two live production apps.
**Audience:** ChatGPT Codex (or any agent/engineer) restarting the AuroraHR HRMS MVP with the
ACV Solutions implementation.

---

## 0. Read this first

This kit is the **canonical hosting and DevOps standard** for AuroraHR. It exists because the
repo currently contains ~20 conflicting deployment markdown files at root, most of them stale
and describing a DigitalOcean droplet architecture that is **no longer running**.

> **⚠️ CANONICAL DECLARATION**
> Where this kit disagrees with any other document in this repository, **this kit wins**.
> The following root-level docs are **SUPERSEDED** and must not be followed:
> `DEPLOYMENT.md`, `DEPLOY-NOW.md`, `DEPLOYMENT-STEPS.md`, `DEPLOYMENT-STEPS`,
> `PRODUCTION-DEPLOYMENT-GUIDE.md`, `PRODUCTION_DEPLOYMENT_COMPLETE.md`,
> `PRODUCTION_SAFE_AND_READY.md`, `PHASE1-DEPLOYMENT-GUIDE.md`,
> `AURORAHR-DEPLOYMENT-GUIDE.md`, `HOSTING-OPTIONS-INDIA.md`, `GITHUB-SECRETS-SETUP.md`,
> `DEPLOY-NOW`, `COMMIT_PRODUCTION_CHANGES.sh`, `MANUAL_COMMIT_INSTRUCTIONS.md`.
> They describe droplet/nginx/manual-SSH deploys. Do not read them for guidance; do not
> resurrect their patterns. (Deleting them is recommended — see `11-ACCEPTANCE-CHECKLIST.md`.)

---

## 1. 🔴 Urgent finding — read before planning anything

**As of 2026-07-23, `aurorahr.in` is DOWN and the production host is unreachable.**

Verified from this machine:

| Check | Result |
|---|---|
| `https://aurorahr.in` | HTTP `000` (no response) |
| `https://www.aurorahr.in` | HTTP `000` |
| DNS `aurorahr.in` A record | `64.227.173.175` (DigitalOcean droplet — unchanged) |
| TCP 443 / 80 / 22 to that IP | all closed/filtered |
| ICMP ping to that IP | 100% packet loss |
| Control host (`google.com`) | HTTP `200` — so this is **not** a local network fault |

This is the same failure signature as the June 2026 `chinardeshpande.tech` outage, where a
droplet had been destroyed and DNS was left pointing at a dead IP.

**What this does NOT tell us** (cannot be determined from outside): whether the droplet was
*destroyed*, *powered off*, or *firewalled*. That determines whether the ACV production
database and uploaded employee documents still exist.

**→ Action for Chinar, before any migration work begins:** open the DigitalOcean console and
establish (a) does droplet `aurorahr-production` still exist? (b) do backups/snapshots exist?
(c) can a Postgres dump and the `uploads/` directory be recovered? Everything in
`05-RUNBOOK.md` Phase 0 depends on the answer. See `01-CURRENT-STATE.md` §4.

This reframes the project: it is **not** "improve hosting on a running system." It is
**"rebuild production properly on Cloud Run, and recover the ACV tenant's data."**

---

## 2. What is in this kit

| File | What it is | Read when |
|---|---|---|
| `01-CURRENT-STATE.md` | Verified facts: repo, stack, branches, hosting, outage | First. Always. |
| `02-GOLDEN-PATH-SOP.md` | **The doctrine.** Product-agnostic standing rules | First. Always. |
| `03-TARGET-ARCHITECTURE.md` | The AuroraHR target design + the decisions behind it | Before planning |
| `04-BLOCKERS.md` | 5 things that must be fixed before Cloud Run works at all | Before coding |
| `05-RUNBOOK.md` | Phase-by-phase execution, Phase 0 → Phase 9 | During execution |
| `06-ARTIFACTS.md` | Copy-ready Dockerfile / cloudbuild.yaml / workflow / health route | Phase 3 |
| `07-SECRETS-IAM.md` | Secret Manager map, WIF/keyless CI, no-leak intake pattern | Phase 4–5 |
| `08-DOMAIN-CUTOVER.md` | `aurorahr.in` DNS cutover, LB vs Firebase, rollback | Phase 8 |
| `09-GOTCHAS.md` | Hard-won failures. Each one cost real hours | Continuously |
| `10-CODEX-OPERATING-RULES.md` | **Guardrails.** What Codex may and may not do | First. Always. |
| `11-ACCEPTANCE-CHECKLIST.md` | Definition of done + verification gates | Before claiming done |
| `scripts/setup-gcp-pipeline.sh` | Idempotent GCP wiring (APIs, AR, WIF, IAM) | Phase 4 |

---

## 3. Suggested prompt to give Codex

Paste this to start the engagement:

```text
You are restarting the AuroraHR HRMS MVP (repo: HRMS-SaaS-MVP) and moving it to
Google Cloud Run, replacing the dead DigitalOcean droplet.

Before doing ANYTHING, read these files in order and treat them as authoritative:
  docs/devops-handover/README.md
  docs/devops-handover/10-CODEX-OPERATING-RULES.md
  docs/devops-handover/01-CURRENT-STATE.md
  docs/devops-handover/02-GOLDEN-PATH-SOP.md
  docs/devops-handover/03-TARGET-ARCHITECTURE.md
  docs/devops-handover/04-BLOCKERS.md

Ignore all root-level *DEPLOYMENT*.md / DEPLOY-NOW*.md / HOSTING-OPTIONS*.md files —
they are superseded and describe a host that no longer exists.

This system holds REAL production PII for a real client (ACV Solutions). The operating
rules in 10-CODEX-OPERATING-RULES.md are hard constraints, not suggestions.

Then: confirm you understand the 5 blockers in 04-BLOCKERS.md, and propose a plan for
Phase 0 and Phase 1 from 05-RUNBOOK.md. Do not write code until the plan is approved.
```

---

## 4. Provenance — why you should trust this recipe

This is not theory. Every pattern here was executed end-to-end and verified live:

- **Career Command Centre** (`ccc-pilot-25459`) — Next.js → Cloud Run + Cloud SQL Postgres +
  Secret Manager. One-click `git push → prod` CI/CD proven green (run `28117433733`,
  revision `ccc-00004-zbj`, `/api/health` → 200).
- **chinardeshpande.tech** (`chinar-portfolio`) — migrated OFF a dead droplet ONTO Cloud Run,
  15 secrets into Secret Manager, Global External HTTPS LB at `136.68.43.223`, managed cert
  ACTIVE in ~6 minutes, apex + www live with HTTP→HTTPS redirect. Resolved a 20-day outage.
- The `gcp-cloud-run-deploy` skill distilled from both, including the gotchas file that is
  reproduced (and extended for Express/TypeORM) in `09-GOTCHAS.md`.

**AuroraHR is materially different from both**, and this kit says exactly where: those were
Next.js apps with no file uploads and no WebSockets. AuroraHR is an Express + TypeORM API
with a separate Vite SPA, Socket.IO, local-disk document storage, and live client PII. The
adaptations are documented rather than hand-waved — see `03-TARGET-ARCHITECTURE.md` and
`04-BLOCKERS.md`.


<!-- ================================================================= -->
<!-- FILE: docs/devops-handover/01-CURRENT-STATE.md -->
<!-- ================================================================= -->

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
directory, so `DB_HOST=/cloudsql/<PROJECT>:<REGION>:<INSTANCE>` works directly. AuroraHR
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

**There is no AuroraHR project yet.** Per the platform standard, AuroraHR gets its own
projects, one per environment (`aurorahr-staging`, `aurorahr-prod`) — see
`02-GOLDEN-PATH-SOP.md` §7. Do **not** deploy AuroraHR into `ccc-pilot-25459` or
`acv-solutions-63915` without an explicit decision from Chinar; `acv-solutions-63915` in
particular may already hold unrelated ACV resources.

**Billing:** one central account (`01FFEC-2708FA-A00DFF`). A $300 trial was noted as expiring
~20 Sep 2026 — **verify current billing status before assuming free headroom**, as the trial
may since have been consumed or converted.


<!-- ================================================================= -->
<!-- FILE: docs/devops-handover/02-GOLDEN-PATH-SOP.md -->
<!-- ================================================================= -->

# 02 — The Golden Path (Standard Operating Procedure)

This is the **doctrine**: product-agnostic standing rules that govern every deploy in this
portfolio. They are not preferences. Each one exists because violating it cost real time,
real money, or real downtime.

Codex: follow these even when a faster shortcut is obvious. The shortcuts were tried.

---

## R1 — Compute is always Cloud Run. The front door is tiered separately.

The application **always** runs on **Cloud Run**. This is settled and not re-litigated per
product.

"Firebase Hosting vs Load Balancer" is **not** a question about where the app lives — it is
only about the **front door** (CDN + TLS + custom domain) sitting in front of Cloud Run.
Decide compute and front door independently:

- **Compute = Cloud Run, every product.** Scales to zero when idle (≈$0), scales out under
  load. Production-grade, not a hobby tier.
- **Front door, tiered by need:**
  - Low-traffic sites (portfolios, marketing pages, static SPAs) → **Firebase Hosting**
    (free tier, custom domain, auto-SSL, no lock-in — it is just a CDN, swap anytime).
  - Serious products, advanced routing, WebSockets, many domains → **ONE shared Global
    External HTTPS Load Balancer**, host-based routing to multiple Cloud Run services.

### R1a — ⛔ Never one Load Balancer per product.

A dedicated LB forwarding rule is **~$18/month fixed**. Six products with their own LBs is
~$108/month for front doors alone, before a single request is served. Use Firebase fronts
(≈$0) for small things and a **single shared LB** for products that genuinely need LB
features.

### R1b — You tune, you do not re-platform.

When demand grows: set `min-instances` (kills cold starts), `max-instances` (caps cost), and
`concurrency` on Cloud Run; add CDN/caching; scale the DB tier. The recipe is identical
serving 10 users or 10 million. **The real scaling work is always the database**, never the
host.

---

## R2 — Keyless CI. No service-account JSON keys, ever.

GitHub Actions authenticates to GCP via **Workload Identity Federation (WIF)**: GitHub's OIDC
token is exchanged for short-lived GCP credentials, with trust locked to one specific repo.

- **Never** create, download, or paste a service-account JSON key into GitHub secrets.
- The WIF pool + provider are **reusable per project**. App #2 in the same project needs only
  a new repo binding on the principalSet — not a new pool.
- Bind the deployer SA to `attribute.repository/<owner>/<repo>` — the **exact repo**, not the
  whole owner. (The provider's attribute-condition additionally pins `repository_owner`.)

Rationale: a leaked long-lived key is a permanent, unbounded blast radius. A leaked OIDC
exchange is bounded to minutes and to one repository.

---

## R3 — Secrets live in Secret Manager. Never in git. Never in the transcript.

- Runtime secrets are injected by Cloud Run at deploy time via `--set-secrets`.
- The runtime service account gets `roles/secretmanager.secretAccessor`.
- **Never `echo` a secret value.** Always pipe: `printf '%s' "$VAL" | gcloud secrets ...`.
- Intake pattern: a local **fill-file** the human pastes values into, consumed by a loop that
  pipes each value into Secret Manager, then `rm -f` the file. Full procedure in
  `07-SECRETS-IAM.md`.
- If a secret value ever transits a chat transcript or a tool result, **say so explicitly and
  recommend rotation.** Do not quietly hope.
- Validate a key is live *before* baking it into prod (e.g. an HTTP 200/401 probe). A revoked
  key was caught exactly this way.

---

## R4 — Build once, promote by digest. Never rebuild for production.

The artifact that was tested is the artifact that ships. Tag images with the **commit SHA**
(`_TAG=${GITHUB_SHA::7}`), and promote the **image digest** from staging to production. Never
run a fresh `docker build` as part of a production release — a rebuild is a new, untested
artifact wearing the old one's name.

---

## R5 — A green pipeline is NOT a working application.

A build can succeed, a deploy can go green, and the service can still serve an error page.
**Every deploy ends with an HTTP verification**, not a checkmark:

```bash
URL=$(gcloud run services describe <SVC> --project=<PID> --region=<REGION> \
  --format='value(status.url)')
curl -s -o /dev/null -w "health %{http_code}\n" "$URL/health"
curl -s -o /dev/null -w "root   %{http_code}\n" "$URL/"
# and confirm real content, not a fallback:
curl -s "$URL/" | head -c 400
```

Corollary: **verify, don't assume.** After DNS changes, query the authoritative nameserver
directly (`dig +short @<ns> <domain>`) to bypass caching. After a secret change, confirm the
new revision actually picked it up.

---

## R6 — Containers are stateless. Local disk is a scratchpad, never storage.

Cloud Run's filesystem is **ephemeral and per-instance**. Anything written to local disk
disappears when the instance recycles and is invisible to every other instance.

- Durable files → **Google Cloud Storage** (or an equivalent object store).
- Logs → stdout/stderr, collected by Cloud Logging. Never a log *file*.
- Sessions/queues/caches → an external store, never in-process memory, once
  `max-instances > 1`.

This rule is the single largest blocker for AuroraHR. See `04-BLOCKERS.md` §1.

---

## R7 — One GCP project per product, per environment.

`aurorahr-staging` and `aurorahr-prod` are **separate projects**, not separate namespaces in
one project. Separate projects give you a hard IAM boundary, independent billing visibility,
independent quota, and a blast radius that stops at the boundary.

Staging is proven first. Production is never the first place a change runs.

---

## R8 — Database migrations are a gated, separate step. Never on container boot.

Do **not** run migrations in the container `CMD`/entrypoint. With `max-instances > 1`, N
instances race the same migration on every cold start.

Run migrations as a **Cloud Run Job** (or an explicitly gated CI step) that executes once,
before the new revision receives traffic. Migrations must be **idempotent** and
**expand-and-contract** (add the new column → backfill → switch reads → drop the old), so
that the previous revision keeps working during rollout and rollback stays possible.

**Never** enable TypeORM `synchronize: true` outside local development. (AuroraHR correctly
has `synchronize: false` — keep it that way.)

---

## R9 — Rollback is a first-class feature, and it is a Cloud Run revision.

Every deploy creates an immutable revision. Rollback is:

```bash
gcloud run services update-traffic <SVC> --to-revisions=<PREVIOUS_REVISION>=100 \
  --region=<REGION> --project=<PID>
```

Know the previous revision name **before** you cut over. A migration that cannot be rolled
back (R8) is what turns a bad deploy into an incident.

---

## R10 — Infrastructure scripts are idempotent.

Re-running setup must be safe and boring. Creates tolerate "already exists"; IAM bindings are
additive; the script can be run five times with the same result. Freshly-created service
accounts can lag a few seconds before bindings on them succeed — **retry once** rather than
failing the run.

---

## R11 — Never mask an exit code.

```bash
gcloud builds submit ... | tail      # ⛔ WRONG — tail's exit code hides gcloud's failure
```

This masked three consecutive failed builds that appeared to succeed. Capture full output and
check `$?`. Applies to every pipe of a command whose success you care about.

---

## R12 — Verify tooling; do not assume it is blocked (or available).

Environment claims must be tested, not inherited. A corporate-MDM machine may block `npm` and
native installers; a personal machine may not. Run the command and observe before declaring
something impossible — and equally, before declaring it available.

Related: macOS has no `timeout` command — use a background poll loop for slow async
conditions (certificate provisioning, long deploys).

---

## R13 — Least privilege, and separate identities.

Two service accounts, distinct roles:

- **Deployer SA** (`gha-deployer@…`) — what GitHub impersonates. Submits builds. Roles:
  `cloudbuild.builds.editor`, `storage.admin` (upload build source), `viewer`,
  `serviceusage.serviceUsageConsumer`, plus `iam.serviceAccountUser` on the runtime SA.
- **Runtime/build SA** (the compute SA) — what the build and the running service execute as.
  Roles: `run.admin`, `artifactregistry.writer`, `secretmanager.secretAccessor`,
  `logging.logWriter`, `cloudbuild.builds.builder`, `iam.serviceAccountUser` on **itself**,
  and `cloudsql.client` when Cloud SQL is used.

For a product handling PII, tighten further once the pipeline works: scope
`secretmanager.secretAccessor` to individual secrets rather than project-wide.

---

## R14 — Keep the recipe boringly consistent across products.

Same file names (`Dockerfile`, `cloudbuild.yaml`, `.gcloudignore`,
`.github/workflows/deploy.yml`), same secret-naming scheme (`<prefix>-<kebab-env-var>`), same
SA layout, same four GitHub **Variables** (`GCP_PROJECT_ID`, `GCP_REGION`, `GCP_WIF_PROVIDER`,
`GCP_DEPLOYER_SA` — Variables, not Secrets; they are not sensitive).

Consistency is what makes the *n*th deploy a copy-paste instead of an investigation.

---

## R15 — Production data never leaves production.

No production dumps on laptops. No prod PII in staging, test fixtures, seed scripts, or CI.
Staging uses synthetic or anonymised data. Any dump taken for migration is encrypted,
minimally scoped, used, and deleted — and its handling is written down.

For AuroraHR this is not a nicety: it is a real client's employee records.


<!-- ================================================================= -->
<!-- FILE: docs/devops-handover/03-TARGET-ARCHITECTURE.md -->
<!-- ================================================================= -->

# 03 — Target Architecture for AuroraHR

The target state, and — more usefully — **why** each choice was made and what the rejected
alternatives were. Codex: if you want to deviate, argue against the rationale, not the
conclusion.

---

## 1. The shape

```
                    ┌──────────────────────────────────────────┐
  Browser  ───────► │  Global External HTTPS Load Balancer      │
  (aurorahr.in)     │  static IP · Google-managed SSL           │
                    │  host + path routing                      │
                    └───────────────┬──────────────────────────┘
                                    │
              ┌─────────────────────┴─────────────────────┐
              │                                           │
     path: /api/**, /socket.io/**              everything else (/, /assets/**)
              │                                           │
              ▼                                           ▼
    ┌───────────────────────┐                 ┌───────────────────────────┐
    │ Cloud Run             │                 │ Cloud Run                 │
    │ aurorahr-api          │                 │ aurorahr-web              │
    │ Express + Socket.IO   │                 │ nginx serving Vite build  │
    │ port 8080             │                 │ port 8080                 │
    └───────┬───────────────┘                 └───────────────────────────┘
            │
   ┌────────┼─────────────────────┬──────────────────────┐
   ▼        ▼                     ▼                      ▼
┌────────────────┐  ┌──────────────────┐  ┌────────────────┐  ┌──────────────┐
│ Cloud SQL      │  │ Cloud Storage    │  │ Secret Manager │  │Cloud Logging │
│ Postgres 16    │  │ employee docs    │  │ runtime config │  │  + Monitoring│
│ (private, IAM) │  │ (private bucket) │  │                │  │              │
└────────────────┘  └──────────────────┘  └────────────────┘  └──────────────┘
```

**Region:** `asia-south1` (Mumbai) — closest to ACV's users in India. Everything in one
region: Cloud Run, Cloud SQL, Artifact Registry, GCS bucket.

**Projects:** `aurorahr-staging` and `aurorahr-prod` (R7). Staging first, always.

---

## 2. Decision: two Cloud Run services, not one

**Chosen:** `aurorahr-api` (Express) and `aurorahr-web` (nginx serving the built SPA), behind
one LB with path-based routing so both are same-origin.

**Why:**
- They have genuinely different scaling profiles, resource needs, and deploy cadence. The SPA
  is static bytes; the API is stateful-ish, DB-bound, and holds WebSockets.
- Same-origin via one LB means **no CORS configuration**, and Socket.IO "just works" without
  cross-origin credential handling. This removes an entire class of bug.
- Either service can be rolled back independently.

**Rejected — single container running both:** couples deploys, forces the SPA to redeploy for
an API fix, and wastes memory on nginx inside the API container.

**Rejected — Firebase Hosting for the SPA + Cloud Run for the API on a subdomain:** this is
cheaper (Firebase is free) and is the right answer for a *static* product. It was rejected
here for two concrete reasons:
1. **Socket.IO needs WebSockets.** Firebase Hosting's CDN does not proxy WebSocket
   connections reliably to a Cloud Run rewrite target. The API therefore cannot sit behind
   Firebase Hosting.
2. Splitting the SPA onto `aurorahr.in` (Firebase) and the API onto `api.aurorahr.in`
   (LB or direct Cloud Run URL) **reintroduces cross-origin**, and with it CORS + cookie
   `SameSite` + Socket.IO origin configuration — for an app that is already mid-migration.

If cost pressure later makes this worth revisiting, the migration is trivial in the other
direction and can be done once the system is stable. **Do not do it during the cutover.**

> **⚠️ Verify before building:** Cloud Run **domain mappings are not available in every
> region — `asia-south1` is one where they are not**. That is precisely why the LB exists
> here rather than a simple domain mapping. Confirm current regional support before assuming
> a cheaper path is open; do not design around an unverified capability.

**Cost note:** the LB forwarding rule is ~$18/month. Per R1a this must be the **shared**
portfolio LB, with AuroraHR as a host on it — not a new AuroraHR-only LB. If no shared LB
exists yet, AuroraHR's becomes the shared one, and future products are added as hosts.

---

## 3. Decision: Cloud SQL Postgres, private IP, Unix socket

**Chosen:** Cloud SQL for PostgreSQL 16, connected from Cloud Run via
`--add-cloudsql-instances` and a Unix socket.

Configuration for TypeORM — **no code change required**, because `data-source.ts` already
takes discrete fields and `pg` treats a leading `/` as a socket directory:

```
DB_HOST     = /cloudsql/<PROJECT_ID>:asia-south1:<INSTANCE>
DB_PORT     = 5432          # ignored for socket connections
DB_NAME     = aurorahr
DB_USER     = aurorahr_app
DB_PASSWORD = <from Secret Manager>
DB_SSL      = false         # ⚠️ MUST be false — the socket is already private
```

`DB_SSL=true` over a Unix socket will fail. This is a real trap; see `09-GOTCHAS.md` §C2.

**Sizing:** start `db-custom-1-3840` (1 vCPU / 3.75 GB) with automated backups **and
point-in-time recovery enabled**. Do not start on `db-f1-micro` — that was acceptable for a
disposable pilot; this holds a client's HR records. Enable deletion protection.

**Why not keep Postgres in a container:** a database on ephemeral Cloud Run storage is data
loss with extra steps (R6). Managed Cloud SQL gives automated backups, PITR, and a restore
path you can actually demonstrate.

---

## 4. Decision: Google Cloud Storage for employee documents

**This is the change that unblocks everything else.** Documents currently go to local disk via
multer (`backend/src/middleware/upload.ts` → `uploads/documents`). On Cloud Run that means:
every uploaded appointment letter, payslip, and policy PDF is destroyed the moment the
instance recycles, and is invisible to any other instance in the meantime.

**Target:** one **private** GCS bucket per environment
(`aurorahr-prod-documents`, `aurorahr-staging-documents`).

- Uniform bucket-level access; **no public objects, ever** — these are HR records.
- Downloads served via short-lived **V4 signed URLs** generated by the API after it has
  authorised the request, or streamed through the API. Never a public object URL.
- Versioning on; lifecycle rules for old versions.
- The runtime SA gets `roles/storage.objectAdmin` **scoped to the bucket**, not project-wide.
- Encryption: Google-managed keys are sufficient for v1; CMEK is a later hardening step.

Implementation detail and acceptance criteria: `04-BLOCKERS.md` §1.

---

## 5. Decision: Socket.IO handling

Socket.IO on Cloud Run has two specific requirements and one architectural trap.

**Requirements — set these on `aurorahr-api`:**
- `--session-affinity` — sticky sessions, so a client's polling fallback and upgrade land on
  the same instance.
- `--timeout=3600` — Cloud Run's default request timeout will otherwise cut long-lived
  connections.
- `--min-instances=1` — an HR app with zero warm instances gives users a cold start on first
  interaction and drops sockets when scaling to zero. Costs roughly $10–15/month and is worth
  it here.

**The trap:** with `max-instances > 1` and **no shared adapter**, a broadcast emitted on
instance A never reaches clients connected to instance B. Notifications silently reach some
users and not others — an intermittent bug that is miserable to diagnose.

**Two acceptable resolutions:**
1. **v1 (recommended for ACV's size):** `--max-instances=1` with `--concurrency=250`. One
   instance, no cross-instance broadcast problem, adequate for a single tenant of tens of
   employees. **Document this as a deliberate ceiling** — it is a scaling limit, and it must
   be revisited before onboarding a second real tenant.
2. **When multi-instance is needed:** add the Socket.IO **Redis adapter** backed by
   Memorystore, then raise `max-instances`.

Do not silently ship option 1 without recording it. A hidden single-instance ceiling is how a
system quietly fails its second customer.

---

## 6. Decision: migrations as a Cloud Run Job

`backend/package.json` has `migrate` → `typeorm -d dist/backend/src/data-source.js migration:run`.

Per R8 this runs as a **Cloud Run Job** (`aurorahr-migrate`) built from the same image as the
API, executed in the pipeline **after** the image is pushed and **before** traffic shifts to
the new revision. Never in the container entrypoint.

The pipeline order is therefore: build → push → **run migration job** → deploy revision →
verify → (rollback if verification fails).

---

## 7. Decision: staging environment is not optional

`aurorahr-staging` is a full parallel stack: its own project, Cloud Run services, Cloud SQL
instance, GCS bucket, secrets. It runs **synthetic data only** (R15) — never an ACV dump.

This is the environment where the cutover is rehearsed end to end, including a restore test,
*before* production is touched.

---

## 8. What is explicitly out of scope for v1 cutover

Name these so they do not silently expand the work:

- `mobile-app/` — not part of the first cutover. Confirm what, if anything, currently
  consumes the production API from mobile before disabling anything.
- The `hardening` branch tenant-isolation work — see `01-CURRENT-STATE.md` §3. Separate
  workstream, after the platform is stable.
- Postgres RLS — part of `hardening`, not of the migration.
- Shared Identity Platform / auth migration — a much later programme. **Never migrate host
  and auth at the same time.**
- CMEK, Cloud Armor WAF, VPC Service Controls — post-cutover hardening, tracked but not
  blocking.


<!-- ================================================================= -->
<!-- FILE: docs/devops-handover/04-BLOCKERS.md -->
<!-- ================================================================= -->

# 04 — Blockers: what must be fixed before Cloud Run works at all

Five items. Each is a **hard blocker** — the app will be broken, silently or loudly, without
it. Each has explicit acceptance criteria so "done" is testable rather than asserted.

Work them in this order. #1 is the big one.

---

## Blocker 1 — Document storage is on local disk (data loss on Cloud Run)

**Severity: critical. This destroys client data.**

**Evidence [verified]:**
```
backend/src/middleware/upload.ts:7   const uploadsDir = path.join(__dirname, '../../uploads/documents');
backend/src/utils/uploadPaths.ts:4   const configuredUploadDir = process.env.UPLOAD_DIR || 'uploads';
backend/src/config/config.ts:108     dir: process.env.UPLOAD_DIR || 'uploads',
```
multer disk storage is used across `employeeDocumentRoutes`, `companyDocumentRoutes`,
`documentRoutes`, `compensationRoutes`, `employeeRoutes`, `authRoutes`, and
`onboardingController`.

**The false lead:** `backend/.env.production.example` declares `STORAGE_TYPE`, `S3_ENDPOINT`,
`S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` — which
looks like an object-storage abstraction already exists.

**It does not.** `grep -rn "STORAGE_TYPE" backend/src` returns **nothing**, and `config.ts`
exposes only `upload.dir`. The S3 variables are **aspirational documentation that was never
implemented.** Do not assume a driver exists because an env var mentions it. Verify first.

**What to build:**

1. A storage interface — `backend/src/services/storage/StorageProvider.ts`:
   `put(key, buffer, contentType)`, `getSignedUrl(key, ttl)`, `delete(key)`, `exists(key)`.
2. Two implementations: `LocalStorageProvider` (development only) and `GcsStorageProvider`
   (`@google-cloud/storage`, using Application Default Credentials — **no key file**; the
   Cloud Run runtime SA authenticates automatically).
3. Selection via the already-declared `STORAGE_TYPE` env var (`local` | `gcs`), wired in
   `config.ts` so it is actually read.
4. Replace multer `diskStorage` with `memoryStorage` and hand the buffer to the provider.
   **Enforce `MAX_FILE_SIZE`** — memory storage makes an unbounded upload a memory-exhaustion
   vector.
5. Serve downloads via **short-lived V4 signed URLs** issued *after* the API authorises the
   request, or by streaming through the API. **Never** make objects public — these are
   appointment letters and payslips.
6. Storage keys must be tenant-scoped: `tenants/{tenantId}/employees/{employeeId}/{uuid}-{filename}`.
   Never trust a client-supplied filename as a path component.
7. Migrate existing files: copy the droplet's `uploads/` tree into the bucket **preserving the
   paths recorded in the database**, or run a DB migration that rewrites stored paths to the
   new keys. Whichever is chosen, DB rows and bucket objects must agree afterwards.

**Acceptance criteria:**
- [ ] Upload a document on a Cloud Run revision; force a new revision; the document still
      downloads. (This is the actual test — it is what local disk fails.)
- [ ] With `max-instances > 1`, a document uploaded via one instance is retrievable via
      another.
- [ ] `gsutil ls -L` on an object shows no public ACL; an unauthenticated direct object URL
      returns 403.
- [ ] A signed URL expires and returns 403 after its TTL.
- [ ] A user of tenant A cannot retrieve a signed URL for a tenant B object (authorisation is
      checked before the URL is minted).
- [ ] `scripts/diagnoseDocumentStorage.ts` (already in the repo) passes against GCS.

---

## Blocker 2 — Port binding must be `$PORT` / 8080 and bind `0.0.0.0`

**Evidence [verified]:** `backend/src/server.ts:29` → `httpServer.listen(config.port, ...)`;
the legacy `docker/backend/Dockerfile` exposes **3000**.

Cloud Run injects `PORT` (default 8080) and requires the process to listen on it, on all
interfaces. A container listening on a hardcoded 3000, or on `127.0.0.1`, fails health checks
and the deploy fails with "container failed to start and listen on the port".

**Fix:** ensure `config.port` reads `process.env.PORT` first, defaulting to 8080; bind
explicitly to `0.0.0.0`.

**Acceptance criteria:**
- [ ] `docker run -e PORT=8080 -p 8080:8080 <image>` serves `GET /health` locally.
- [ ] Cloud Run deploy succeeds without a "failed to listen" error.

---

## Blocker 3 — Migrations must not run on container start

**Per R8.** With `max-instances > 1`, every cold-starting instance races the same migration.

**Fix:** build a Cloud Run **Job** `aurorahr-migrate` from the same image, invoked in the
pipeline between push and deploy. Confirm no entrypoint/`CMD`/start script calls
`npm run migrate`. (Note: git history shows a `codex/production-migration-idempotency` branch
was merged — good; re-verify idempotency holds rather than assuming.)

**Acceptance criteria:**
- [ ] Grep confirms no migration invocation in `CMD`, entrypoint, or `start` script.
- [ ] The migration job runs to completion and is safely re-runnable (run it twice; second
      run is a no-op, exit 0).
- [ ] Pipeline order is: build → push → migrate job → deploy → verify.

---

## Blocker 4 — Health endpoint must be dependency-free and unauthenticated

**Evidence [verified]:** `backend/src/app.ts:194` → `GET /health` exists and returns
`{ status: 'healthy', ... }`.

**Must verify** (not yet confirmed): that it is reachable **without a JWT**, that no auth
middleware or rate limiter intercepts it, and that it does **not** query the database.

A health check that touches the DB reports "unhealthy" during a transient DB blip and Cloud
Run kills otherwise-fine instances. Keep the liveness probe dumb — it answers "is the process
up", nothing more. If a deeper check is wanted, add a **separate** `/health/ready` that may
touch dependencies, and do not wire it to the platform probe.

**Acceptance criteria:**
- [ ] `curl -s -o /dev/null -w "%{http_code}" https://<svc-url>/health` → `200` with no
      credentials.
- [ ] With the database intentionally unreachable, `/health` still returns 200.
- [ ] The rate limiter does not throttle the health path.

---

## Blocker 5 — Logs must go to stdout, not to a file

**Evidence [verified]:** `backend/src/config/config.ts` → `logFile: process.env.LOG_FILE || 'logs/app.log'`;
the legacy Dockerfile creates `/app/logs`.

On Cloud Run a log file is written to ephemeral per-instance disk: invisible, unsearchable,
and gone on recycle. Worse, it silently consumes the instance's memory-backed filesystem.

**Fix:** in production, log **structured JSON to stdout/stderr**. Cloud Logging ingests it
automatically. Map the severity field to Cloud Logging's `severity` so log levels render
correctly, and include a request/trace id.

**Acceptance criteria:**
- [ ] No file transport is active when `NODE_ENV=production`.
- [ ] `gcloud logging read` returns application logs with correct severities.
- [ ] An error path produces a `severity: ERROR` entry containing a correlation id.

---

## Also fix, not strictly blocking

- **`.gitignore` the `.ua/` directory** (currently untracked noise in the working tree).
- **Delete the superseded root deployment docs** listed in `README.md` — they are an active
  hazard for any agent reading the repo.
- **`git fetch --all`** before any branch reasoning; the local checkout last fetched
  2026-06-11.
- **Node version:** `engines` says `>=18`, the legacy Dockerfile uses `node:18-alpine`. Move
  to **Node 20** (`node:20-slim`). Prefer `-slim` over `-alpine` — alpine's musl libc causes
  native-module surprises; this bit the earlier Next.js work.
- **Decide the `hardening` branch question** (`01-CURRENT-STATE.md` §3) before starting.


<!-- ================================================================= -->
<!-- FILE: docs/devops-handover/05-RUNBOOK.md -->
<!-- ================================================================= -->

# 05 — Runbook: Phase 0 → Phase 9

Execute top to bottom. Do not skip ahead — each phase's exit criteria are the next phase's
assumptions. Phases 0 and 1 require **human decisions** and must not be auto-executed.

Placeholders: `<PID>` project id · `<REGION>` = `asia-south1` · `<REPO>` = `owner/name`.

---

## Phase 0 — Recover and assess (BLOCKING, human-led)

**Nothing else starts until this is answered.** `aurorahr.in` is down and the droplet is
unreachable (`01-CURRENT-STATE.md` §2).

**Chinar, in the DigitalOcean console:**
1. Does droplet `aurorahr-production` (`64.227.173.175`) still exist? Is it powered off?
2. Are there automated backups or snapshots? What is the newest restore point, and what is
   its date relative to the last real ACV usage?
3. If recoverable: power it on (or restore a snapshot to a **new** droplet), then take
   - `pg_dump` of the production database, and
   - a tarball of the `uploads/` tree.
4. Note the DigitalOcean **billing state** — a suspended/unpaid account presents exactly this
   symptom and is trivially reversible.

**Exit criteria:**
- [ ] Recoverability of the database: **known** (recovered / snapshot exists / lost).
- [ ] Recoverability of uploaded documents: **known**.
- [ ] If data is lost, ACV is informed and the re-import path is scoped — the
      `ACV Implementation Data/` corpus plus the `acv:*` import scripts are the rebuild path.
- [ ] Any recovered dump is stored **encrypted**, off the laptop's general filesystem, and
      logged as a controlled artifact (R15).

> If data is unrecoverable, this becomes a re-implementation from the ACV source corpus.
> That is a materially different project — re-plan with Chinar rather than proceeding.

---

## Phase 1 — Decisions and project setup (human-approved)

**Decisions required from Chinar (do not assume):**
| Decision | Recommendation |
|---|---|
| Merge `hardening` now, or ship `main` first? | **Ship `main` first**; `hardening` after |
| Reuse `acv-solutions-63915` or create new projects? | **Create `aurorahr-staging` + `aurorahr-prod`** (R7) |
| Is there an existing shared LB to join? | If not, AuroraHR's becomes the shared one (R1a) |
| Accept the `max-instances=1` Socket.IO ceiling for v1? | **Yes** for single-tenant ACV; record it |
| Billing account + current trial status? | Verify before assuming free headroom |

Then create the projects and link billing:

```bash
gcloud projects create aurorahr-staging --name="AuroraHR Staging"
gcloud projects create aurorahr-prod    --name="AuroraHR Production"
gcloud billing projects link aurorahr-staging --billing-account=<BILLING_ACCOUNT_ID>
gcloud billing projects link aurorahr-prod    --billing-account=<BILLING_ACCOUNT_ID>
# confirm:
gcloud billing projects describe aurorahr-staging   # expect billingEnabled: True
```

**Exit criteria:** both projects exist, billing enabled, decisions recorded in an ADR at
`docs/adr/`.

---

## Phase 2 — Fix the blockers (staging only)

Work `04-BLOCKERS.md` §1–§5 on a feature branch. Everything is proven locally and in staging
before production exists in any meaningful sense.

**Exit criteria:** every acceptance checkbox in `04-BLOCKERS.md` ticked **with evidence**
(command output, not assertion). `npm run build` succeeds in `backend/` and `frontend-web/`;
existing Jest suites pass; Playwright e2e passes locally.

---

## Phase 3 — Repo artifacts

Add the deploy artifacts from `06-ARTIFACTS.md`:

```
Dockerfile.api            # Express API (multi-stage, node:20-slim)
Dockerfile.web            # Vite build -> nginx
cloudbuild.yaml           # build -> push -> migrate job -> deploy
.gcloudignore
.github/workflows/deploy-cloud-run.yml
docker/nginx/spa.conf     # SPA fallback + security headers
```

**First**, resolve the build-output path trap (`01-CURRENT-STATE.md` §1):

```bash
cd backend && npm ci && npm run build && find dist -name server.js
```

Set the Dockerfile `CMD` from what that actually prints.

**Retire the legacy workflows** in the same commit: delete or rename
`deploy-aurorahr.yml`, `deploy-staging.yml`, `deploy-production.yml.disabled`,
`ci-cd.yml.disabled`. Two live deploy paths is how a droplet deploy silently overwrites a
Cloud Run one.

**Exit criteria:** `docker build -f Dockerfile.api .` succeeds locally and the container
serves `/health` on `PORT=8080`.

---

## Phase 4 — GCP wiring (per project)

```bash
chmod +x docs/devops-handover/scripts/setup-gcp-pipeline.sh
docs/devops-handover/scripts/setup-gcp-pipeline.sh aurorahr-staging <REPO> asia-south1
```

Idempotent (R10). It enables APIs, creates the Artifact Registry `containers` repo, creates
the deployer SA, grants both SAs their roles, sets up the WIF pool/provider, and binds the
deployer to **this repo only**. It prints the WIF provider resource name and the four repo
Variables.

Then set the GitHub **Variables** (Variables, not Secrets — R14):

```bash
R=<REPO>
gh variable set GCP_PROJECT_ID   --repo $R --body "aurorahr-staging"
gh variable set GCP_REGION       --repo $R --body "asia-south1"
gh variable set GCP_WIF_PROVIDER --repo $R --body "<provider resource name printed by script>"
gh variable set GCP_DEPLOYER_SA  --repo $R --body "gha-deployer@aurorahr-staging.iam.gserviceaccount.com"
```

Additional grants AuroraHR needs beyond the script's defaults:

```bash
PID=aurorahr-staging
PNUM=$(gcloud projects describe $PID --format='value(projectNumber)')
COMPUTE="${PNUM}-compute@developer.gserviceaccount.com"
gcloud services enable sqladmin.googleapis.com storage.googleapis.com --project=$PID
gcloud projects add-iam-policy-binding $PID \
  --member="serviceAccount:${COMPUTE}" --role="roles/cloudsql.client" --condition=None
```

(The GCS grant is **bucket-scoped**, applied in Phase 5.)

**Exit criteria:** `gcloud iam workload-identity-pools providers describe github-provider
--location=global --workload-identity-pool=github-pool --project=$PID` succeeds; the four
repo Variables are set.

---

## Phase 5 — Data stores and secrets

**Cloud SQL:**
```bash
PID=aurorahr-staging; REGION=asia-south1; INST=aurorahr-pg
gcloud sql instances create $INST --project=$PID --region=$REGION \
  --database-version=POSTGRES_16 --tier=db-custom-1-3840 \
  --storage-auto-increase --backup --enable-point-in-time-recovery \
  --deletion-protection
gcloud sql databases create aurorahr --instance=$INST --project=$PID
gcloud sql users create aurorahr_app --instance=$INST --project=$PID --password=<generated>
CONN="${PID}:${REGION}:${INST}"     # ⚠️ braces — zsh mangles "$PID:$REGION" (gotcha C1)
```

**GCS bucket** (private; bucket-scoped IAM, not project-wide):
```bash
gcloud storage buckets create gs://aurorahr-staging-documents \
  --project=$PID --location=$REGION --uniform-bucket-level-access
gcloud storage buckets update gs://aurorahr-staging-documents --versioning
gcloud storage buckets add-iam-policy-binding gs://aurorahr-staging-documents \
  --member="serviceAccount:${COMPUTE}" --role="roles/storage.objectAdmin"
```

**Secrets:** follow the fill-file pattern in `07-SECRETS-IAM.md` — values are piped, never
echoed, and the fill-file is deleted afterwards.

**Exit criteria:** instance `RUNNABLE`; bucket exists with uniform access and no public IAM;
every secret in the map exists with a version.

---

## Phase 6 — Data migration (production data — highest care)

Only when Phase 0 recovered a dump.

1. Restore into **staging first**, using an **anonymised** copy if at all possible (R15).
2. Import: `gcloud sql import sql` from a GCS staging bucket, or `pg_restore` through the
   Cloud SQL Auth Proxy.
3. Copy documents into the bucket preserving the paths the database records:
   `gcloud storage rsync -r ./uploads gs://aurorahr-staging-documents/…`
4. **Reconcile.** Row counts per table before/after; object count vs document rows; then spot-
   check that a sample of DB-referenced documents actually resolves in the bucket. A count
   match with broken paths is a silent failure.
5. Delete the local dump and tarball when finished. Record that you did.

**Exit criteria:** documented row-count parity, document-reference resolution rate 100%, and
a **demonstrated restore** (not merely a configured backup — actually restore it and prove
the database comes back).

---

## Phase 7 — Deploy to staging and verify

Push to the branch that triggers the workflow, then watch it — **never pipe to `tail`** (R11):

```bash
R=<REPO>
gh run watch "$(gh run list --repo $R --limit 1 --json databaseId -q '.[0].databaseId')" \
  --repo $R --exit-status
```

Then verify by HTTP, because green ≠ working (R5):

```bash
PID=aurorahr-staging; REGION=asia-south1
API=$(gcloud run services describe aurorahr-api --project=$PID --region=$REGION --format='value(status.url)')
WEB=$(gcloud run services describe aurorahr-web --project=$PID --region=$REGION --format='value(status.url)')
curl -s -o /dev/null -w "api health %{http_code}\n" "$API/health"
curl -s -o /dev/null -w "web root   %{http_code}\n" "$WEB/"
curl -s "$WEB/" | grep -oiE "<title>[^<]*</title>" | head -1
```

Then the functional gates that only matter for **this** app:
- [ ] Log in as a test user; a JWT is issued and an authed route returns data.
- [ ] Upload a document → force a new revision (`gcloud run deploy` again) → **download it**.
- [ ] Socket.IO connects and receives an event (browser devtools: WS 101, not polling-only).
- [ ] Run the Playwright e2e suite against the staging URL.
- [ ] Trigger an error and confirm it appears in Cloud Logging with `severity: ERROR`.

**Exit criteria:** all of the above pass. Any failure returns to Phase 2.

---

## Phase 8 — Production and domain cutover

Repeat Phases 4–7 against `aurorahr-prod`, then follow `08-DOMAIN-CUTOVER.md` to move
`aurorahr.in` off the dead droplet IP onto the load balancer.

**Do not** cut DNS until the production Cloud Run URL passes every Phase 7 gate.

---

## Phase 9 — Post-cutover hardening (tracked, not blocking)

- [ ] Rotate every credential that existed on the droplet — assume compromise of anything on
      a host you lost control of. Also rotate anything that transited a chat transcript.
- [ ] Narrow `secretmanager.secretAccessor` from project-wide to per-secret.
- [ ] Uptime checks + alerting on `/health`; alert on 5xx rate and p95 latency.
- [ ] Budget alerts on both projects.
- [ ] Cloud Armor WAF in front of the LB; rate limiting at the edge.
- [ ] Schedule and **perform** a restore drill; write the runbook from the real attempt.
- [ ] Resume the `hardening` tenant-isolation branch as its own workstream.
- [ ] Decommission DigitalOcean once Cloud Run has been stable for an agreed window.


<!-- ================================================================= -->
<!-- FILE: docs/devops-handover/06-ARTIFACTS.md -->
<!-- ================================================================= -->

# 06 — Copy-ready deploy artifacts

Adapted from a recipe proven on two live apps, **modified for this monorepo** (Express +
TypeORM API, Vite SPA, Socket.IO, Cloud SQL, GCS).

Placeholders: `<PID>`, `<REGION>` = `asia-south1`, `<PNUM>` project number, `<INSTANCE>`.

> **Before writing `Dockerfile.api`, resolve the build-output path** (`01-CURRENT-STATE.md` §1):
> ```bash
> cd backend && npm ci && npm run build && find dist -name server.js
> ```
> The repo's `main` and legacy Dockerfile both say `dist/backend/src/server.js`, but
> `tsconfig.json` (`outDir: ./dist`, `include: src/**/*`) implies `dist/src/server.js`.
> **Use what the build actually emits.** Everything below marks this as `<ENTRY>`.

---

## 1. `Dockerfile.api` — Express + TypeORM

Build context is the **repo root** (so `shared/` is available if the build reaches for it).

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-slim AS base
WORKDIR /app
ENV NODE_ENV=production

# ---------- deps (with dev deps, needed to compile TS) ----------
FROM base AS deps
COPY backend/package.json backend/package-lock.json ./backend/
WORKDIR /app/backend
RUN npm ci --include=dev

# ---------- build ----------
FROM base AS builder
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY backend ./backend
COPY shared ./shared
WORKDIR /app/backend
# Server-only env is injected at RUNTIME from Secret Manager. Placeholders here only satisfy
# any incidental build-time env validation — never real secrets in a layer.
ENV DB_HOST=build-placeholder \
    DB_USER=build-placeholder \
    DB_PASSWORD=build-placeholder \
    JWT_SECRET=build-placeholder \
    JWT_REFRESH_SECRET=build-placeholder
RUN npm run build
# Drop dev dependencies from the artifact we ship
RUN npm prune --omit=dev

# ---------- runtime ----------
FROM base AS runner
ENV PORT=8080 HOST=0.0.0.0
# Run as non-root
RUN useradd --user-group --create-home --shell /bin/false app
WORKDIR /app/backend
COPY --from=builder --chown=app:app /app/backend/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/backend/dist ./dist
COPY --from=builder --chown=app:app /app/backend/package.json ./package.json
USER app
EXPOSE 8080
# <ENTRY> = the path `find dist -name server.js` actually printed.
CMD ["node", "dist/backend/src/server.js"]
```

Notes:
- `node:20-slim`, **not** alpine — musl libc causes native-module surprises.
- No Docker `HEALTHCHECK`: Cloud Run ignores it and probes the port itself.
- No `mkdir /app/uploads`, no `/app/logs` — those were the droplet's stateful design and are
  exactly what `04-BLOCKERS.md` §1 and §5 remove.

---

## 2. `Dockerfile.web` — Vite build → nginx

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-slim AS builder
WORKDIR /app
COPY frontend-web/package.json frontend-web/package-lock.json ./
RUN npm ci
COPY frontend-web ./
COPY shared /shared

# ⚠️ VITE_* are INLINED AT BUILD TIME into the client bundle — exactly like NEXT_PUBLIC_*.
# Supplying them only at runtime is too late; the bundle ships with undefined.
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ARG VITE_APP_ENV=production
ENV VITE_API_URL=$VITE_API_URL \
    VITE_SOCKET_URL=$VITE_SOCKET_URL \
    VITE_APP_ENV=$VITE_APP_ENV
RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY docker/nginx/spa.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

Because the LB routes `/api/**` and `/socket.io/**` to the API on the **same origin**, set
`VITE_API_URL=/api` and `VITE_SOCKET_URL=/` (relative) — no CORS, no hardcoded hostname, and
the same image works behind any domain.

## 3. `docker/nginx/spa.conf`

```nginx
server {
  listen 8080;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  # hashed assets: immutable
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # never cache the shell, or users get a stale app pointing at old assets
  location = /index.html {
    add_header Cache-Control "no-store, must-revalidate";
  }

  # SPA history fallback
  location / {
    try_files $uri $uri/ /index.html;
  }

  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  gzip on;
  gzip_types text/css application/javascript application/json image/svg+xml;
}
```

---

## 4. `cloudbuild.yaml` — build → push → migrate → deploy

```yaml
substitutions:
  _REGION: asia-south1
  _REPO: containers
  _API: aurorahr-api
  _WEB: aurorahr-web
  _JOB: aurorahr-migrate
  _RUNTIME_SA: <PNUM>-compute@developer.gserviceaccount.com
  _SQL_CONN: <PID>:asia-south1:<INSTANCE>   # spell out fully — see gotcha C1
  _BUCKET: aurorahr-staging-documents
  _TAG: latest                              # GitHub Actions overrides with the commit SHA

steps:
  # ---- API image ----
  - id: build-api
    name: gcr.io/cloud-builders/docker
    args: [build, -f, Dockerfile.api,
           -t, '$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/$_API:$_TAG',
           -t, '$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/$_API:latest', .]

  # ---- WEB image (VITE_* are build-args) ----
  - id: build-web
    name: gcr.io/cloud-builders/docker
    args: [build, -f, Dockerfile.web,
           --build-arg, 'VITE_API_URL=/api',
           --build-arg, 'VITE_SOCKET_URL=/',
           -t, '$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/$_WEB:$_TAG',
           -t, '$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/$_WEB:latest', .]

  - id: push-api
    name: gcr.io/cloud-builders/docker
    args: [push, --all-tags, '$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/$_API']
  - id: push-web
    name: gcr.io/cloud-builders/docker
    args: [push, --all-tags, '$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/$_WEB']

  # ---- migrations: a JOB, before traffic shifts (R8) ----
  - id: migrate
    name: gcr.io/google.com/cloudsdktool/cloud-sdk
    entrypoint: bash
    args:
      - -c
      - |
        set -euo pipefail
        gcloud run jobs deploy $_JOB \
          --image=$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/$_API:$_TAG \
          --region=$_REGION --service-account=$_RUNTIME_SA \
          --set-cloudsql-instances=$_SQL_CONN \
          --set-secrets=DB_PASSWORD=aurorahr-db-password:latest \
          --set-env-vars=NODE_ENV=production,DB_HOST=/cloudsql/$_SQL_CONN,DB_NAME=aurorahr,DB_USER=aurorahr_app,DB_SSL=false \
          --command=npm --args=run,migrate \
          --max-retries=0 --task-timeout=900s
        gcloud run jobs execute $_JOB --region=$_REGION --wait

  # ---- deploy API ----
  - id: deploy-api
    name: gcr.io/google.com/cloudsdktool/cloud-sdk
    entrypoint: gcloud
    args:
      - run
      - deploy
      - $_API
      - --image=$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/$_API:$_TAG
      - --region=$_REGION
      - --platform=managed
      - --allow-unauthenticated
      - --port=8080
      - --cpu=1
      - --memory=1Gi
      - --min-instances=1          # warm: HR app, and Socket.IO hates cold starts
      - --max-instances=1          # ⚠️ deliberate ceiling — see 03-TARGET-ARCHITECTURE §5
      - --concurrency=250
      - --session-affinity         # sticky sessions for Socket.IO
      - --timeout=3600             # long-lived WebSocket connections
      - --service-account=$_RUNTIME_SA
      - --add-cloudsql-instances=$_SQL_CONN
      - --set-env-vars=NODE_ENV=production,DB_HOST=/cloudsql/$_SQL_CONN,DB_NAME=aurorahr,DB_USER=aurorahr_app,DB_SSL=false,STORAGE_TYPE=gcs,GCS_BUCKET=$_BUCKET
      - --set-secrets=DB_PASSWORD=aurorahr-db-password:latest,JWT_SECRET=aurorahr-jwt-secret:latest,JWT_REFRESH_SECRET=aurorahr-jwt-refresh-secret:latest,SMTP_PASSWORD=aurorahr-smtp-password:latest

  # ---- deploy WEB ----
  - id: deploy-web
    name: gcr.io/google.com/cloudsdktool/cloud-sdk
    entrypoint: gcloud
    args:
      - run
      - deploy
      - $_WEB
      - --image=$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/$_WEB:$_TAG
      - --region=$_REGION
      - --platform=managed
      - --allow-unauthenticated
      - --port=8080
      - --cpu=1
      - --memory=256Mi
      - --min-instances=0
      - --max-instances=4
      - --concurrency=200
      - --service-account=$_RUNTIME_SA

images:
  - $_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/$_API:$_TAG
  - $_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/$_WEB:$_TAG

options:
  logging: CLOUD_LOGGING_ONLY      # new projects have no default Cloud Build logs bucket
  machineType: E2_HIGHCPU_8
timeout: 2400s
```

> **`$PROJECT_ID` must be used directly** in steps/images. It does **not** expand when nested
> inside a user-`substitutions` default — which is why `_SQL_CONN` spells the project out.

---

## 5. `.gcloudignore`

```
.git
.gitignore
node_modules
**/node_modules
dist
**/dist
.env
.env*.local
*.tsbuildinfo
.DS_Store
.vscode
.idea
docs
e2e
mobile-app
.ua
uploads
*.dump
*.sql
```

Note `uploads`, `*.dump`, `*.sql` — never ship recovered production data into a build context.

---

## 6. `.github/workflows/deploy-cloud-run.yml`

```yaml
name: Deploy to Cloud Run
on:
  push:
    branches: [main]
    paths-ignore: ['**.md', 'docs/**']
  workflow_dispatch:
concurrency:
  group: deploy-production
  cancel-in-progress: false
permissions:
  contents: read
  id-token: write          # required to mint the OIDC token for WIF
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production   # add required reviewers here for a hard human gate
    steps:
      - uses: actions/checkout@v4
      - id: auth
        uses: google-github-actions/auth@v2
        with:
          project_id: ${{ vars.GCP_PROJECT_ID }}
          workload_identity_provider: ${{ vars.GCP_WIF_PROVIDER }}
          service_account: ${{ vars.GCP_DEPLOYER_SA }}
      - uses: google-github-actions/setup-gcloud@v2

      - name: Build, migrate, deploy
        run: |
          set -euo pipefail
          gcloud builds submit \
            --project="${{ vars.GCP_PROJECT_ID }}" \
            --config=cloudbuild.yaml \
            --substitutions=_TAG="${GITHUB_SHA::7}"

      - name: Verify live (green pipeline != working app)
        run: |
          set -euo pipefail
          API=$(gcloud run services describe aurorahr-api \
            --project="${{ vars.GCP_PROJECT_ID }}" --region="${{ vars.GCP_REGION }}" \
            --format='value(status.url)')
          WEB=$(gcloud run services describe aurorahr-web \
            --project="${{ vars.GCP_PROJECT_ID }}" --region="${{ vars.GCP_REGION }}" \
            --format='value(status.url)')
          code=$(curl -s -o /dev/null -w '%{http_code}' "$API/health")
          [ "$code" = "200" ] || { echo "API health $code"; exit 1; }
          code=$(curl -s -o /dev/null -w '%{http_code}' "$WEB/")
          [ "$code" = "200" ] || { echo "WEB root $code"; exit 1; }
          { echo "API: $API"; echo "WEB: $WEB"; } >> "$GITHUB_STEP_SUMMARY"
```

The verify step is **not** optional decoration — it is R5 enforced in CI, so a build that
deploys a broken app fails the run instead of reporting success.

> Pushing any `.github/workflows/*` file needs the `gh` token's **`workflow` scope**. If the
> push is rejected, run `gh auth refresh -h github.com -s workflow`. If the machine has no
> SSH key, set the remote to HTTPS and run `gh auth setup-git`.


<!-- ================================================================= -->
<!-- FILE: docs/devops-handover/07-SECRETS-IAM.md -->
<!-- ================================================================= -->

# 07 — Secrets, IAM, and keyless CI

---

## 1. What is a secret, what is config, what is a build-arg

Three buckets. Getting this wrong is the most common cause of "it works locally but the
deployed app is broken".

| Bucket | Where it goes | AuroraHR examples |
|---|---|---|
| **Runtime secret** | Secret Manager → `--set-secrets` | `DB_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SMTP_PASSWORD` |
| **Runtime config** (not sensitive) | `--set-env-vars` | `NODE_ENV`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_SSL`, `STORAGE_TYPE`, `GCS_BUCKET`, `CORS_ORIGIN`, `LOG_LEVEL` |
| **Build-time inlined** | Docker `--build-arg` | every `VITE_*` |

> **`VITE_*` behaves exactly like `NEXT_PUBLIC_*`: inlined into the client bundle at build
> time.** Setting it only at runtime is too late — the shipped JS contains `undefined`. This
> cost real debugging time on the Next.js apps; do not repeat it here.
>
> And the corollary: **anything in a `VITE_*` var is public.** It ships to every browser.
> Never put a secret in one. `VITE_SENTRY_DSN` is fine; an API key never is.

---

## 2. Secret naming

`<prefix>-<env-var-in-kebab-case>` — mechanical, so it is derivable rather than remembered:

```
JWT_SECRET          -> aurorahr-jwt-secret
JWT_REFRESH_SECRET  -> aurorahr-jwt-refresh-secret
DB_PASSWORD         -> aurorahr-db-password
SMTP_PASSWORD       -> aurorahr-smtp-password
```

Secrets live in the **same project** as the service that reads them, so staging and prod
secrets are naturally separate and cannot be confused.

---

## 3. The no-leak intake pattern

**Never type, echo, or paste a secret value into a chat, a log, or a command line that gets
recorded.** Use a local fill-file, consumed by a pipe.

**Step 1 — write the template** (`/tmp/aurorahr-secrets.env`, keys only):

```
DB_PASSWORD=
JWT_SECRET=
JWT_REFRESH_SECRET=
SMTP_PASSWORD=
```

**Step 2 — the human fills it in an editor.** Values come from the source of truth: the
droplet's `.env`, the password manager, or freshly generated (`openssl rand -base64 48` for
JWT secrets — and if the droplet is lost, these **must** be regenerated, which invalidates
existing sessions; plan for that).

**Step 3 — create secrets, piping so nothing prints:**

```bash
PID=aurorahr-staging; FILE=/tmp/aurorahr-secrets.env
while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in ''|\#*) continue;; esac
  key=${line%%=*}; val=${line#*=}
  key=$(printf '%s' "$key" | tr -d '[:space:]'); val=${val%$'\r'}
  [ -z "$key" ] && continue
  [ -z "$val" ] && { echo "  BLANK (skipped): $key"; continue; }
  sname="aurorahr-$(printf '%s' "$key" | tr 'A-Z_' 'a-z-')"
  if gcloud secrets describe "$sname" --project=$PID >/dev/null 2>&1; then
    printf '%s' "$val" | gcloud secrets versions add "$sname" --project=$PID --data-file=- >/dev/null \
      && echo "  updated $key -> $sname"
  else
    printf '%s' "$val" | gcloud secrets create "$sname" --project=$PID \
      --replication-policy=automatic --data-file=- >/dev/null && echo "  created $key -> $sname"
  fi
done < "$FILE"
```

**Step 4 — delete the fill-file:** `rm -f "$FILE"`

**Step 5 — transcript hygiene.** If a tool result, editor diff, or "file changed" notice
echoes the filled file back into a transcript, the values are exposed. **Say so plainly and
recommend rotation.** This happened during the portfolio migration; the honest disclosure is
part of the procedure, not an admission of failure.

**Verifying a secret without printing it:** probe it. An HTTP 200/401 from the service that
consumes it tells you whether it is live. Never `echo` it to check.

---

## 4. Rotation

Adding a version does not restart anything — `:latest` is resolved **at deploy time**:

```bash
printf '%s' "$NEW" | gcloud secrets versions add aurorahr-jwt-secret --project=$PID --data-file=-
gcloud run services update aurorahr-api --project=$PID --region=asia-south1 \
  --update-secrets=JWT_SECRET=aurorahr-jwt-secret:latest      # forces a new revision
```

**Rotate immediately (Phase 9):** everything that lived on the lost droplet. A host you no
longer control is a host you must assume was compromised — DB password, JWT signing secrets,
SMTP credentials, and any third-party API keys in its `.env`.

Note that rotating `JWT_SECRET`/`JWT_REFRESH_SECRET` invalidates every issued token: all users
are logged out. Fine during a migration; announce it.

---

## 5. Keyless CI (WIF) — why and how

**No service-account JSON key is ever created, downloaded, or stored in GitHub.** GitHub's
OIDC token is exchanged for short-lived GCP credentials; trust is pinned to one repository.

`scripts/setup-gcp-pipeline.sh` builds this:
- Pool `github-pool`, OIDC provider `github-provider`
  (issuer `token.actions.githubusercontent.com`), attribute-condition pinning
  `repository_owner`.
- Deployer SA `gha-deployer@<PID>.iam` with `roles/iam.workloadIdentityUser` bound to a
  **principalSet scoped to the exact repo** (`attribute.repository/<owner>/<repo>`).

**Reuse:** the pool and provider are per-project and reusable. A second app in the same
project needs only another repo binding — not a new pool.

### Role split (R13)

**Deployer SA** — what GitHub impersonates:
`cloudbuild.builds.editor`, `storage.admin`, `viewer`, `serviceusage.serviceUsageConsumer`,
plus `iam.serviceAccountUser` on the runtime SA.

**Runtime/compute SA** — what the build and the service run as:
`run.admin`, `artifactregistry.writer`, `secretmanager.secretAccessor`, `logging.logWriter`,
`cloudbuild.builds.builder`, `iam.serviceAccountUser` **on itself**, plus for AuroraHR:
`cloudsql.client` (project-level) and `storage.objectAdmin` (**bucket-scoped**, not
project-wide).

### The four GitHub **Variables** (not Secrets — they are not sensitive)

```
GCP_PROJECT_ID · GCP_REGION · GCP_WIF_PROVIDER · GCP_DEPLOYER_SA
```

---

## 6. Hardening after it works

Get the pipeline green first, then tighten — in this order:

1. Replace project-wide `secretmanager.secretAccessor` with per-secret bindings.
2. Add required reviewers on the GitHub `production` environment so prod deploys need a human.
3. Separate deployer SAs for staging and prod (they are already separate projects, so this is
   mostly natural).
4. Consider Secret Manager CMEK and per-secret rotation schedules.
5. Audit: `gcloud projects get-iam-policy <PID>` — confirm no stray `owner`/`editor` bindings
   and no user-managed SA keys (`gcloud iam service-accounts keys list`) anywhere.


<!-- ================================================================= -->
<!-- FILE: docs/devops-handover/08-DOMAIN-CUTOVER.md -->
<!-- ================================================================= -->

# 08 — `aurorahr.in` domain cutover

Moving `aurorahr.in` off the dead DigitalOcean IP (`64.227.173.175`) onto a Global External
HTTPS Load Balancer in front of Cloud Run.

This exact procedure resolved a 20-day outage on `chinardeshpande.tech` in June 2026: managed
certificate went ACTIVE in ~6 minutes and the site returned with apex + www and an HTTP→HTTPS
redirect.

---

## 1. Why a Load Balancer here

- **Cloud Run domain mappings are not supported in `asia-south1`.** That alone forces the LB
  (or a Firebase front, which is ruled out below).
- **Socket.IO needs WebSockets.** The LB proxies them; Firebase Hosting's CDN does not do so
  reliably to a Cloud Run rewrite target.
- **Path routing keeps everything same-origin**, which removes CORS and cookie `SameSite`
  problems entirely.
- It is pure `gcloud` — no extra CLI to install, works from any machine.

**Cost:** ~$18/month for the forwarding rule + static IP. Per **R1a this must be the shared
portfolio LB**, with `aurorahr.in` added as a host — never a new AuroraHR-only LB. If no
shared LB exists yet, this one becomes it, and future products join as additional hosts.

---

## 2. Build the load balancer

```bash
P=aurorahr-prod; REGION=asia-south1; N=aurorahr
APEX=aurorahr.in; WWW=www.aurorahr.in

# 1. static global IP
gcloud compute addresses create ${N}-lb-ip --global --project=$P

# 2. serverless NEGs -> the two Cloud Run services
gcloud compute network-endpoint-groups create ${N}-api-neg --region=$REGION \
  --network-endpoint-type=serverless --cloud-run-service=aurorahr-api --project=$P
gcloud compute network-endpoint-groups create ${N}-web-neg --region=$REGION \
  --network-endpoint-type=serverless --cloud-run-service=aurorahr-web --project=$P

# 3. backend services
gcloud compute backend-services create ${N}-api-backend --global \
  --load-balancing-scheme=EXTERNAL_MANAGED --project=$P
gcloud compute backend-services add-backend ${N}-api-backend --global \
  --network-endpoint-group=${N}-api-neg --network-endpoint-group-region=$REGION --project=$P
gcloud compute backend-services create ${N}-web-backend --global \
  --load-balancing-scheme=EXTERNAL_MANAGED --project=$P
gcloud compute backend-services add-backend ${N}-web-backend --global \
  --network-endpoint-group=${N}-web-neg --network-endpoint-group-region=$REGION --project=$P

# 4. url map: default -> web, /api/** and /socket.io/** -> api
gcloud compute url-maps create ${N}-urlmap --default-service=${N}-web-backend --global --project=$P
gcloud compute url-maps add-path-matcher ${N}-urlmap --global --project=$P \
  --path-matcher-name=api-matcher \
  --default-service=${N}-web-backend \
  --backend-service-path-rules='/api/*='${N}'-api-backend,/socket.io/*='${N}'-api-backend' \
  --new-hosts=$APEX,$WWW

# 5. Google-managed certificate (apex + www)
gcloud compute ssl-certificates create ${N}-cert --domains=$APEX,$WWW --global --project=$P

# 6. HTTPS proxy + 443 forwarding rule
gcloud compute target-https-proxies create ${N}-https-proxy \
  --url-map=${N}-urlmap --ssl-certificates=${N}-cert --global --project=$P
gcloud compute forwarding-rules create ${N}-https-fr --global \
  --target-https-proxy=${N}-https-proxy --address=${N}-lb-ip --ports=443 \
  --load-balancing-scheme=EXTERNAL_MANAGED --project=$P

# 7. HTTP -> HTTPS redirect (needs an IMPORTed url-map; there is no pure-flag form)
cat > /tmp/${N}-redirect.yaml <<YAML
name: ${N}-redirect
defaultUrlRedirect:
  httpsRedirect: true
  redirectResponseCode: MOVED_PERMANENTLY_DEFAULT
  stripQuery: false
YAML
gcloud compute url-maps import ${N}-redirect --global --source=/tmp/${N}-redirect.yaml -q --project=$P
gcloud compute target-http-proxies create ${N}-http-proxy --url-map=${N}-redirect --global --project=$P
gcloud compute forwarding-rules create ${N}-http-fr --global \
  --target-http-proxy=${N}-http-proxy --address=${N}-lb-ip --ports=80 \
  --load-balancing-scheme=EXTERNAL_MANAGED --project=$P

# the IP to put in DNS:
gcloud compute addresses describe ${N}-lb-ip --global --project=$P --format='value(address)'
```

> Verify the path-matcher syntax against the installed `gcloud` version before relying on it —
> flag names in `add-path-matcher` have shifted between releases. If it rejects the flags,
> export the url-map to YAML, edit, and `import` it. Do not guess and move on.

---

## 3. Test through the LB *before* touching DNS

The LB serves on its IP immediately; only the certificate waits for DNS. Test with a forced
host header over the (temporarily untrusted) TLS endpoint:

```bash
IP=$(gcloud compute addresses describe ${N}-lb-ip --global --project=$P --format='value(address)')
curl -sk -o /dev/null -w "web %{http_code}\n"  --resolve "$APEX:443:$IP" "https://$APEX/"
curl -sk -o /dev/null -w "api %{http_code}\n"  --resolve "$APEX:443:$IP" "https://$APEX/health"
```

Both must be 200 **before** DNS moves. This is the difference between a 5-minute cutover and
an outage.

---

## 4. DNS cutover (Chinar's action, at the registrar)

Point **both** apex and www at the LB IP as **A records**, replacing the dead
`64.227.173.175`:

```
aurorahr.in        A   <LB_IP>
www.aurorahr.in    A   <LB_IP>
```

Both must resolve to the LB or the managed certificate will not validate.

**Lower the TTL to 300s a day beforehand if possible** — it makes rollback fast. (If the
registrar's current TTL is long, that is a constraint to know *before* cutover, not after.)

---

## 5. Verify

```bash
# authoritative nameserver, bypassing caches:
dig +short @<registrar-ns> aurorahr.in A          # expect <LB_IP>
dig +short @<registrar-ns> www.aurorahr.in A      # expect <LB_IP>

# certificate:
gcloud compute ssl-certificates describe ${N}-cert --global --project=$P \
  --format='value(managed.status)'                # want ACTIVE

# live:
curl -s -o /dev/null -w "%{http_code}\n" https://aurorahr.in/health          # 200
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://aurorahr.in/ # 301 -> https
```

The certificate sits in `PROVISIONING` until DNS resolves, then flips to `ACTIVE` — often
5–15 minutes, occasionally over an hour. **Right at the moment it flips, the HTTPS front-ends
take a couple more minutes to settle; an immediate probe can return `000`. Retry before
concluding anything is wrong.**

---

## 6. App-side checklist

- `CORS_ORIGIN=https://aurorahr.in` (or drop CORS entirely — the LB makes it same-origin).
- `BACKEND_URL` / `FRONTEND_URL` set to `https://aurorahr.in`.
- The web image is rebuilt with `VITE_API_URL=/api` and `VITE_SOCKET_URL=/` (relative, so the
  bundle is domain-agnostic).
- Cookies: `Secure`, `HttpOnly`, `SameSite=Lax` — the app is now HTTPS-only.
- No OAuth redirect-URI change is needed: AuroraHR uses JWT credentials login, not a Google
  OAuth login flow. **Verify** this before telling anyone otherwise.

---

## 7. Rollback

| Situation | Action |
|---|---|
| Bad app revision | `gcloud run services update-traffic aurorahr-api --to-revisions=<PREV>=100 --region=$REGION --project=$P` |
| Bad LB routing | Re-import the previous url-map YAML |
| Cutover must be abandoned | Repoint DNS back — but note the **droplet is dead**, so there is nothing to roll back *to*. Forward-only. |

That last row matters: this is a one-way cutover. There is no working fallback host. Which is
exactly why §3 (test through the LB before DNS) is not optional.

---

## 8. Teardown (only if abandoning the LB)

Delete in reverse: forwarding rules → target proxies → url maps → ssl certificate → backend
services → NEGs → address. **The reserved static IP keeps billing until it is released.**


<!-- ================================================================= -->
<!-- FILE: docs/devops-handover/09-GOTCHAS.md -->
<!-- ================================================================= -->

# 09 — Gotchas

Every item below cost real hours on a real deploy. Items marked **[AuroraHR]** are specific to
this stack; the rest are portfolio-wide and were learned on the Next.js apps.

---

## A. Cloud Build / `cloudbuild.yaml`

**A1. `$PROJECT_ID` does not expand inside a user-`substitutions` default.**
Use it directly in `steps:` and `images:`. Spell out the Cloud SQL connection name fully
(`<PID>:asia-south1:<INSTANCE>`) rather than composing it from `$PROJECT_ID`.

**A2. `options.logging: CLOUD_LOGGING_ONLY` is required on new projects.**
A fresh project has no default Cloud Build logs bucket; without this the build fails on log
storage, with an error that does not obviously say so.

**A3. ⛔ Never pipe a command whose exit code matters.**
```bash
gcloud builds submit ... | tail     # WRONG — you get tail's exit code
```
This masked **three consecutive failed builds** that appeared to succeed. Capture output, check
`$?`, and use `set -euo pipefail` in every multi-line build step.

**A4. zsh mangles `"$PID:$REGION:$INSTANCE"`.**
zsh treats `:a`, `:r` etc. as history modifiers. Use `${PID}:${REGION}:${INSTANCE}` with
braces, or build the string into a variable first.

---

## B. Build / application

**B1. [AuroraHR] The compiled entrypoint path is ambiguous — resolve it, do not guess.**
`package.json` `main` and the legacy Dockerfile both say `dist/backend/src/server.js`, but
`backend/tsconfig.json` (`outDir: "./dist"`, `include: ["src/**/*"]`) implies
`dist/src/server.js`. They disagree. Run:
```bash
cd backend && npm ci && npm run build && find dist -name server.js
```
and set `CMD` from the observed output. A wrong path fails at container start with a bare
`Cannot find module`.

**B2. [AuroraHR] `VITE_*` variables are inlined at BUILD time.**
Exactly like `NEXT_PUBLIC_*`. Pass them as Docker `--build-arg`s. Supplied only at runtime,
the client bundle ships `undefined` and the SPA cannot reach the API — with no build error.
Corollary: **anything in a `VITE_*` var is public**; never put a secret in one.

**B3. Prefer `node:20-slim` over alpine.**
Alpine's musl libc produces native-module surprises. `-slim` costs a few MB and saves an
afternoon.

**B4. An empty directory is not tracked by git**, so a Dockerfile `COPY` of it fails with
`stat app/<dir>: file does not exist`. Add `RUN mkdir -p <dir>` in the builder stage. (Bit the
Next.js `public/` directory; watch for the same with any expected-but-empty path here.)

**B5. A green pipeline is not a working app.** Always `curl` and inspect content. A build can
succeed and serve an error page.

---

## C. Cloud SQL / TypeORM **[AuroraHR]**

**C1. Enable `sqladmin.googleapis.com` before creating the instance** — it is separate from
`run`/`artifactregistry`/`secretmanager`/`cloudbuild`/`iam`.

**C2. `DB_SSL` must be `false` for a Unix-socket connection.**
`data-source.ts` reads `ssl: process.env.DB_SSL === 'true' ? {...} : false`. Over
`/cloudsql/...` the socket is already private and local; requesting TLS fails the connection.
The droplet's `.env` very likely has `DB_SSL=true` — **do not copy it forward blindly.**

**C3. Cloud Run ↔ Cloud SQL needs three things together:**
`--add-cloudsql-instances=<PID>:<REGION>:<INSTANCE>`, `DB_HOST=/cloudsql/<same>`, and
`roles/cloudsql.client` on the runtime SA. Missing any one gives a connection timeout that
looks like a network problem.

**C4. AuroraHR dodges the postgres-js URL bug** — worth knowing why. On the CCC pilot,
`new URL()` (used by postgres-js) *rejects* `postgresql://u:p@/db?host=/cloudsql/INSTANCE`,
requiring structured options instead. AuroraHR's `data-source.ts` already uses discrete
`host`/`port`/`username`/`password` fields, so this does not apply. **Do not "helpfully"
refactor it to a `DATABASE_URL` string** — that would import the bug.

**C5. Never set TypeORM `synchronize: true` outside local dev.** It is currently `false`.
Keep it that way; it will silently restructure a production schema.

---

## D. Cloud Run runtime

**D1. The filesystem is ephemeral and per-instance.** Anything written locally vanishes on
recycle and is invisible to other instances. See `04-BLOCKERS.md` §1 and §5.

**D2. [AuroraHR] Socket.IO broadcasts do not cross instances without a shared adapter.**
With `max-instances > 1` and no Redis adapter, an event emitted on instance A never reaches
clients on instance B. Symptom: notifications reach *some* users, intermittently. Either pin
`max-instances=1` (documented ceiling) or add the Redis adapter. See
`03-TARGET-ARCHITECTURE.md` §5.

**D3. [AuroraHR] Socket.IO also needs `--session-affinity` and `--timeout=3600`.** Without
them, the upgrade handshake and long-lived connections break in ways that look like flaky
client code.

**D4. The container must listen on `$PORT` (8080) on `0.0.0.0`.** The legacy Dockerfile
exposes 3000. A hardcoded port or a `127.0.0.1` bind fails deployment with "container failed
to start and listen on the port".

**D5. Migrations on container start race each other** across instances. Use a Cloud Run Job.

---

## E. IAM / WIF

**E1. The default compute SA only exists once the Compute Engine API is enabled.** On a fresh
project, `actAs` bindings on it fail until then — and even just after creation there is a
few-second propagation lag. Enable `compute.googleapis.com`, then **retry the binding once**.

**E2. Cloud Build now runs as the compute SA**, so that SA needs `run.admin`,
`cloudbuild.builds.builder`, `artifactregistry.writer`, `secretmanager.secretAccessor`,
`logging.logWriter`, and `iam.serviceAccountUser` **on itself** (to deploy a service that runs
as itself). Missing the self-binding produces a confusing permission error at deploy, not at
build.

---

## F. GitHub

**F1. Pushing `.github/workflows/*` requires the `workflow` OAuth scope.**
If rejected: `gh auth refresh -h github.com -s workflow`. This opens a browser device-code
flow and may hit GitHub's sudo-mode passkey prompt.

**F2. No SSH key on the machine?** Set the remote to HTTPS and run `gh auth setup-git` so the
`gh` token is used for pushes.

**F3. [AuroraHR] Multiple deploy workflows will fight each other.** The repo currently has
`deploy-aurorahr.yml`, `deploy-staging.yml`, plus two `.disabled` files. Retire them in the
same commit that adds the Cloud Run workflow, or a droplet-era deploy will silently contend
with the new one.

---

## G. Domain / certificates

**G1. Cloud Run domain mappings are not available in every region** — `asia-south1` is one
where they are not. Hence the Load Balancer.

**G2. A managed certificate stays `PROVISIONING` until *both* apex and www resolve to the LB
IP.** And right when it flips to `ACTIVE`, the HTTPS front-ends need a couple more minutes;
an immediate probe may return `000`. Retry before concluding failure.

**G3. Query the authoritative nameserver directly** (`dig +short @<ns> <domain>`) rather than
trusting a cached local resolver during a cutover.

---

## H. Environment / tooling

**H1. macOS has no `timeout` command.** For slow async conditions (certificate provisioning,
long deploys) use a background poll loop that exits on the condition.

**H2. Verify tooling; do not inherit assumptions about it.** A corporate-MDM machine may block
`npm` and installers; a personal machine may not. Test the command, then decide.

**H3. Model IDs go stale.** If any part of this app calls an LLM, a retired model ID returns
404. Look up current IDs rather than reusing one from memory. (A retired
`claude-3-5-sonnet-20241022` default caused exactly this.)


<!-- ================================================================= -->
<!-- FILE: docs/devops-handover/10-CODEX-OPERATING-RULES.md -->
<!-- ================================================================= -->

# 10 — Operating rules for the AI agent (Codex)

Hard constraints, not suggestions. This system holds a real client's employee records.

---

## 1. The three absolute rules

### Rule 1 — Never touch production data.

No production database is read from, written to, dumped, or restored by the agent. No
production PII is copied into a repository, a test fixture, a seed script, a scratch
directory, a prompt, or a commit. Staging uses **synthetic or anonymised** data only.

If a task appears to require production data, **stop and ask.** That is a human decision with
a human's accountability attached.

### Rule 2 — ACV Solutions is a read-only sentinel.

ACV is a live tenant with real employees. Their records are never modified as a side effect
of migration, refactoring, testing, or cleanup. Import/cleanup scripts under `acv:*` are
**not** run against production by the agent.

### Rule 3 — Never commit a secret, and never print one.

No credential, token, connection string, or key in git — including in example files, comments,
test fixtures, or documentation. Secrets are piped into Secret Manager, never echoed. If a
secret value appears in any output, **say so immediately and recommend rotation.**

---

## 2. What requires human approval before you act

Ask, and wait for an explicit answer:

- Creating, deleting, or modifying **production** GCP resources
- Any DNS change (these are Chinar's to make at the registrar)
- Running database migrations against production
- Deleting **anything** — a branch, a project, a bucket, a droplet, a snapshot, a table
- Rotating a credential that is currently in use
- Merging to `main`, or anything that triggers a production deploy
- Spending decisions: a new LB (~$18/mo), a Cloud SQL tier increase, `min-instances > 0`
- Changing the architecture decisions in `03-TARGET-ARCHITECTURE.md`
- Resolving any item marked **[unknown]** in `01-CURRENT-STATE.md`

Default operating mode is **PR-only**: propose changes as pull requests, do not push to
`main`, and do not hold production credentials.

---

## 3. What you may do freely

- Read any code, configuration, or documentation in the repo
- Work on feature branches; open PRs
- Build and test locally; run the Jest and Playwright suites
- Create and modify **staging** resources, once staging projects are approved and created
- Write the artifacts in `06-ARTIFACTS.md`
- Run read-only `gcloud`/`gh` queries (`describe`, `list`, `get-iam-policy`)

---

## 4. Evidence standards

**Claims about the system must be backed by observation, not inference.**

- Do not say "the app now works" — show the `curl` output and the status code.
- Do not say "tests pass" — show the run and its summary line.
- Do not say "the secret is set" — show `gcloud secrets describe` (metadata only, never the
  value).
- Do not say "deployed successfully" — a green pipeline is not a working app (R5). Show the
  HTTP verification.

If something was not verified, **say it was not verified.** If a step was skipped, say it was
skipped. An honest "I could not confirm this" is worth more than a confident guess, because
someone will act on what you write.

Distinguish these three explicitly in your reports:
- **verified** — I ran it and observed the result
- **inferred** — consistent with the evidence, but not directly observed
- **unknown** — needs a human, or a check I could not perform

---

## 5. Working method

1. **Read before writing.** Read the whole file you are about to change. Read the neighbouring
   code and match its conventions.
2. **One variable at a time.** Do not combine the platform migration with the `hardening`
   security refactor, or with a dependency upgrade, or with a redesign. When something breaks
   you must be able to say what caused it.
3. **Small, reviewable PRs**, each with a stated verification result.
4. **Prefer the boring, consistent path** (R14). Novelty in infrastructure is a cost, not a
   feature.
5. **When blocked, deliver everything that is not blocked**, then state the blocker precisely
   — what you need, from whom, and why the work cannot continue without it.
6. **Do not resurrect superseded patterns.** The root-level `*DEPLOYMENT*.md` files describe a
   droplet architecture that no longer exists. They are not a fallback.

---

## 6. Anti-patterns seen in this repo — do not repeat them

The repository's history shows these; they are named so they are not mistaken for house style:

- **~20 overlapping deployment markdown files at root**, mutually contradictory, none dated,
  none authoritative. If you write a new doc, it replaces the old one — you do not add to the
  pile.
- **`.disabled` workflow files** left in place instead of deleted. Git history is the archive;
  the working tree should reflect what is true.
- **Env vars documented but never implemented** (`STORAGE_TYPE`, `S3_*` — declared in
  `.env.production.example`, read nowhere in code). Documentation that describes intentions as
  if they were facts is worse than no documentation. Verify before believing.
- **`COMMIT_PRODUCTION_CHANGES.sh` / `MANUAL_COMMIT_INSTRUCTIONS.md`** — manual, un-reviewed
  production paths. Everything goes through the pipeline.
- **Untested work on a long-lived branch** (`hardening`: TypeScript-clean, never executed).
  Code that has never run is not "done" — it is a hypothesis.

---

## 7. Escalate immediately, do not work around

Stop and tell Chinar at once if you find:

- Any credential committed in git history
- Any evidence of unauthorised access to the droplet, the database, or a GCP project
- Production data in a place it should not be (a repo, a public bucket, a test fixture)
- Cross-tenant data leakage
- Any situation where recovering the system appears to require handling ACV PII in a way not
  covered by this kit

These are not puzzles to solve quietly. They are reportable events.


<!-- ================================================================= -->
<!-- FILE: docs/devops-handover/11-ACCEPTANCE-CHECKLIST.md -->
<!-- ================================================================= -->

# 11 — Acceptance checklist (definition of done)

Nothing is "done" on assertion. Each box needs an observed result — a command's output, a
status code, a screenshot. Per `10-CODEX-OPERATING-RULES.md` §4.

---

## Gate 0 — Recovery assessed
- [ ] Droplet `aurorahr-production` status established (exists / destroyed / powered off)
- [ ] Database recoverability established, with the newest restore point dated
- [ ] Document (`uploads/`) recoverability established
- [ ] Any recovered dump stored encrypted and logged as a controlled artifact
- [ ] If data is lost: ACV informed, re-import path scoped from `ACV Implementation Data/`

## Gate 1 — Decisions recorded
- [ ] `hardening` branch decision made and written down
- [ ] `aurorahr-staging` + `aurorahr-prod` created, billing enabled and **verified**
- [ ] Shared-LB question resolved (join existing, or this becomes the shared one)
- [ ] Socket.IO `max-instances=1` ceiling explicitly accepted and documented
- [ ] ADR written under `docs/adr/`

## Gate 2 — Blockers cleared (`04-BLOCKERS.md`)
- [ ] **Storage:** upload → force new revision → document still downloads
- [ ] **Storage:** no public object ACL; unauthenticated object URL returns 403
- [ ] **Storage:** signed URL expires correctly; tenant A cannot obtain a tenant B URL
- [ ] **Port:** container serves `/health` with `PORT=8080`, bound `0.0.0.0`
- [ ] **Migrations:** absent from entrypoint; job runs twice with the second a clean no-op
- [ ] **Health:** returns 200 unauthenticated, and still 200 with the DB unreachable
- [ ] **Logs:** structured JSON to stdout; `gcloud logging read` shows correct severities
- [ ] `.ua/` gitignored; superseded root deployment docs deleted; legacy workflows retired

## Gate 3 — Pipeline works
- [ ] `docs/devops-handover/scripts/setup-gcp-pipeline.sh` run, idempotent on re-run
- [ ] Four GitHub **Variables** set (not Secrets)
- [ ] **No service-account JSON key exists anywhere** — `gcloud iam service-accounts keys list`
      shows only Google-managed keys
- [ ] Push to branch → build → migrate → deploy, fully automatic
- [ ] The workflow's verify step actually fails the run when the app is broken (test it
      deliberately — break it once and confirm the pipeline goes red)

## Gate 4 — Staging verified
- [ ] `GET /health` → 200; SPA root → 200 with real content
- [ ] Login issues a JWT; an authed route returns data
- [ ] Document upload → new revision → download succeeds
- [ ] Socket.IO connects (WS 101 in devtools, not polling-only) and receives an event
- [ ] Playwright e2e suite passes against staging
- [ ] An induced error appears in Cloud Logging at `severity: ERROR` with a correlation id
- [ ] Cloud SQL automated backups on, PITR on, **and a restore actually performed**

## Gate 5 — Data migrated (if applicable)
- [ ] Row-count parity per table, documented
- [ ] 100% of DB-referenced documents resolve in the bucket (sampled and checked, not just
      counted)
- [ ] Local dumps and tarballs deleted; deletion recorded

## Gate 6 — Production live
- [ ] Gates 3–5 repeated against `aurorahr-prod`
- [ ] LB tested via `--resolve` **before** any DNS change (both 200)
- [ ] DNS moved; `dig` at the authoritative NS confirms both apex and www → LB IP
- [ ] Managed certificate `ACTIVE`
- [ ] `https://aurorahr.in/health` → 200; `http://` → 301 → https
- [ ] Full functional pass on the real domain (login, upload, download, sockets)
- [ ] Previous revision names noted, and the rollback command rehearsed

## Gate 7 — Hardening
- [ ] Every droplet-era credential rotated (assume compromise of a lost host)
- [ ] Anything that transited a chat transcript rotated
- [ ] `secretmanager.secretAccessor` narrowed from project-wide to per-secret
- [ ] Uptime check + alerting on `/health`; 5xx and p95 latency alerts
- [ ] Budget alerts on both projects
- [ ] Required reviewers on the GitHub `production` environment
- [ ] Restore drill performed and the runbook written from the real attempt
- [ ] DigitalOcean decommissioned after an agreed stable window

---

## The four questions to answer before saying "done"

1. **Can I show it?** Which command, and what did it output?
2. **Does it survive a restart?** State that does not survive a new revision is not state.
3. **Can I roll it back?** Which revision, which command, and has it been tried?
4. **What did I not verify?** Say it plainly, before someone else finds out the hard way.


<!-- ================================================================= -->
<!-- FILE: docs/devops-handover/scripts/setup-gcp-pipeline.sh -->
<!-- ================================================================= -->

```bash
#!/usr/bin/env bash
# ============================================================================
# Idempotent GCP wiring for the AuroraHR Cloud Run pipeline.
#
# Enables APIs, creates Artifact Registry, sets up Workload Identity Federation
# (keyless CI) + service-account IAM, and prints the WIF provider resource name
# plus the four GitHub repo Variables to set.
#
# Usage:
#   ./setup-gcp-pipeline.sh PROJECT_ID GITHUB_OWNER/REPO REGION
# Example:
#   ./setup-gcp-pipeline.sh aurorahr-staging chinardeshpande/HRMS-SaaS-MVP asia-south1
#
# Safe to re-run (R10). A freshly-created default compute SA can lag a few
# seconds before IAM bindings on it succeed — those are retried once.
#
# NOTE: this creates NO service-account JSON keys. That is deliberate (R2).
# ============================================================================
set -uo pipefail

PID="${1:?project id}"; REPO="${2:?owner/repo}"; REGION="${3:?region}"
OWNER="${REPO%%/*}"

echo "== enable APIs =="
# run/cloudbuild/artifactregistry/secretmanager/iamcredentials/sts/iam = the base pipeline.
# compute      -> so the default compute SA exists (see gotcha E1)
# sqladmin     -> Cloud SQL (gotcha C1: separate API, easy to miss)
# storage      -> GCS bucket for employee documents (blocker 1)
gcloud services enable \
  run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  secretmanager.googleapis.com iamcredentials.googleapis.com sts.googleapis.com \
  iam.googleapis.com compute.googleapis.com sqladmin.googleapis.com \
  storage.googleapis.com --project="$PID"

PNUM="$(gcloud projects describe "$PID" --format='value(projectNumber)')"
COMPUTE="$PNUM-compute@developer.gserviceaccount.com"
DEPLOYER="gha-deployer@$PID.iam.gserviceaccount.com"
echo "project number: $PNUM"

echo "== Artifact Registry 'containers' =="
gcloud artifacts repositories create containers --repository-format=docker \
  --location="$REGION" --project="$PID" 2>/dev/null \
  || echo "  (already exists)"

echo "== deployer service account =="
gcloud iam service-accounts create gha-deployer --project="$PID" \
  --display-name="GitHub Actions deployer ($REPO)" 2>/dev/null \
  || echo "  (already exists)"

echo "== deployer project roles =="
for ROLE in roles/cloudbuild.builds.editor roles/storage.admin roles/viewer \
            roles/serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding "$PID" \
    --member="serviceAccount:$DEPLOYER" --role="$ROLE" --condition=None -q >/dev/null \
    && echo "  + $ROLE"
done

echo "== compute SA (build + runtime identity) roles =="
# cloudsql.client is AuroraHR-specific (Cloud SQL over unix socket, gotcha C3).
# NOTE: storage.objectAdmin is granted BUCKET-SCOPED in Phase 5, not here —
# deliberately not project-wide (least privilege, R13).
for ROLE in roles/run.admin roles/artifactregistry.writer roles/secretmanager.secretAccessor \
            roles/logging.logWriter roles/cloudbuild.builds.builder roles/cloudsql.client; do
  gcloud projects add-iam-policy-binding "$PID" \
    --member="serviceAccount:$COMPUTE" --role="$ROLE" --condition=None -q >/dev/null \
    && echo "  + $ROLE"
done

echo "== actAs bindings (retry once for SA propagation — gotcha E1) =="
bind_actas() {
  gcloud iam service-accounts add-iam-policy-binding "$COMPUTE" --project="$PID" \
    --member="$1" --role="roles/iam.serviceAccountUser" -q >/dev/null 2>&1
}
for M in "serviceAccount:$DEPLOYER" "serviceAccount:$COMPUTE"; do
  bind_actas "$M" || { sleep 8; bind_actas "$M"; } && echo "  + actAs: $M"
done

echo "== Workload Identity Federation (keyless CI) =="
gcloud iam workload-identity-pools create github-pool --project="$PID" --location=global \
  --display-name="GitHub Actions pool" 2>/dev/null || echo "  (pool exists)"
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --project="$PID" --location=global --workload-identity-pool=github-pool \
  --display-name="GitHub OIDC" --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == '$OWNER'" 2>/dev/null \
  || echo "  (provider exists)"

echo "== bind deployer to THIS repo only =="
gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER" --project="$PID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$PNUM/locations/global/workloadIdentityPools/github-pool/attribute.repository/$REPO" \
  -q >/dev/null && echo "  + repo binding: $REPO"

PROVIDER="projects/$PNUM/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
cat <<EOF

============================================================
 DONE. Set these GitHub repo Variables (Variables, NOT Secrets):

   gh variable set GCP_PROJECT_ID   --repo $REPO --body "$PID"
   gh variable set GCP_REGION       --repo $REPO --body "$REGION"
   gh variable set GCP_WIF_PROVIDER --repo $REPO --body "$PROVIDER"
   gh variable set GCP_DEPLOYER_SA  --repo $REPO --body "$DEPLOYER"

 Cloud Build / runtime identity (cloudbuild.yaml _RUNTIME_SA):
   $COMPUTE

 STILL TO DO (Phase 5 of the runbook):
   - create Cloud SQL instance + database + user
   - create the documents bucket and grant BUCKET-SCOPED storage.objectAdmin
     to $COMPUTE
   - create Secret Manager secrets via the fill-file pattern (07-SECRETS-IAM.md)
============================================================
EOF
```
