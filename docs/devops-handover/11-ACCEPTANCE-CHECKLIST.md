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
- [ ] `aurahrms-staging` + `aurahrms-prod` created, billing enabled and **verified**
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
- [ ] Gates 3–5 repeated against `aurahrms-prod`
- [ ] LB tested via `--resolve` **before** any DNS change (both 200)
- [ ] DNS moved; `dig` at the authoritative NS confirms both apex and www → LB IP
- [ ] Managed certificate `ACTIVE`
- [ ] `https://aurahrms.com/health` → 200; `http://` → 301 → https
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
