# ACV pilot feature expansion

Status: local candidate in draft PR #89. Production is unchanged.

## Delivered candidate scope

- Employee attendance marking and retrospective correction approvals.
- Tenant-configurable CSV/XLS/XLSX biometric attendance import with preview, validation, conflict handling, transactional commit, and audit evidence.
- Employee self-service access to payslips, Form 16, employment documents, and exit documents.
- Employee-to-HR document request and fulfilment workflow.
- Active-employee information and document gap report.
- Employee Register defaults to active employees, with historical/exited employees one click away.
- Curated, non-AI HR reporting with filters, grouping, charts, tenant identity, exports, and sharing hand-offs.
- Invitation-first user administration; direct temporary-password creation is no longer the primary UI journey.
- External payroll-partner operations for monthly review, controlled approvals, partner and bank references, payslip milestones, previous-month comparison, and annual statement tracking. AuraHR does not calculate payroll or statutory liabilities.
- Contextual Manu presence across attendance, documents, payroll, employee, readiness, reporting, onboarding, leave, and performance screens. Manu is explicitly visual/contextual and does not imply invisible automation.

## Verification evidence — 10 August 2026

- Backend TypeScript build: pass.
- Frontend production build: pass.
- Backend automated suite: 25 suites, 193 tests passed.
- Chromium end-to-end suite: 61 passed, 2 pre-existing scenario skips, 0 failures.
- Tenant isolation: API and browser suites passed.
- Focused new workflow suites: attendance, document lifecycle, gap reporting, and payroll-partner operations passed.
- `git diff --check`: pass.
- Credential scan of this change set: no new credential-like values introduced.

## Release boundary

This is a pilot candidate, not a production authorization. Before any production release:

1. Apply and verify the three new database migrations in staging.
2. Complete role-based human acceptance in staging with synthetic or approved sample records.
3. Confirm the biometric column map against ACV's actual device export.
4. Confirm payroll workflow owners and partner hand-off fields with ACV Finance/HR.
5. Take a Cloud SQL backup and record rollback evidence.
6. Obtain a separate explicit production deployment approval.
