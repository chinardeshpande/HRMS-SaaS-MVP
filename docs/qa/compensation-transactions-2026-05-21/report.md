# Compensation Transaction Sprint QA

Run date: 2026-05-21
Run id: COMP-2026-05-21-1779364438489
Target: http://localhost:5186
API: http://localhost:5000/api/v1

## Executive Summary

- Passed: 17
- Failed: 0
- Production-readiness verdict: Local sprint changes are production-candidate after normal code review and deployment smoke.

## Scope

This QA pass covers the AuroraHR changes made today: compensation salary transaction history, CRUD backing APIs, monthly generation, bulk import with prescribed template, computation validation, data sync into compensation read models, login-to-home navigation, and core UI visibility.

## Business Process Narrative

An HR administrator maintains employee compensation during implementation and monthly operations. Historical salary transactions can be manually entered, generated from the active salary structure, or bulk imported during migration. Each transaction must preserve gross, deductions, net pay, salary heads, and payslip context. Invalid math, duplicate periods, and malformed values must be rejected without corrupting the employee record.

## Test Outcomes

| ID | Area | Expected | Actual | Status | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| API-01 | Authorization | Compensation data rejects missing token | HTTP 401 | passed |  |  |
| API-02 | Read model | HR admin can read active salary structure, payslips and timeline | structures=3, payslips=6, timeline=15 | passed |  |  |
| API-03 | CRUD create | Manual salary transaction saves exact gross, deduction, net and components | net=51000.00, components=6 | passed | de491fc6-d147-4361-8aca-2d3d94ae9f24 |  |
| API-04 | Duplicate control | Same employee/month/year cannot be created twice | A payslip already exists for this employee and month | passed |  |  |
| API-05 | Validation | Invalid month is rejected | A valid date is required | passed |  |  |
| API-06 | Computation | Net pay must equal gross earnings minus deductions | Net pay should match gross earnings minus total deductions | passed |  |  |
| API-07 | Validation | Negative salary values are rejected | Payslip values cannot be negative | passed |  |  |
| API-08 | CRUD update | Updating transaction fields preserves component split | paidDays=29.00, components=6 | passed |  |  |
| API-09 | Monthly generation | Monthly generation copies active salary structure and computes net correctly | gross=60000.00, deductions=9000.00, net=51000.00, components=5 | passed | 0003502a-cfe1-4c8f-84c1-b5e562439e24 |  |
| API-10 | Monthly generation | Generated monthly transaction cannot duplicate existing period | A payslip already exists for this employee and month | passed |  |  |
| API-11 | Bulk import | Bulk import creates, updates, and reports invalid rows without aborting the whole file | created=1, updated=1, failed=1 | passed |  |  |
| API-12 | Data sync | Bulk upsert result appears in compensation read model and transaction timeline | net=45000.00, timelineHasMarch=true | passed |  |  |
| UI-01 | Navigation | Login screen provides a clear route back to the public landing page | Landing page reached | passed | screenshots/login-home-route.png |  |
| UI-02 | Transaction UI | Transaction history exposes CRUD, monthly generation, bulk import, and salary columns | Buttons and Net Amount column found | passed | screenshots/transaction-history-table.png |  |
| UI-03 | Bulk import journey | Bulk import is guided with template, rules, and upload path | Guide modal rendered with template columns and rules | passed | screenshots/bulk-import-guide.png |  |
| UI-04 | Bulk import template | Downloaded template contains prescribed required fields and salary head examples | EMP0001-salary-transaction-import-template.csv | passed | docs/qa/compensation-transactions-2026-05-21/EMP0001-salary-transaction-import-template.csv |  |
| UI-05 | Responsive login | Mobile login still exposes AuroraHR Home without horizontal overflow | hasHome=true | passed | screenshots/mobile-login-home-route.png |  |

## API Proof

- Authentication and missing-token control verified.
- Create, update, duplicate rejection, invalid month, negative values, and net-pay arithmetic were verified.
- Monthly generation from active salary structure verified.
- Bulk import verified for create, upsert update, and row-level failure.
- Read model and timeline sync verified after import.

## Visual Proof

- `screenshots/login-home-route.png` proves the login route has a home navigation path.
- `screenshots/transaction-history-table.png` proves the transaction table and actions render.
- `screenshots/bulk-import-guide.png` proves the guided import journey and template instructions render.
- `screenshots/mobile-login-home-route.png` proves the mobile login view keeps the home route visible.

## Gaps Found

- None in this local QA pass.

## Repairs Made

- No new repairs were required during this QA pass.

## Residual Risks

- This pass used local database data and local auth. Production smoke should be rerun after deployment.
- Bulk import currently supports CSV; XLS/XLSX import can be added later if HR migration teams prefer spreadsheet upload directly.

## Rerun Commands

```bash
npm run build --prefix backend
npm run build --prefix frontend-web
node scripts/qa/compensation-transaction-qa.mjs
```
