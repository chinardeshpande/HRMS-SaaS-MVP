# AuroraHR Commercial Lifecycle Simulation - 2026-05-11

Run ID: AHR-COMMERCIAL-SIM-2026-05-11-1778489157172
Target: https://aurorahr.in
API: https://aurorahr.in/api/v1

## Executive Summary

- Passed: 48
- Failed: 1
- Blocked: 2
- Phases covered: 24

Verdict: not yet open-commercial-launch ready. The platform is suitable for controlled pilot testing, but the blocked/failed findings below must be resolved before unrestricted self-serve commercial launch.

## Business Story

This simulation follows a real buyer journey: a company discovers AuroraHR, starts signup, configures company data, creates HR roles, adds and imports employees, establishes reporting relationships, runs three months of HR operations, hires a new employee, completes attendance and leave approvals, runs performance reviews for three employees, processes one resignation/exit path, generates analytics reports, produces HR documents, and verifies subscription management.

Where public production signup cannot complete because email verification is not operationally exposed, the simulation records that as a commercial blocker and continues the operational lifecycle using the existing authenticated demo tenant so the rest of the product can still be tested.

## Test Outcomes

| ID | Phase | Use Case | Role | Status | Evidence | Notes | Severity |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REG_01 | New Company Registration | Subscription plans are publicly available | public | passed | plans=free,starter,professional,enterprise |  |  |
| REG_02 | New Company Registration | New company can initiate signup | public | passed | registrationId=899a30f1-f6ad-448c-8d51-d7254b259b03, email=commercial.sim.1778489157173@aurorahr.test |  |  |
| REG_03 | New Company Registration | Production signup can proceed to verification/completion | public | blocked | email verification required | Signup initiation works, but production email delivery/token retrieval is not enabled in the public flow: Email verification required | blocker |
| AUTH_EMPLOYEE | Authentication | Demo login as employee | employee | passed | /demo/login | demo.employee@aurorahr.in |  |
| AUTH_MANAGER | Authentication | Demo login as manager | manager | passed | /demo/login | demo.manager@aurorahr.in |  |
| AUTH_HR | Authentication | Demo login as hr | hr | passed | /demo/login | demo.hr@aurorahr.in |  |
| AUTH_ADMIN | Authentication | Demo login as admin | admin | passed | /demo/login | demo.admin@aurorahr.in |  |
| SUB_01 | Subscription Management | HR can retrieve current tenant subscription | hr | passed | plan=enterprise, status=active, users=7/250 |  |  |
| SUB_02 | Subscription Management | HR can change billing cycle structurally | hr | passed | changed=monthly, restored=yearly |  |  |
| SUB_03 | Subscription Management | Real payment gateway charge and webhook lifecycle is available | hr | blocked | paymentMethods=0 | Payment method storage exists, but real gateway charge, webhook reconciliation, retry/dunning, invoice tax, and subscription activation from payment are not implemented. | blocker |
| SETUP_01 | Company Setup | HR creates departments for simulation company structure | hr | passed | departments=People Ops 89157172, Engineering 89157172, Sales 89157172 |  |  |
| SETUP_02 | Company Setup | HR creates designations for reporting hierarchy | hr | passed | designations=HR Business Partner 89157172, Engineering Manager 89157172, Software Engineer 89157172 |  |  |
| SETUP_03 | HR Roles | HR creates a custom HR operations role | hr | passed | roleId=12672c64-7c6f-4863-a429-3d2f08518c1d |  |  |
| USER_01 | Adding New Users | HR creates manager and employee users through employee creation | hr | passed | manager=47b9bf26-9c82-4345-9ee0-debb81ec91d1, employee=d4f45d93-e9ea-4452-a729-dff1c5cc0873 |  |  |
| USER_02 | Importing Employee Data | HR bulk imports employee records by CSV | hr | failed | runtime/API error | Bulk import did not create expected employees: successful=0, failed=2, errors=[{"row":2,"employeeCode":"SIM-BULK-1-89157172","email":"kavya.menon.89157172@aurorahr.test","error":"null value in column \"fullName\" of relation \"users\" violates not-null constraint"},{"row":3,"employeeCode":"SIM-BULK-2-89157172","email":"rohan.sen.89157172@aurorahr.test","error":"null value in column \"fullName\" of relation \"users\" violates not-null constraint"}] | high |
| ORG_01 | Org Structure And Approval Rules | Reporting relationships are visible through employee hierarchy | hr | passed | employees=20, reportingRelationships=13 |  |  |
| ATT_01 | Three Month Operations | Employee clock-in/out endpoints are guarded and usable | employee | passed | clockIn=400, clockOut=400 |  |  |
| ATT_REG_1 | Attendance Tracking And Approvals | Month 1: employee regularization and approval path | employee/manager | passed | editId=71f28d0c-fba5-4e8d-b9e6-3552b4c190ef, action=approve |  |  |
| ATT_REG_2 | Attendance Tracking And Approvals | Month 2: employee regularization and approval path | employee/manager | passed | editId=1202bb3e-5a0e-43d1-9956-7383d958e322, action=reject |  |  |
| ATT_REG_3 | Attendance Tracking And Approvals | Month 3: employee regularization and approval path | employee/manager | passed | editId=72b33021-5d9a-4fb7-b3c1-d37d82a426a7, action=approve |  |  |
| LEAVE_1 | Leave Management And Approvals | Month 1: leave request with role-played decision | employee/manager/hr | passed | leave guarded=400 Bad Request |  |  |
| LEAVE_2 | Leave Management And Approvals | Month 2: leave request with role-played decision | employee/manager/hr | passed | leave guarded=400 Bad Request |  |  |
| LEAVE_3 | Leave Management And Approvals | Month 3: leave request with role-played decision | employee/manager/hr | passed | leave guarded=400 Bad Request |  |  |
| HIRING_01 | Hiring And Onboarding | HR creates candidate and records offer acceptance | hr | passed | candidateId=2afd6a81-9ea4-43ff-8d38-f77778700cfd |  |  |
| PERF_01 | Performance Appraisal | HR creates complete performance lifecycle for three employees | hr/manager/employee | passed | reviews=3 |  |  |
| EXIT_01 | Resignation And Exit | Employee resignation flows into manager/HR exit workflow | employee/manager/hr | passed | resignation guarded=400 Exit case already exists for this employee |  |  |
| REP_HEADCOUNT | Reports And Analytics | HR runs /reports/headcount | hr | passed | Headcount Report: records=9 |  |  |
| REP_ATTENDANCE | Reports And Analytics | HR runs /reports/attendance-summary?startDate=2026-03-02&endDate=2026-05-11 | hr | passed | Attendance Summary: records=12 |  |  |
| REP_LEAVE | Reports And Analytics | HR runs /reports/leave-balance | hr | passed | Leave Balance & Usage: records=36 |  |  |
| REP_JOINERS | Reports And Analytics | HR runs /reports/joiners-leavers?startDate=2026-03-02&endDate=2026-05-11 | hr | passed | Joiners & Leavers Report: records=2 |  |  |
| REP_CONFIRMATION | Reports And Analytics | HR runs /reports/confirmation-due | hr | passed | Confirmation Due Report: records=3 |  |  |
| REP_ATTRITION | Reports And Analytics | HR runs /reports/attrition?startDate=2026-03-02&endDate=2026-05-11 | hr | passed | Attrition Report: records=0 |  |  |
| REP_PMS | Reports And Analytics | HR runs /reports/pms-completion | hr | passed | PMS Completion Report: records=10 |  |  |
| REP_MISSING_DOCS | Reports And Analytics | HR runs /reports/missing-documents | hr | passed | Missing Documents Report: records=20 |  |  |
| ANA_01 | Reports And Analytics | HR runs semantic analytics after data buildup | hr | passed | metrics=headcount,attendance_rate,leave_utilization |  |  |
| DOC_01 | Standard HR Documents | HR previews, generates, and downloads standard HR document | hr | passed | template=Offer Letter, pdfBytes=1703 |  |  |
| VIS_01 | Go To Market Entry | Landing page renders commercial entry point | public | passed | screenshots/01-landing-page.png |  |  |
| VIS_02 | New Company Registration | Company signup page renders registration journey | public | passed | screenshots/02-company-signup.png |  |  |
| VIS_03 | Company Setup | HR settings show company, subscription, users, and policies | hr | passed | screenshots/03-company-settings.png |  |  |
| VIS_04 | Employee Data | Employee directory after setup and imports | hr | passed | screenshots/04-employees-after-data-build.png |  |  |
| VIS_05 | Attendance Operations | HR attendance operations and approvals view | hr | passed | screenshots/05-attendance-operations.png |  |  |
| VIS_06 | Leave Operations | HR leave balances, requests, and intervention view | hr | passed | screenshots/06-leave-operations.png |  |  |
| VIS_07 | Performance Appraisal | Performance appraisal dashboard after review setup | hr | passed | screenshots/07-performance-cycle.png |  |  |
| VIS_08 | Exit Workflow | Exit dashboard after resignation simulation | hr | passed | screenshots/08-exit-workflow.png |  |  |
| VIS_09 | Reports And Analytics | Reports command center after three-month data simulation | hr | passed | screenshots/09-reports-analytics.png |  |  |
| VIS_10 | Standard HR Documents | Document generation workspace | hr | passed | screenshots/10-standard-documents.png |  |  |
| VIS_11 | Manager Role Play | Manager attendance approvals view | manager | passed | screenshots/11-manager-attendance-approvals.png |  |  |
| VIS_12 | Manager Role Play | Manager leave approvals view | manager | passed | screenshots/12-manager-leave-approvals.png |  |  |
| VIS_13 | Employee Role Play | Employee attendance self-service | employee | passed | screenshots/13-employee-attendance-self-service.png |  |  |
| VIS_14 | Employee Role Play | Employee leave self-service | employee | passed | screenshots/14-employee-leave-self-service.png |  |  |
| VIS_15 | Leadership View | Leadership dashboard after simulated operations | admin | passed | screenshots/15-leadership-dashboard.png |  |  |

