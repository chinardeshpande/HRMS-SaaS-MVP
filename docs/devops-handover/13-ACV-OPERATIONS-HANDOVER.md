# 13 — ACV Operations Handover

This is the handover checklist for the ACV Solutions team after AuraHRMS is accepted on
`aurahrms.com`. It complements the technical acceptance gates in
`11-ACCEPTANCE-CHECKLIST.md`; it does not replace them.

No employee names, credentials, database values, signed storage URLs, or other PII belong in
this document or its evidence links.

---

## 1. Service ownership

Record named people before handover:

| Responsibility | Owner | Backup | Evidence/location |
|---|---|---|---|
| ACV business owner | To assign | To assign | ACV internal register |
| AuraHRMS application owner | To assign | To assign | ACV internal register |
| GCP billing owner | To assign | To assign | Google Cloud IAM/billing |
| GitHub repository owner | To assign | To assign | GitHub access settings |
| Security/privacy contact | To assign | To assign | ACV incident directory |
| Deployment approver | To assign | To assign | GitHub `production` environment |

The handover is incomplete until every role has a named owner and backup outside this public
repository.

---

## 2. Normal operating model

- All application and infrastructure changes use a feature branch and pull request.
- Required CI must pass before merge.
- Staging is deployed and accepted before production promotion.
- Production deployment is manual and requires an authorised human approver.
- Production data operations are performed only by an accountable human using the approved
  runbook; agents never read, dump, restore, or transform production PII.
- Secrets live in Secret Manager. Do not paste credentials, signed URLs, employee records, or
  database output into GitHub, chat, tickets, or documents.
- `main` is the source of code truth. Cloud Run revisions and Artifact Registry digests are
  the source of deployment truth.

---

## 3. Release checklist

### Before promotion

- [ ] PR merged to `main`; backend and e2e checks green.
- [ ] Staging workflow green for the exact commit.
- [ ] Owner confirms login, representative authenticated workflows, document Preview and
      Download, and Socket.IO behavior in staging.
- [ ] Staging API and web image digests recorded.
- [ ] Migration reviewed for compatibility and rollback implications.
- [ ] Previous production API and web revisions recorded.
- [ ] Change window and deployment approver recorded.

### Promotion

- [ ] Use the dedicated production-promotion workflow; do not repoint the staging workflow.
- [ ] Promote the already-tested image digest; do not rebuild for production.
- [ ] Run the approved production migration job once.
- [ ] Deploy API and web revisions with zero traffic surprises.
- [ ] Verify direct Cloud Run API `/health` and web `/` before domain checks.

### After promotion

- [ ] `https://aurahrms.com/` and `/health` return 200.
- [ ] `https://www.aurahrms.com/` returns the expected application.
- [ ] HTTP redirects to HTTPS and certificate is ACTIVE.
- [ ] Owner confirms login and representative ACV workflows.
- [ ] Owner confirms one employee document Preview and Download without sharing its URL or
      contents.
- [ ] Cloud Logging shows no new sustained errors.
- [ ] Release commit, image digests, revisions, approver, and timestamp recorded.

---

## 4. Rollback

Rollback is application-first. Do not restore a database merely to undo an application
release.

1. Stop further deployments.
2. Record the failing revision and symptoms without copying PII into the incident record.
3. Route API and web traffic to the previously recorded known-good revisions.
4. Verify direct service URLs, then `aurahrms.com`.
5. If a migration is suspected, escalate to the application and database owners. Do not run
   an improvised down-migration or restore.
6. Open a corrective PR and preserve the failed revision for investigation.

The exact rollback commands and known-good revision names must be copied from the release
record at deployment time; never guess a revision.

---

## 5. Backup and restore

- Cloud SQL automated backups, PITR, and deletion protection must remain enabled.
- GCS document-bucket versioning and uniform bucket-level access must remain enabled.
- A restore drill must be performed on a controlled, isolated target and documented without
  exposing restored PII to agents or general-purpose logs.
- The database restore and document recovery procedures are separate; both must be tested.
- Restore authority belongs to the named database/application owners, not an AI agent.

Quarterly evidence should record only dates, resource identifiers, outcome, and accountable
human—not database rows or document names.

---

## 6. Monitoring and routine checks

At minimum, the ACV owner should receive alerts for:

- public `/health` availability;
- Cloud Run 5xx rate and p95 latency;
- failed migration or deployment workflows;
- Cloud SQL storage, connectivity, and backup failures;
- monthly GCP budget thresholds;
- managed certificate expiry or failure.

Review monthly:

- GitHub and GCP access lists;
- service-account keys (expected: no user-managed deployer keys);
- public bucket IAM bindings (expected: none);
- production revisions and unused artifacts;
- costs versus the agreed three-month operating window.

---

## 7. Staging data policy

The target state is synthetic or anonymised staging data only. The temporary presence of ACV
PII in staging is an exception that must be closed before final handover:

- [ ] Restrict access to the smallest approved group during validation.
- [ ] Record the owner and expiry date of the exception.
- [ ] Purge ACV PII after production acceptance using a human-approved procedure.
- [ ] Reseed synthetic data and repeat basic staging health checks.
- [ ] Confirm no production dump or document corpus remains in local scratch locations.

---

## 8. Three-month decision point

At the agreed three-month review, ACV must explicitly choose one:

1. Continue production and renew the operating ownership/cost commitment.
2. Pause the service while retaining an approved backup for a defined period.
3. Decommission the service using a separately approved retention-and-destruction plan.

Decommissioning must cover DNS/LB, Cloud Run, Cloud SQL, GCS, secrets, Artifact Registry,
monitoring, GitHub environments, backups, retention obligations, and confirmation by the ACV
business and privacy owners. Resource deletion is never inferred from choosing not to renew.
