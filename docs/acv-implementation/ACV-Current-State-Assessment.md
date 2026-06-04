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

### Current Status

Tenant configuration exists. Tenant identity is now projected in the authenticated app title bar near the user profile area, while the primary AuroraHR product logo remains unchanged. Generated HR document preview/PDF output now resolves tenant branding for logo, colors, letterhead, and footer.

### Current Gap

Tenant identity is not yet consistently projected into outbound emails because runtime email sending still uses global SMTP configuration.

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
- Uploaded/generated/payslip/library document surfaces now support view-in-modal behavior using authenticated blob loading where required.

### Current Status

Document capability exists and now has a clearer memory split:

- employee documents
- generated HR documents
- compensation documents
- company HR/compliance documents
- HR Connect communication attachments

The first durable company document vault slice is implemented with tenant isolation, HR/admin access, metadata, expiry fields, verification status, and audit logging for upload, update, verification, download, and archive.

The first durable employee document slice is implemented with tenant isolation, HR/admin upload and verification, employee self-read/download for own documents, metadata, expiry fields, verification status, and audit logging for upload, update, verification, download, and archive.

Generated HR documents now show a tenant-branded view-only preview before save/download. Uploaded documents can be viewed in modal from the company vault, generated document history, employee document tab, My HR Documents/digital library, and payslip attachment surfaces.

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

### Current Status

The authenticated app shell title bar resolves tenant branding separately from the AuroraHR product logo. Generated HR documents also resolve tenant branding during preview and PDF generation.

### Current Gap

Auth pages, landing/system pages, and email templates do not yet consistently resolve tenant branding. Branding must remain controlled and scoped, not a full theme-builder.

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
- The Missing Documents report now uses the durable `EmployeeDocument` vault instead of onboarding-stage candidate documents.

### Current Gap

The first implementation-readiness report is in place. ACV still needs broader operational dashboards:

- tenant readiness
- lifecycle health
- HR operations status
- leave/attendance operational health

## Mobile Application

### Existing Implementation

- Framework & version: Expo SDK 50, React Native 0.73.2, React 18.2.0, Zustand for state management, and Axios with custom interceptors for API requests.
- Core self-service screens implemented and wired to endpoints: Login, Profile, Attendance punch (geofenced), and Leave Tracker (balances, history, apply leave).
- Digital Vault: Includes tabs for Payslips, Issued Docs (e.g. NDAs), and Policies. Private files are gated by local biometric authentication (`expo-local-authentication`), downloaded via `expo-file-system`, and shared via `expo-sharing`.
- HR Connect: Announcements feed and groups join/leave are connected to real backend routes with offline fallbacks.
- HR Command Hub: Includes screens for Hiring Pipeline, Probation reviews, Performance rating details, and Exits.

### Current Status

The core employee self-service features and manager leave approvals are fully operational and connected to the backend. The custom Curved Bottom Floating Tab Bar dynamically swaps the profile tab to "HR Hub" (redirecting to the HR Command Center) for managers and administrators, matching role-based permission rules. Biometric locking and geofencing calculations function correctly.

### Current Gap

The HR Command Hub detail screens (Onboarding, Probation review, Performance appraisal, Exit checklists) and HR Connect direct chats are fully client-side mocked and lack database connections. Manu AI has no mobile interface. Device branding is hardcoded rather than resolving dynamically from the tenant organization settings. Outbound downloads do not create audit log entries in the backend databases.

## Production Readiness Interpretation

AuroraHR is materially beyond a basic MVP. ACV implementation should focus on hardening, governance, evidence, and tenant-specific operational readiness before deeper integrations.
