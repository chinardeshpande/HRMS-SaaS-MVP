"use strict";
/**
 * Shared TypeScript type definitions for HRMS SaaS
 * These types are used across backend, frontend-web, and mobile-app
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveApplicationStatus = exports.AttendanceStatus = exports.CandidateStatus = exports.EmploymentStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["EMPLOYEE"] = "employee";
    UserRole["MANAGER"] = "manager";
    UserRole["HR_ADMIN"] = "hr_admin";
    UserRole["SYSTEM_ADMIN"] = "system_admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var EmploymentStatus;
(function (EmploymentStatus) {
    EmploymentStatus["ACTIVE"] = "active";
    EmploymentStatus["INACTIVE"] = "inactive";
    EmploymentStatus["EXITED"] = "exited";
})(EmploymentStatus || (exports.EmploymentStatus = EmploymentStatus = {}));
// ============================================================================
// Onboarding
// ============================================================================
var CandidateStatus;
(function (CandidateStatus) {
    CandidateStatus["OFFER_RELEASED"] = "offer_released";
    CandidateStatus["DOCUMENTS_PENDING"] = "documents_pending";
    CandidateStatus["DOCUMENTS_SUBMITTED"] = "documents_submitted";
    CandidateStatus["READY_TO_JOIN"] = "ready_to_join";
    CandidateStatus["JOINED"] = "joined";
})(CandidateStatus || (exports.CandidateStatus = CandidateStatus = {}));
// ============================================================================
// Attendance
// ============================================================================
var AttendanceStatus;
(function (AttendanceStatus) {
    AttendanceStatus["PRESENT"] = "present";
    AttendanceStatus["ABSENT"] = "absent";
    AttendanceStatus["HALF_DAY"] = "half_day";
    AttendanceStatus["LEAVE"] = "leave";
    AttendanceStatus["LATE"] = "late";
    AttendanceStatus["WEEKEND"] = "weekend";
    AttendanceStatus["HOLIDAY"] = "holiday";
})(AttendanceStatus || (exports.AttendanceStatus = AttendanceStatus = {}));
var LeaveApplicationStatus;
(function (LeaveApplicationStatus) {
    LeaveApplicationStatus["PENDING"] = "pending";
    LeaveApplicationStatus["APPROVED"] = "approved";
    LeaveApplicationStatus["REJECTED"] = "rejected";
    LeaveApplicationStatus["CANCELLED"] = "cancelled";
})(LeaveApplicationStatus || (exports.LeaveApplicationStatus = LeaveApplicationStatus = {}));
//# sourceMappingURL=index.js.map