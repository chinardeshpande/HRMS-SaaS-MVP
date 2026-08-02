# 01 — Current State (verified 2026-08-02)

This file records the observed platform state after the Cloud Run rebuild. Facts are marked
**[verified]**; incomplete evidence is marked **[unknown]**. The operating constraints in
`10-CODEX-OPERATING-RULES.md` continue to apply.

---

## 1. Recovery decision

**[verified — human report]** The DigitalOcean droplet was destroyed and DigitalOcean had no
backup or snapshot. The former production database and droplet-local uploads were not
recoverable.

**[verified]** ADR `0001-aurahrms-cloud-run-fresh-start.md` records the resulting decision:
rebuild from the current local application, use `aurahrms.com`, keep staging and production in
separate GCP projects, ship `main` before the unexecuted `hardening` branch, and keep all
production PII operations human-controlled.

---

## 2. Repository and delivery state

**[verified 2026-08-02]** `origin/main` is `63b32a27`, “Proxy private document downloads
through API (#75)”. The three most recent document-recovery PRs are:

| PR | Commit | Purpose |
|---|---|---|
| #73 | `6096bc7` | private local recovery scanner |
| #74 | `6ae0900` | hash-verified recovery copies |
| #75 | `63b32a2` | authenticated API streaming for private downloads |

The active workflow `.github/workflows/deploy-cloud-run.yml` is a manually dispatched,
staging-only deployment. It authenticates with WIF, submits `cloudbuild.yaml`, runs the
migration job, deploys the API and web services, then verifies both service URLs by HTTP.

**[verified]** Workflow run `30697288929` successfully deployed `63b32a27` to staging. Its
manual rerun also completed successfully on 2026-08-01.

**[gap]** There is no production promotion workflow on `main`. The existing staging workflow
must not be repointed to production. Production promotion must be a separate, manual workflow
that promotes the tested staging image rather than rebuilding it.

**[gap]** GitHub environments `staging` and `production` exist, but `production` currently has
no protection rules or required reviewer.

---

## 3. Staging (`aurahrms-staging`)

**[verified 2026-08-02]** Project `aurahrms-staging` is ACTIVE with billing enabled.

| Resource | Observed state |
|---|---|
| API | revision `aurahrms-api-00013-bl2`, image tag `63b32a27…`, HTTP `/health` 200 |
| Web | revision `aurahrms-web-00005-zw9`, image tag `63b32a27…`, HTTP `/` 200 |
| Migration job | `aurahrms-migrate`; latest execution successful |
| Cloud SQL | PostgreSQL 16, RUNNABLE, backups on, PITR on, deletion protection on |
| Documents | `gs://aurahrms-staging-documents`, uniform access and versioning on, no public IAM binding |
| Secrets | required secret resources exist; values were not read |
| CI auth | WIF provider ACTIVE; no user-managed deployer service-account key was listed |

The API is capped at one instance with concurrency 250 and session affinity. Both API and web
currently scale to zero; this differs from ADR 0001's proposed one minimum API instance and is
the lower-cost configuration presently deployed.

### Staging PII exception — unresolved

**[verified — human-run procedure and reported results]** A human restored the current local
ACV database into staging and uploaded recovered ACV documents. This means staging contains
real employee PII, contrary to the canonical synthetic-only staging rule.

The agent must not inspect these records. Before handover, the owner must choose and record a
remediation window: restrict staging as a temporary PII environment, complete validation, and
then purge/reseed it with synthetic data. This is an open acceptance gate.

### Remaining staging acceptance

- [ ] Signed-in login and authenticated route verified by the owner.
- [ ] Employee PDF Preview and Download verified after PR #75.
- [ ] Company-document Preview and Download verified after PR #75.
- [ ] Document survives a newly deployed revision.
- [ ] Socket.IO connects and receives an event.
- [ ] An error appears in Cloud Logging with `severity: ERROR` and a correlation ID.
- [ ] A Cloud SQL restore drill is demonstrated.
- [ ] Staging PII is purged and replaced with synthetic data after the approved validation window.

---

## 4. Production (`aurahrms-prod`)

**[verified 2026-08-02]** Project `aurahrms-prod` is ACTIVE with billing enabled. Production
infrastructure exists and the public domain is live.

| Resource | Observed state |
|---|---|
| API | revision `aurahrms-api-00003-q8b`, image tag `prod-731ae872`, direct `/health` 200 |
| Web | revision `aurahrms-web-00001-w5t`, image tag `prod-731ae872`, direct `/` 200 |
| Migration job | `aurahrms-migrate`; latest execution successful |
| Cloud SQL | PostgreSQL 16, RUNNABLE, backups on, PITR on, deletion protection on |
| Documents | `gs://aurahrms-prod-documents`, uniform access and versioning on, no public IAM binding |
| Secrets | required secret resources exist; values were not read |
| CI auth | WIF provider ACTIVE; no user-managed deployer service-account key was listed |

**[verified]** `aurahrms.com` resolves to `8.233.68.252`; apex and `www` return HTTPS 200;
HTTP redirects to HTTPS; managed certificate `aurahrms-cert-v2` is ACTIVE and covers both
hostnames. `https://aurahrms.com/health` returns 200.

**[gap]** Production runs older application commit `731ae872`, while staging runs tested
commit `63b32a27`. Production therefore does not yet include PRs #70–#75, including the
authenticated document-streaming fix.

**[unknown]** No agent inspection of production database rows, employee records, or document
contents was performed or is permitted. Signed-in production workflows and the completeness
of the ACV implementation require human validation.

---

## 5. Security and governance gaps

- Production promotion is not encoded as a separate PR-reviewed workflow.
- The production GitHub environment has no required reviewer protection.
- WIF provider conditions are restricted to the GitHub repository owner, not visibly to this
  single repository; bindings and conditions need a focused least-privilege review.
- Runtime services use the projects' default compute service accounts rather than dedicated
  least-privilege runtime identities.
- Secret Manager access scope has not yet been proven per-secret.
- Uptime, 5xx, latency, and budget alerts have not yet been evidenced.
- Rollback revisions are identifiable, but a rollback rehearsal has not been evidenced.
- A production restore drill has not been evidenced.

These are tracked handover requirements. They do not authorise an agent to modify production.

---

## 6. Next safe sequence

1. Complete the owner-led signed-in staging acceptance checks, especially document preview.
2. Add and review a dedicated build-once/promote-by-digest production workflow.
3. Configure a human approval gate on the GitHub `production` environment.
4. Obtain explicit approval for the production migration and deployment.
5. Promote the tested staging artifact, verify Cloud Run URLs, then verify the real domain.
6. Complete owner-led ACV data validation without exposing PII to the agent.
7. Purge real PII from staging and reseed synthetic data.
8. Complete the operational and security handover in `13-ACV-OPERATIONS-HANDOVER.md`.
