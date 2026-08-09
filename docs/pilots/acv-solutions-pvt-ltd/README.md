# ACV Solutions Pvt Ltd Pilot

## Objective

Implement AuraHR as a controlled real-organization pilot for ACV Solutions Pvt Ltd using real employee data, real roles, real reporting relationships, and production-grade validation before credentials are shared with ACV leadership, HR, managers, and employees.

The final go/no-go record is the [ACV Pilot Release Gate](pilot-release-gate.md).

This pilot must be treated differently from demo data. Demo tenants are disposable. ACV data is confidential production data and must be handled with explicit controls, backups, validation logs, and a rollback plan.

Clean-room rules for this implementation are documented in [clean-room-implementation-protocol.md](clean-room-implementation-protocol.md). That protocol is mandatory before real ACV employee data is imported.

## Pilot Principles

- Keep ACV data in its own tenant only.
- Do not mix ACV data with demo tenants or QA seed data.
- Do not import employee data until masters are validated.
- Do not invite employees until leadership and HR have signed off on imported records.
- Do not bulk-mutate production data without a fresh database backup.
- Use masked test files for dry runs; use real files only for the final approved import.

## Implementation Sequence

1. Create or confirm the ACV tenant.
2. Configure organization settings, subscription state, roles, and HR admin ownership.
3. Run the ACV tenant cleanliness audit and confirm there is no inherited demo, QA, CampusLife, Acme, or previous testing data.
4. Load master data:
   - departments
   - designations
   - work locations, if available
   - employment types
   - leave policies
   - attendance policy
5. Validate masters with ACV HR.
6. Re-run the cleanliness audit before employee import.
7. Import employees in dependency order:
   - directors and HR admins
   - managers
   - individual contributors
8. Validate reporting relationships and role access.
9. Configure workflows:
   - attendance approvals
   - leave approvals
   - probation rules
   - performance review visibility
   - exit approvals
10. Run controlled pilot QA.
11. Share credentials with:
   - Director
   - HR leader
   - selected managers
   - selected employee sample
12. Run a monitored pilot period and capture issues.

## Current Product Fit

AuroraHR currently supports the core pilot spine:

- tenant-scoped organization setup
- master data for departments and designations
- employee bulk import by CSV
- manager mapping through `managerEmail`
- role-based dashboards and access restrictions
- attendance and leave workflows
- onboarding, performance, exit, documents, reports, HR Connect

Known constraints to manage during pilot:

- Employee import currently requires departments and designations to already exist.
- Bulk import creates active employees and users with a generated default password path; credential activation must be tested before broad release.
- Payment gateway/subscription can be configured for pilot state, but full commercial billing should not be treated as final unless separately validated.
- Real email delivery and invitation flows must be tested with a small group before company-wide rollout.
- The ACV pilot uses the agreed General Shift. Multi-shift rostering is deferred.
- Calendar holidays are informational during the pilot; an attendance-consuming holiday master is deferred.

## Pilot Candidate Improvements

The pilot-readiness candidate adds the following guarded workflows:

- HR can choose full onboarding or direct employee-register entry for an already-onboarded person.
- Employees can cancel their own pending leave request.
- A rejected leave request no longer blocks a corrected request for the same date.
- Managers can review pending, approved, rejected, and cancelled leave history for their team.
- An employee can reopen today's attendance after an accidental clock-out, with a required reason and audit metadata.
- Database startup retries transient connection failures with bounded backoff, without replaying business queries or writes.

## Data Security

ACV source files must not be committed to Git unless they are synthetic or masked. Real employee files should be stored in a controlled private location and deleted from local temporary folders after import verification.

Required controls:

- database backup before import
- import result report retained
- failed-row report retained
- access matrix validation retained
- sign-off from ACV HR before employee invitations

## Pilot Acceptance Criteria

- ACV tenant exists and is isolated.
- ACV HR admin can log in.
- ACV masters match approved organization structure.
- Employee count, active status, departments, designations, and managers reconcile with the source file.
- Director, HR, manager, and employee roles show appropriate dashboards and restricted navigation.
- Employees cannot access admin-only modules.
- Managers can see only expected team workflows.
- HR can administer employee data and reports.
- Attendance and leave workflows work for at least one employee-manager-HR approval chain.
- Documents can be generated for at least one employee.
- Reports reflect imported ACV data.
