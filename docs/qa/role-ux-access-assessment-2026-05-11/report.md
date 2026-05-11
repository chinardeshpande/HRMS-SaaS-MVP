# AuroraHR Role, UI/UX, And Access Assessment

Run date: 2026-05-11
Scope: persona journeys, navigation fit, frontend route exposure, backend role access, and production hardening backlog
Evidence base: source review plus prior QA evidence from commercial lifecycle, route resilience, tenant isolation, attendance/leave, HR lifecycle, HR Connect, documents, reports, and analytics runs.

## Executive Summary

AuroraHR has the right foundation for the role model the product needs, but the experience is still too coarse for a clean commercial launch.

The current platform has four hard system roles:

| System role | Current meaning | Commercial persona fit |
| --- | --- | --- |
| `system_admin` | Tenant-level administrator | Company owner / main HR admin / subscription owner |
| `hr_admin` | HR operator with broad access | HR manager / HR operations lead |
| `manager` | People manager / approver | Senior employee with team responsibilities |
| `employee` | Individual contributor | Employee self-service user |

This maps well to the requested operating model, but the product needs a stricter distinction between:

- subscription owner work,
- HR implementation/configuration work,
- HR operations work,
- manager approval work,
- employee self-service work.

The biggest readiness gap is not missing modules. The bigger issue is role clarity: some UI is hidden by navigation but still reachable by direct route, some backend APIs grant HR admin access to billing/subscription operations, some authenticated users can access broad collaboration/document/calendar surfaces, and the custom roles/permissions UI is not yet the primary backend authorization engine.

## Requested Persona Model

| Requested persona | Recommended AuroraHR role | Primary journey |
| --- | --- | --- |
| Main HR Admin enrolling company | `system_admin` | Register company, select free subscription, verify email, create password, complete setup |
| Main HR Admin completing onboarding | `system_admin` | Finish onboarding wizard, organization profile, departments, designations, policies, users |
| Main HR Admin adding users and roles | `system_admin` | Create employees, bulk import, assign roles, send invitations, configure permissions |
| Main HR Admin implementing platform | `system_admin` | Data migration, master setup, business rules, policy setup, document templates, demo/training readiness |
| HR Manager | `hr_admin` | Operate HR modules, manage employees, approvals, reports, global documentation |
| Senior employee self-service | `manager` | Own attendance, leave, performance, documents, resignation |
| Senior employee approvals | `manager` | Team attendance regularization, leave approvals, performance reviews, probation, exit approvals |
| HR Manager override/global ops | `hr_admin` | Mass updates, global reports, HR override actions, policy operations |
| Individual employee | `employee` | Minimal self-service: own profile, attendance, leave, documents, performance, resignation, HR Connect |

## Current Frontend Navigation Assessment

Current navigation is defined in `frontend-web/src/components/layout/ModernLayout.tsx`.

| Navigation item | Current visibility | Assessment |
| --- | --- | --- |
| Dashboard | All roles | Correct, but dashboard content should become persona-specific. |
| Employees | `system_admin`, `hr_admin`, `manager` | Correct in principle. Manager must remain team-scoped only. |
| Onboarding | `system_admin`, `hr_admin` | Correct. Candidate/new hire onboarding should be HR-led. |
| Attendance | All roles | Correct, but UI must split self-service, team approvals, HR overrides, and reports clearly. |
| Leave Management | All roles | Correct, same separation needed as attendance. |
| Performance | `system_admin`, `hr_admin`, `manager` | Incomplete for employees. Employees need access to their own reviews/goals without seeing admin dashboard. |
| Exit Management | `system_admin`, `hr_admin`, `manager` | Incomplete for employees. Employees need a simple "My Resignation / My Exit" path. |
| Calendar | All roles | Acceptable, but create/update/delete permissions need tightening by ownership or role. |
| HR Connect | All roles | Correct for social feed/chat, but group admin actions and ticket access need stronger role/ownership controls. |
| Org Chart | All roles | Correct if only tenant-safe org visibility is intended. |
| Master Data | `system_admin`, `hr_admin` | Correct. |
| Reports | `system_admin`, `hr_admin` | Frontend is stricter than backend, where managers can access several report APIs. Decide intentionally. |
| Documents | `system_admin`, `hr_admin`, `manager` | Likely too broad for manager template generation unless team-scoped or specific templates only. |
| My HR Documents | All roles | Correct. |
| Settings | `system_admin`, `hr_admin` | Too broad as currently implemented. Billing/security/subscription should be owner-only. |

