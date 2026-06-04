# ACV Claude Repo Orientation Report

**Generated**: 2026-06-04
**Purpose**: Repository discovery and orientation before QA/testing work

---

## 1. Repository Identity

| Field | Value |
|-------|-------|
| **Path** | `/Users/chinar.deshpande06/Documents/GitHub/HRMS-SaaS-MVP` |
| **Remote** | `https://github.com/chinardeshpande/HRMS-SaaS-MVP.git` |
| **Current branch** | `codex/acv-validation-reports` |
| **Confirmed AuroraHR repo** | Yes |

**Note**: A second clone exists at `current-projects/HRMS-SaaS-MVP/` (on branch `antigravity/current-mobile-product-surface-inventory`). The Documents/GitHub clone is the primary working copy with all codex/acv-* branches.

### Latest 5 commits (current branch)

```
045075f Add ACV validation report generation
2506990 Improve HR analytics workbench
bb6cd1e Patch frontend axios audit finding
0b296cd Polish dashboard profile and masters UX
7ebbf75 Repair ACV leave policy entitlement drift
```

### Uncommitted changes

Modified (unstaged):
- `backend/.env.example`, `backend/.env.production.example`
- `backend/src/app.ts`, `backend/src/config/config.ts`
- `frontend-web/src/components/layout/ModernLayout.tsx`
- `frontend-web/src/index.css`
- `frontend-web/src/pages/ModernAttendance.tsx`, `ModernDashboard.tsx`, `ModernEmployeeDetail.tsx`, `ModernEmployees.tsx`

Untracked:
- `backend/src/controllers/assistantController.ts`
- `backend/src/routes/assistantRoutes.ts`
- `backend/src/services/assistantService.ts`
- `docs/acv-implementation/ACV-Current-Product-Surface-Inventory.md`
- `docs/acv-implementation/ACV-Testing-Strategy.md`
- `docs/qa/manu-hr-operations-angel-2026-06-03/`
- `frontend-web/public/images/assistant/`
- `frontend-web/src/components/assistant/`
- `frontend-web/src/services/assistantService.ts`

---

## 2. Directory Structure

| Directory | Status |
|-----------|--------|
| `backend/` | Present |
| `frontend-web/` | Present |
| `mobile-app/` | Present |
| `shared/` | Present |
| `docs/` | Present |
| `docs/acv-implementation/` | Present |
| `docker/` | Present (backend, frontend, nginx) |
| `.github/workflows/` | Present |
| `scripts/` | Present (incl. `scripts/qa/`, `scripts/acv/`) |

**Missing**: No root `package.json` (monorepo without root workspace). No root `.env.example`.

---

## 3. ACV Implementation Documents

| Document | Status |
|----------|--------|
| `ACV-AuroraHR-Implementation-Charter.md` | Present |
| `ACV-Current-State-Assessment.md` | Present |
| `ACV-Current-Product-Surface-Inventory.md` | Present (untracked) |
| `ACV-Customer-Zero-Completion-Checklist.md` | Present |
| `ACV-Testing-Strategy.md` | Present (untracked) |
| `ACV-Product-Gap-Register.md` | Present |
| `ACV-UAT-Plan.md` | Present |

Additional docs found:
- `ACV-Company-Document-Vault-Plan.md`
- `ACV-Compensation-History-Plan.md`
- `ACV-Data-Migration-Plan.md`
- `ACV-Data-Validation-Report.md`
- `ACV-Implementation-Readiness-Assessment-2026-05-26.md`
- `ACV-Missing-Data-Register.md`
- `ACV-Testing-Evidence/` directory
- `latest-data-ingestion-2026-05-27/` directory

---

## 4. Test Infrastructure

### Frameworks installed

| Package | Backend | Frontend | Mobile |
|---------|---------|----------|--------|
| `jest` | 29.7.0 | 29.7.0 | 29.7.0 |
| `ts-jest` | 29.1.1 | - | - |
| `supertest` | 6.3.3 | - | - |
| `@testing-library/react` | - | 14.1.2 | - |
| `@testing-library/jest-dom` | - | 6.2.0 | - |
| `@testing-library/user-event` | - | 14.5.2 | - |
| `@testing-library/react-native` | - | - | 12.4.3 |
| `jest-environment-jsdom` | - | 29.7.0 | - |
| Playwright / Cypress | Not installed | Not installed | N/A |

### Existing test files

- `mobile-app/src/api/__tests__/client.test.ts`
- `mobile-app/src/context/__tests__/useAuthStore.test.ts`
- `mobile-app/src/screens/hr-command/__tests__/HRCommandCenter.test.tsx`
- `mobile-app/src/screens/hr-command/__tests__/OnboardingDetail.test.tsx`
- `mobile-app/src/screens/hr-command/__tests__/ProbationReview.test.tsx`

