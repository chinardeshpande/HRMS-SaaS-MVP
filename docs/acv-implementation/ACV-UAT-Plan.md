# ACV UAT Plan

## Objective

Validate ACV Solutions as a real AuroraHR tenant through role-based, production-grade UAT covering setup, employee lifecycle, documents, compensation, communications, dashboards, auditability, and responsive behavior.

## Test Personas

### Director/Admin

Primary responsibilities:

- tenant setup
- organization settings
- roles and permissions
- employee master oversight
- reports and dashboards
- subscription/settings oversight

### HR Manager

Primary responsibilities:

- employee data management
- documents
- lifecycle actions
- compensation history
- HR Connect operations
- implementation exception handling

### Manager

Primary responsibilities:

- team visibility
- approvals
- attendance/leave review
- team lifecycle inputs
- limited employee data access

### Employee

Primary responsibilities:

- self-service profile
- documents
- payslips
- leave/attendance
- HR Connect
- lifecycle requests where applicable

## UAT Tracks

### Track 1: Tenant Setup

- ACV tenant opens correctly.
- ACV organization details are visible.
- ACV branding appears where expected.
- Non-tenant system pages retain AuroraHR identity where appropriate.
- Admin can update organization settings.

### Track 2: Employee Master

- HR can create, edit, view, and deactivate employee records.
- Department/designation/reporting manager data is synchronized.
- Employee list reflects designation and department correctly.
- Employee profile tabs show current and historical data.
- Role restrictions prevent unauthorized access.

### Track 3: Master Data and Roles

- Departments and designations can be maintained.
- Roles and permissions match personas.
- Employee user cannot see admin-only features.
- Manager can see appropriate team views.
- HR Manager can manage global HR operations.

### Track 4: Documents

- HR uploads employee document.
- Employee views own document.
- Employee cannot access another employee's private document.
- HR verifies and archives employee documents.
- Employee document download creates an audit log.
- HR generates an HR document from a template.
- Company document vault supports company-level document storage.
- HR uploads a company document with category, expiry, issuing authority, and notes.
- HR verifies a company document.
- HR downloads a company document and audit log records the access.
- HR archives a company document.
- Manager/Employee cannot access company document vault APIs.
- Download/share/delete actions are auditable.

### Track 5: Compensation

- HR views salary structure.
- HR imports salary transaction history.
- HR uploads payslip.
- Employee previews and downloads own payslip.
- Missing payslip coverage is reportable.
- Manual compensation edits are auditable.
- No payroll computation or statutory filing behavior is present.

### Track 6: HR Connect and Communication

- HR posts announcement.
- Employee comments/replies where allowed.
- HR Connect comment flows do not blank-screen.
- System-generated outbound communication events are logged once implemented.
- Tenant SMTP send test succeeds once implemented.

### Track 7: Lifecycle

- Onboarding case can be managed.
- Probation due items are visible.
- Leave and attendance approvals follow reporting relationships.
- Performance lifecycle can be completed for selected employees.
- Exit workflow can be initiated and completed where role allows.

### Track 8: Reports and Dashboards

- Admin sees organization-level readiness dashboard.
- HR sees employee/document/compensation coverage.
- Manager sees team workload.
- Employee sees self-service dashboard.
- Reports respect tenant and role boundaries.

### Track 9: Responsive UI

Required devices/viewports:

- iPhone width
- small Android width
- tablet width
- laptop width
- desktop width

Coverage:

- landing page
- login
- dashboard
- employee detail
- compensation tab
- documents
- HR Connect
- reports
- settings

## Evidence Requirements

For each UAT run, capture:

- test date
- environment
- tenant
- persona
- browser/device
- steps
- expected result
- actual result
- screenshot path
- pass/fail
- defect link or gap ID

Evidence folder:

`docs/acv-implementation/ACV-Testing-Evidence/`

## Release Gate

ACV implementation should not be considered ready until:

- P1 gaps are closed or explicitly accepted.
- No tenant-isolation issue is open.
- No employee data-loss issue is open.
- No compensation data corruption issue is open.
- No document access leak is open.
- Role-based access tests pass.
- Production smoke test passes.
