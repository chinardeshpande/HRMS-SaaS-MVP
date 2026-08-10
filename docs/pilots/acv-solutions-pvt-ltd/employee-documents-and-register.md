# Employee documents and register — pilot scope

This slice is designed for ACV pilot validation with synthetic or approved local test data only.

## Employee experience

- **My HR documents** presents employee-visible payslip attachments, Form 16 documents, and employment/exit documents in one protected self-service page.
- Employees can request a document for an in-employment or exit need, add the period/reason/deadline, and track HR status and response notes.
- A user account must be linked to its employee record. Document and payslip APIs enforce employee and tenant boundaries.

## HR experience

- **Document Library → Requests** provides the operational queue. HR can open the employee record, start, fulfil, or reject a request and leave a response note.
- **HR Analytics → Active employee gaps** lists active employees whose required documents or important master information are incomplete. Historical employees are intentionally excluded.
- The Employee Register opens on **Active employees** and provides a one-click **Historical / exited** tab. The existing total and status cards remain available for broader filtering.

## Pilot boundaries

- AuraHR stores and serves uploaded Form 16 files; it does not calculate or generate tax statements in this slice.
- Payslips shown to employees come from the existing compensation record and must be marked employee-visible. A missing attachment is shown as pending rather than fabricated.
- “Mark fulfilled” records HR's resolution and note. HR should upload the final document to the employee record first when the request requires a file.
- No production data migration, credential handling, deployment, or production mutation is part of this change.

## Verification

- Backend integration coverage verifies employee request creation, HR processing, and tenant isolation.
- Reporting coverage verifies active-only scope and gap-count consistency.
- Backend TypeScript and frontend production builds must pass before pilot handoff.