**No backend unit/integration test files found** (only `npm test` script configured).
**No frontend test files found** (only deps and `npm test` script configured).

### Jest configuration

No standalone `jest.config.*` files found in backend, frontend, or root. Jest config may be inline in `package.json` (grep did not find a `"jest": {}` config block - only the dependency entry).

### QA scripts (scripts/qa/)

15 existing QA scripts (.mjs), including:
- `acv-memory-foundation-qa.mjs`
- `attendance-leave-visual-test.mjs`
- `commercial-lifecycle-simulation.mjs`
- `compensation-transaction-qa.mjs`
- `documents-reports-analytics-visual-test.mjs`
- `frontend-route-resilience-test.mjs`
- `hr-connect-visual-test.mjs`
- `hr-lifecycle-visual-test.mjs`
- `role-access-matrix-test.mjs`
- `security-tenant-isolation-test.mjs`
- (and 5 more)

---

## 5. Run/Test Commands

### Backend (`backend/package.json`)

| Command | Script |
|---------|--------|
| `npm run dev` | `nodemon --exec ts-node src/server.ts` |
| `npm run build` | `tsc && tsc -p tsconfig.scripts.json` |
| `npm test` | `jest --coverage` |
| `npm run test:watch` | `jest --watch` |
| `npm run test:integration` | `jest --testPathPattern=tests/integration` |
| `npm run seed` | `ts-node src/scripts/seedTestData.ts` |
| `npm run seed:all` | seeds all data (test + attendance + onboarding + hrconnect) |

### Frontend (`frontend-web/package.json`)

| Command | Script |
|---------|--------|
| `npm run dev` | (Vite dev server) |
| `npm test` | `jest --coverage` |
| `npm run test:watch` | `jest --watch` |

### Mobile (`mobile-app/package.json`)

| Command | Script |
|---------|--------|
| `npm test` | `jest --coverage` |

---

## 6. Backend Architecture Summary

- **Entry**: `backend/src/app.ts` + `backend/src/server.ts`
- **35 route files** covering: auth, employees, attendance, leave, compensation, documents, HR Connect, onboarding, exit, probation, performance, settings, departments, designations, analytics, dashboard, calendar, chat, digital library, templates, tickets, org structure, reporting, demo, health, assistant
- **24 controllers**, **38+ services**
- **65+ models** (TypeORM entities)
- **Middleware**: auth, tenant isolation, error handling, request logging, upload, validation, optional auth
- **Auth/RBAC**: `middleware/auth.ts`, `middleware/tenant.ts`
- **Assistant/Manu**: `assistantController.ts`, `assistantService.ts`, `assistantRoutes.ts` (untracked)

## 7. Frontend Architecture Summary

- **80+ page components** (Modern* prefix is the active UI)
- **Component directories**: assistant, chat, common, demo, documents, employee, employees, exit, landing, layout, leave, masterdata, onboarding, orgchart, performance, probation, routing, settings
- **29 service modules** mapping to backend APIs
- **App shell**: `frontend-web/src/App.tsx`
- **Stack**: React + Vite + Tailwind CSS

---

## 8. Key Observations and Blockers

### Observations
1. **Test infrastructure is installed but empty** - Jest + supertest + testing-library are in package.json but no actual backend or frontend test files exist. Mobile has 5 test files.
2. **No jest.config files** - Tests will need configuration before they can run.
3. **Rich QA script library** - 15 `.mjs` scripts in `scripts/qa/` provide automated visual/functional testing but are separate from the Jest framework.
4. **Comprehensive ACV documentation** - All 7 requested ACV docs exist. Testing strategy and product surface inventory are untracked (new).
5. **Active uncommitted work** on current branch includes assistant/Manu feature files and UI changes.

### Potential blockers
- Jest config files need to be created for backend and frontend before `npm test` will work properly.
- No `backend/tests/` directory exists yet for integration tests.
- No E2E test framework (Playwright/Cypress) is installed.

---

## 9. Recommendations

- **Recommended branch for testing work**: Create a new branch from `main` (e.g., `codex/acv-regression-test-foundation`) to avoid conflicts with the uncommitted assistant work on the current branch.
- **First steps**: Create jest.config.ts files for backend and frontend, then scaffold the `backend/tests/` directory structure.

---

## 10. Readiness Assessment

**Claude is ready to proceed with the ACV regression test foundation**, pending branch decision. All required context has been gathered:
- Correct repo confirmed
- Full backend/frontend architecture mapped
- Test framework dependencies already installed (just need configuration)
- ACV documentation complete and available for test case derivation
