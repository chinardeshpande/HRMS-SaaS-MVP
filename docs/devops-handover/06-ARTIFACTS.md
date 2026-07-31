# 06 — Copy-ready deploy artifacts

Adapted from a recipe proven on two live apps, **modified for this monorepo** (Express +
TypeORM API, Vite SPA, Socket.IO, Cloud SQL, GCS).

Placeholders: `<PID>`, `<REGION>` = `asia-south1`, `<PNUM>` project number, `<INSTANCE>`.

> **Before writing `Dockerfile.api`, resolve the build-output path** (`01-CURRENT-STATE.md` §1):
> ```bash
> cd backend && npm ci && npm run build && find dist -name server.js
> ```
> The repo's `main` and legacy Dockerfile both say `dist/backend/src/server.js`, but
> `tsconfig.json` (`outDir: ./dist`, `include: src/**/*`) implies `dist/src/server.js`.
> **Use what the build actually emits.** Everything below marks this as `<ENTRY>`.

---

## 1. `Dockerfile.api` — Express + TypeORM

Build context is the **repo root** (so `shared/` is available if the build reaches for it).

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-slim AS base
WORKDIR /app
ENV NODE_ENV=production

# ---------- deps (with dev deps, needed to compile TS) ----------
FROM base AS deps
COPY backend/package.json backend/package-lock.json ./backend/
WORKDIR /app/backend
RUN npm ci --include=dev

# ---------- build ----------
FROM base AS builder
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY backend ./backend
COPY shared ./shared
WORKDIR /app/backend
# Server-only env is injected at RUNTIME from Secret Manager. Placeholders here only satisfy
# any incidental build-time env validation — never real secrets in a layer.
ENV DB_HOST=build-placeholder \
    DB_USER=build-placeholder \
    DB_PASSWORD=build-placeholder \
    JWT_SECRET=build-placeholder \
    JWT_REFRESH_SECRET=build-placeholder
RUN npm run build
# Drop dev dependencies from the artifact we ship
RUN npm prune --omit=dev

