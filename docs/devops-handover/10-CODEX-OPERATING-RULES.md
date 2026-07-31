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
