# AuroraHR (HRMS-SaaS-MVP)

Multi-tenant HR Management SaaS platform. Three apps: web frontend, backend API, mobile app.

## Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js 18+ / Express 4 / TypeScript / TypeORM 0.3 / PostgreSQL 15 |
| Frontend | React 18 / Vite 5 / TypeScript / MUI 5 / Zustand / React Hook Form + Yup |
| Mobile | React Native 0.73 / Expo 50 / React Paper 5 |
| Real-time | Socket.IO 4.8 |
| Auth | JWT (24h access, 7d refresh) + bcrypt + RBAC (4 roles) |
| Testing | Jest (unit) / Playwright (e2e) |
| CI/CD | GitHub Actions → S3/CloudFront (frontend), PM2 on DigitalOcean (backend) |

## Quick Start

```bash
# Backend
cd backend && cp .env.example .env && yarn install && yarn run migrate && yarn run seed && yarn dev
# → http://localhost:3000  (API docs at /api/docs when ENABLE_SWAGGER=true)

# Frontend
cd frontend-web && cp .env.example .env && yarn install && yarn dev
# → http://localhost:5173

# Docker (full stack)
docker-compose up
```

## Project Layout

```
backend/
  src/
    controllers/    # 26 controllers — HTTP handlers
    services/       # 42 services — business logic
    models/         # 72 TypeORM entities
    routes/         # 37 route files, all under /api/v1/
    middleware/     # auth, tenant, validation, errorHandler, requestLogger
    migrations/    # TypeORM migrations (synchronize: false)
    config/        # database.ts, config.ts
    scripts/       # Seed scripts, data imports
frontend-web/
  src/
    pages/         # 80+ page components
    components/    # Feature-grouped (attendance/, leave/, employee/, etc.)
    services/      # Axios-based API clients
    context/       # React Context providers
mobile-app/        # Expo/React Native app
e2e/               # Playwright E2E tests
docker/            # Dockerfiles, nginx config
.github/workflows/ # CI/CD pipelines
docs/              # API spec, DB schema, deployment, QA plans
```

## Architecture

- **Multi-tenant**: Shared DB, row-level isolation via `tenant_id` on every table + middleware enforcement
- **Layered**: Controllers → Services → Models (TypeORM entities with decorators)
- **FSM workflows**: Onboarding (13 states), Probation (11 states), Exit (6 states) — implemented as service-layer state machines
- **Path aliases**: Backend uses `@controllers`, `@services`, `@models`, `@middleware`, `@utils`, `@config`, `@types`. Frontend uses `@components`, `@pages`, `@context`, `@services`, `@hooks`, `@utils`, `@types`, `@assets`.

## Conventions

- **TypeScript strict mode** everywhere
- **Naming**: PascalCase for entities/components, camelCase for services/controllers (with suffix: `fooController`, `barService`)
- **Validation**: Joi on backend, Yup on frontend
- **Linting**: ESLint + Prettier (run `yarn lint` / `yarn format`)
- **Commits**: Prefixed — `Claude:`, `Codex:`, or conventional (`feat:`, `fix:`, `docs:`)
- **Branches**: `claude/<task>` or `codex/<task>` for AI work; PRs to main

## Database

- PostgreSQL 15 via TypeORM. Migrations only (no synchronize).
- `yarn run migrate` to apply, seed scripts under `backend/src/scripts/`.
- 72 entities covering full employee lifecycle: auth, attendance, leave, performance, onboarding, exit, compensation, documents, chat, HR social feed.

## Testing

```bash
# Backend unit/integration
cd backend && yarn test          # with coverage
cd backend && yarn test:watch    # watch mode

# Frontend
cd frontend-web && yarn test

# E2E (needs running app + DB)
cd e2e && yarn test              # headless
cd e2e && yarn test:headed       # visible browser
cd e2e && yarn test:ui           # interactive Playwright UI
```

## Deployment

- **Domain**: aurorahr.in (GoDaddy DNS → DigitalOcean)
- **Frontend**: S3 + CloudFront via `deploy-aurorahr.yml` GitHub Action
- **Backend**: PM2 on DigitalOcean droplet, Nginx reverse proxy (API at `/api/*`)
- **SSL**: Let's Encrypt with auto-renewal
- **Note**: CI/CD currently only deploys frontend automatically. Backend deployment requires manual steps or audit of the pipeline.

## Test Credentials (dev seed data)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin.user@acme.com | password123 |
| HR | sarah.johnson@acme.com | password123 |
| Manager | john.smith@acme.com | password123 |
| Employee | alice.williams@acme.com | password123 |

## Implemented Modules

Auth & RBAC, Employee Master, Attendance, Leave Management, Onboarding (FSM), Probation (FSM), Exit Management (FSM), Performance (goals/reviews/KPIs/360), HR Connect (social feed/groups), Chat (Socket.IO), Settings & Org Config, Dashboard (role-specific), Landing Page, Document Management, Digital Library, Compensation/Payroll, Reports/Analytics, Calendar.

## Known Gaps

- Payment gateway (Stripe/PayPal) — entity exists, no processor wired
- Cloud file storage (S3/Spaces) — multer configured, cloud backend missing
- Transfer & Promotion workflows — not implemented
- Test coverage is low across all three apps
- Swagger docs may have TS conflicts (check ENABLE_SWAGGER)

## Launch-Readiness Track — Operating Protocol

You are executing AURORAHR-LAUNCH-READINESS.md in collaboration with a
Claude chat instance acting as mission control. Chinar relays missions
and decisions between you.

Rules:
- Work only on branch `hardening`. Codex owns feature branches. Never merge to main without Chinar's explicit approval.
- Write every audit/test/report output to audit/ as markdown. At the end of every mission, copy the contents of audit/ (**markdown reports only**) to the Drive bridge path: `<DRIVE_BRIDGE_PATH>  <!-- machine-specific: set per machine, do NOT commit the real path -->`. **NEVER copy to the bridge:** `.env` files, database dumps, credentials/secrets, or source code — markdown reports only.
- End every mission with a MISSION-STATUS block: what was done, what failed, open questions for mission control, recommended next step.
- Allowed without asking: tests, bug fixes, commits to `hardening`, load tests against staging/local.
- Ask first: schema migrations, production deploys, anything touching live tenant data, new external dependencies.
- Never: load tests against production, destructive operations on any database.

### Production data protection (ACV is a LIVE onboarded tenant)

ACV Solutions is a real customer with real employee PII and payment data in
production. A tenant-isolation breach or data loss involving ACV would cost
more than the entire launch program. These rules are binding on every session,
effective 2026-06-11:

- **No production deploy without a fresh, verified backup.** Before any push
  that deploys, take a manual snapshot/dump of the prod DB (pg_dump or platform
  snapshot), verify the dump is non-zero AND restorable to a scratch database,
  and store it off the production host. Report backup location + size in the GO
  message. No exceptions.
- **No mission touches the production DB directly.** Schema work (e.g. Mission 2
  RLS policies) is built and adversarially tested against a copy of prod
  restored locally/staging — that restore doubles as the restore drill. Only the
  final, test-proven migration runs against prod, with a fresh backup taken
  minutes before.
- **QA tenants (`qa-alpha` / `qa-beta`) only** for production verification —
  reads and their own throwaway records. They must never touch ACV's tenant or
  any real customer tenant.
- **Every MISSION-STATUS includes a named line:** `ACV tenant impact: none / [description]`.
  Cheap to write; forces the check every time.
