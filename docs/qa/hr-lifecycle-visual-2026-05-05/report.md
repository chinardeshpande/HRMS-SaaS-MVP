# HR Lifecycle Visual QA Report

Run date: 2026-05-05
Run id: HRL-2026-05-05-1777972407031
Application: https://aurorahr.in
API: https://aurorahr.in/api/v1

## Executive summary

Executed 30 checks: 30 passed, 0 failed.

This test covers Onboarding, Probation, Performance Management, and Exit workflows across HR, manager, employee, and admin roles.

## Test outcomes

| ID | Area | Role | Status | Evidence | Notes |
| --- | --- | --- | --- | --- | --- |
| AUTH_EMPLOYEE | Demo login for employee | employee | PASS | API /demo/login | demo.employee@aurorahr.in |
| AUTH_MANAGER | Demo login for manager | manager | PASS | API /demo/login | demo.manager@aurorahr.in |
| AUTH_HR | Demo login for hr | hr | PASS | API /demo/login | demo.hr@aurorahr.in |
| AUTH_ADMIN | Demo login for admin | admin | PASS | API /demo/login | demo.admin@aurorahr.in |
| ONB_API_01 | HR retrieves candidate pipeline and candidate list | hr | PASS | pipelineKeys=13, candidates=4 |  |
| ONB_API_02 | HR creates a realistic demo candidate | hr | PASS | candidateId=ec14be22-e86f-47a3-ba37-d8de49272ac8 |  |
| ONB_API_03 | HR sends and records offer acceptance for candidate | hr | PASS | candidateId=ec14be22-e86f-47a3-ba37-d8de49272ac8 |  |
| ONB_API_04 | HR retrieves probation cases and statistics | hr | PASS | probationCases=2, statKeys=6 |  |
| PERF_API_01 | HR retrieves performance reviews | hr | PASS | reviews=3 |  |
| PERF_API_02 | Manager retrieves scoped performance review queue | manager | PASS | managerReviews=3 |  |
| PERF_API_03 | Employee performance self-service endpoint availability | employee | PASS | myReviews=3 |  |
| PERF_API_04 | HR creates review, goal, and manager approval path | hr | PASS | reviewId=6a2023f7-a3f1-4860-a453-1c6f7663d42b, goalId=95601d39-5de8-4435-ad1b-6ab2ce332d6a |  |
| EXIT_API_01 | HR retrieves exit statistics and cases | hr | PASS | exitCases=1, statKeys=6 |  |
| EXIT_API_02 | Employee exit self-service endpoint availability | employee | PASS | no active resignation |  |
| EXIT_API_03 | Manager retrieves exit management view | manager | PASS | managerExitCases=1 |  |
| VIS_ONB_HR_01 | HR onboarding candidate pipeline | hr | PASS | screenshots/01-hr-onboarding-pipeline.png |  |
| VIS_ONB_HR_02 | HR probation tracker and at-risk management view | hr | PASS | screenshots/02-hr-probation-tracker.png |  |
| VIS_ONB_HR_03 | HR candidate detail workflow view | hr | PASS | screenshots/03-hr-candidate-detail.png |  |
| VIS_PERF_HR_01 | HR performance management dashboard | hr | PASS | screenshots/04-hr-performance-dashboard.png |  |
| VIS_PERF_HR_02 | HR performance review detail | hr | PASS | screenshots/05-hr-performance-review-detail.png |  |
| VIS_EXIT_HR_01 | HR exit management dashboard | hr | PASS | screenshots/06-hr-exit-dashboard.png |  |
| VIS_EXIT_HR_02 | HR exit pending approvals view | hr | PASS | screenshots/07-hr-exit-pending-approvals.png |  |
| VIS_EXIT_HR_03 | HR exit case detail workflow view | hr | PASS | screenshots/08-hr-exit-case-detail.png |  |
| VIS_PERF_MGR_01 | Manager performance queue | manager | PASS | screenshots/09-manager-performance-dashboard.png |  |
| VIS_EXIT_MGR_01 | Manager exit approvals and management view | manager | PASS | screenshots/10-manager-exit-dashboard.png |  |
| VIS_PERF_EMP_01 | Employee performance self-service view | employee | PASS | screenshots/11-employee-performance-self-service.png |  |
| VIS_EXIT_EMP_01 | Employee exit self-service view | employee | PASS | screenshots/12-employee-exit-self-service.png |  |
| VIS_ONB_ADMIN_01 | Admin onboarding leadership view | admin | PASS | screenshots/13-admin-onboarding-leadership-view.png |  |
| VIS_PERF_ADMIN_01 | Admin performance leadership view | admin | PASS | screenshots/14-admin-performance-leadership-view.png |  |
| VIS_EXIT_ADMIN_01 | Admin exit leadership view | admin | PASS | screenshots/15-admin-exit-leadership-view.png |  |

