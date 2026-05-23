# ACV Data Migration Plan

## Objective

Migrate ACV Solutions data into AuroraHR as a clean production tenant using controlled waves, validation, evidence, and rollback notes. The migration must support real operations without mixing historical test data or demo data.

## Source Material

Known source files from the ACV implementation workstream include:

- ACV onboarding master workbook.
- Personal employee detail workbooks.
- Salary month workbook.
- Employee resumes and supporting documents.
- ACV email IDs under `acvsolutions.in`.
- Director/Admin details for Anupama Bhat.

Source files containing real employee data must remain outside version control.

## Existing Repo Support

- `docs/pilots/acv-solutions-pvt-ltd/employee-import-template.csv`
- `docs/pilots/acv-solutions-pvt-ltd/master-data-template.csv`
- `docs/pilots/acv-solutions-pvt-ltd/data-intake-checklist.md`
- `docs/pilots/acv-solutions-pvt-ltd/clean-room-implementation-protocol.md`
- `backend/src/scripts/importPilotOrganization.ts`
- `backend/src/scripts/auditTenantCleanliness.ts`

## Migration Waves

### Wave 0: Tenant Clean-Room

- Confirm ACV tenant exists or create it using production-safe flow.
- Run tenant cleanliness audit.
- Confirm no demo/test data is attached to the ACV tenant.
- Confirm ACV domain and primary admin.

Evidence:

- Cleanliness audit output.
- Tenant ID, organization ID, and admin user confirmation.

### Wave 1: Master Data

- Departments.
- Designations.
- Locations.
- Employment types.
- Role templates.
- Reporting hierarchy rules.

Validation:

- No duplicate department/designation names.
- All employee records can map to valid master values.

### Wave 2: Employee Master

- Employee codes.
- Names.
- ACV email IDs.
- Designation and department.
- Date of joining.
- Reporting manager.
- Employment status.
- Contact and personal fields where available.

Validation:

- Unique employee code.
- Unique official email.
- Manager references resolve.
- Required fields complete.
- Run the Memory Readiness report after import to capture missing employee master fields.

### Wave 3: User Access and Roles

- Director/Admin user.
- HR user(s).
- Manager users.
- Employee self-service users.

Validation:

- Role access matches persona matrix.
- Employee cannot access global admin features.
- Managers can see team work queues only where appropriate.

### Wave 4: Documents

- Employee identity documents.
- Appointment/offer/confirmation documents.
- Resumes and supporting documents.
- Company HR/compliance documents.

Validation:

- Document category exists.
- Access level is correct.
- Employee-linked documents map to the right employee.
- Company documents do not appear as employee personal documents.
- Run the Memory Readiness report after document import to capture missing required employee documents and company document category gaps.

Implementation note:

- Company HR/compliance documents should use the durable Company Document Vault.
- Employee documents should use the durable Employee Document Vault.
- The legacy in-memory `/api/documents` path should not be used for ACV production memory.

### Wave 5: Compensation History

- Salary structures.
- Salary transactions.
- Payslip files.
- Payslip components.

Validation:

- Employee/month matrix is complete.
- Net amount matches source.
- Payslip attachment maps to employee/month.
- No statutory payroll calculations are created.
- Run the Memory Readiness report after salary structure and payslip import to capture employee-level compensation memory gaps.

### Wave 6: Lifecycle History

- Past promotions.
- Transfers.
- salary revisions.
- unpaid breaks or sabbaticals.
- exits, where applicable.

Validation:

- Manual employment history entries are marked as implementation migration records.
- Sensitive updates are auditable.

## Migration Evidence Folder

Use:

`docs/acv-implementation/ACV-Testing-Evidence/`

Evidence can include:

- dry-run reports
- validation summaries
- screenshots
- import logs with sensitive data redacted
- UAT sign-off notes

## Data Safety Rules

- Do not commit real employee source workbooks, resumes, salary sheets, or identity documents.
- Do not use demo tenant IDs for ACV production data.
- Do not run destructive import scripts without a dry run.
- Do not import documents until document taxonomy is finalized.
- Do not create payroll computation records.
