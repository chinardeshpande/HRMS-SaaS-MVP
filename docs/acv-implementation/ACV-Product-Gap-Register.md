# ACV Product Gap Register

## Classification Key

- Bug: Current intended behavior does not work correctly.
- Configuration Gap: Data/config exists but is not applied completely.
- Data Model Gap: Existing model cannot clearly represent required production data.
- UX Gap: Flow exists but is unclear, incomplete, or hard to operate.
- Integration Gap: External or cross-module connection is missing or incomplete.
- Reporting Gap: Required visibility, completeness, or evidence is missing.
- Future Enhancement: Valuable, but not required for ACV Customer Zero launch.
- Out of Scope: Explicitly excluded from this phase.

## Priority Gaps

| ID | Area | Classification | Gap | Required Outcome | Priority |
| --- | --- | --- | --- | --- | --- |
| ACV-GAP-001 | Tenant branding | Configuration Gap | Branding fields exist but are not consistently applied across shell, emails, and documents. | App shell title bar now resolves tenant logo/name/color from organization settings with AuroraHR fallbacks. Generated HR document preview and PDF output now use tenant logo/colors. Remaining: branded email templates and tenant-aware email sender identity. | P1 |
| ACV-GAP-002 | Email | Integration Gap | Tenant SMTP config exists but email service uses global SMTP. | Pending. Runtime email sender must resolve tenant SMTP first, then platform fallback, and log outbound email events. | P1 |
| ACV-GAP-003 | Documents | Data Model Gap | Company HR/compliance document vault was not explicit. | Company document vault with categories, ownership, access, expiry metadata, and audit. Initial reusable vault implemented in `codex/acv-memory-foundation`. | P1 |
| ACV-GAP-004 | Documents | UX Gap | Employee/generated/company/compensation documents were not clearly separated for HR governance. | Company and employee document vaults now create clearer memory separation, Missing Documents reporting now uses durable employee documents, and key document surfaces now support view-in-modal plus list/card views. Remaining: generated-document and payslip linkage into one cross-module memory view. | P1 |
| ACV-GAP-005 | Compensation | Reporting Gap | Payslip and salary transaction completeness was not visible at company level. | Initial readiness coverage now reports salary structure and payslip presence by employee. Remaining: employee/month matrix and missing payslip report. | P1 |
| ACV-GAP-006 | Compensation | UX Gap | Share actions are logged but not yet fully connected to actual HR Connect/email delivery. | Share semantics clarified and eventually connected to outbound channels. | P2 |
| ACV-GAP-007 | Audit | Configuration Gap | Audit model exists but sensitive operations are not systematically covered. | Company and employee document operations are now API-tested for upload/download/update/verify/archive audit events. Payslip attachment download is now audited. Remaining coverage needed for employee master, salary structure/payslip mutations, settings, role, import, and email operations. | P1 |
| ACV-GAP-008 | Data migration | Reporting Gap | Existing import scripts need ACV execution evidence and migration wave tracking. | Dry-run/execution reports, validation summaries, and rollback notes. | P1 |
| ACV-GAP-009 | Dashboards | Reporting Gap | Generic dashboards existed but not ACV implementation readiness dashboards. | Initial Memory Readiness report now exists. Remaining: lifecycle, HR operations, leave/attendance, and tenant readiness dashboards. | P2 |
| ACV-GAP-010 | HR Connect | Integration Gap | External communication aggregation is not built. | Start with outbound communication event logs; defer inbound sync. | P2 |
| ACV-GAP-011 | Zoho Cliq | Future Enhancement | No operational alert integration. | Add after tenant SMTP and audit logs are stable. | P3 |
| ACV-GAP-012 | Zoho WorkDrive | Future Enhancement | No document sync. | Add only after company document taxonomy is stable. | P3 |
| ACV-GAP-013 | Payroll processing | Out of Scope | Tax/PF/ESI/TDS/statutory payroll processing is not built. | Remain out of scope; store payroll outputs only. | N/A |
| ACV-GAP-014 | Recruitment/ATS | Out of Scope | Recruitment workflows are not part of ACV Customer Zero scope. | Keep out of scope. | N/A |

## First Work Packages

1. `codex/acv-implementation-control-room`
   - Documentation only.
   - Create shared operating truth before product changes.

2. `codex/acv-tenant-branding-settings`
   - Apply controlled tenant identity across app shell and tenant-generated surfaces.
   - Current status: app shell tenant branding and generated HR document branding are implemented. Email branding remains pending.

3. `codex/acv-tenant-smtp-zoho-mail`
   - Use existing tenant SMTP config in runtime email service.
   - Log outbound HR email events.
   - Current status: not started.

4. `codex/acv-company-document-vault`
   - Add explicit company HR/compliance document governance.

5. `codex/acv-compensation-hardening`
   - Add coverage reports, audit coverage, and stronger import evidence.

## Risk Register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| ACV-specific logic leaks into generic product | Multi-tenant maintainability risk | Use tenant config, templates, and data; avoid hardcoding. |
| Document library becomes ungoverned storage | HR compliance and usability risk | Define explicit document taxonomy before migration. |
| Salary tracking turns into payroll processing | Scope and liability risk | Store outputs only; do not compute statutory payroll. |
| Real employee data is imported without rollback plan | Data quality and privacy risk | Dry-run, validate, execute in waves, record evidence. |
| Email integration starts with inbound sync | Complexity and privacy risk | Start with outbound tenant SMTP and communication logs only. |

## QA Advisory Status - 2026-06-04