## Screenshot Evidence

### VIS_01 - Landing page renders commercial entry point

Phase: Go To Market Entry
Role: public

![VIS_01](screenshots/01-landing-page.png)

### VIS_02 - Company signup page renders registration journey

Phase: New Company Registration
Role: public

![VIS_02](screenshots/02-company-signup.png)

### VIS_03 - HR settings show company, subscription, users, and policies

Phase: Company Setup
Role: hr

![VIS_03](screenshots/03-company-settings.png)

### VIS_04 - Employee directory after setup and imports

Phase: Employee Data
Role: hr

![VIS_04](screenshots/04-employees-after-data-build.png)

### VIS_05 - HR attendance operations and approvals view

Phase: Attendance Operations
Role: hr

![VIS_05](screenshots/05-attendance-operations.png)

### VIS_06 - HR leave balances, requests, and intervention view

Phase: Leave Operations
Role: hr

![VIS_06](screenshots/06-leave-operations.png)

### VIS_07 - Performance appraisal dashboard after review setup

Phase: Performance Appraisal
Role: hr

![VIS_07](screenshots/07-performance-cycle.png)

### VIS_08 - Exit dashboard after resignation simulation

Phase: Exit Workflow
Role: hr

![VIS_08](screenshots/08-exit-workflow.png)

