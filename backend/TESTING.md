# Backend QA Test Guide

## Scope

The backend QA suite is a Jest + supertest integration suite for AuroraHR API quality gates. It uses synthetic seeded data only and must not depend on real ACV production or development data.

## Test Database

Default test database:

```bash
hrms_saas_test
```

The Jest setup forces `NODE_ENV=test` and defaults `DB_NAME` to `hrms_saas_test`. Global setup refuses destructive reset logic unless the database name contains `test`, unless explicitly overridden:

```bash
ALLOW_NON_TEST_DB_FOR_TESTS=true
```

Do not use that override for normal development or CI.

## Local Setup

Create the test database once:

```bash
createdb hrms_saas_test
```

If `createdb` is not available, create the database through your local PostgreSQL admin tool. The local DB user must match backend `.env`, or you can override connection settings:

```bash
DB_HOST=localhost \
DB_PORT=5432 \
DB_NAME=hrms_saas_test \
DB_USER=postgres \
DB_PASSWORD=postgres \
npm run test:qa
```

## Seeded Test Users

The suite resets the test database and seeds these synthetic accounts before each run:

| Persona | Email | Password | Tenant |
| --- | --- | --- | --- |
| System Admin | `system.admin@acv.test` | `ACV@2026!` | ACV QA |
| HR Admin | `hr.admin@acv.test` | `ACV@2026!` | ACV QA |
| Manager | `manager@acv.test` | `ACV@2026!` | ACV QA |
| Employee | `employee@acv.test` | `ACV@2026!` | ACV QA |
| Second Tenant Admin | `admin@orbit.test` | `ACV@2026!` | Orbit QA |

Seed source:

```text
backend/tests/setup/seedTestData.ts
```

## Commands

Run backend QA:

```bash
npm run test:qa
```

Run backend QA with coverage:

```bash
npm run test:qa:coverage
```

Run one suite:

```bash
npm run test:qa -- --runInBand tests/integration/02-auth-login.test.ts
```

## CI

GitHub Actions workflow:

```text
.github/workflows/backend-tests.yml
```

The workflow starts PostgreSQL 15, installs dependencies with `npm ci`, and runs:

```bash
npm run test:qa
```

## Current Boundaries

- Browser E2E tests are not included yet.
- Playwright is intentionally out of scope for this QA foundation branch.
- Upload/download file roundtrip tests are still pending.
- HR Connect realtime, chat, helpdesk, calendar collaboration, and Manu assistant tests remain future QA work.
