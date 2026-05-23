# ACV Current-State Assessment

## Assessment Summary

AuroraHR already has a strong HRMS spine. The main ACV Customer Zero gaps are not missing core modules; they are implementation-grade completeness gaps: tenant branding, tenant SMTP execution, company document governance, compensation hardening, audit coverage, dashboards, migration evidence, and UAT discipline.

## Tenant Configuration and Subscription

### Existing Implementation

- `backend/src/models/Tenant.ts` stores company identity, subdomain, plan, status, logo/color fields, trial metadata, and onboarding status.
- `backend/src/models/OrganizationSettings.ts` stores company profile, contacts, operational settings, branding JSON, SMTP config, and security settings.
- `backend/src/models/Subscription.ts` and payment models support subscription records.
- `backend/src/models/CompanyRegistration.ts` supports company signup.
- `backend/src/routes/settingsRoutes.ts`, `registrationRoutes.ts`, and `onboardingWizardRoutes.ts` expose relevant setup APIs.

### Current Gap

Tenant configuration exists, but tenant identity is not consistently projected across app shell, emails, document templates, and generated documents.

## Employee Master and Org Setup

### Existing Implementation

- `Employee`, `User`, `Department`, `Designation`, `Role`, `Permission`, and invitation models exist.
- Employee CRUD, stats, bulk upload, department/designation setup, role management, and user invitation flows are present.
- Reporting manager fields and professional history routes exist.
- ACV pilot import scripts and templates already exist under `docs/pilots/acv-solutions-pvt-ltd/` and `backend/src/scripts/`.

### Current Gap

Employee master is usable but needs implementation-grade completeness checks: mandatory field coverage, manager hierarchy validation, role assignment validation, data import evidence, and clear exception reporting.

## Documents

### Existing Implementation

- `DocumentTemplate` and `GeneratedDocument` support HR document generation.
- `DigitalLibrary` and `DocumentCategory` support managed document resources.
- `CompanyDocument` now supports tenant-level company HR/compliance document memory.
- `EmployeeDocument` now supports durable employee-level document memory.
- `documentRoutes.ts`, `digitalLibraryRoutes.ts`, and `documentCategoryRoutes.ts` expose document-related APIs.
- `companyDocumentRoutes.ts` exposes the company document vault APIs.
- `employeeDocumentRoutes.ts` exposes employee document vault APIs.
- Frontend document screens include `ModernDocuments`, `MyHRDocuments`, template management, and document preview surfaces.
- Employee detail now includes an employee Documents tab backed by durable employee document storage.

### Current Status

Document capability exists and now has a clearer memory split:

- employee documents
- generated HR documents
- compensation documents
- company HR/compliance documents
- HR Connect communication attachments

The first durable company document vault slice is implemented with tenant isolation, HR/admin access, metadata, expiry fields, verification status, and audit logging for upload, update, verification, download, and archive.

The first durable employee document slice is implemented with tenant isolation, HR/admin upload and verification, employee self-read/download for own documents, metadata, expiry fields, verification status, and audit logging for upload, update, verification, download, and archive.

### Current Gap

Completeness reporting is still limited to per-employee stats. The legacy `/api/documents` controller still uses in-memory storage and should not be treated as the durable employee/company document memory path.

## Compensation and Payslips

### Existing Implementation

- `SalaryStructure`, `SalaryComponent`, `Payslip`, `PayslipComponent`, `PayslipAttachment`, `CompensationHistory`, and `CompensationShareLog` exist.
- `compensationRoutes.ts` supports salary structure CRUD, payslips, monthly generation, salary transaction import, attachments, and share logs.
- `frontend-web/src/components/employees/CompensationTab.tsx` includes compensation ledger, payslip library, salary transaction history, bulk import template, and guided import flows.

### Current Gap

The base is strong. ACV still needs coverage dashboards, stronger audit logging, import validation evidence, payslip month/employee completeness checks, and clear distinction that AuroraHR tracks payroll outputs but does not process payroll.

## HR Connect and Communication

### Existing Implementation

- `HRConnectPost`, `HRConnectComment`, groups, reactions, chat conversations, chat messages, calendar events, tickets, and notifications exist.
- `hrConnectRoutes.ts`, `chatRoutes.ts`, `calendarRoutes.ts`, and `ticketRoutes.ts` expose communication APIs.

### Current Gap

Internal communication exists. External communication aggregation is not yet built. The immediate ACV requirement should be outbound HR event logging and tenant-aware email sending, not full inbound mailbox sync.

## Email and SMTP

### Existing Implementation

- `OrganizationSettings.smtpConfig` exists.
- `settingsRoutes.ts` supports SMTP settings.
- `settingsService.ts` supports SMTP read/update from frontend.

### Current Gap

`backend/src/services/emailService.ts` currently uses global SMTP configuration. Tenant-specific SMTP resolution is not yet wired into runtime email sending.

## Branding

### Existing Implementation

- Tenant and organization settings can store logo and color configuration.

### Current Gap

App shell, auth pages, landing/system pages, email templates, and generated documents do not yet consistently resolve tenant branding. Branding must be controlled and scoped, not a full theme-builder.

## Audit Logs

### Existing Implementation

- `AuditLog` model exists.
- FSM services for onboarding, probation, and exit already use audit-style status tracking.
- Company document vault operations now create audit entries through `auditService`.

### Current Gap

Audit logging is not yet systematic across employee master changes, compensation operations, settings changes, imports, role changes, email sends/failures, and sensitive download/share actions outside the newly added company and employee document vaults.

## Reports and Dashboards

### Existing Implementation

- `reportingRoutes.ts`, `analyticsRoutes.ts`, saved reports, dashboard pages, and analytics models exist.
- Several visual QA reports and production-readiness reports already exist.
- A Memory Readiness report now exists at `/api/reports/memory-readiness` and appears in `Reports & Analytics`.
- The report combines employee master completeness, durable employee document categories, company document vault coverage, salary structure presence, and payslip presence.
- It produces a tenant-level readiness score, employee-level readiness rows, and company document category findings.

### Current Gap

The first implementation-readiness report is in place. ACV still needs broader operational dashboards:

- tenant readiness
- lifecycle health
- HR operations status
- leave/attendance operational health

## Production Readiness Interpretation

AuroraHR is materially beyond a basic MVP. ACV implementation should focus on hardening, governance, evidence, and tenant-specific operational readiness before deeper integrations.
