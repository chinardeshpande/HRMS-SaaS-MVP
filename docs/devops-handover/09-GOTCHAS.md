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
