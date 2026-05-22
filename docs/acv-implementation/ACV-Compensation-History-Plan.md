# ACV Compensation History Plan

## Objective

Use AuroraHR to track ACV compensation structures, salary transaction history, and payslip documents without turning AuroraHR into a payroll processing system.

## Scope Boundary

AuroraHR will store:

- salary structures
- salary components
- salary transaction records
- imported payroll outputs
- payslip PDFs/images
- payslip component breakdowns
- compensation history events
- salary revision documents

AuroraHR will not compute:

- PF
- ESIC
- TDS
- income tax
- professional tax
- payroll statutory filings
- Form 16
- payroll disbursement execution

## Existing Implementation

Relevant backend models:

- `SalaryStructure`
- `SalaryComponent`
- `Payslip`
- `PayslipComponent`
- `PayslipAttachment`
- `CompensationHistory`
- `CompensationShareLog`

Relevant backend routes:

- `backend/src/routes/compensationRoutes.ts`

Relevant frontend surfaces:

- `frontend-web/src/components/employees/CompensationTab.tsx`
- `frontend-web/src/pages/ModernCompensation.tsx`

Existing capabilities include:

- compensation ledger
- salary structure CRUD
- payslip library
- salary transaction history
- monthly payslip generation
- bulk import template and guided import
- payslip attachments
- share log records

## Required ACV Hardening

### Import Validation

- Validate employee code/email.
- Validate salary month uniqueness.
- Validate numeric fields.
- Validate net amount against component total where possible.
- Report missing required heads.
- Report duplicate month entries.
- Support dry-run preview before execution.

### Coverage Reporting

Required reports:

- employee/month salary transaction matrix
- missing payslip matrix
- salary structure coverage by employee
- salary revision timeline
- compensation import error report

### Audit Logging

Sensitive operations requiring audit:

- salary structure create/update/delete
- salary transaction create/update/delete/import
- payslip upload/delete
- payslip download/share
- compensation history manual update

### UX Requirements

- Compensation ledger must show current structure and event timeline.
- Payslip library must behave like a document library with preview, print, download, and share actions.
- Salary transaction history must show salary date, net amount, and primary earning/deduction heads.
- Bulk import must be guided and reversible by evidence, even if technical rollback is manual.

### Communication Requirements

Initial scope:

- Log payslip share/send intent.
- Log outbound notification once tenant SMTP is wired.

Deferred:

- WhatsApp sharing.
- Inbound email aggregation.
- WorkDrive sync.

## ACV UAT Scenarios

- HR imports May 2026 salary transactions for all active employees.
- HR uploads payslip PDF for one employee and previews it.
- Employee views own payslip and cannot view another employee's payslip.
- HR updates a salary transaction and audit log captures the change.
- Missing payslip report identifies gaps.
- Compensation page clearly communicates tracking, not payroll processing.

