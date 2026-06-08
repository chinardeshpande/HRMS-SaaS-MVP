# ACV Data Validation Report

Date: 2026-06-08
Branch: `codex/acv-validation-reports`
Evidence folder: `docs/acv-implementation/ACV-Testing-Evidence/import-validation-reports/2026-06-08/`

## Verdict

**Not ready due to blockers.**

AuroraHR contains substantial ACV Customer Zero data, but the current validation found storage and completeness blockers that must be closed before clean UAT sign-off. The largest blocker is document-file reachability: document metadata exists, but multiple uploaded employee and company files are not reachable from the configured storage path in this environment.

## Source

The validation was generated from the local AuroraHR database using:

```bash
NODE_ENV=test npm --prefix backend run acv:validation-reports -- --company-name="ACV Solutions" --output-dir="../docs/acv-implementation/ACV-Testing-Evidence/import-validation-reports/2026-06-08"
```

The script is read-only. It exports coverage, missing-item evidence, and aggregate readiness signals. It does not export salary amounts, source documents, payslip contents, PAN/Aadhaar values, emails, phone numbers, or employee names unless explicitly run with `--include-names`.

## Current Data Counts

| Area | Count |
| --- | ---: |
| Employees | 21 |
| Active employees | 6 |
| Inactive/exited employees | 15 |
| Departments | 6 |
| Designations | 15 |
| Employee documents | 31 |
| Company documents | 16 |
| Salary structures | 14 |
| Payslips | 104 |
| Payslip attachments | 4 |
| Attendance rows | 1745 |
| Leave balances | 30 |
| Leave policies | 5 |
| Leave requests | 1 |
| Audit logs | 2011 |
| HR Connect posts/comments | 0 / 0 |
| Chat conversations/messages | 8 / 0 |
| Saved reports | 0 |

## Readiness Scorecard

| Area | Status | Evidence |
| --- | --- | --- |
| Employee master | Red | 21/21 employees have missing/risky fields |
| Manager mapping | Amber | 16 without manager; 0 circular risks |
| Lifecycle history | Amber | 0 with no timeline; 3 inactive/exited without exit case |
| Employee documents | Red | 21/21 employees missing one or more key document classes |
| Company document vault | Red | 16 company documents; 4 expected categories not detected |
| Compensation and payslips | Red | 7 without active structures; 13 with unattached payslips |
| Attendance | Green | 1745 rows; date range 2024-01-01 to 2026-07-26 |
| Leave | Green | 30 balances; 5 active policies |
| Tenant setup | Red | 5/8 tenant setup items configured |
| HR Connect and communication trail | Amber | 0 posts; 0 comments; 0 chat messages |
| Audit logs | Amber | 2011 audit rows; 3/5 expected areas covered |
| Dashboard/reporting readiness | Green | 0 saved reports; 6/7 data readiness signals present |
| Zoho/SMTP integration | Grey | Explicitly out of scope for this branch |

## Main Findings

1. Attendance and leave are the strongest areas. Both have enough imported data for functional validation.
2. Employee master exists for 21 employees, but all employees have at least one missing/risky field. Active employee cleanup should be handled before historical cleanup.
3. Manager mapping has no circular hierarchy risk. The remaining gaps are mostly top-level or historical records without managers.
4. Employee document metadata exists, but document class coverage is incomplete and uploaded files are not reachable for multiple records.
5. Company vault metadata exists, but the underlying files are not reachable in the current environment and TAN, POSH, HR templates, and optional EPF/ESIC are not detected.
6. Compensation has useful coverage: 14 salary structures and 104 payslips. Gaps remain in active structure coverage and payslip attachment coverage.
7. Audit rows exist, but expected coverage is partial. Audit rows were found for document workflows, but not for every lifecycle area.
8. HR Connect has no posts/comments/messages in the validation data. Chat conversations exist, but no chat message content is exported.

## Data Safety Notes

- Salary amounts are intentionally excluded.
- Employee names are intentionally omitted unless the script is run with `--include-names`.
- File paths and upload filenames are intentionally not exported in missing-file evidence.
- Source spreadsheets, identity documents, payslip files, and original employee documents remain outside version control.

## Verification

| Check | Result |
| --- | --- |
| Validation generator | Passed |
| Backend TypeScript build | Passed |
| Requested `npm run test:qa` | Blocked: script is not present in this branch |
| Available `npm test` | Blocked: Jest found zero tests in this branch |

## Output Files

The evidence folder contains the requested ACV-prefixed machine-readable outputs:

- `acv-tenant-readiness.json`
- `acv-master-data-summary.json`
- `acv-employee-completeness.csv`
- `acv-manager-mapping.csv`
- `acv-document-coverage.csv`
- `acv-company-document-coverage.csv`
- `acv-compensation-coverage.csv`
- `acv-payslip-coverage.csv`
- `acv-attendance-coverage.csv`
- `acv-leave-coverage.csv`
- `acv-audit-coverage.json`
- `acv-hr-connect-coverage.json`
- `acv-dashboard-readiness.json`
- `acv-readiness-scorecard.json`

Legacy-compatible filenames are also retained for continuity with earlier reports.

## Next Recommended Sprint

Run a focused cleanup sprint before UAT:

1. Repair document storage paths or re-upload employee and company documents.
2. Complete organization profile fields: registered address, HR/company email, and registration/tax references.
3. Fix active employee master gaps first.
4. Attach payslip files where available, or explicitly mark records as payroll-output-only.
5. Upload or classify missing PAN/Aadhaar/address proof/employment/exit documents.
6. Add or classify TAN, POSH, HR templates, and optional EPF/ESIC company records.
7. Create/verify the three missing exit cases for inactive/exited employees.
