# Attendance and Leave Production Readiness Update

Date: 2026-05-05

This update closes the production hardening gaps found during the Attendance and Leave visual QA pass.

## Closed Gaps

| Gap from QA | Resolution |
| --- | --- |
| Attendance Mass Update UI was not wired to the backend | Mass update now calls the real `/attendance/bulk-update` endpoint and can create or update attendance records by employee/date. |
| Backend bulk update only handled existing attendance IDs | Bulk update now supports either `attendanceId` or `employeeId + date`, validates tenant ownership, and upserts missing records. |
| Frontend used hyphenated statuses not matching backend enum values | Attendance status handling now normalizes `half-day`/`on-leave` to backend-safe `half_day`/`on_leave`, with backend validation as a safety net. |
| Attendance Sync UI used mock device data | Mock device data was removed. File-based CSV sync now persists real rows through the bulk update endpoint. Device sync is production-guarded until a real connector is configured. |
| Reporting API had a department column bug | Department attendance now uses `Department.name` while preserving the `departmentName` response alias. |
| Monthly reporting UX was weak | HR/Admin now get an Attendance Reports tab with date range, attendance summary, department breakdown, leave summary, and CSV export. |

## Production Behavior

- HR/Admin mass updates are persisted and audited through manual override fields.
- CSV sync accepts `EmployeeCode, Name, CheckIn, CheckOut, Status`.
- Rows with unknown employee codes are rejected from sync result counts instead of silently creating bad data.
- Device sync no longer fabricates records; it clearly requires a configured device connector.
- Reports are generated from live Attendance and Leave APIs.

## Verification

- Backend build: `npm run build`
- Frontend build: `npm run build`

Both builds pass.

## Remaining External Dependency

Biometric device sync is production-safe but not fully integrated with real hardware yet. To enable direct device sync, the product needs a connector/service for the selected biometric vendor or middleware.
