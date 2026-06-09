# AuroraHR E2E Tests (Playwright)

Browser-level end-to-end tests for AuroraHR ACV Customer Zero.

## Status

**Scaffold complete. Playwright installation blocked by corp registry (403).**

All test files, fixtures, and configuration are ready. Once Playwright is installed, the tests can run immediately.

## Prerequisites

### Install Playwright (on a machine with npm registry access)

```bash
cd e2e
npm init -y
npm install -D @playwright/test
npx playwright install chromium
```

### Start the application

```bash
# Terminal 1: Backend (against test DB)
cd backend
DB_NAME=hrms_saas_test npm run dev

# Terminal 2: Frontend
cd frontend-web
npm run dev
```

### Seed test data

The test accounts are synthetic (not real ACV employees). Ensure the test DB is seeded:

```bash
cd backend
npm run test:qa  # runs globalSetup which seeds hrms_saas_test
```

## Run Tests

```bash
cd e2e
npx playwright test                        # headless, all tests
npx playwright test --headed               # visible browser
npx playwright test --ui                   # interactive UI mode
npx playwright test specs/auth.spec.ts     # single file
npx playwright test --grep "A01"           # single test by name
```

## Test Structure

```
e2e/
  playwright.config.ts      # Playwright configuration
  specs/
    auth.spec.ts            # Login/logout/protected routes (7 tests)
    rbac.spec.ts            # Role-based access denial (16 tests)
    employees.spec.ts       # Employee register/profile (4 tests)
    documents.spec.ts       # Document access boundaries (4 tests)
    compensation.spec.ts    # Compensation/payslip access (4 tests)
    leave.spec.ts           # Leave page access (3 tests + 2 skipped)
  fixtures/
    users.ts                # Test account matrix
    test-data.ts            # Expected seed data constants
  utils/
    auth.ts                 # Login/logout helpers
    routes.ts               # Route constants
  auth-states/              # Persisted auth state (gitignored)
  test-results/             # Screenshots, traces (gitignored)
```

## Test Accounts

| Role | Email | Tenant |
|------|-------|--------|
| System Admin | `system.admin@acv.test` | ACV Solutions Pvt Ltd |
| HR Admin | `hr.admin@acv.test` | ACV Solutions Pvt Ltd |
| Manager | `manager@acv.test` | ACV Solutions Pvt Ltd |
| Employee | `employee@acv.test` | ACV Solutions Pvt Ltd |
| Orbit Admin | `admin@orbit.test` | Orbit QA Isolation Ltd |
| Orbit Employee | `employee@orbit.test` | Orbit QA Isolation Ltd |

Password for all: `ACV@2026!`

## Important Notes

- Tests use **synthetic seed data only** — no real employee records
- Screenshots/videos should never contain real HR data
- Tests run against **local/test environment only** — never production
- If a UI route is not implemented, the test is marked `test.skip` with a clear reason
