# 04 — Blockers: what must be fixed before Cloud Run works at all

Five items. Each is a **hard blocker** — the app will be broken, silently or loudly, without
it. Each has explicit acceptance criteria so "done" is testable rather than asserted.

Work them in this order. #1 is the big one.

---

## Blocker 1 — Document storage is on local disk (data loss on Cloud Run)

**Severity: critical. This destroys client data.**

**Evidence [verified]:**
```
backend/src/middleware/upload.ts:7   const uploadsDir = path.join(__dirname, '../../uploads/documents');
backend/src/utils/uploadPaths.ts:4   const configuredUploadDir = process.env.UPLOAD_DIR || 'uploads';
backend/src/config/config.ts:108     dir: process.env.UPLOAD_DIR || 'uploads',
```
multer disk storage is used across `employeeDocumentRoutes`, `companyDocumentRoutes`,
`documentRoutes`, `compensationRoutes`, `employeeRoutes`, `authRoutes`, and
`onboardingController`.

**The false lead:** `backend/.env.production.example` declares `STORAGE_TYPE`, `S3_ENDPOINT`,
`S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` — which
looks like an object-storage abstraction already exists.

**It does not.** `grep -rn "STORAGE_TYPE" backend/src` returns **nothing**, and `config.ts`
exposes only `upload.dir`. The S3 variables are **aspirational documentation that was never
implemented.** Do not assume a driver exists because an env var mentions it. Verify first.

**What to build:**

1. A storage interface — `backend/src/services/storage/StorageProvider.ts`:
   `put(key, buffer, contentType)`, `getSignedUrl(key, ttl)`, `delete(key)`, `exists(key)`.
2. Two implementations: `LocalStorageProvider` (development only) and `GcsStorageProvider`
   (`@google-cloud/storage`, using Application Default Credentials — **no key file**; the
   Cloud Run runtime SA authenticates automatically).
3. Selection via the already-declared `STORAGE_TYPE` env var (`local` | `gcs`), wired in
   `config.ts` so it is actually read.
4. Replace multer `diskStorage` with `memoryStorage` and hand the buffer to the provider.
   **Enforce `MAX_FILE_SIZE`** — memory storage makes an unbounded upload a memory-exhaustion
   vector.
5. Serve downloads via **short-lived V4 signed URLs** issued *after* the API authorises the
   request, or by streaming through the API. **Never** make objects public — these are
   appointment letters and payslips.
6. Storage keys must be tenant-scoped: `tenants/{tenantId}/employees/{employeeId}/{uuid}-{filename}`.
   Never trust a client-supplied filename as a path component.
7. Migrate existing files: copy the droplet's `uploads/` tree into the bucket **preserving the
   paths recorded in the database**, or run a DB migration that rewrites stored paths to the
   new keys. Whichever is chosen, DB rows and bucket objects must agree afterwards.

**Acceptance criteria:**
- [ ] Upload a document on a Cloud Run revision; force a new revision; the document still
      downloads. (This is the actual test — it is what local disk fails.)
- [ ] With `max-instances > 1`, a document uploaded via one instance is retrievable via
      another.
- [ ] `gsutil ls -L` on an object shows no public ACL; an unauthenticated direct object URL
      returns 403.
- [ ] A signed URL expires and returns 403 after its TTL.
- [ ] A user of tenant A cannot retrieve a signed URL for a tenant B object (authorisation is
      checked before the URL is minted).
- [ ] `scripts/diagnoseDocumentStorage.ts` (already in the repo) passes against GCS.

---

## Blocker 2 — Port binding must be `$PORT` / 8080 and bind `0.0.0.0`

**Evidence [verified]:** `backend/src/server.ts:29` → `httpServer.listen(config.port, ...)`;
the legacy `docker/backend/Dockerfile` exposes **3000**.

Cloud Run injects `PORT` (default 8080) and requires the process to listen on it, on all
interfaces. A container listening on a hardcoded 3000, or on `127.0.0.1`, fails health checks
and the deploy fails with "container failed to start and listen on the port".

**Fix:** ensure `config.port` reads `process.env.PORT` first, defaulting to 8080; bind
explicitly to `0.0.0.0`.

**Acceptance criteria:**
- [ ] `docker run -e PORT=8080 -p 8080:8080 <image>` serves `GET /health` locally.
- [ ] Cloud Run deploy succeeds without a "failed to listen" error.

---

## Blocker 3 — Migrations must not run on container start

**Per R8.** With `max-instances > 1`, every cold-starting instance races the same migration.

**Fix:** build a Cloud Run **Job** `aurorahr-migrate` from the same image, invoked in the
pipeline between push and deploy. Confirm no entrypoint/`CMD`/start script calls
`npm run migrate`. (Note: git history shows a `codex/production-migration-idempotency` branch
was merged — good; re-verify idempotency holds rather than assuming.)

**Acceptance criteria:**
- [ ] Grep confirms no migration invocation in `CMD`, entrypoint, or `start` script.
- [ ] The migration job runs to completion and is safely re-runnable (run it twice; second
      run is a no-op, exit 0).
- [ ] Pipeline order is: build → push → migrate job → deploy → verify.

---

## Blocker 4 — Health endpoint must be dependency-free and unauthenticated

**Evidence [verified]:** `backend/src/app.ts:194` → `GET /health` exists and returns
`{ status: 'healthy', ... }`.

**Must verify** (not yet confirmed): that it is reachable **without a JWT**, that no auth
middleware or rate limiter intercepts it, and that it does **not** query the database.

A health check that touches the DB reports "unhealthy" during a transient DB blip and Cloud
Run kills otherwise-fine instances. Keep the liveness probe dumb — it answers "is the process
up", nothing more. If a deeper check is wanted, add a **separate** `/health/ready` that may
touch dependencies, and do not wire it to the platform probe.

**Acceptance criteria:**
- [ ] `curl -s -o /dev/null -w "%{http_code}" https://<svc-url>/health` → `200` with no
      credentials.
- [ ] With the database intentionally unreachable, `/health` still returns 200.
- [ ] The rate limiter does not throttle the health path.

---

## Blocker 5 — Logs must go to stdout, not to a file

**Evidence [verified]:** `backend/src/config/config.ts` → `logFile: process.env.LOG_FILE || 'logs/app.log'`;
the legacy Dockerfile creates `/app/logs`.

On Cloud Run a log file is written to ephemeral per-instance disk: invisible, unsearchable,
and gone on recycle. Worse, it silently consumes the instance's memory-backed filesystem.

**Fix:** in production, log **structured JSON to stdout/stderr**. Cloud Logging ingests it
automatically. Map the severity field to Cloud Logging's `severity` so log levels render
correctly, and include a request/trace id.

**Acceptance criteria:**
- [ ] No file transport is active when `NODE_ENV=production`.
- [ ] `gcloud logging read` returns application logs with correct severities.
- [ ] An error path produces a `severity: ERROR` entry containing a correlation id.

---

## Also fix, not strictly blocking

- **`.gitignore` the `.ua/` directory** (currently untracked noise in the working tree).
- **Delete the superseded root deployment docs** listed in `README.md` — they are an active
  hazard for any agent reading the repo.
- **`git fetch --all`** before any branch reasoning; the local checkout last fetched
  2026-06-11.
- **Node version:** `engines` says `>=18`, the legacy Dockerfile uses `node:18-alpine`. Move
  to **Node 20** (`node:20-slim`). Prefer `-slim` over `-alpine` — alpine's musl libc causes
  native-module surprises; this bit the earlier Next.js work.
- **Decide the `hardening` branch question** (`01-CURRENT-STATE.md` §3) before starting.
