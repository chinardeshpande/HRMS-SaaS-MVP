/**
 * Shared TypeScript type definitions for HRMS SaaS
 * These types are used across backend, frontend-web, and mobile-app
 */
export type UUID = string;
export type Timestamp = string;
export declare enum UserRole {
    EMPLOYEE = "employee",
    MANAGER = "manager",
    HR_ADMIN = "hr_admin",
    SYSTEM_ADMIN = "system_admin"
}
export declare enum EmploymentStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    EXITED = "exited"
}
export interface Tenant {
    tenantId: UUID;
    companyName: string;
    subdomain?: string;
    planType: 'basic' | 'professional' | 'enterprise';
    status: 'active' | 'suspended' | 'cancelled';
    logoUrl?: string;
    primaryColor?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface User {
    userId: UUID;
    tenantId: UUID;
    email: string;
    fullName: string;
    role: UserRole;
    employeeId?: UUID;
    isActive: boolean;
    lastLogin?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface AuthTokens {
    token: string;
    refreshToken: string;
}
export interface AuthResponse {
    user: User;
    tokens: AuthTokens;
}
export interface Employee {
    employeeId: UUID;
    tenantId: UUID;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    address?: string;
    departmentId?: UUID;
    designationId?: UUID;
    managerId?: UUID;
    dateOfJoining: string;
    probationEndDate?: string;
    employmentType?: 'full-time' | 'part-time' | 'contract' | 'intern';
    status: EmploymentStatus;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface EmployeeProfile extends Employee {
    department?: Department;
    designation?: Designation;
    manager?: Employee;
    attendanceSummary?: AttendanceSummary;
    leaveBalance?: LeaveBalance;
    performanceScore?: number;
    documents?: Document[];
    history?: EmployeeHistoryEntry[];
}
export interface AttendanceSummary {
    totalDays: number;
    present: number;
    absent: number;
    halfDay: number;
    lateMark: number;
}
export interface LeaveBalance {
    [leaveTypeCode: string]: number;
}
export interface EmployeeHistoryEntry {
    action: string;
    date: string;
    details?: string;
}
export interface Department {
    departmentId: UUID;
    tenantId: UUID;
    name: string;
    parentDeptId?: UUID;
    headEmployeeId?: UUID;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface Designation {
    designationId: UUID;
    tenantId: UUID;
    name: string;
    level?: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export declare enum CandidateStatus {
    OFFER_RELEASED = "offer_released",
    DOCUMENTS_PENDING = "documents_pending",
    DOCUMENTS_SUBMITTED = "documents_submitted",
    READY_TO_JOIN = "ready_to_join",
    JOINED = "joined"
}
export interface Candidate {
    candidateId: UUID;
    tenantId: UUID;
    fullName: string;
    personalEmail: string;
    phone?: string;
    positionOffered: string;
    departmentId?: UUID;
    designationId?: UUID;
    managerId?: UUID;
    offerDate?: string;
    expectedJoinDate?: string;
    actualJoinDate?: string;
    status: CandidateStatus;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface CandidateDocument {
    documentId: UUID;
    tenantId: UUID;
    candidateId: UUID;
    documentType: string;
    filePath: string;
    status: 'pending' | 'uploaded' | 'verified' | 'rejected';
    remarks?: string;
    uploadedAt: Timestamp;
    reviewedBy?: UUID;
    reviewedAt?: Timestamp;
}
export declare enum AttendanceStatus {
    PRESENT = "present",
    ABSENT = "absent",
    HALF_DAY = "half_day",
    LEAVE = "leave",
    LATE = "late",
    WEEKEND = "weekend",
    HOLIDAY = "holiday"
}
export interface AttendanceRecord {
    attendanceId: UUID;
    tenantId: UUID;
    employeeId: UUID;
    date: string;
    punchIn?: Timestamp;
    punchOut?: Timestamp;
    workHours?: number;
    status?: AttendanceStatus;
    remarks?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface LeaveType {
    leaveTypeId: UUID;
    tenantId: UUID;
    name: string;
    code: string;
    annualAllocation: number;
    carryForwardAllowed: boolean;
    maxCarryForward: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export declare enum LeaveApplicationStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    CANCELLED = "cancelled"
}
export interface LeaveApplication {
    leaveId: UUID;
    tenantId: UUID;
    employeeId: UUID;
    leaveTypeId: UUID;
    startDate: string;
    endDate: string;
    days: number;
    isHalfDay: boolean;
    reason?: string;
    status: LeaveApplicationStatus;
    appliedAt: Timestamp;
    approvedBy?: UUID;
    approvedAt?: Timestamp;
    managerComments?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface PerformanceCycle {
    cycleId: UUID;
    tenantId: UUID;
    name: string;
    startDate: string;
    endDate: string;
    status: 'active' | 'completed' | 'cancelled';
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface Goal {
    goalId: UUID;
    tenantId: UUID;
    employeeId: UUID;
    cycleId: UUID;
    title: string;
    description?: string;
    weightage?: number;
    targetDate?: string;
    status: 'active' | 'completed' | 'cancelled';
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface PerformanceReview {
    reviewId: UUID;
    tenantId: UUID;
    employeeId: UUID;
    cycleId: UUID;
    managerId: UUID;
    selfRating?: number;
    managerRating?: number;
    managerComments?: string;
    submittedAt?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface Promotion {
    promotionId: UUID;
    tenantId: UUID;
    employeeId: UUID;
    newDesignationId?: UUID;
    newDepartmentId?: UUID;
    effectiveDate: string;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected';
    initiatedBy?: UUID;
    approvedBy?: UUID;
    approvedAt?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface ConfirmationReview {
    confirmId: UUID;
    tenantId: UUID;
    employeeId: UUID;
    reviewDate: string;
    performanceRating?: number;
    hrRemarks?: string;
    decision?: 'confirm' | 'extend' | 'terminate';
    newProbationEndDate?: string;
    decidedAt?: Timestamp;
    decidedBy?: UUID;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface Resignation {
    resignId: UUID;
    tenantId: UUID;
    employeeId: UUID;
    noticeDate: string;
    lastWorkingDay: string;
    reason?: string;
    status: 'pending' | 'accepted' | 'withdrawn';
    createdAt: Timestamp;
    approvedAt?: Timestamp;
    approvedBy?: UUID;
}
export interface ExitClearance {
    clearanceId: UUID;
    tenantId: UUID;
    resignId: UUID;
    departmentCategory: string;
    status: 'pending' | 'cleared';
    clearedBy?: UUID;
    clearedAt?: Timestamp;
    remarks?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface Document {
    documentId: UUID;
    tenantId: UUID;
    employeeId?: UUID;
    documentType: string;
    filePath: string;
    fileName: string;
    fileSize?: number;
    uploadedBy?: UUID;
    uploadedAt: Timestamp;
}
export interface AuditLog {
    logId: UUID;
    tenantId: UUID;
    userId?: UUID;
    action: string;
    entityType: string;
    entityId?: UUID;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Timestamp;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    meta?: PaginationMeta;
    error?: ApiError;
}
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export interface ApiError {
    code: string;
    message: string;
    details?: Array<{
        field: string;
        message: string;
    }>;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface LeaveApplicationRequest {
    leaveTypeId: UUID;
    startDate: string;
    endDate: string;
    days: number;
    isHalfDay: boolean;
    reason?: string;
}
export interface AttendancePunchRequest {
    action: 'in' | 'out';
    timestamp?: Timestamp;
    remarks?: string;
}
export interface PromotionRequest {
    employeeId: UUID;
    newDepartmentId?: UUID;
    newDesignationId?: UUID;
    effectiveDate: string;
    reason?: string;
}
//# sourceMappingURL=index.d.ts.map