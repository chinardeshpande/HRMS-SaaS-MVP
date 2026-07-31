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