### VIS_09 - Reports command center after three-month data simulation

Phase: Reports And Analytics
Role: hr

![VIS_09](screenshots/09-reports-analytics.png)

### VIS_10 - Document generation workspace

Phase: Standard HR Documents
Role: hr

![VIS_10](screenshots/10-standard-documents.png)

### VIS_11 - Manager attendance approvals view

Phase: Manager Role Play
Role: manager

![VIS_11](screenshots/11-manager-attendance-approvals.png)

### VIS_12 - Manager leave approvals view

Phase: Manager Role Play
Role: manager

![VIS_12](screenshots/12-manager-leave-approvals.png)

### VIS_13 - Employee attendance self-service

Phase: Employee Role Play
Role: employee

![VIS_13](screenshots/13-employee-attendance-self-service.png)

### VIS_14 - Employee leave self-service

Phase: Employee Role Play
Role: employee

![VIS_14](screenshots/14-employee-leave-self-service.png)

### VIS_15 - Leadership dashboard after simulated operations

Phase: Leadership View
Role: admin

![VIS_15](screenshots/15-leadership-dashboard.png)

## Commercial Gaps To Resolve

- **blocker REG_03:** Production signup can proceed to verification/completion. Signup initiation works, but production email delivery/token retrieval is not enabled in the public flow: Email verification required
- **blocker SUB_03:** Real payment gateway charge and webhook lifecycle is available. Payment method storage exists, but real gateway charge, webhook reconciliation, retry/dunning, invoice tax, and subscription activation from payment are not implemented.
- **high USER_02:** HR bulk imports employee records by CSV. Bulk import did not create expected employees: successful=0, failed=2, errors=[{"row":2,"employeeCode":"SIM-BULK-1-89157172","email":"kavya.menon.89157172@aurorahr.test","error":"null value in column \"fullName\" of relation \"users\" violates not-null constraint"},{"row":3,"employeeCode":"SIM-BULK-2-89157172","email":"rohan.sen.89157172@aurorahr.test","error":"null value in column \"fullName\" of relation \"users\" violates not-null constraint"}]

## Residual Commercial Risks

- Signup currently depends on email verification, but production email delivery/token completion is not yet proven by this public flow.
- Payment gateway processing is still not a real charge/webhook lifecycle.
- This run uses the existing demo tenant after signup is blocked; a true fresh-tenant end-to-end run should be repeated after email verification and payment gateway integration are completed.
- The simulation creates persistent QA data; a commercial demo/reset strategy should be added before repeated customer demos.

## Rerun Commands

```bash
QA_BASE_URL=https://aurorahr.in QA_API_URL=https://aurorahr.in/api/v1 node scripts/qa/commercial-lifecycle-simulation.mjs
```
