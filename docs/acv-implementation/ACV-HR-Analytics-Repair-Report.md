# ACV HR Analytics Repair Report

Date: 2026-06-09  
Branch: `codex/hr-analytics-repair`  
Scope: backend/API/data/reporting correctness, targeted frontend report-column contract repair, synthetic QA coverage, and documentation. Browser E2E remains owned by Claude.

## Executive Verdict

**Verdict: Green for backend HR Analytics/reporting sanity; Amber for browser/reporting UX readiness.**

The analytics/reporting backend now enforces tenant scoping, role scoping, manager team scoping, and saved-report guardrails using synthetic QA data. Backend build and full backend QA are green. Frontend production build is also green after linking existing local frontend dependencies into the isolated worktree.

Browser E2E and visual QA are still required before calling the HR Analytics module fully production-polished.

## Defects Found

| Area | Defect | Risk |
| --- | --- | --- |
| Manager report scoping | Reporting controller passed only `tenantId` to the reporting service, so manager-accessible reports could return tenant-wide data. | Managers could see company-wide analytics instead of team-appropriate analytics. |
| Saved report execution | Managers could execute saved report types outside their allowed reporting surface if they had a saved-report ID. | Route-level permissions could be bypassed through saved reports. |
| Saved report filters | Saved report execution assumed `filterConfig` existed. | Older/incomplete saved reports could crash execution. |
| Frontend leave columns | HR Analytics leave perspective requested `totalAllocated`, while backend returns `totalEntitlement`. | Column selector/table defaults could appear broken or incomplete. |
| Empty data resilience | Reporting needed explicit coverage for empty attendance windows and incomplete memory-readiness data. | Reports could regress into crashes or misleading failures. |

## Fixes Implemented

| Area | Fix |
| --- | --- |
| Reporting access context | Added `ReportAccessContext` with `tenantId`, `userRole`, and optional `employeeId`. |
| Manager scoping | Added report-service scoping so manager-accessible reports are limited to the manager employee record plus direct reports. |
| Report type allow-list | Added role-specific report type allow-lists. System admin/HR admin can access all report types; managers can access attendance, leave balance, headcount, confirmation due, and review completion; employees cannot access company reporting endpoints. |
| Saved report list/execute | Added access-aware saved-report listing and execution. Forbidden saved report types now return 403. Missing filters are handled safely. |
| Frontend column contract | Updated leave report suggested columns from `totalAllocated` to `totalEntitlement`. |
| Synthetic QA | Added HR Analytics/reporting tests for tenant scoping, role scoping, manager scoping, core metrics, empty states, saved-report guardrails, and semantic analytics. |

## Tests Added

File: `backend/tests/integration/12-reporting-analytics.test.ts`

Coverage:

- Employee denial for company reporting endpoints.
- Manager denial for HR-only reports.
- ACV vs second-tenant headcount isolation.
- Manager headcount limited to manager plus direct reports.
- Manager attendance summary limited to manager plus direct reports.
- Gender-restricted leave eligibility in leave balance reports.
- Empty attendance date range returns an empty result without crashing.
- Memory readiness report handles incomplete data without crashing.
- Manager cannot create HR-only saved reports.
- Manager can create and execute allowed saved headcount report without tenant leakage.
- Semantic analytics headcount query returns tenant-scoped synthetic data.

## Validation Results

| Command | Result |
| --- | --- |
| `npm --prefix backend run build` | Passed |
| `npm --prefix backend run test:qa -- --runTestsByPath tests/integration/12-reporting-analytics.test.ts` | Passed: 1 suite, 11 tests |
| `npm --prefix backend run test:qa` | Passed on rerun: 12 suites, 95 tests |
| `npm --prefix frontend-web run build` | Passed after temporary local dependency symlink |

Note: An earlier full QA run reported 1 failed test but did not preserve the failing assertion in visible output. The immediate rerun against the same branch and test DB setup passed 95/95. No stable failure reproduced.

## Role and Tenant Scoping Result

| Role | Result |
| --- | --- |
| System admin | Can access full analytics surface through existing route permissions. |
| HR admin | Can access company HR analytics. |
| Manager | Limited to manager-appropriate report types and scoped to manager plus direct reports where report rows are employee-based. |
| Employee | Blocked from company reporting endpoints. |
| Second tenant user | Sees only second-tenant synthetic data; no ACV leakage observed. |

## Remaining Analytics Gaps

1. Browser E2E still needs to validate HR Analytics interaction: perspective selector, date filters, grouping selector, column dropdown, table/summary/chart toggles, saved reports, and downloads.
2. Chart rendering correctness was not browser-validated in this Codex sprint.
3. Manager scoping currently covers direct reports plus manager self; deeper hierarchy scoping is not implemented unless product policy explicitly requires it.
4. Export file content was not deeply parsed in automated tests.
5. Saved-report sharing/public semantics need more product definition before broader role tests.

## Updated Product Readiness

| Area | Before | After |
| --- | --- | --- |
| Backend analytics/reporting correctness | Amber/Red | Green/Amber |
| Tenant/role scoping | Amber | Green for covered synthetic scenarios |
| Frontend reporting UI | Amber/Red | Amber |
| Browser E2E readiness | Amber | Amber, pending Claude Playwright execution |
| Overall ACV product readiness | Amber | Amber with one fewer blocker |

## Recommended Next Sprint

`claude/hr-analytics-browser-e2e` or equivalent Playwright-owned sprint.

Focus:

- HR Analytics screen interaction and visual behavior.
- Column selector, grouping, chart modes, empty states, and saved reports.
- Desktop and mobile responsive screenshots.
- Export/download smoke validation.