| Advisory | Previous Risk | Status | Evidence |
| --- | --- | --- | --- |
| Account enumeration through inactive/ambiguous login responses | Low | Resolved | Login now returns generic 401 `INVALID_CREDENTIALS` for inactive, duplicate, nonexistent, and wrong-password credential failures. |
| Missing second-tenant employee-role fixture | Low | Resolved | `employee@orbit.test` is seeded under Orbit QA Isolation Ltd. |
| Silent-pass patterns in seeded API tests | Medium | Resolved for current API suite | Seed-dependent integration tests now use `requireAuth(...)` hard failures instead of returning early. |

## Validation Sprint Update - 2026-06-08

The `codex/acv-validation-reports` branch created a repeatable, read-only validation script and generated an ACV missing-data register.

New/confirmed gaps:

| ID | Area | Classification | Gap | Required Outcome | Priority |
| --- | --- | --- | --- | --- | --- |
| ACV-GAP-015 | Employee master | Reporting Gap | Every employee has at least one missing/risky master field in the generated validation report. | Complete active employee master first, then historical records. | P1 |
| ACV-GAP-016 | HR Analytics | Reporting Gap | Reporting routes previously lacked access-aware service scoping for manager-visible reports and saved report execution. | Backend analytics/reporting now enforces tenant scope, role scope, manager/direct-report scope, and saved-report guardrails with synthetic QA coverage. Remaining: browser E2E and visual/chart validation. | P1 |
| ACV-GAP-016 | Employee documents | Reporting Gap | All 21 employees are missing one or more key document classes by current taxonomy/title detection. | Upload/classify PAN, Aadhaar, address proof, employment letters, compensation letters, and exit documents. | P1 |
| ACV-GAP-017 | Company documents | Reporting Gap | TAN, POSH, HR templates, and optional EPF/ESIC are not detected in the company vault. | Upload or reclassify company documents before UAT sign-off. | P1 |
| ACV-GAP-018 | Compensation | Reporting Gap | 100 payslip records have no file attachment; 7 employees have no active salary structure. | Attach payslip files where available and complete current salary structure coverage. | P1 |
| ACV-GAP-019 | Tenant setup | Configuration Gap | Registered address, HR/company email, and registration/tax references are missing from organization settings. | Complete organization profile before Zoho SMTP and formal UAT. | P1 |
| ACV-GAP-020 | Document storage | Bug / Data Integrity Gap | Employee and company document records exist, but uploaded files are not reachable from configured storage in the current environment. | Repair storage path mapping or re-upload documents; then regenerate validation reports. | P0 |
| ACV-GAP-021 | HR Connect | Reporting Gap | No ACV HR Connect posts, comments, or chat messages were found in the validation data. | Seed/use real HR Connect communication trails before testing operating-memory scenarios. | P2 |
| ACV-GAP-022 | Audit | Reporting Gap | Audit logs exist, but expected audit coverage is partial across key lifecycle areas. | Add/verify audit hooks for missing lifecycle-sensitive actions. | P1 |

Current validation verdict: **Not ready due to blockers**. The generated register has 47 Blocker-class items, all related to document file reachability.

## Functional Solidity Sprint Update - 2026-06-08

Branch: `codex/acv-functional-solidity-sprint`

The sprint deliberately parked historical document restoration and focused on backend functional solidity with synthetic QA data.

New/updated gaps:

| ID | Area | Classification | Gap | Required Outcome | Priority |
| --- | --- | --- | --- | --- | --- |
| ACV-GAP-023 | Leave | Bug | Leave application used the raw `LeaveBalance.available` getter instead of normalized effective balance logic, allowing over-balance requests in QA. | Fixed in `LeaveService.applyLeave`; insufficient-balance requests now return controlled 400 responses. | Resolved |
| ACV-GAP-024 | Attendance | Reporting Gap | Attendance self-service clock-in/out had limited automated lifecycle coverage. | Added synthetic API regression for clock-in, duplicate clock-in rejection, and clock-out. | Resolved for API baseline |
| ACV-GAP-025 | Leave | Reporting Gap | Leave apply/approve, insufficient-balance, and gender-restricted leave behavior had limited automated lifecycle coverage. | Added synthetic API regression for apply/approve, insufficient balance, and gender mismatch. | Resolved for API baseline |
| ACV-GAP-026 | Audit | Reporting Gap | Leave and attendance mutation audit coverage is not yet proven. | Add audit hooks/tests for leave apply/approve/reject/cancel and attendance clock/regularisation/mass update. | P1 |
| ACV-GAP-027 | Browser QA | Reporting Gap | Backend API is green, but role-based browser journeys are not yet automated for this sprint. | Add Playwright critical-path suite before claiming full UI readiness. | P1 |
| ACV-GAP-028 | Historical documents | Data Integrity Gap | Missing historical document backing files remain unresolved. | Parked by product decision; restore only in a dedicated document restoration sprint. | Parked |

## Production Deployment Alignment Update - 2026-06-09

Branch: `codex/production-deployment-alignment`

The accepted QA-hardened baseline is locally ready for production deployment:

- backend build passed
- backend QA passed: 12 suites, 95 tests
- frontend build passed
- auth hardening is present for nonexistent email, wrong password, malformed login payloads, and non-string login payloads

New/updated deployment gap:

| ID | Area | Classification | Gap | Required Outcome | Priority |
| --- | --- | --- | --- | --- | --- |
| ACV-GAP-029 | Production deployment | Configuration Gap | Production was reachable but behind the QA-hardened baseline; malformed/non-string login payloads returned unsafe `500` before deployment alignment. | Resolved: deployment run `27226832082` deployed commit `dce3779775f43c68978442434c7f27652d9b5a15`; post-deployment smoke confirmed controlled `400`/`401` auth responses. | Resolved |

`ACV-GAP-029` is closed. Controlled ACV manual UAT may begin; automated authenticated production smoke awaits a disposable or explicitly approved ACV production UAT credential.
