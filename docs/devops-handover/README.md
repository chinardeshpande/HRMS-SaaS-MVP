# AuraHRMS — Hosting & DevOps Handover Kit

**Version:** 1.0 · **Written:** 2026-07-23 · **Author:** Claude Code (Opus 4.8), from a proven
GCP Cloud Run recipe shipped on two live production apps.
**Audience:** ChatGPT Codex (or any agent/engineer) restarting the AuraHRMS HRMS MVP with the
ACV Solutions implementation.

---

## 0. Read this first

This kit is the **canonical hosting and DevOps standard** for AuraHRMS. It exists because the
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
| `03-TARGET-ARCHITECTURE.md` | The AuraHRMS target design + the decisions behind it | Before planning |
| `04-BLOCKERS.md` | 5 things that must be fixed before Cloud Run works at all | Before coding |
| `05-RUNBOOK.md` | Phase-by-phase execution, Phase 0 → Phase 9 | During execution |
| `06-ARTIFACTS.md` | Copy-ready Dockerfile / cloudbuild.yaml / workflow / health route | Phase 3 |
| `07-SECRETS-IAM.md` | Secret Manager map, WIF/keyless CI, no-leak intake pattern | Phase 4–5 |
| `08-DOMAIN-CUTOVER.md` | `aurahrms.com` DNS cutover, LB vs Firebase, rollback | Phase 8 |
| `09-GOTCHAS.md` | Hard-won failures. Each one cost real hours | Continuously |
| `10-CODEX-OPERATING-RULES.md` | **Guardrails.** What Codex may and may not do | First. Always. |
| `11-ACCEPTANCE-CHECKLIST.md` | Definition of done + verification gates | Before claiming done |
| `scripts/setup-gcp-pipeline.sh` | Idempotent GCP wiring (APIs, AR, WIF, IAM) | Phase 4 |

---

## 3. Suggested prompt to give Codex

Paste this to start the engagement:

```text
You are restarting the AuraHRMS HRMS MVP (repo: HRMS-SaaS-MVP) and moving it to
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

**AuraHRMS is materially different from both**, and this kit says exactly where: those were
Next.js apps with no file uploads and no WebSockets. AuraHRMS is an Express + TypeORM API
with a separate Vite SPA, Socket.IO, local-disk document storage, and live client PII. The
adaptations are documented rather than hand-waved — see `03-TARGET-ARCHITECTURE.md` and
`04-BLOCKERS.md`.
