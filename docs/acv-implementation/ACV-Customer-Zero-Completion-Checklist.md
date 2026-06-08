# ACV Customer Zero Completion Checklist

Date: 2026-06-08
Branch: `codex/current-product-surface-inventory`
Scope: completion checklist only. No implementation changes were made.

## Definition Of Done

ACV Customer Zero is complete when ACV Solutions can run its internal HR operations in AuroraHR with trusted data, governed documents, correct role boundaries, clean tenant identity, and evidence-backed implementation sign-off.

The product remains scoped to HR lifecycle management, HR operations memory, document management, compensation tracking, payslip storage, attendance/leave operations, collaboration, reporting, and guided AI assistance. Payroll computation and recruitment/ATS are out of scope.

## Status Legend

- `Done`: implemented and evidenced enough for current phase.
- `Partial`: implemented but needs validation, cleanup, or completion.
- `Pending`: not yet implemented or not yet loaded.
- `Blocked`: requires user/business input or external integration.

## 1. Tenant And Company Setup

| Item | Status | Completion evidence required |
| --- | --- | --- |
| ACV tenant exists | Done | Tenant record and ACV login. |
| ACV company name/logo visible in app shell | Done | Screenshot of authenticated title-bar branding. |
| AuroraHR product logo remains untouched | Done | Authenticated app shell screenshot. |
| ACV organization profile complete | Partial | Legal name, address, email, phone, GST/PAN/TAN/registration references verified. |
| Departments/designations created | Partial | Master data export and employee coverage report. |
| Work locations standardized | Partial | Employee master completeness report. |
| Tenant colors/theme configured | Partial | Current visual style uses app-level theme; tenant-specific theme still limited. |
| Tenant SMTP/Zoho Mail | Pending | Tenant SMTP send test, fallback test, failure log, audit/communication log. |

## 2. Employee Master

| Item | Status | Completion evidence required |
| --- | --- | --- |
| Active employees loaded | Done | Employee register active count and data extract. |
| Historical/exited employees loaded | Partial | Exited employee register, exit dates, status, reason coverage. |
| Mock Chinar record removed | Done | Employee lookup no longer returns mock record. |
| Employee codes assigned | Partial | Duplicate/blank employee code report. |
| Personal details captured | Partial | Missing DOB/gender/phone/address/personal email report. |
| Professional details captured | Partial | Missing department/designation/manager/joining/location report. |
| Manager mapping applied | Partial | Active employee manager mapping report. |
| Employment history events captured | Partial | Join/confirmation/promotion/transfer/exit timeline coverage report. |
| CRUD works for key employee fields | Partial | Browser/API regression evidence. |

## 3. Documents And Company Memory

| Item | Status | Completion evidence required |
| --- | --- | --- |
| Employee document vault exists | Done | Employee detail document tab. |
| Company document vault exists | Done | Company vault under Document Library. |
| Company document latest batch imported | Done | `latest-data-ingestion-2026-05-27/company-documents-execution/README.md`. |
| Employee documents imported where available | Partial | Employee document coverage report by category. |
| Company policies uploaded | Partial | Policy list and verification status. |
| Company compliance documents uploaded | Partial | Incorporation/tax/labor/statutory category coverage. |
| Document preview works | Partial | Production/local visual regression for PDFs/images/doc/docx edge cases. |
| Document download works | Partial | Role-based download tests. |
| Document verification workflow works | Partial | HR/admin verification audit evidence. |
| Document delete/update audit logs | Partial | Endpoint-level audit log verification. |
| Missing document register | Pending | Exportable missing document report shared with ACV team. |

## 4. Compensation And Payslips

| Item | Status | Completion evidence required |
| --- | --- | --- |
| Compensation tab exists | Done | Employee detail compensation tab. |
| Current salary structures loaded | Partial | Active employee salary structure coverage report. |
| Salary transaction history loaded | Partial | Employee/month transaction coverage report. |
| Payslip library exists | Done | Payslip library tab and attachment records. |
| Payslip files attached | Partial | Employee/month payslip attachment matrix. |
| Bulk import journey exists | Done | UI/API route and template evidence. |
| Salary data role boundary | Pending | Admin/HR/manager/employee permission tests. |
| Payslip preview/download/share | Partial | Browser evidence and share-log verification. |
| Payroll computation boundary visible | Partial | UX text/tests confirming tracking-only scope. |

## 5. Attendance

