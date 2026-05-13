# ACV Pilot QA Plan

## Scope

This QA plan validates ACV Solutions Pvt Ltd as a real production pilot tenant after masters and employee data are loaded.

## Personas

- Director / owner
- HR leader
- HR manager / operations
- Reporting manager
- Employee

## Test Cases

| ID | Area | Persona | Expected Result |
| --- | --- | --- | --- |
| ACV-001 | Login | Director | Can log in and view owner/admin dashboard |
| ACV-002 | Login | HR leader | Can log in and view HR operations dashboard |
| ACV-003 | Login | Manager | Can log in and view team work queue |
| ACV-004 | Login | Employee | Can log in and view employee self-service dashboard |
| ACV-005 | Access control | Employee | Cannot access employees, masters, reports, settings |
| ACV-006 | Access control | Manager | Cannot access owner-only settings or onboarding admin |
| ACV-007 | Masters | HR | Departments and designations match approved ACV data |
| ACV-008 | Employee data | HR | Imported employee count matches source file |
| ACV-009 | Reporting lines | Manager | Manager sees expected direct reports only |
| ACV-010 | Attendance | Employee | Can submit attendance action or regularization |
| ACV-011 | Attendance approval | Manager | Can review team attendance item |
| ACV-012 | Leave | Employee | Can apply for leave using configured policy |
| ACV-013 | Leave approval | Manager | Can approve/reject subordinate leave |
| ACV-014 | Leave override | HR | HR can view and intervene where permitted |
| ACV-015 | Documents | HR | Can generate a standard HR document for ACV employee |
| ACV-016 | Reports | HR/Director | Reports reflect ACV tenant data only |
| ACV-017 | HR Connect | Employee | Can view HR Connect feed and create permitted interactions |
| ACV-018 | Exit | Employee/HR | Exit flow is visible according to role and works for test case |

## Evidence Required

- screenshots of each persona dashboard
- screenshots of access-denied checks
- API verification of employee count and tenant isolation
- import success/failure report
- production health check
- final pilot readiness summary

## Go/No-Go

Go only if:

- no cross-tenant data is visible
- no employee can access admin routes
- ACV leadership and HR records are correct
- reporting relationships reconcile
- credential activation works for a small pilot sample