## Frontend Route Guard Assessment

`frontend-web/src/App.tsx` exposes protected application routes directly, but there is no central route guard declaring role permissions. Pages rely on internal API failures, layout behavior, or page-level checks.

This has improved from earlier route resilience work, but the architecture should move toward a single route access source of truth:

- one config that defines route, label, icon, allowed roles, ownership scope, and feature flag;
- navigation generated from the config;
- route guard generated from the same config;
- Playwright route-access tests generated from the same config;
- backend authorization tests validating matching API boundaries.

Without this, navigation and direct URL behavior will continue to drift.

## Backend Access Assessment

### Registration And Subscription Entry

Routes: `backend/src/routes/registrationRoutes.ts`

| Capability | Current access | Assessment |
| --- | --- | --- |
| Company signup | Public | Correct. |
| Email verification | Public token-based | Correct design, but production QA previously blocked on real verification delivery/token completion. |
| Complete registration | Public with registration id/password | Correct if registration id is unguessable and expiry checked in service. |
| Plans | Public | Correct. |

Commercial gap: registration cannot be considered fully production-ready until real email verification is consistently testable end to end in production.

### Organization Setup, Settings, Billing, Roles

Routes: `backend/src/routes/settingsRoutes.ts`, `backend/src/routes/paymentMethodRoutes.ts`, `backend/src/routes/onboardingWizardRoutes.ts`

| Capability | Current access | Recommended access |
| --- | --- | --- |
| Subscription create/update/upgrade/cancel | `system_admin`, `hr_admin` | `system_admin` only by default. Delegate via explicit billing permission later. |
| Payment history/status | `system_admin`, `hr_admin` | `system_admin` only for payment operations; `hr_admin` can view only if delegated. |
| Payment methods | `system_admin`, `hr_admin` | `system_admin` only. |
| Organization profile | `system_admin`, `hr_admin` | `system_admin`; HR can edit selected HR profile fields if delegated. |
| Business rules | `system_admin`, `hr_admin` | `system_admin`, `hr_admin` acceptable. |
| Roles/permissions | `system_admin`, `hr_admin` | `system_admin` by default; HR role admin only if explicitly delegated. |
| User management | `system_admin`, `hr_admin` | Both acceptable, but role changes/deactivation of admins should be owner-only. |
| Leave/attendance policies | `system_admin`, `hr_admin` | Correct. |
| SMTP config | `system_admin`, `hr_admin` | `system_admin` only. |
| Onboarding wizard | `system_admin`, `hr_admin` | Correct for implementation, but first-run experience should strongly favor `system_admin`. |

High-priority gap: HR managers currently have backend access to subscription, payment, SMTP, and role-permission configuration. That is too broad for a commercial SaaS default.

### Employee Data And Master Data

Routes: `backend/src/routes/employeeRoutes.ts`, `departmentRoutes.ts`, `designationRoutes.ts`

| Capability | Current access | Assessment |
| --- | --- | --- |
| Employee list/detail | All authenticated, filtered in controller | Correct pattern if filtering stays strict. Prior security work supports this direction. |
| Employee create/update/delete | `system_admin`, `hr_admin` | Correct. |
| Bulk import/template | `system_admin`, `hr_admin` | Correct. |
| Department/designation read | All authenticated | Acceptable. |
| Department/designation write/delete | `system_admin`, `hr_admin` | Correct. |

UX gap: employee users should not feel they are entering an HR database. Their route should read as "My Profile" and only expose employee-safe tabs.

### Attendance And Leave

Routes: `backend/src/routes/attendanceRoutes.ts`, `backend/src/routes/leaveRoutes.ts`

| Capability | Current access | Assessment |
| --- | --- | --- |
| Clock in/out, my attendance | All authenticated | Correct. |
| Attendance regularization request | All authenticated | Correct. |
| Pending regularizations approve/reject | `manager`, `hr_admin`, `system_admin` | Correct if controller checks team scope for managers. |
| Team attendance | `manager`, `hr_admin`, `system_admin` | Correct if manager scope is enforced. |
| Company-wide attendance | `manager`, `hr_admin`, `system_admin` | Potentially too broad for managers unless controller returns team-only data for managers. |
| Bulk update/override/statistics/by department | `hr_admin`, `system_admin` | Correct. |
| Leave apply/cancel/my balance | All authenticated | Correct. |
| Leave pending approvals/approve | `manager`, `hr_admin`, `system_admin` | Correct if team scope is enforced. |
| Leave all/statistics/init balance | `hr_admin`, `system_admin` | Correct. |