# ---------- runtime ----------
FROM base AS runner
ENV PORT=8080 HOST=0.0.0.0
# Run as non-root
RUN useradd --user-group --create-home --shell /bin/false app
WORKDIR /app/backend
COPY --from=builder --chown=app:app /app/backend/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/backend/dist ./dist
COPY --from=builder --chown=app:app /app/backend/package.json ./package.json
USER app
EXPOSE 8080
# <ENTRY> = the path `find dist -name server.js` actually printed.
CMD ["node", "dist/backend/src/server.js"]
```

Notes:
- `node:20-slim`, **not** alpine — musl libc causes native-module surprises.
- No Docker `HEALTHCHECK`: Cloud Run ignores it and probes the port itself.
- No `mkdir /app/uploads`, no `/app/logs` — those were the droplet's stateful design and are
  exactly what `04-BLOCKERS.md` §1 and §5 remove.

---

## 2. `Dockerfile.web` — Vite build → nginx

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-slim AS builder
WORKDIR /app
COPY frontend-web/package.json frontend-web/package-lock.json ./
RUN npm ci
COPY frontend-web ./
COPY shared /shared

# ⚠️ VITE_* are INLINED AT BUILD TIME into the client bundle — exactly like NEXT_PUBLIC_*.
# Supplying them only at runtime is too late; the bundle ships with undefined.
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ARG VITE_APP_ENV=production
ENV VITE_API_URL=$VITE_API_URL \
    VITE_SOCKET_URL=$VITE_SOCKET_URL \
    VITE_APP_ENV=$VITE_APP_ENV
RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY docker/nginx/spa.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

Because the LB routes `/api/**` and `/socket.io/**` to the API on the **same origin**, set
`VITE_API_URL=/api` and `VITE_SOCKET_URL=/` (relative) — no CORS, no hardcoded hostname, and
the same image works behind any domain.

## 3. `docker/nginx/spa.conf`

```nginx
server {
  listen 8080;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  # hashed assets: immutable
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # never cache the shell, or users get a stale app pointing at old assets
  location = /index.html {
    add_header Cache-Control "no-store, must-revalidate";
  }

  # SPA history fallback
  location / {
    try_files $uri $uri/ /index.html;
  }

  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  gzip on;
  gzip_types text/css application/javascript application/json image/svg+xml;
}
```

---

## 4. `cloudbuild.yaml` — build → push → migrate → deploy

```yaml
substitutions:
  _REGION: asia-south1
  _REPO: containers
  _API: aurahrms-api
  _WEB: aurahrms-web
  _JOB: aurahrms-migrate
  _RUNTIME_SA: <PNUM>-compute@developer.gserviceaccount.com
  _SQL_CONN: <PID>:asia-south1:<INSTANCE>   # spell out fully — see gotcha C1
  _BUCKET: aurahrms-staging-documents
  _TAG: latest                              # GitHub Actions overrides with the commit SHA

steps:
  # ---- API image ----
  - id: build-api
    name: gcr.io/cloud-builders/docker
    args: [build, -f, Dockerfile.api,
           -t, '$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/$_API:$_TAG',
           -t, '$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/$_API:latest', .]

  # ---- WEB image (VITE_* are build-args) ----
  - id: build-web
    name: gcr.io/cloud-builders/docker
    args: [build, -f, Dockerfile.web,
           --build-arg, 'VITE_API_URL=/api',
           --build-arg, 'VITE_SOCKET_URL=/',
           -t, '$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/$_WEB:$_TAG',
           -t, '$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/$_WEB:latest', .]

  - id: push-api
    name: gcr.io/cloud-builders/docker
    args: [push, --all-tags, '$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/$_API']
  - id: push-web
    name: gcr.io/cloud-builders/docker
    args: [push, --all-tags, '$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/$_WEB']

  # ---- migrations: a JOB, before traffic shifts (R8) ----
  - id: migrate
    name: gcr.io/google.com/cloudsdktool/cloud-sdk
    entrypoint: bash
    args:
      - -c
      - |
        set -euo pipefail
        gcloud run jobs deploy $_JOB \
          --image=$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/$_API:$_TAG \
          --region=$_REGION --service-account=$_RUNTIME_SA \
          --set-cloudsql-instances=$_SQL_CONN \
          --set-secrets=DB_PASSWORD=aurahrms-db-password:latest \
          --set-env-vars=NODE_ENV=production,DB_HOST=/cloudsql/$_SQL_CONN,DB_NAME=aurorahr,DB_USER=aurorahr_app,DB_SSL=false \
          --command=npm --args=run,migrate \
          --max-retries=0 --task-timeout=900s
        gcloud run jobs execute $_JOB --region=$_REGION --wait

  # ---- deploy API ----
  - id: deploy-api
    name: gcr.io/google.com/cloudsdktool/cloud-sdk
    entrypoint: gcloud
    args:
      - run
      - deploy
      - $_API
      - --image=$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/$_API:$_TAG
      - --region=$_REGION
      - --platform=managed
      - --allow-unauthenticated
      - --port=8080
      - --cpu=1
      - --memory=1Gi
      - --min-instances=1          # warm: HR app, and Socket.IO hates cold starts
      - --max-instances=1          # ⚠️ deliberate ceiling — see 03-TARGET-ARCHITECTURE §5
      - --concurrency=250
      - --session-affinity         # sticky sessions for Socket.IO
      - --timeout=3600             # long-lived WebSocket connections
      - --service-account=$_RUNTIME_SA
      - --add-cloudsql-instances=$_SQL_CONN
      - --set-env-vars=NODE_ENV=production,DB_HOST=/cloudsql/$_SQL_CONN,DB_NAME=aurorahr,DB_USER=aurorahr_app,DB_SSL=false,STORAGE_TYPE=gcs,GCS_BUCKET=$_BUCKET
      - --set-secrets=DB_PASSWORD=aurahrms-db-password:latest,JWT_SECRET=aurahrms-jwt-secret:latest,JWT_REFRESH_SECRET=aurahrms-jwt-refresh-secret:latest,SMTP_PASSWORD=aurahrms-smtp-password:latest

  # ---- deploy WEB ----
  - id: deploy-web
    name: gcr.io/google.com/cloudsdktool/cloud-sdk
    entrypoint: gcloud
    args:
      - run
      - deploy
      - $_WEB
      - --image=$_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/$_WEB:$_TAG
      - --region=$_REGION
      - --platform=managed
      - --allow-unauthenticated
      - --port=8080
      - --cpu=1
      - --memory=256Mi
      - --min-instances=0
      - --max-instances=4
      - --concurrency=200
      - --service-account=$_RUNTIME_SA

images:
  - $_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/$_API:$_TAG
  - $_REGION-docker.pkg.dev/$PROJECT_ID/$_REPO/$_WEB:$_TAG

options:
  logging: CLOUD_LOGGING_ONLY      # new projects have no default Cloud Build logs bucket
  machineType: E2_HIGHCPU_8
timeout: 2400s
```

> **`$PROJECT_ID` must be used directly** in steps/images. It does **not** expand when nested
> inside a user-`substitutions` default — which is why `_SQL_CONN` spells the project out.

---

## 5. `.gcloudignore`

```
.git
.gitignore
node_modules
**/node_modules
dist
**/dist
.env
.env*.local
*.tsbuildinfo
.DS_Store
.vscode
.idea
docs
e2e
mobile-app
.ua
uploads
*.dump
*.sql
```

Note `uploads`, `*.dump`, `*.sql` — never ship recovered production data into a build context.

---

## 6. `.github/workflows/deploy-cloud-run.yml`

```yaml
name: Deploy to Cloud Run
on:
  push:
    branches: [main]
    paths-ignore: ['**.md', 'docs/**']
  workflow_dispatch:
