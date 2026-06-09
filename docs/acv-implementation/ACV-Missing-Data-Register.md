# ACV Missing Data Register

Date: 2026-06-08
Evidence source: `docs/acv-implementation/ACV-Testing-Evidence/import-validation-reports/2026-06-08/acv-missing-data-register.csv`

## Summary

| Severity | Count |
| --- | ---: |
| Blocker | 47 |
| Important | 167 |
| Cleanup | 156 |
| Optional | 1 |

Final verdict: **Not ready due to blockers**.

## Missing Items By Area

| Area | Missing item count |
| --- | ---: |
| Audit logs | 2 |
| Company documents | 20 |
| Compensation | 101 |
| Employee documents | 150 |
| Employee master | 91 |
| Lifecycle history | 3 |
| Manager mapping | 1 |
| Tenant setup | 3 |

## Blocker Pattern

All current Blocker items are document storage reachability issues:

| Area | Blocker pattern | Required action |
| --- | --- | --- |
| Employee documents | Document record exists, but the stored file is not reachable. | Repair upload storage path or re-upload the document. |
| Company documents | Company document record exists, but the stored file is not reachable. | Repair upload storage path or re-upload the company document. |

The generated register intentionally does not export upload paths or person-identifying filenames.

## Highest-Volume Gaps

| Gap | Count | Severity Pattern | Action |
| --- | ---: | --- | --- |
| Payslip attachment missing | 100 | Important | Attach payslip PDFs/images or mark payroll-output-only records. |
| Employee document file missing from configured storage | 31 | Blocker | Repair storage path or re-upload documents. |
| Company document file missing from configured storage | 16 | Blocker | Repair storage path or re-upload documents. |
| Employee address missing | 21 | Cleanup | Update employee profile address fields. |
| Employee work location missing | 21 | Cleanup | Set a default/verified work location. |
| Aadhaar missing/not detected | 21 | Important | Upload or correctly classify Aadhaar documents. |
| Address proof missing/not detected | 21 | Cleanup | Upload or classify address proof. |
| Education documents missing/not detected | 21 | Cleanup | Upload available education documents or mark not available. |
| PAN missing/not detected | 18 | Important | Upload or correctly classify PAN documents. |
| Salary/revision letters missing/not detected | 18 | Cleanup | Upload salary revision/increment letters where available. |
| DOB missing | 16 | Cleanup | Update DOB from employee master documents. |
| Phone missing | 16 | Cleanup | Update employee phone numbers. |
| Gender missing | 15 | Cleanup | Update gender where known so gender-specific leave logic remains reliable. |
| Exit documents missing | 13 | Important | Upload FNF/experience/relieving/exit records where available. |
| Offer/appointment letter missing | 7 | Important | Upload appointment or offer letters. |
| Missing exit case | 3 | Important | Create/verify exit cases for inactive/exited records. |

## Company-Level Gaps

| Item | Severity | Action |
| --- | --- | --- |
| TAN not detected | Important | Upload TAN or classify existing record correctly. |
| POSH not detected | Important | Upload POSH policy/committee record. |
| HR templates not detected | Cleanup | Upload active HR document templates/letter formats. |
| EPF/ESIC not detected | Optional | Upload if applicable to ACV. |

## Tenant Setup Gaps

| Item | Action |
| --- | --- |
| Registered address | Complete organization settings. |
| HR/company email | Complete organization settings before Zoho SMTP sprint. |
| PAN/TAN/GST/CIN references | Add verified references to organization settings. |

## Detailed Register

Use the generated machine-readable register for employee-code-level corrections:

- CSV: `docs/acv-implementation/ACV-Testing-Evidence/import-validation-reports/2026-06-08/acv-missing-data-register.csv`
- JSON: `docs/acv-implementation/ACV-Testing-Evidence/import-validation-reports/2026-06-08/acv-missing-data-register.json`

## Operating Rule

Close Blocker items first, then active employee Important gaps, then historical employee cleanup. Historical records may remain incomplete if ACV confirms that evidence is unavailable, but they should be explicitly marked as historical/incomplete rather than silently ignored.
