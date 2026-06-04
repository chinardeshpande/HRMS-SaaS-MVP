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
| ACV-GAP-007 | Audit | Configuration Gap | Audit model exists but sensitive operations are not systematically covered. | Company and employee document operations now audited. Remaining coverage needed for employee master, compensation, settings, role, import, and email operations. | P1 |
| ACV-GAP-008 | Data migration | Reporting Gap | Existing import scripts need ACV execution evidence and migration wave tracking. | Dry-run/execution reports, validation summaries, and rollback notes. | P1 |
| ACV-GAP-009 | Dashboards | Reporting Gap | Generic dashboards existed but not ACV implementation readiness dashboards. | Initial Memory Readiness report now exists. Remaining: lifecycle, HR operations, leave/attendance, and tenant readiness dashboards. | P2 |
| ACV-GAP-010 | HR Connect | Integration Gap | External communication aggregation is not built. | Start with outbound communication event logs; defer inbound sync. | P2 |
| ACV-GAP-011 | Zoho Cliq | Future Enhancement | No operational alert integration. | Add after tenant SMTP and audit logs are stable. | P3 |
| ACV-GAP-012 | Zoho WorkDrive | Future Enhancement | No document sync. | Add only after company document taxonomy is stable. | P3 |
| ACV-GAP-013 | Payroll processing | Out of Scope | Tax/PF/ESI/TDS/statutory payroll processing is not built. | Remain out of scope; store payroll outputs only. | N/A |
| ACV-GAP-014 | Recruitment/ATS | Out of Scope | Recruitment workflows are not part of ACV Customer Zero scope. | Keep out of scope. | N/A |
| ACV-GAP-MOB-01 | Mobile HR Hub | Integration Gap | HR Command Center (Onboarding/PMS/Exits) is client-side mock-only. | Wire to real API routes or hide mockup elements to prevent invalid data display. | P1 |
| ACV-GAP-MOB-02 | Mobile Chat | Integration Gap | Direct Chats tab under HR Connect runs entirely on mock seed arrays. | Disable/hide option for pilot launch or connect to chat API + WebSockets. | P1 |
| ACV-GAP-MOB-03 | Mobile AI | Future Enhancement | Manu AI interface is absent from the mobile app. | Design and wire AI mobile shell with backend confirmation gates. | P3 |
| ACV-GAP-MOB-04 | Mobile Security | UX Gap | Passcode bypass when local biometric hardware is not set up. | Require account password input if biometrics are unavailable instead of bypassing. | P1 |
| ACV-GAP-MOB-05 | Mobile Auditing | Reporting Gap | Secure file views/downloads on mobile do not trigger backend audit logs. | Integrate `POST /audit-logs` endpoint when mobile documents are read/shared. | P1 |


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