## Screenshot evidence

### VIS_ONB_HR_01 - HR onboarding candidate pipeline

Role: hr

![VIS_ONB_HR_01](screenshots/01-hr-onboarding-pipeline.png)

### VIS_ONB_HR_02 - HR probation tracker and at-risk management view

Role: hr

![VIS_ONB_HR_02](screenshots/02-hr-probation-tracker.png)

### VIS_ONB_HR_03 - HR candidate detail workflow view

Role: hr

![VIS_ONB_HR_03](screenshots/03-hr-candidate-detail.png)

### VIS_PERF_HR_01 - HR performance management dashboard

Role: hr

![VIS_PERF_HR_01](screenshots/04-hr-performance-dashboard.png)

### VIS_PERF_HR_02 - HR performance review detail

Role: hr

![VIS_PERF_HR_02](screenshots/05-hr-performance-review-detail.png)

### VIS_EXIT_HR_01 - HR exit management dashboard

Role: hr

![VIS_EXIT_HR_01](screenshots/06-hr-exit-dashboard.png)

### VIS_EXIT_HR_02 - HR exit pending approvals view

Role: hr

![VIS_EXIT_HR_02](screenshots/07-hr-exit-pending-approvals.png)

### VIS_EXIT_HR_03 - HR exit case detail workflow view

Role: hr

![VIS_EXIT_HR_03](screenshots/08-hr-exit-case-detail.png)

### VIS_PERF_MGR_01 - Manager performance queue

Role: manager

![VIS_PERF_MGR_01](screenshots/09-manager-performance-dashboard.png)

### VIS_EXIT_MGR_01 - Manager exit approvals and management view

Role: manager

![VIS_EXIT_MGR_01](screenshots/10-manager-exit-dashboard.png)

### VIS_PERF_EMP_01 - Employee performance self-service view

Role: employee

![VIS_PERF_EMP_01](screenshots/11-employee-performance-self-service.png)

### VIS_EXIT_EMP_01 - Employee exit self-service view

Role: employee

![VIS_EXIT_EMP_01](screenshots/12-employee-exit-self-service.png)

### VIS_ONB_ADMIN_01 - Admin onboarding leadership view

Role: admin

![VIS_ONB_ADMIN_01](screenshots/13-admin-onboarding-leadership-view.png)

### VIS_PERF_ADMIN_01 - Admin performance leadership view

Role: admin

![VIS_PERF_ADMIN_01](screenshots/14-admin-performance-leadership-view.png)

### VIS_EXIT_ADMIN_01 - Admin exit leadership view

Role: admin

![VIS_EXIT_ADMIN_01](screenshots/15-admin-exit-leadership-view.png)


## Product gaps detected and addressed in this PR branch

- Visual checks now assert critical employee self-service controls. A screenshot alone is not counted as a passed workflow.
- Employee Performance page required manager/HR review-list access; this branch adds `/performance/my-reviews` and uses it for employees.
- Manager Performance review list was tenant-wide; this branch scopes manager review lists to `reviewerId`.
- Performance export was a placeholder; this branch implements CSV export.
- Employee Exit page required manager/HR case-list access; this branch adds `/exit/my-case` and an employee resignation self-service view.
- Onboarding and Exit tables used legacy `departmentName`/`designationName` only; this branch supports current `name` fields as well.

