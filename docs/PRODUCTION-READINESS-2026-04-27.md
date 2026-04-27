# Production Readiness Status - 2026-04-27

## Current Decision

The application is ready for a controlled production deployment from the `codex/production-readiness` branch after review and merge to `main`.

This is not a claim that the product is feature-complete. It means the current MVP now has the minimum engineering controls required to deploy safely enough to production, observe health, and roll back if deployment fails.

## What Was Hardened

- Backend TypeScript production build now compiles.
- Backend runtime entrypoint now matches the actual compiled output path.
- TypeORM migration command now points at the compiled production data source.
- Backend and frontend are deployed together by the production GitHub Actions workflow.
- Production deployment now uploads backend artifacts, frontend artifacts, and package manifests.
- Production deployment preserves backend `.env`, `uploads`, `logs`, and `node_modules`.
- Production deployment creates backend and frontend backups before replacing files.
- Production deployment includes backend and frontend health checks.
- Production rollback restores both backend and frontend from the most recent backup.
- CI now blocks high or critical production dependency vulnerabilities.
- CI deploys are serialized with GitHub Actions concurrency to avoid overlapping production releases.
- Frontend dependency management is standardized on Yarn by removing the stale npm lockfile.

## Verification Completed

Commands run locally on 2026-04-27:

```bash
cd backend && npm run build
cd backend && npm audit --omit=dev --audit-level=high
cd frontend-web && yarn install --frozen-lockfile
cd frontend-web && yarn audit --groups dependencies --level high
cd frontend-web && yarn build
ruby -e "require 'yaml'; YAML.load_file('.github/workflows/deploy-aurorahr.yml')"
```

Results:

- Backend build passed.
- Frontend build passed.
- Frontend production dependency audit reported `0 vulnerabilities found`.
- Backend production dependency audit has no high or critical findings.
- Workflow YAML parsed successfully.

## Known Residual Risks

- Backend production audit still reports two moderate findings through `typeorm -> uuid`. The npm-proposed fix is a breaking downgrade to `typeorm@0.2.41`, so it has not been applied. This should be monitored and remediated when TypeORM publishes a compatible patched release.
- Database migrations are not run automatically during production deploy. That is intentional until the production database backup/restore procedure and migration history are confirmed.
- The frontend production bundle is large, around 1.4 MB minified JavaScript. This is acceptable for initial deployment but should be split with dynamic imports after the release is stable.
- End-to-end browser smoke tests are not yet part of CI.

## Deployment Gate

Before merging this branch to `main`, confirm:

- GitHub production secrets exist: `PRODUCTION_SSH_KEY`, `PRODUCTION_SERVER_IP`.
- Server paths exist or can be created by the deploy user:
  - `/var/www/hrms-app/backend`
  - `/var/www/hrms-app/frontend-web/dist`
- Backend production `.env` exists on the server and matches the current backend configuration requirements.
- PM2 is installed on the production server.
- Nginx or the production reverse proxy routes:
  - `https://aurorahr.in/` to the frontend build
  - `https://aurorahr.in/api/v1` to the backend API
  - `https://aurorahr.in/health` to the backend health endpoint

