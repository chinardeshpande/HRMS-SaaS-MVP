# ACV Pilot Release Gate

Use this checklist for the limited ACV pilot release. It supplements the platform-wide
acceptance checklist in `docs/devops-handover/11-ACCEPTANCE-CHECKLIST.md`. Evidence must not
contain employee records, credentials, document URLs, or other PII.

## Release baseline

- Target: `aurahrms.com`, ACV Solutions Pvt Ltd only.
- Release path: pull request -> `main` -> staging build/test -> immutable image-digest
  promotion through `.github/workflows/promote-production.yml`.
- Last observed baseline before this pilot work: commit `8fc31d6e` on 2026-08-04.
- Observed GitHub evidence for that baseline:
  - E2E run `30905274742`: success.
  - Staging deployment run `30905347274`: success.
  - Production promotion run `30908833408`: success.
- These historical green runs are evidence for that exact commit only. The pilot candidate
  needs fresh runs and the human checks below.

## Automated gate — blocking

- [ ] Backend QA passes for the exact candidate commit.
- [ ] Frontend production build passes for the exact candidate commit.
- [ ] Playwright passes for the exact candidate commit.
- [ ] Production dependency audit has no unresolved critical finding; high findings are fixed
      or explicitly accepted by the accountable owner with a dated follow-up.
- [ ] Database startup resilience test proves a transient connection timeout is retried and a
      permanent authentication error is not retried.
- [ ] Staging deployment succeeds for the exact commit and records API/web image digests.

Candidate audit snapshot (2026-08-09): backend production dependencies report 18 findings
(12 moderate, 6 high, 0 critical); frontend production dependencies report 8 findings
(4 moderate, 4 high, 0 critical). Dependency upgrades remain a separate focused change per
the one-variable-at-a-time operating rule. The accountable owner must either approve that
follow-up before pilot release or record a time-bounded acceptance here.

Local candidate evidence captured on 2026-08-09 (informational until repeated by CI for the
exact commit):

- Backend QA: 24 suites, 185 tests passed.
- Backend TypeScript production build: passed.
- Frontend Vite production build: passed.
- Playwright: 61 tests passed, 2 intentionally skipped.
- Database startup resilience unit coverage: 6 tests passed.
- `git diff --check`: passed.
- Frontend has no Jest test files; browser behavior is covered by Playwright rather than an
  empty Jest gate.

## Human staging acceptance — blocking

Run with approved test identities. Record only pass/fail, tester, date, and non-PII issue IDs.

- [ ] HR administrator: login, dashboard, employee register and one employee profile open.
- [ ] HR administrator: company and employee document preview/download work.
- [ ] Employee: own dashboard, profile and documents open; admin routes remain inaccessible.
- [ ] Employee -> manager: one leave request is submitted, approved/rejected, and visible to
      both roles with the expected status.
- [ ] Employee -> manager: one attendance clock/regularisation journey completes.
- [ ] HR administrator: attendance policy can be viewed and updated without affecting a
      different tenant.
- [ ] HR administrator: onboarding candidate/case/task journey completes for synthetic test
      data.
- [ ] HR Connect post creation survives reload; chat or messaging works in both directions.
- [ ] Socket.IO establishes a WebSocket connection and a recipient observes one event.
- [ ] A fresh API revision starts while the database is available; a controlled transient
      database-startup failure recovers within the configured retry window.
- [ ] No tested role can see another tenant's employees, documents, compensation, leave,
      attendance, conversations, or reports.

## Production promotion — blocking

Requires the explicit human approval mandated by
`docs/devops-handover/10-CODEX-OPERATING-RULES.md`.

- [ ] Previous production API/web revisions and rollback owner recorded.
- [ ] Candidate commit and staging image digests match the promotion inputs.
- [ ] Any schema migration is reviewed and executed by the approved production procedure.
- [ ] Candidate direct URLs pass `/health` and `/` before traffic moves.
- [ ] `https://aurahrms.com/health` and `/` return HTTP 200 after promotion.
- [ ] ACV owner performs login plus representative employee, document, leave, attendance and
      HR Connect checks without sharing PII evidence with an agent.
- [ ] Cloud Logging shows no sustained new database timeouts or HTTP 5xx errors during the
      agreed observation window.
- [ ] Rollback command is prepared with the recorded revisions; no database restore is used
      as an improvised application rollback.

## Explicit pilot deferrals — non-blocking

The pilot is intentionally limited. These items are not represented as delivered and must not
silently become acceptance assumptions:

- **Multi-shift attendance:** deferred. The pilot uses one agreed attendance-policy model;
  rotating, overlapping, overnight, and employee-specific shift assignment are out of scope.
- **Attendance-consuming holiday master:** deferred. Holiday entries may be displayed or
  represented in imported attendance, but a governed holiday master that automatically drives
  attendance and leave calculations is out of scope.

Any workflow that depends on either deferred capability must remain manual for the pilot and
must have a named ACV owner.

## Decision

- Candidate commit:
- Staging workflow/run:
- Production promotion run:
- ACV business approver:
- Technical approver:
- Decision: GO / CONDITIONAL GO / NO-GO
- Conditions or linked issue IDs:
- Pilot start and review date:
