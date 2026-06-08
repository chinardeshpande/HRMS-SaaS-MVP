# ACV Functional Solidity Report

Date: 2026-06-08  
Branch: `codex/acv-functional-solidity-sprint`  
Scope: backend functional hardening and QA evidence. No historical document restoration, Zoho integration, Manu expansion, payroll processing, or recruitment work was performed.

## Executive Verdict

**Verdict: Green for backend functional solidity baseline; Amber for full product readiness.**

The backend API regression foundation is stable and now covers stronger leave and attendance behavior. The sprint found and fixed one leave-balance defect. Backend TypeScript build and the full synthetic QA suite are green.

This does not mean ACV Customer Zero is fully signed off. Browser E2E, responsive UI, collaboration, HR Analytics, deeper audit coverage, and production data validation remain separate work packages.

## Scope Actually Validated

| Area | Status | Evidence |
| --- | --- | --- |
| Auth/session | Green | Existing QA suite validates login, malformed payloads, wrong password, nonexistent email, inactive users, duplicate email, and `/auth/me`. |
| Tenant isolation | Green | Synthetic ACV and Orbit tenant matrix validates tenant-scoped employee visibility and forged tenant rejection. |
| RBAC | Green | System admin, HR admin, manager, employee, and second-tenant role boundaries remain covered. |
| Employee register/detail | Green | Register/detail API visibility tests remain green. |
| Documents/company vault | Green for API lifecycle | Synthetic file upload/list/download/update/verify/archive tests pass for employee and company documents. |
| Compensation/payslips | Green for API lifecycle | Synthetic payslip creation, attachment download, and access-denial tests pass. |
| Attendance | Green for basic API lifecycle | Added self-service clock-in, duplicate clock-in rejection, and clock-out coverage. |
| Leave | Green for basic API lifecycle | Added apply/approve, insufficient-balance rejection, and gender-restricted leave rejection coverage. |
| Audit logging | Amber | Document and payslip download audit coverage exists. Attendance, leave, employee master, salary mutation, settings, and role-change audit coverage remain incomplete. |
| Dashboards/reports | Amber | Existing backend tests do not validate browser dashboard/report correctness. HR Analytics still needs a dedicated repair and E2E sprint. |
| Error handling | Green for tested endpoints | Negative auth, RBAC, missing file, invalid leave, duplicate attendance, and insufficient leave paths return controlled failures. |

## Bug Fixed

### Leave insufficient-balance validation

`LeaveService.applyLeave` was checking `balance.available` directly. `available` is a TypeORM getter over decimal fields, and the service already had a safer normalization helper for numeric and gender-aware leave balance behavior. The direct getter allowed an over-balance leave request to pass in the synthetic QA test.

Fix:

- Use `toEffectiveLeaveBalance(balance, employee)` during leave application.
- Validate requested days against the normalized `available` value.
- Preserve existing pending-balance update behavior.

## Tests Added

| Suite | New coverage |
| --- | --- |
| `09-attendance-basic.test.ts` | Employee can clock in, duplicate clock-in is rejected, and clock-out succeeds. |
| `10-leave-basic.test.ts` | Employee can apply for leave and manager can approve it. |
| `10-leave-basic.test.ts` | Employee cannot apply for leave beyond available balance. |
| `10-leave-basic.test.ts` | Gender-restricted leave types reject mismatched employees. |

## Test Results

| Command | Result |
| --- | --- |
| `npm --prefix backend run build` | Passed |
| `npm --prefix backend run test:qa -- --runTestsByPath tests/integration/09-attendance-basic.test.ts tests/integration/10-leave-basic.test.ts` | Passed: 2 suites, 20 tests |
| `npm --prefix backend run test:qa` | Passed: 11 suites, 84 tests |

Evidence:

- `docs/acv-implementation/ACV-Testing-Evidence/functional-solidity/2026-06-08/README.md`

## Green / Amber / Red Summary

| Category | Rating | Notes |
| --- | --- | --- |
| Backend build health | Green | TypeScript build passes. |
| Backend API regression | Green | 84/84 tests pass against dedicated synthetic test DB. |
| Core HRMS data boundaries | Green | Auth, tenant, RBAC, employee, document, payslip, attendance, and leave baseline checks pass. |
| Leave and attendance functional solidity | Green/Amber | Basic API lifecycle is green. Browser workflow, regularisation, and managerial UX remain amber. |
| ACV production data readiness | Amber | Historical document restoration remains parked. Validation reports still show data/document completeness gaps. |
| Browser UX and responsive quality | Amber | Not part of this sprint. Requires Playwright/visual QA. |
| HR Analytics | Amber/Red | Known UI/query/chart defects remain outside this sprint. |
| Manu AI | Amber/Red | Explicitly out of scope for this sprint. |

## Historical Documents

Historical document restoration is deliberately parked. This sprint validates that document APIs can handle synthetic upload/list/download/update/verify/archive flows safely. It does not attempt to recover or re-link missing historical backing files.

## Remaining QA Blockers

1. Browser E2E is still required for real user journeys.
2. HR Analytics column/group/chart behavior needs a dedicated repair sprint.
3. Attendance regularisation workflow is not yet covered by automated tests.
4. Leave policy switching/active-policy UX is not yet hardened.
5. Audit logging must be expanded for employee master, salary changes, leave actions, attendance actions, settings, roles, imports, and outbound communications.
6. Collaboration surfaces, HR Connect, chat, helpdesk, calendar, and multi-user scenarios remain high-risk until E2E tested.
7. Real ACV production data completeness remains separate from backend functional solidity.

## Recommended Next QA Sprint

`codex/acv-browser-e2e-critical-paths`

Focus:

- Login and tenant shell.
- Employee register/detail.
- Document Library and company vault.
- Compensation and payslip view/download.
- Attendance self-service and company views.
- Leave apply/approve/company view.
- Basic dashboard integrity.
- Responsive checks for desktop and iPhone widths.

