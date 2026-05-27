# ACV Latest Data Ingestion Assessment - 2026-05-27

Source folder: `/Users/chinar.deshpande06/Temp/CL-ACV/ACV-India/HRMS-MVP/ACV Implementation Data/01-source-files/Latest Data`

This is a non-destructive assessment. No AuroraHR database records were created, changed, or deleted.

## Inventory Summary

- Files assessed: 230
- Extensions: {'.pdf': 55, '.xlsx': 18, '.zip': 3, '.xls': 95, '.docx': 59}
- Categories: {'company_document': 9, 'migration_gap_workbook': 1, 'leave_balance_source': 1, 'monthly_attendance_source': 11, 'source_archive': 3, 'salary_transaction_source': 84, 'payslip_document_or_template': 95, 'exit_fnf_document': 2, 'unclassified': 1, 'employee_compensation_document': 19, 'biometric_attendance_source': 4}
- Duplicate hash groups detected: 51

## What Is Immediately Usable

- Company document PDFs are ready for idempotent import into the Company Document Vault.
- `Leave_Management_2026.xlsx` has employee-wise leave balance/usage sheets and can feed leave balances after policy mapping.
- Monthly attendance `.xlsx` workbooks have day-level status grids (`P`, `WO`, `PH`, `L`/`Leave`) suitable for attendance backfill.
- `ACV-AuroraHR-Missing-Data-and-Documents-Workbook-2026-05-26.xlsx` remains the control workbook for gaps and team follow-up.
- `FNF_Latika.xlsx` is a structured full-and-final source and can attach to the exited employee record and/or exit documents.
- Salary tax summary `.xlsx` files provide current/annual salary references, but they include tax-calculation content and must not be imported as payroll computation.

## What Needs Caution

- Payroll salary registers and biometric exports are legacy `.xls` binary files. This environment can classify them, but cannot safely parse them without a legacy Excel converter/library.
- Several files are duplicated by hash and by naming pattern, especially salary registers and salary slips. Import must use SHA-256 plus employee/month uniqueness to avoid duplicate payslips or salary transactions.
- Some 2026 payroll folders contain a file named `SALARY FOR THE MONTH OF -January 2026.xls` inside other month folders. These must be validated before import; folder month and file month conflict.
- `Timesheet-August-2025.xlsx` is project effort data, not HR attendance. It should not be imported into Attendance Management unless ACV explicitly wants project timesheets tracked separately.

## Company Vault Import Candidates

| Title | Category | Source file | Pages | Hash prefix |
|---|---|---|---:|---|
| ACV PTEC Certificate | `tax_registration` | `ACV PTEC Certificate.pdf` | 2 | `0210ceda018c` |
| Acknowlegement | `incorporation_identity` | `Acknowlegement.pdf` | 2 | `b7db576069ee` |
| CERTIFICATE OF INCORPORATION | `incorporation_identity` | `CERTIFICATE OF INCORPORATION.PDF` | 1 | `78e227699179` |
| Form_INC-20A_ACV Solutions | `incorporation_identity` | `Form_INC-20A_ACV Solutions.pdf` | 1 | `504f29d72ad6` |
| GST Certificate | `tax_registration` | `GST Certificate-ACV Solutions.pdf` | 3 | `27aa10d2ecff` |
| Gumasta / Shops & Establishment License | `labor_hr_compliance` | `Gumasta License.pdf` | 3 | `7c81a38eefe3` |
| PAN Card | `tax_registration` | `PAN Card-ACV.pdf` | 1 | `1ecdd570626e` |
| PTRC Certificate | `tax_registration` | `PTRC Certifcate.pdf` | 1 | `deb21be91ac8` |
| Udyam Registration Certificate | `incorporation_identity` | `Print _ Udyam Registration Certificate with Anexure.pdf` | 5 | `1ca302e047da` |

## Recommended Import Order

1. **Company documents**: safest first. Upsert by `tenantId + normalizedTitle + category + sha256`; mark imported files as `unverified` with notes.
2. **Leave balances**: parse `Leave_Management_2026.xlsx`, map CL to `casual`, PL to `earned`, LOP to `unpaid`; update balances only after checking active leave policy IDs.
3. **Monthly attendance**: import curated `.xlsx` monthly attendance before biometric raw exports. Map `P=present`, `WO=weekend`, `PH/HOLIDAY=holiday`, `L/Leave=on_leave`, blank=skip/no evidence`. Use upsert on `employeeId + date`.
4. **Salary transactions and payslips**: first generate a dry-run from salary registers and payslip files. Import only rows/files that map confidently to employee + month + year. Attach ambiguous files to the employee document library as `needs review`, not as final payslips.
5. **Biometric exports**: use as secondary evidence to enrich check-in/check-out only after conversion from `.xls` is available and conflicts against curated monthly attendance are reported.

## Required Dry-Run Rules Before Any Data Update

- Never create duplicate employees from this folder. Employee matching must be by employee code first, then normalized name aliases.
- All imports must be tenant-scoped to ACV only.
- All import scripts must support `--dry-run` and produce created/updated/skipped/error counts.
- Every inserted/updated record should store `metadata.sourceFile`, `metadata.sourceHash`, and `metadata.importBatch = acv-latest-data-2026-05-27`.
- For attendance and salary, updates must be idempotent and preserve manually corrected records unless explicitly forced.
- For company documents, existing uploaded records should be matched by hash and normalized title before upload.

## Proposed Work Packages

### WP1 - Company Document Vault Upsert
Build and run dry-run import for the 9 root company PDFs. This is low risk and directly improves ACV memory completeness.

### WP2 - Leave Balance Dry Run
Parse the 2026 leave workbook into employee/year/type balance rows. Validate against active employees and existing leave policies before any save.

### WP3 - Attendance Backfill Dry Run
Normalize monthly attendance `.xlsx` files into daily attendance rows. Detect duplicate/conflicting daily statuses across sources before saving.

### WP4 - Payroll/Payslip Conversion and Dry Run
Convert/read legacy `.xls` salary registers using a controlled converter or temporary parser, then produce salary transaction import preview. Do not import tax/PF/TDS computation fields as payroll logic.

## Local Assessment Artifacts

- `source-file-manifest.json`: full file inventory, categories, hashes, duplicate groups.
- `workbook-schema-summary.json`: workbook sheet/dimension/header previews for `.xlsx` sources.

## Current Recommendation

Start with WP1 and WP2. They are structurally clean, low risk, and directly support ACV Customer Zero. Keep payroll `.xls` and biometric `.xls` as dry-run-only until a safe conversion route is confirmed.

## WP1 Execution Update

Completed locally on 2026-05-27 using the ACV tenant stored as `ACV Solutions`.

- Dry-run result: 9 planned records, 8 creates, 1 existing GST record metadata/file update, 0 warnings.
- Execution result: 9 processed records, 8 created, 1 updated, 0 warnings.
- Idempotency check: 9 skipped by existing source hash, 0 creates, 0 updates, 0 warnings.
- File verification: all ACV company document records now point to existing local files under `/uploads/company-documents`.

Evidence:

- `company-documents-dry-run/README.md`
- `company-documents-execution/README.md`
- `company-documents-idempotency-check/README.md`

Importer:

- `backend/src/scripts/importAcvCompanyDocuments.ts`
- Dry-run command: `npm --prefix backend run acv:company-documents -- --company-name="ACV Solutions"`
- Execute command: `npm --prefix backend run acv:company-documents -- --company-name="ACV Solutions" --execute`