UI gap: one Attendance page and one Leave page carry too much responsibility. The same route should render role-aware sections:

- Employee: Today, My Timesheet, My Regularization Requests, My Leave Balance, Apply Leave.
- Manager: Team Approvals, Team Calendar, Exceptions.
- HR: Bulk Updates, Overrides, Policy Checks, Company Reports.

### Onboarding And Probation

Routes: `backend/src/routes/onboardingRoutes.ts`, `probationRoutes.ts`

| Capability | Current access | Assessment |
| --- | --- | --- |
| Candidate onboarding | `hr_admin`, `system_admin` | Correct. |
| Candidate documents/tasks/BGV/case | `hr_admin`, `system_admin` | Correct. |
| Probation statistics | `hr_admin`, `system_admin` | Correct. |
| Probation cases/reviews/at-risk | `manager`, `hr_admin`, `system_admin` | Correct if managers see only their team. |
| Confirm/terminate probation | `hr_admin`, `system_admin` | Correct. |

UX gap: managers should not see "Probation Management" as an HR module. They should see "Probation Reviews Due" in a team-work queue.

### Performance

Routes: `backend/src/routes/performanceRoutes.ts`

| Capability | Current access | Assessment |
| --- | --- | --- |
| All reviews | `manager`, `hr_admin`, `system_admin` | Correct only if manager data is team-scoped. |
| My reviews | All authenticated | Correct. |
| Review details | All authenticated | Needs strict ownership/team/admin check in controller. |
| Create/delete review | `hr_admin`, `system_admin` | Correct. |
| Update review | `manager`, `hr_admin`, `system_admin` | Correct if manager scope/state is enforced. |
| Goals/KPIs/action items/360 feedback | Authenticated with controller-level rules | Needs systematic audit because route-level access is broad. |
| Approve goals/final rating/development plan | `manager`, `hr_admin`, `system_admin` | Correct with team scope. |

UI gap: employees currently do not get a clear navigation item for "My Performance" even though the API has `my-reviews`. This should be made explicit.

### Exit

Routes: `backend/src/routes/exitRoutes.ts`

| Capability | Current access | Assessment |
| --- | --- | --- |
| Submit resignation | All authenticated | Correct. |
| My exit case | All authenticated | Correct. |
| All cases/pending clearances/assets | `manager`, `hr_admin`, `system_admin` | Correct with team scope. |
| Approve/reject resignation | `manager`, `hr_admin`, `system_admin` | Correct with team scope and approval-chain validation. |
| Settlement, buyout, case transition, delete | `hr_admin`, `system_admin` | Correct. |

UX gap already found in earlier QA: employee self-service must always show the expected "Submit Resignation" action when no case exists. Any screenshot/report claiming that path must be backed by an actual visible control.

### Documents

Routes: `backend/src/routes/documentRoutes.ts`, `templateGenerationRoutes.ts`, `digitalLibraryRoutes.ts`, `documentCategoryRoutes.ts`

| Capability | Current access | Assessment |
| --- | --- | --- |
| My/document upload/download/entity docs | Authenticated | Needs entity ownership checks and document sensitivity rules. |
| Verify/reject/delete documents | `hr_admin`, `system_admin` | Correct. |
| Template list | Authenticated | Acceptable if templates are non-sensitive. |
| Generate/preview/download generated docs | `manager`, `hr_admin`, `system_admin` | Potentially too broad. Managers should generate only approved team-level documents, if any. |
| Template update/history/delete | `hr_admin`, `system_admin` | Correct. |
| Digital library save/update/delete/stats | Authenticated route-level, controller/service scoped | Needs explicit role/ownership audit. Employee should not globally update/delete library items. |
| Categories create/update/delete | `hr_admin`, `system_admin` | Correct. |

High-priority gap: digital library route-level access is too broad unless every mutation is strongly enforced in service code. Document access must be treated as sensitive HR data, not general collaboration data.

### Reports And Analytics

Routes: `backend/src/routes/reportingRoutes.ts`, `analyticsRoutes.ts`

| Capability | Current access | Assessment |
| --- | --- | --- |
| Several reports | `manager`, `hr_admin`, `system_admin` | Correct only when manager reports are team-scoped. |
| Some global reports | `hr_admin`, `system_admin` | Correct. |
| Analytics | `manager`, `hr_admin`, `system_admin` | Correct only with manager-scoped data. |

