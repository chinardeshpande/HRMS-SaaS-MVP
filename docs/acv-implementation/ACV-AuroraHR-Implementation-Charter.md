# ACV AuroraHR Implementation Charter

## Purpose

ACV Solutions Pvt Ltd is the Customer Zero implementation for AuroraHR. The objective is to run ACV's real SME HR operations inside AuroraHR and use that implementation to validate the product as an implementation-grade SaaS platform, not just a feature-complete MVP.

This program must prove that AuroraHR can support a complete employee lifecycle for a real organization: tenant setup, organization configuration, employee master data, lifecycle records, HR documents, compensation history, payslips, internal HR communications, dashboards, auditability, and controlled tenant personalization.

## Scope

### In Scope

- ACV tenant configuration and clean-room setup.
- ACV branding and controlled tenant personalization.
- Employee master, departments, designations, reporting lines, roles, and user access.
- Historical and current employee lifecycle records.
- Employee documents, generated HR documents, and company HR/compliance documents.
- Compensation tracking, salary structures, salary transaction history, payslip storage, and payslip attachments.
- Controlled data migration using templates, validation, dry runs, and evidence.
- Tenant-aware outbound email readiness, starting with Zoho Mail SMTP.
- HR Connect logging for internal HR communication and selected system-generated HR events.
- Dashboards for implementation readiness, employee completeness, document completeness, compensation coverage, and HR operations.
- Audit logging for sensitive HR, document, compensation, settings, import, and communication actions.
- Role-based UAT and production-readiness evidence.

### Explicitly Out of Scope

- Payroll processing.
- PF, ESIC, TDS, professional tax, income tax, statutory payroll computation, or statutory filing logic.
- Recruitment or ATS functionality.
- Full inbound email ingestion from Zoho Mail.
- WorkDrive synchronization before document taxonomy and governance are stable.
- WhatsApp automation before email, audit, and communication logging are reliable.
- ACV-specific hardcoding in the generic product.

AuroraHR may store payroll outputs produced elsewhere: salary structures, salary disbursement history, payslips, imported salary records, and supporting documents. It must not become the payroll engine in this phase.

## Implementation Principles

- Treat ACV as a production customer, not a demo tenant.
- Keep all ACV-specific configuration as tenant data or templates, not source-code branches.
- Preserve tenant isolation across all data, documents, communications, and reports.
- Use controlled migration waves with validation and rollback notes.
- Use audit logs and evidence packs for every sensitive implementation action.
- Strengthen existing modules before adding new integrations.
- Convert every ACV implementation lesson into reusable onboarding methodology.

## Success Criteria

- ACV users can log in and see an ACV-specific tenant experience where appropriate.
- ACV employee records are complete enough to support daily HR operations.
- Employee and company documents are governed by a clear taxonomy.
- Compensation history, salary transactions, and payslips are viewable and auditable.
- Outbound HR emails can be sent through tenant-specific SMTP once configured.
- HR Connect captures relevant internal HR events and communication context.
- ACV dashboards show readiness gaps and operational status.
- Role-based UAT evidence proves the implementation across Admin, HR Manager, Manager, and Employee personas.
- No payroll/recruitment scope creep is introduced.

## Related Existing Assets

- `docs/pilots/acv-solutions-pvt-ltd/README.md`
- `docs/pilots/acv-solutions-pvt-ltd/clean-room-implementation-protocol.md`
- `docs/pilots/acv-solutions-pvt-ltd/data-intake-checklist.md`
- `docs/pilots/acv-solutions-pvt-ltd/pilot-qa-plan.md`
- `docs/qa/compensation-transactions-2026-05-21/report.md`
- `docs/qa/responsive-visual-2026-05-21/report.md`

