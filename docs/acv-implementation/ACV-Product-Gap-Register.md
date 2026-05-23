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
| ACV-GAP-001 | Tenant branding | Configuration Gap | Branding fields exist but are not consistently applied across shell, emails, and documents. | Controlled tenant logo/color/document/email identity applied where appropriate. | P1 |
| ACV-GAP-002 | Email | Integration Gap | Tenant SMTP config exists but email service uses global SMTP. | Runtime email sender resolves tenant SMTP first, then platform fallback. | P1 |
| ACV-GAP-003 | Documents | Data Model Gap | Company HR/compliance document vault was not explicit. | Company document vault with categories, ownership, access, expiry metadata, and audit. Initial reusable vault implemented in `codex/acv-memory-foundation`. | P1 |
| ACV-GAP-004 | Documents | UX Gap | Employee/generated/company/compensation documents are not clearly separated for HR governance. | Clear document taxonomy and navigation model. | P1 |
| ACV-GAP-005 | Compensation | Reporting Gap | Payslip and salary transaction completeness is not visible at company level. | Coverage dashboard by employee/month and missing payslip report. | P1 |
| ACV-GAP-006 | Compensation | UX Gap | Share actions are logged but not yet fully connected to actual HR Connect/email delivery. | Share semantics clarified and eventually connected to outbound channels. | P2 |
| ACV-GAP-007 | Audit | Configuration Gap | Audit model exists but sensitive operations are not systematically covered. | Company document operations now audited. Remaining coverage needed for employee, employee document, compensation, settings, role, import, and email operations. | P1 |
| ACV-GAP-008 | Data migration | Reporting Gap | Existing import scripts need ACV execution evidence and migration wave tracking. | Dry-run/execution reports, validation summaries, and rollback notes. | P1 |
| ACV-GAP-009 | Dashboards | Reporting Gap | Generic dashboards exist but not ACV implementation readiness dashboards. | ACV readiness, completeness, lifecycle, document, and compensation dashboards. | P2 |
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

3. `codex/acv-tenant-smtp-zoho-mail`
   - Use existing tenant SMTP config in runtime email service.
   - Log outbound HR email events.

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