Frontend currently hides Reports from managers while backend allows some manager reporting. This should be resolved intentionally:

- either expose a manager "Team Insights" route, or
- remove manager access from report APIs.

### HR Connect, Chat, Tickets, Calendar

Routes: `backend/src/routes/hrConnectRoutes.ts`, `chatRoutes.ts`, `ticketRoutes.ts`, `calendarRoutes.ts`

| Capability | Current access | Assessment |
| --- | --- | --- |
| HR Connect feed/comments/groups | Authenticated with service-level checks | Reasonable, but group admin controls must be consistently tested. |
| Chat conversations/messages/participants | Authenticated with service-level checks | Reasonable if participant checks are strict. |
| Tickets | `optionalAuth`, fallback tenant data in controller | Not production-ready. Tickets should require authentication and tenant ownership. |
| Calendar events read/create/update/delete | Authenticated | Needs ownership/role checks for update/delete and lifecycle event visibility. |

High-priority gap: ticket routes using optional auth and controller fallback tenant data is not acceptable for commercial multi-tenant production.

## UI/UX Target Model

AuroraHR should move from module-first navigation to persona-first workspaces.

### 1. Company Owner / Main HR Admin Workspace

Primary screen: Implementation Console.

The workspace should show:

- subscription status and trial countdown,
- company setup checklist,
- departments/designations setup,
- employee import status,
- role/invitation status,
- policy/rule configuration,
- document template setup,
- demo/training mode,
- production readiness checklist.

This user can still enter all HR modules, but the first-run journey should prioritize setup before operations.

### 2. HR Manager Workspace

Primary screen: HR Operations.

The workspace should show:

- open onboarding cases,
- attendance exceptions,
- leave approvals and policy exceptions,
- probation reviews,
- performance cycle status,
- exits in progress,
- document verification queue,
- reports and analytics.

Billing, SMTP, platform security, and owner-level subscription controls should be hidden unless delegated.

### 3. Manager / Senior Employee Workspace

Primary screen: Team Work Queue plus My Self-Service.

The workspace should show:

- my attendance,
- my leave,
- my performance,
- my documents,
- my resignation,
- team attendance exceptions,
- team leave approvals,
- performance reviews due,
- probation reviews due,
- exit approvals/clearances for team.

Managers should not see global HR terminology unless they truly have HR rights.

### 4. Employee Workspace

Primary screen: My HR.

The workspace should show:

- clock in/out and timesheet,
- leave balance and leave requests,
- my documents,
- my performance reviews/goals,
- my profile,
- submit resignation / my exit status,
- HR Connect and tickets.

The UI should be minimal, not administrative.

## Functional Access Matrix

Legend: `F` full access, `S` scoped/self/team access, `A` approval access, `R` read/report access, `-` no access.

| Capability | System Admin | HR Admin | Manager | Employee |
| --- | --- | --- | --- | --- |
| Company registration | F | - | - | - |
| Subscription/billing/payment methods | F | Delegated only | - | - |
| Onboarding wizard/company setup | F | S | - | - |
| Organization profile/security/SMTP | F | Delegated only | - | - |
| Departments/designations | F | F | R | R |
| Employee import/create/update/delete | F | F | - | - |
| Employee directory | F | F | S | S |
| User invitations | F | F | - | - |
| System role assignment | F | Delegated only | - | - |
| Custom roles/permissions | F | Delegated only | - | - |
| Attendance self-service | S | S | S | S |
| Attendance team approvals | F | F | A/S | - |
| Attendance bulk update/override | F | F | - | - |
| Leave self-service | S | S | S | S |
| Leave approvals | F | F | A/S | - |
| Leave policies/balances | F | F | - | - |
| Hiring/onboarding candidates | F | F | A/S if assigned later | - |
| Probation reviews | F | F | A/S | - |
| Probation confirm/terminate | F | F | - | - |
| Performance review cycle setup | F | F | - | - |
| Performance self-review/goals | S | S | S | S |
| Performance manager review | F | F | A/S | - |
| Exit resignation self-service | S | S | S | S |
| Exit approval/clearance | F | F | A/S | - |
| Exit settlement/payments | F | F | - | - |
| HR documents/templates | F | F | S/R only | R/S own docs |
| Digital library management | F | F | S only if owner/team | S own/allowed |
| Reports/analytics | F | F | S team insights | - |
| HR Connect/feed/chat | S | S | S | S |
| HR tickets | F | F | S team/requester | S requester |
| Calendar | F | F | S own/team | S own/public tenant |
| Demo mode | F | F | S | S |

