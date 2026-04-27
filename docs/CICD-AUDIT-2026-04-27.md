# CI/CD Audit - April 27, 2026

Branch: `codex/cicd-audit`

## Summary

The current production CI/CD setup is not safe to rely on for full-stack releases yet.

The active workflow, `.github/workflows/deploy-aurorahr.yml`, deploys only the frontend build to production. Backend changes can be pushed to `main` without being built, tested, or deployed by the active workflow. This matters because the latest product work includes backend changes for Digital Library and Document Categories.

## Confirmed Findings

### 1. Active Production Workflow Is Frontend-Only

File: `.github/workflows/deploy-aurorahr.yml`

Current behavior:

- Installs frontend dependencies.
- Builds `frontend-web`.
- Uploads frontend artifact.
- Copies frontend `dist` to `/var/www/hrms-app/frontend-web/dist`.
- Checks only `https://aurorahr.in/`.

It does not:

- Install backend dependencies.
- Build backend TypeScript.
- Deploy backend code.
- Restart PM2 backend.
- Run migrations.
- Check backend health.

Action taken on this branch:

- Added backend `npm ci` and `npm run build` before frontend deployment.
- This intentionally blocks production deploys when backend code does not compile.

### 2. Backend Does Not Currently Compile

Command run:

```bash
cd backend
npm ci
npm run build
```

Result:

- `npm ci` succeeded.
- `npm run build` failed with TypeScript errors.

Representative errors:

- `src/services/analyticsService.ts`: `queryConfig.joins[].type` is typed as `string` instead of `"INNER" | "LEFT" | "RIGHT"`.
- `src/services/enhancedDocumentService.ts`: implicit `this` type and missing `OrganizationSettings.companyLogo`.
- `src/services/progressTrackingService.ts`: multiple references to fields that do not exist on current entities, including `caseId`, `status`, `taskName`, `expectedJoiningDate`, `reviewStatus`, `dueDate`, and missing import `In`.

Impact:

- A proper full-stack pipeline would currently fail before deployment.
- The existing frontend-only workflow can hide backend breakage.

### 3. Migration Script Is Broken

File: `backend/package.json`

The script is:

```json
"migrate": "ts-node src/database/migrate.ts"
```

But `backend/src/database/migrate.ts` does not exist.

Impact:

- Any workflow step that runs `npm run migrate` or `yarn run migrate` will fail.
- The disabled full production workflow and staging workflow both reference migration execution.

### 4. Backend Health Check Path Was Wrong In Docker Config

The Express app exposes:

```text
GET /health
```

The Docker backend health checks used:

```text
GET /api/health
```

Action taken on this branch:

- Updated `docker/backend/Dockerfile`.
- Updated `docker-compose.production.yml`.
- Both now check `http://localhost:3000/health`.

### 5. Deployment Strategies Are Inconsistent

There are at least three different deployment models in the repo:

- Active production workflow: frontend artifact over SSH, static Nginx deployment.
- Manual script: local backend/frontend build, tarball deployment, PM2 restart.
- Disabled workflow: Docker image build/deploy with `docker-compose.production.yml`.

These use different domains, secrets, health paths, and runtime assumptions.

Impact:

- It is easy to think backend is being deployed when it is not.
- Re-enabling the disabled workflow without correction is likely to fail.
- Rollback behavior is inconsistent across deployment paths.

### 6. Frontend Dependency State Needs Cleanup

Command run:

```bash
cd frontend-web
npm ci
```

Result:

- Failed because `package-lock.json` is not in sync with `package.json`.

Command run:

```bash
cd frontend-web
yarn install --frozen-lockfile
```

Result:

- Failed locally while resolving optional platform packages for `esbuild` and `rollup`.

Notes:

- The active workflow uses Yarn, not npm.
- The repo includes both `package-lock.json` and `yarn.lock`, which should be cleaned up once the package manager is chosen.

### 7. Dependency Security Risk Exists

Command run:

```bash
cd backend
npm ci
```

Result:

- `37 vulnerabilities`
- `2 critical`
- `30 high`

No automatic dependency upgrades were applied on this branch because `npm audit fix --force` can introduce breaking changes.

## Recommended Next Steps

1. Fix backend TypeScript compile errors.
2. Decide one production deployment model:
   - PM2/tarball, or
   - Docker Compose.
3. Fix or replace the missing backend migration runner.
4. Make backend health checks consistent across app, Nginx, Docker, workflows, and docs.
5. Add backend deployment to the active production workflow only after compile and migration issues are resolved.
6. Choose one frontend package manager and remove the stale lockfile.
7. Run a dependency security review, starting with critical/high backend vulnerabilities.

## Current Position

This branch improves safety by preventing silent frontend-only deploys when backend code is broken. It does not yet implement full backend production deployment because the backend does not compile and the migration/deployment strategy needs correction first.
