# 03 — Target Architecture for AuraHRMS

The target state, and — more usefully — **why** each choice was made and what the rejected
alternatives were. Codex: if you want to deviate, argue against the rationale, not the
conclusion.

---

## 1. The shape

```
                    ┌──────────────────────────────────────────┐
  Browser  ───────► │  Global External HTTPS Load Balancer      │
  (aurahrms.com)     │  static IP · Google-managed SSL           │
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
    │ aurahrms-api          │                 │ aurahrms-web              │
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

**Projects:** `aurahrms-staging` and `aurahrms-prod` (R7). Staging first, always.

---

## 2. Decision: two Cloud Run services, not one

**Chosen:** `aurahrms-api` (Express) and `aurahrms-web` (nginx serving the built SPA), behind
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
2. Splitting the SPA onto `aurahrms.com` (Firebase) and the API onto `api.aurahrms.com`
   (LB or direct Cloud Run URL) **reintroduces cross-origin**, and with it CORS + cookie
   `SameSite` + Socket.IO origin configuration — for an app that is already mid-migration.

If cost pressure later makes this worth revisiting, the migration is trivial in the other
direction and can be done once the system is stable. **Do not do it during the cutover.**

> **⚠️ Verify before building:** Cloud Run **domain mappings are not available in every
> region — `asia-south1` is one where they are not**. That is precisely why the LB exists
> here rather than a simple domain mapping. Confirm current regional support before assuming
> a cheaper path is open; do not design around an unverified capability.

**Cost note:** the LB forwarding rule is ~$18/month. Per R1a this must be the **shared**
portfolio LB, with AuraHRMS as a host on it — not a new AuraHRMS-only LB. If no shared LB
exists yet, AuraHRMS's becomes the shared one, and future products are added as hosts.

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
(`aurahrms-prod-documents`, `aurahrms-staging-documents`).

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

**Requirements — set these on `aurahrms-api`:**
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

Per R8 this runs as a **Cloud Run Job** (`aurahrms-migrate`) built from the same image as the
API, executed in the pipeline **after** the image is pushed and **before** traffic shifts to
the new revision. Never in the container entrypoint.

The pipeline order is therefore: build → push → **run migration job** → deploy revision →
verify → (rollback if verification fails).

---

## 7. Decision: staging environment is not optional

`aurahrms-staging` is a full parallel stack: its own project, Cloud Run services, Cloud SQL
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