concurrency:
  group: deploy-production
  cancel-in-progress: false
permissions:
  contents: read
  id-token: write          # required to mint the OIDC token for WIF
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production   # add required reviewers here for a hard human gate
    steps:
      - uses: actions/checkout@v4
      - id: auth
        uses: google-github-actions/auth@v2
        with:
          project_id: ${{ vars.GCP_PROJECT_ID }}
          workload_identity_provider: ${{ vars.GCP_WIF_PROVIDER }}
          service_account: ${{ vars.GCP_DEPLOYER_SA }}
      - uses: google-github-actions/setup-gcloud@v2

      - name: Build, migrate, deploy
        run: |
          set -euo pipefail
          gcloud builds submit \
            --project="${{ vars.GCP_PROJECT_ID }}" \
            --config=cloudbuild.yaml \
            --substitutions=_TAG="${GITHUB_SHA::7}"

      - name: Verify live (green pipeline != working app)
        run: |
          set -euo pipefail
          API=$(gcloud run services describe aurahrms-api \
            --project="${{ vars.GCP_PROJECT_ID }}" --region="${{ vars.GCP_REGION }}" \
            --format='value(status.url)')
          WEB=$(gcloud run services describe aurahrms-web \
            --project="${{ vars.GCP_PROJECT_ID }}" --region="${{ vars.GCP_REGION }}" \
            --format='value(status.url)')
          code=$(curl -s -o /dev/null -w '%{http_code}' "$API/health")
          [ "$code" = "200" ] || { echo "API health $code"; exit 1; }
          code=$(curl -s -o /dev/null -w '%{http_code}' "$WEB/")
          [ "$code" = "200" ] || { echo "WEB root $code"; exit 1; }
          { echo "API: $API"; echo "WEB: $WEB"; } >> "$GITHUB_STEP_SUMMARY"
```

The verify step is **not** optional decoration — it is R5 enforced in CI, so a build that
deploys a broken app fails the run instead of reporting success.

> Pushing any `.github/workflows/*` file needs the `gh` token's **`workflow` scope**. If the
> push is rejected, run `gh auth refresh -h github.com -s workflow`. If the machine has no
> SSH key, set the remote to HTTPS and run `gh auth setup-git`.
