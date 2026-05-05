# QA Evidence Audit - 2026-05-05

## Why this audit exists

The employee Exit self-service report said the employee should click **Submit Resignation**, but the linked screenshot did not show that action. The user's manual live test confirmed the same issue.

That is a real QA evidence failure. It means the earlier report mixed two different facts:

- **Live production baseline:** employee Exit and employee Performance self-service were missing key routes and UI behavior.
- **PR branch remediation:** code was added to implement those routes and employee UI paths.

The screenshot proves the live production gap. It does **not** prove the branch fix until the branch is deployed and the visual test is re-run against the deployed build.

## Methodology issue found

The lifecycle visual runner treated some screenshots as successful checks merely because the page loaded and a screenshot was captured. That is too weak for production-readiness QA.

For workflow QA, a page-load screenshot is only evidence that a route rendered. It must not be treated as proof that the workflow exists or works unless the test also asserts the critical controls and outcomes.

Examples:

- Employee Exit must assert **Submit Resignation** or **My Resignation Status** is visible.
- Employee Performance must assert employee self-service content and must not show HR-only controls such as **Create Review** or **View Employees**.
- Attendance reporting must assert the reporting APIs return successfully and the Reports UI is present after deployment.
- Bulk attendance update must assert persisted backend results, not only that a modal opened.

## Module-by-module answer

### Attendance and Leave

Core employee, manager, and HR leave/attendance workflows were API-tested and visually exercised. The first production run found a real reporting query failure in department attendance reporting. The PR branch includes fixes for the reporting query, mass update persistence, CSV sync persistence, and a Reports tab.

Current assessment: **partially proven on production; branch fixes build successfully but need post-deploy strict visual re-test.**

### Onboarding and Probation

Candidate pipeline, candidate creation, offer progression, candidate detail, probation statistics, and probation tracker were exercised successfully. This area has the strongest evidence among the lifecycle modules, although future runs should still add stricter UI assertions for key controls and record state transitions.

Current assessment: **mostly proven for the tested HR-facing paths; needs deeper assertions before calling it fully production-ready.**

### Performance Management

HR and manager paths were exercised, and the branch tightened manager review scoping. However, live production lacked the employee self-service endpoint `/performance/my-reviews`, and the screenshot-based visual pass was too weak.

Current assessment: **not production-proven for employee self-service. Branch fix exists and build passed; post-deploy strict visual re-test is required.**

### Exit Management

HR and manager exit management views were exercised. Employee self-service was not production-proven. Live production lacked `/exit/my-case`, and the employee screenshot did not show **Submit Resignation**.

Current assessment: **not production-proven for employee resignation self-service. Branch fix exists and build passed; post-deploy strict visual re-test is required.**

## Direct answer

No, we should not claim that all functionality currently exists and works properly on production.

The correct status is:

- Several HR and manager workflows are working and have evidence.
- Some employee self-service workflows were missing in live production.
- The PR branch adds the missing Performance and Exit employee paths.
- The previous visual reports over-claimed proof for some screens because screenshots were treated as workflow success.
- The QA runners now need strict assertions and a post-deploy re-run before we declare these modules production-ready.

## Correct next gate

1. Merge and deploy the current PR branch.
2. Re-run strict visual QA against production or staging.
3. Require every scenario to assert critical UI controls and backend outcomes.
4. Regenerate reports only after the strict run, clearly labeling them as post-deploy evidence.
5. Only then mark Attendance/Leave, Onboarding, Performance, and Exit as production-ready.
