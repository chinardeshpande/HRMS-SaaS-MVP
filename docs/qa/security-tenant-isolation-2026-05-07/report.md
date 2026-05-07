# Security and Tenant Isolation QA - 2026-05-07

Run ID: SEC-2026-05-07-1778143632282
Target: https://aurorahr.in

## Outcome

- Passed: 13
- Failed: 0
- Skipped/conditional evidence: 0

## Scope

This run validates role boundaries and tenant-scoped behavior for organization masters, billing/payment methods, professional history, and HR Connect edge cases that previously had elevated risk.

## Results

| ID | Scenario | Role | Status | Evidence | Notes |
| --- | --- | --- | --- | --- | --- |
| AUTH_EMPLOYEE | Demo login as employee | employee | passed | /demo/login | demo.employee@aurorahr.in |
| AUTH_MANAGER | Demo login as manager | manager | passed | /demo/login | demo.manager@aurorahr.in |
| AUTH_HR | Demo login as hr | hr | passed | /demo/login | demo.hr@aurorahr.in |
| AUTH_ADMIN | Demo login as admin | admin | passed | /demo/login | demo.admin@aurorahr.in |
| RBAC_01 | Employees can read department master data but cannot mutate it | employee/hr | passed | employee denied with 403; HR created 56a3ba82-979e-4616-9d9a-f93e3716356b |  |
| RBAC_02 | Employees can read designations but cannot mutate them | employee/hr | passed | employee denied with 403; HR created 0c37cdab-4741-462a-8ee5-6a98ad64b09c |  |
| RBAC_03 | Employees can read document categories but cannot manage category taxonomy | employee/hr | passed | employee denied with 403; HR created 5bdd6143-21d2-462f-9292-1263cfff1a7b |  |
| RBAC_04 | Employees cannot access tenant billing payment methods | employee/hr | passed | employee denied with 403; HR method count=0 |  |
| HIST_01 | Employees cannot read another employee position history | employee | passed | otherEmployee=ca2766f2-e6ef-495f-ae96-55f8a2cd557e; denied=403 |  |
| HIST_02 | Employees can read their own compensation history only | employee | passed | self allowed; otherEmployee=ca2766f2-e6ef-495f-ae96-55f8a2cd557e; denied=403 |  |
| HIST_03 | Managers can read team position history but not team compensation history | manager | passed | directReport=cc6fa95d-c517-41d3-9893-1990a9b5fd5e; position allowed; compensation denied=403 |  |
| HRC_01 | HR Connect comment edge case returns a controlled 404 instead of a blank-screen-causing server error | employee | passed | missing post produced 404 |  |
| HRC_02 | HR Connect reaction edge case is tenant-scoped and controlled | employee | passed | missing post produced 404 |  |