## Key Findings

### Finding 1: Role model exists, but persona experience is not yet clean enough

The four-role model is sufficient for MVP launch, but the UI should stop making every role feel like a smaller version of the admin product. Employee and manager experiences need dedicated self-service and team-work mental models.

Priority: High.

### Finding 2: Backend authorization is mostly role-based, but not yet policy-based

Most backend routes use hard-coded enum role checks. The Settings UI has custom roles and permissions, but that permission model is not yet consistently used as the backend source of truth.

Priority: High.

### Finding 3: HR admin access is too broad for billing/security defaults

`hr_admin` currently has access to subscription, payments, payment methods, SMTP, roles, permissions, and user management through settings/payment routes. For commercial SaaS, owner-level billing and tenant security operations should default to `system_admin`.

Priority: High.

### Finding 4: Direct frontend routes need central guards

Navigation filtering is useful but not enough. Direct URL access must show a clean permission page before sensitive page logic loads.

Priority: High.

### Finding 5: Manager views must be team-scoped everywhere

Employee listing/detail already uses controller-level role filtering. The same proof discipline must be applied consistently to attendance company-wide, reports, analytics, performance reviews, probation, and exit cases.

Priority: High.

### Finding 6: Tickets are not production-ready as currently routed

Ticket routes use optional authentication and fallback tenant/user values in the controller. That is incompatible with authentic multi-tenant commercial readiness.

Priority: High.

### Finding 7: Documents and digital library need stricter sensitivity rules

Document routes and library operations should explicitly enforce ownership, allowed audience, HR sensitivity, and manager/team scope. Document access cannot be treated like generic feed access.

Priority: High.

### Finding 8: Employees need explicit "My Performance" and "My Exit" journeys

APIs exist for employee self-service, but navigation currently hides Performance and Exit from employees. They need minimal self-service entry points without exposing manager/HR dashboards.

Priority: Medium.

## Recommended Execution Plan

### Slice 1: Create a single access model

Create a shared frontend access configuration for:

- route path,
- nav label,
- module,
- allowed roles,
- scope model,
- direct-route fallback behavior,
- feature flag if needed.

Use it to drive both navigation and route guards.

Expected result: no role sees irrelevant menu items, and direct restricted URLs produce controlled access states.

### Slice 2: Split Settings into owner vs HR settings

Restrict by default:

- subscription,
- payments,
- payment methods,
- SMTP,
- owner/security settings,
- role/permission mutation.

Keep HR manager access to:

- policies,
- business rules,
- employee/user operations,
- leave/attendance settings,
- document categories/templates where appropriate.

Expected result: HR managers remain operationally powerful without becoming billing/security owners.

### Slice 3: Fix ticket authentication and tenant handling

Replace optional authentication on ticket routes with required authentication. Remove fallback tenant/user values from ticket controller logic. Add tests for unauthenticated, cross-tenant, requester, HR, and manager access.

Expected result: tickets become safe for real tenant usage.

### Slice 4: Build employee and manager self-service journeys

Add or refine route-level experiences:

- `My HR` employee workspace,
- `My Performance`,
- `My Exit`,
- manager team work queue,
- manager team insights.

Expected result: employees and managers get clean, minimal, relevant UI instead of admin-flavored screens.

### Slice 5: Harden document/library permissions

Audit and enforce:

- employee own-document access,
- HR global access,
- manager team-limited access,
- template generation eligibility,
- library update/delete ownership or HR rights,
- download auditability.

Expected result: HR document handling becomes defensible for production.

### Slice 6: Generate automated role-access QA

Create a deterministic QA script that:

- logs in as system admin, HR admin, manager, and employee,
- crawls every route,
- asserts visible navigation,
- tests direct restricted routes,
- tests representative API allow/deny cases,
- captures screenshots only after assertions pass,
- writes a matrix report.

Expected result: future regressions in access control become visible immediately.

## Immediate Next Step

The next implementation step should be Slice 1 plus the most obvious security cleanup from Slice 3:

1. Add central frontend route/nav access config.
2. Add route guard behavior using that config.
3. Align ModernLayout navigation to the same config.
4. Fix ticket routes from optional auth to required auth.
5. Add a role-access QA script covering direct route behavior and ticket authentication.

This is the cleanest foundation before deeper UI polish, because it prevents us from designing beautiful but role-inconsistent screens.
