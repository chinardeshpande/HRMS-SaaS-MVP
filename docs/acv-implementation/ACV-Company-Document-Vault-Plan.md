# ACV Company Document Vault Plan

## Objective

Create a production-grade company document vault for ACV HR and compliance documents while preserving clear separation from employee documents, generated HR documents, compensation documents, and HR Connect attachments.

## Required Document Taxonomy

### Employee Documents

Examples:

- Aadhaar
- PAN
- address proof
- resume
- education certificates
- experience letters
- employee-signed policy acknowledgements

Owner:

- employee record

Primary access:

- employee self-service, reporting manager where allowed, HR, admin

### Generated HR Documents

Examples:

- appointment letter
- confirmation letter
- transfer letter
- salary revision letter
- warning letter
- exit letter

Owner:

- generated document workflow

Primary access:

- HR, admin, employee where shared

### Compensation Documents

Examples:

- payslip PDF
- annual compensation letter
- bonus letter

Owner:

- compensation module

Primary access:

- employee, HR, admin

### Company HR and Compliance Documents

Examples:

- Certificate of Incorporation
- PAN
- TAN
- GST registration
- Shops and Establishments registration
- PF/ESIC registration where applicable
- POSH policy and committee records
- employee handbook
- HR policies
- insurance policies
- statutory returns
- audit documents

Owner:

- tenant/company record

Primary access:

- admin and HR manager by default

### HR Connect Attachments

Examples:

- communication attachments
- circular attachments
- announcement files

Owner:

- HR Connect post or message

Primary access:

- audience of the communication

## Functional Requirements

- Upload company documents.
- Categorize documents by company document type.
- Store issuer, registration number, issue date, expiry date, renewal owner, and notes where applicable.
- Support reminders for expiry/renewal-sensitive documents.
- Support role-based access.
- Support preview/download.
- Support audit logs for upload, update, delete, download, and share.
- Support search/filter by type, status, expiry, and owner.

## Suggested Initial Categories

- Incorporation and identity
- Tax registrations
- Labor and HR compliance
- Policies and handbooks
- Insurance and benefits
- Statutory returns
- Board/governance documents
- Vendor/partner agreements

## Implementation Boundary

This vault should manage document evidence and governance. It should not perform statutory compliance filing, tax filing, PF/ESI filing, or legal advisory work.

## First Technical Direction

Prefer extending document governance cleanly rather than overloading unrelated employee document fields. If existing `DigitalLibrary` and `DocumentCategory` can represent the taxonomy safely, extend them with explicit company-level ownership and access semantics. If not, introduce a focused company document model with clear tenant ownership.

## Sprint 1 Implementation Status

Implemented in `codex/acv-memory-foundation`:

- `CompanyDocument` persistent model.
- `company_documents` database migration.
- `companyDocumentRoutes.ts` API surface.
- `companyDocumentService.ts` with tenant-scoped list, upload, update, verify, download audit, archive, and stats.
- `auditService.ts` reusable audit helper.
- Documents page `Company Vault` tab.
- Company document stats: total, active, needs review, expiring soon, by category.

Initial access model:

- HR Admin and System Admin can list, upload, update, verify, download, and archive company documents.
- Employee and Manager access is intentionally excluded from this first memory foundation slice.

Audit coverage added:

- `company_document.upload`
- `company_document.update`
- `company_document.verify`
- `company_document.download`
- `company_document.archive`

Remaining work:

- Employee document memory should be moved away from the legacy in-memory `/api/documents` controller or clearly routed through a durable model.
- Company document reminders are not yet scheduled.
- Company document dashboard tiles exist only inside Documents; cross-module readiness dashboard is still pending.
- Fine-grained document permissions beyond HR/Admin are deferred.