| Item | Status | Completion evidence required |
| --- | --- | --- |
| Attendance module exists | Done | `/attendance` route. |
| My Attendance current/date-range view | Partial | Browser regression evidence after recent UI changes. |
| Company Attendance day/date-range view | Partial | Active employees only, horizontal date grid verified. |
| Attendance regularisation request/approval | Partial | Employee/manager/admin workflow test. |
| Monthly attendance backfilled | Done | `latest-data-ingestion-2026-05-27/attendance-execution/README.md`. |
| Biometric punch imports | Pending | Legacy `.xls` parser/converter decision and dry-run. |
| Work-from default to Office when present | Partial | Data rule test. |
| Attendance export/download | Partial | Download test. |

## 6. Leave

| Item | Status | Completion evidence required |
| --- | --- | --- |
| Leave module exists | Done | `/leave` route. |
| My Leaves register | Partial | Browser regression evidence after recent UI changes. |
| Company Leaves view | Partial | Active employees, leave types, taken/eligible values. |
| Team approvals | Partial | Manager workflow test. |
| Leave balances imported | Done | `latest-data-ingestion-2026-05-27/leave-balances-execution/README.md`. |
| Master leave policy configured | Partial | Active tenant-wide policy evidence and business sign-off. |
| Maternity/paternity gender eligibility | Partial | Female/male/unknown/null gender tests. |
| Leave policy switching UX | Pending | Deliberately simple currently; needs clearer active-policy control if required. |

## 7. Lifecycle Modules

| Item | Status | Completion evidence required |
| --- | --- | --- |
| Onboarding | Partial | Candidate-to-employee scenario test. |
| Probation | Partial | Due review, confirmation, extension, termination tests. |
| Moves/promotions/transfers | Partial | Route/surface exists; full workflow and history sync need verification. |
| Performance | Partial | Goal/KPI/review/feedback/development action tests. |
| Exit | Partial | Resignation, approval, clearance, assets, interview, settlement tests. |
| Generated HR letters | Partial | Tenant-branded preview/save/download/share tests. |

## 8. HR Connect, Collaboration, Calendar

| Item | Status | Completion evidence required |
| --- | --- | --- |
| HR Connect feed | Partial | Post/comment/reaction/group browser tests. |
| Groups | Partial | Create/join/leave/member-role tests. |
| Chat | Partial | Conversation/message/upload/read/participants tests. |
| Helpdesk | Partial | Ticket lifecycle and comment tests. |
| Calendar | Partial | Event CRUD/upcoming reminders tests. |
| Video call component | Pending | End-to-end behavior not verified. |
| External email communication logging | Pending | Depends on tenant SMTP/Zoho Mail work. |

## 9. HR Analytics

| Item | Status | Completion evidence required |
| --- | --- | --- |
| HR Analytics route exists | Done | `/reports` route. |
| Dynamic report builder UI | Partial | Current UI exists but has known defects. |
| Column selection | Pending | Known broken/incorrect behavior. |
| Grouping | Pending | Known broken/incorrect behavior. |
| Charts | Pending | Known broken/incorrect behavior. |
| Saved reports/templates | Partial | Saved report model/API exists; UI needs verification. |
| ACV readiness dashboards | Pending | Employee completeness, document coverage, compensation coverage, tenant readiness dashboards. |

## 10. Manu AI

| Item | Status | Completion evidence required |
| --- | --- | --- |
| Manu tray/UI exists | Done | Global authenticated assistant surface. |
| Manu backend routes exist | Done | `/assistant/ask`, preview confirmation, request execution. |
| Persona contract exists | Done | Name `Manu`, label `Ask Manu`, subtitle `HR Operations Angel`. |
| Deterministic data-backed answers | Partial | Some employee/document/compensation/attendance/leave facts work. |
| Intent routing | Pending | Current routing is keyword-based and unreliable. |
| Entity resolution | Pending | Unsafe last-name matching identified in QA. |
| Role-safe salary access | Pending | Admin tested; employee/manager role tests incomplete. |
| Guided workflows | Partial | Some how-to responses exist; real guided tours/actions not complete. |
| Drafting | Pending | Confirmation/email/letter drafting not properly wired. |
| Action guardrails | Partial | Scaffolding exists, but action prompts are not reliably classified. |
| Manu production readiness | Pending | Existing QA verdict is failed. |

## 11. Mobile App

