# ACV Implementation Readiness Assessment

Date: 2026-05-26

Branch: `codex/acv-tenant-branding-settings`

## Current Verdict

ACV Customer Zero implementation has moved beyond planning and now has a usable implementation-grade foundation for tenant memory, document governance, tenant branding, generated HR document preview, and compensation tracking.

It is not yet complete for full ACV daily operations. The remaining work is mainly tenant-aware email/Zoho Mail, migration execution evidence, broader audit coverage, and operational dashboards.

## Completed Since Control Room Setup

### Memory Foundation

- Company HR/compliance document vault exists with tenant isolation, categories, metadata, verification status, expiry fields, and audit coverage.
- Employee document vault exists with tenant isolation, HR/admin management, employee self-read/download for own documents, metadata, verification status, expiry fields, and audit coverage.
- Missing Documents reporting now uses durable employee document storage.
- Memory Readiness reporting exists and combines employee master, employee documents, company documents, salary structures, and payslip presence.

### Tenant Branding

- Authenticated app shell keeps the AuroraHR product logo untouched.
- Tenant branding appears in the title bar near the user profile area.
- Tenant logo is visually separated from tenant name for cleaner display.
- Generated HR documents now resolve tenant logo, colors, company name, letterhead, and footer.

### Document Preview and Document UX

- Generated HR document flow now shows a tenant-branded, view-only preview modal before save/download.
- Uploaded/generated/payslip/library documents now support modal preview where practical.
- Company document vault and generated document history support list/card views.
- Protected documents are loaded through authenticated blob fetches where required.

### Compensation Tracking

- Compensation ledger, payslip library, salary transaction history, payslip attachments, share logs, guided bulk import, and payroll-output tracking are present.
- The module remains correctly scoped as compensation memory and payroll-output tracking, not statutory payroll processing.

## Verification Performed

| Check | Result | Notes |
| --- | --- | --- |
| Backend production build | Pass | `npm run build` completed successfully in `backend`. |
| Frontend production build | Pass | `npm run build` completed successfully in `frontend-web`. |
| Backend automated tests | No executable tests found | Jest is configured, but no backend test files currently match the configured patterns. |
| Frontend automated tests | No executable tests found | Jest is configured, but no frontend test files currently match the configured patterns. |
| Tenant SMTP implementation check | Pending implementation | `backend/src/services/emailService.ts` still uses global SMTP config. |
| ACV docs/gap register accuracy | Updated | Gap register now reflects completed app-shell branding, generated document branding, and document preview modals. |

## Remaining Production Gaps

### P1

- ACV Zoho Mail SMTP credential configuration and live send verification.
- Branded email templates and sender identity review.
- Broader audit coverage for employee master, compensation, settings, roles, imports, and email actions.
- Real ACV migration execution evidence and validation reports.

### P2

- Employee/month compensation coverage matrix.
- Missing payslip report.
- Tenant readiness dashboard.
- Lifecycle health dashboard.
- HR operations dashboard.
- HR Connect linkage for outbound communication events.

### Future

- Zoho Cliq operational alerts.
- Zoho WorkDrive sync.
- Zoho Writer template integration.
- Inbound mailbox aggregation.

## Explicit Scope Boundaries

- No payroll computation.
- No statutory PF/ESI/TDS/tax computation.
- No recruitment/ATS expansion.
- No ACV-specific hardcoding.
- No broad enterprise DMS expansion outside HR/company compliance memory.

## Current Branch

`codex/acv-tenant-smtp-zoho-mail`

Objective:

- Resolve tenant SMTP settings at email-send time.
- Use platform SMTP only as fallback.
- Add safe failure handling.
- Log outbound HR email events.
- Keep inbound sync, WorkDrive, Cliq, and Writer out of scope.

Current status:

- Backend email service resolves tenant SMTP first, then platform SMTP.
- Invitations, password resets, and offer letters pass tenant context into the email service.
- Outbound email events are recorded in `outbound_email_logs`.
- Backend build passes.
- Pending: ACV Zoho SMTP settings, live send test, and browser/UAT pass.

## Deployment Recommendation

Do not deploy this branch to production solely on build success. Before production deployment, run one browser-level smoke pass over:

- ACV login
- Employee details
- Company document vault
- Employee document tab
- Generated HR document preview/save
- Payslip library
- Salary transaction history
- Reports & Analytics memory readiness report
