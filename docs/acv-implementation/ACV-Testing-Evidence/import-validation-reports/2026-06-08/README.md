# ACV Validation Reports

Generated: 2026-06-08T10:24:20.119Z

Tenant: ACV Solutions (f5ed3bd0-d89f-4762-b212-c3b41d358fe8)

Final verdict: Not ready due to blockers

## How To Regenerate

```bash
npm --prefix backend run acv:validation-reports -- --company-name="ACV Solutions" --output-dir="../docs/acv-implementation/ACV-Testing-Evidence/import-validation-reports/2026-06-08"
```

## Output Files

- `acv-validation-report.json`: consolidated machine-readable report.
- `acv-readiness-scorecard.json` / `.csv`: area-level readiness scorecard.
- `acv-missing-data-register.json` / `.csv`: missing data and document register.
- `acv-tenant-readiness.json`
- `acv-master-data-summary.json`
- `acv-audit-coverage.json`
- `acv-hr-connect-coverage.json`
- `acv-dashboard-readiness.json`
- `acv-employee-completeness.csv`
- `acv-manager-mapping.csv`
- `acv-document-coverage.csv`
- `acv-company-document-coverage.csv`
- `acv-compensation-coverage.csv`
- `acv-payslip-coverage.csv`
- `acv-attendance-coverage.csv`
- `acv-leave-coverage.csv`
- `employee-master-completeness.csv`
- `manager-mapping-coverage.csv`
- `lifecycle-history-coverage.csv`
- `employee-document-coverage.csv`
- `company-document-vault-coverage.csv`
- `compensation-payslip-coverage.csv`
- `attendance-coverage.csv`
- `leave-coverage.csv`
- `tenant-setup-completeness.csv`

## Data Safety

Salary amounts are not exported in this evidence pack. The report focuses on coverage, readiness, missing items, and record counts.