| Item | Status | Completion evidence required |
| --- | --- | --- |
| Expo React Native app exists | Done | `mobile-app` repo tree. |
| Login/API client | Partial | API client and auth store tests exist; runtime verification needed. |
| Dashboard | Partial | Screen exists; API parity test needed. |
| Attendance/Leave | Partial | Screens exist; parity with latest web logic needed. |
| Employee directory/detail | Partial | Screens exist; data/access tests needed. |
| Digital Vault | Partial | Screen exists; document API compatibility tests needed. |
| HR Connect | Partial | Screen exists; real-time/workflow tests needed. |
| HR Command Center | Partial | Screens/tests exist for HR command center, onboarding detail, probation review. |
| Mobile ownership decision | Pending | Keep with Antigravity unless a formal handoff pack moves it to Claude Code. |

## 12. Security, Audit, Multi-Tenant Governance

| Item | Status | Completion evidence required |
| --- | --- | --- |
| JWT auth and role middleware | Done | Backend middleware/routes. |
| Tenant-scoped models/services | Partial | Endpoint-by-endpoint tenant isolation tests. |
| Audit log model/service | Done | `AuditLog`, `auditService`. |
| Document audit coverage | Partial | Specific route action verification. |
| Salary audit coverage | Pending | Create/update/delete/import/share audit tests. |
| Settings/role audit coverage | Pending | Role/user/policy/SMTP change audit tests. |
| Import rollback/idempotency docs | Partial | Latest data imports have evidence; older imports need consolidation. |

## 13. Final ACV Sign-Off Pack

Required before declaring Customer Zero complete:

- ACV tenant profile sheet.
- Employee master completeness report.
- Manager mapping report.
- Employment history coverage report.
- Company document vault report.
- Employee document coverage report.
- Compensation and payslip coverage report.
- Attendance import coverage report.
- Leave balance and policy sign-off.
- Role access test report.
- Responsive visual QA report.
- Manu readiness report.
- Known gaps/missing data register.
- Production deployment and rollback notes.

## Recommended Next Work Packages

1. `codex/acv-validation-reports` - generate ACV data coverage reports and missing-data register.
2. `codex/hr-analytics-repair` - repair column selection, grouping, charts, data correctness.
3. `codex/manu-intent-registry` - replace keyword fallback with module use-case registry, entity resolver, permission resolver, output contract tests.
4. `codex/acv-role-boundary-tests` - create/repair admin/HR/manager/employee test users and validate access.
5. `codex/mobile-handoff-pack` - document mobile status, API contracts, known parity gaps, and owner handoff.

## Validation Sprint Update - 2026-06-08

Branch: `codex/acv-validation-reports`
Evidence: `docs/acv-implementation/ACV-Testing-Evidence/import-validation-reports/2026-06-08/`

Current verdict: **Not ready due to blockers**.

The validation report was generated from the local ACV tenant database and found:

- 21 employees total: 6 active and 15 inactive/exited.
- 16 company documents.
- 31 employee documents.
- 14 salary structures.
- 104 payslip records and 4 payslip attachments.

## Functional Solidity Sprint Update - 2026-06-08

Branch: `codex/acv-functional-solidity-sprint`

| Item | Status | Evidence required / current evidence |
| --- | --- | --- |
| Backend build health | Done | `npm --prefix backend run build` passed. |
| Backend QA regression | Done | `npm --prefix backend run test:qa` passed: 11 suites, 84 tests. |
| Attendance basic self-service API | Done | Synthetic test covers clock-in, duplicate clock-in rejection, and clock-out. |
| Leave apply/approval API | Done | Synthetic test covers employee leave apply and manager approval. |
| Leave insufficient-balance protection | Done | Bug fixed and covered by synthetic regression. |
| Maternity/paternity gender eligibility API | Partial | Synthetic mismatch rejection covered. Additional female/male/unknown/null matrix still recommended. |
| Historical document restoration | Parked | Explicitly out of scope for this sprint. |
| Browser E2E readiness | Pending | Backend is green; browser UAT/Playwright remains separate. |
| Full ACV sign-off | Partial | Functional solidity improved, but real ACV data completeness, UI E2E, audit coverage, and analytics repairs remain. |
- 1745 attendance rows.
- 30 leave balances and 5 active leave policies.
- 2011 audit rows.

Current blocker pattern:

- Employee document metadata exists, but 31 uploaded employee document files are not reachable in configured storage.
- Company document metadata exists, but 16 uploaded company document files are not reachable in configured storage.

Checklist impact:

- Document and company memory remain `Partial` until storage reachability is repaired or files are re-uploaded.
- UAT cannot be treated as clean until Blocker items in `ACV-Missing-Data-Register.md` are closed or explicitly accepted.

The detailed missing-data source of truth is now:

- `docs/acv-implementation/ACV-Missing-Data-Register.md`
- `docs/acv-implementation/ACV-Testing-Evidence/import-validation-reports/2026-06-08/acv-missing-data-register.csv`
