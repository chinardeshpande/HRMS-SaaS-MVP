# Documents, Reports, and Analytics Visual QA

Run: DRA-2026-05-07-1778131807827
Base URL: https://aurorahr.in

| ID | Use case | Role | Status | Evidence | Notes |
| --- | --- | --- | --- | --- | --- |
| AUTH_EMPLOYEE | Demo login as employee | employee | passed | API /demo/login | demo.employee@aurorahr.in |
| AUTH_MANAGER | Demo login as manager | manager | passed | API /demo/login | demo.manager@aurorahr.in |
| AUTH_HR | Demo login as hr | hr | passed | API /demo/login | demo.hr@aurorahr.in |
| AUTH_ADMIN | Demo login as admin | admin | passed | API /demo/login | demo.admin@aurorahr.in |
| DOC_01 | HR can list active document templates | hr | passed | templates=3, selected=Confirmation Letter |  |
| DOC_02 | HR can preview a template with sample employee data | hr | passed | previewLength=262 |  |
| DOC_03 | HR can generate a PDF document and the platform records it in history | hr | passed | pdfBytes=1710, documentId=2da479a9-cd08-447e-bed4-7f8365c2d980 |  |
| DOC_04 | HR can download a previously generated document from persistent history | hr | passed | downloadBytes=1710 |  |
| DOC_05 | Employee cannot generate HR-controlled documents | employee | passed | 403 forbidden confirmed |  |
| REP_01 | HR can run Headcount report | hr | passed | Headcount Report: records=5 |  |
| REP_02 | HR can run Attendance summary report | hr | passed | Attendance Summary: records=12 |  |
| REP_03 | HR can run Leave balance report | hr | passed | Leave Balance & Usage: records=36 |  |
| REP_04 | HR can run Joiners and leavers report | hr | passed | Joiners & Leavers Report: records=4 |  |
| REP_05 | HR can run Confirmation due report | hr | passed | Confirmation Due Report: records=3 |  |
| REP_06 | HR can run Attrition report | hr | passed | Attrition Report: records=0 |  |
| REP_07 | HR can run PMS completion report | hr | passed | PMS Completion Report: records=4 |  |
| REP_08 | HR can run Missing documents report | hr | passed | Missing Documents Report: records=12 |  |
| REP_09 | Manager can run permitted team/organization reports | manager | passed | records=5 |  |
| REP_10 | Employee is blocked from HR reporting endpoints | employee | passed | 403 forbidden confirmed |  |
| REP_11 | HR can save and execute a reusable report configuration | hr | passed | reportId=0ab99150-38f9-4d51-9f45-0506e91c2745, records=5 |  |
| ANA_01 | HR can run semantic analytics over workforce data | hr | passed | metrics=headcount,attendance_rate,leave_utilization,review_completion_rate |  |
| ANA_02 | Manager can access governed analytics query capability | manager | passed | answer=attendance rate: 83.0601092896174863 |  |
| ANA_03 | Employee is blocked from management analytics | employee | passed | 403 forbidden confirmed |  |
| ANA_04 | Manager dashboard stats are role-aware and load without tenant-wide leakage errors | manager | passed | teamEmployees=4, presentToday=0 |  |
| VIS_DOC_TEMPLATES | Document templates catalog with HR generation entry points | hr | passed | screenshots/doc_templates.png |  |
| VIS_DOC_HISTORY | Generated document history and download actions | hr | passed | screenshots/doc_history.png |  |
| VIS_REPORTS_HOME | Reports and analytics command center | hr | passed | screenshots/reports_home.png |  |
| VIS_ANALYTICS_QUERY | Semantic analytics query with calculated HR metrics | hr | passed | screenshots/analytics_query.png |  |
| VIS_HEADCOUNT_REPORT | Headcount report result table and export action | hr | passed | screenshots/headcount_report.png |  |
