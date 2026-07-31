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
| Reuse `acv-solutions-63915` or create new projects? | **Create `aurahrms-staging` + `aurahrms-prod`** (R7) |
| Is there an existing shared LB to join? | If not, AuraHRMS's becomes the shared one (R1a) |
| Accept the `max-instances=1` Socket.IO ceiling for v1? | **Yes** for single-tenant ACV; record it |
| Billing account + current trial status? | Verify before assuming free headroom |

Then create the projects and link billing:

```bash
gcloud projects create aurahrms-staging --name="AuraHRMS Staging"
gcloud projects create aurahrms-prod    --name="AuraHRMS Production"
gcloud billing projects link aurahrms-staging --billing-account=<BILLING_ACCOUNT_ID>
gcloud billing projects link aurahrms-prod    --billing-account=<BILLING_ACCOUNT_ID>
# confirm:
gcloud billing projects describe aurahrms-staging   # expect billingEnabled: True
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
docs/devops-handover/scripts/setup-gcp-pipeline.sh aurahrms-staging <REPO> asia-south1
```

Idempotent (R10). It enables APIs, creates the Artifact Registry `containers` repo, creates
the deployer SA, grants both SAs their roles, sets up the WIF pool/provider, and binds the
deployer to **this repo only**. It prints the WIF provider resource name and the four repo
Variables.

Then set the GitHub **Variables** (Variables, not Secrets — R14):

```bash
R=<REPO>
gh variable set GCP_PROJECT_ID   --repo $R --body "aurahrms-staging"
gh variable set GCP_REGION       --repo $R --body "asia-south1"
gh variable set GCP_WIF_PROVIDER --repo $R --body "<provider resource name printed by script>"
gh variable set GCP_DEPLOYER_SA  --repo $R --body "gha-deployer@aurahrms-staging.iam.gserviceaccount.com"
```

Additional grants AuraHRMS needs beyond the script's defaults:

```bash
PID=aurahrms-staging
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
PID=aurahrms-staging; REGION=asia-south1; INST=aurahrms-pg
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
gcloud storage buckets create gs://aurahrms-staging-documents \
  --project=$PID --location=$REGION --uniform-bucket-level-access
gcloud storage buckets update gs://aurahrms-staging-documents --versioning
gcloud storage buckets add-iam-policy-binding gs://aurahrms-staging-documents \
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
   `gcloud storage rsync -r ./uploads gs://aurahrms-staging-documents/…`
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
PID=aurahrms-staging; REGION=asia-south1
API=$(gcloud run services describe aurahrms-api --project=$PID --region=$REGION --format='value(status.url)')
WEB=$(gcloud run services describe aurahrms-web --project=$PID --region=$REGION --format='value(status.url)')
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

Repeat Phases 4–7 against `aurahrms-prod`, then follow `08-DOMAIN-CUTOVER.md` to move
`aurahrms.com` onto the load balancer. The legacy `aurorahr.in` domain remains historical
context only and is not part of this cutover.

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
