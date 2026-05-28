/**
 * TypeScript type definitions for AuroraHR Mobile App
 * Mirrored from shared/types/index.ts for maximum type-safety
 */

export type UUID = string;

export type Timestamp = string; // ISO 8601 format

export enum UserRole {
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  HR_ADMIN = 'hr_admin',
  SYSTEM_ADMIN = 'system_admin',
}

export enum EmploymentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXITED = 'exited',
}

// ============================================================================
// Tenant
// ============================================================================

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

// ============================================================================
// User & Authentication
// ============================================================================

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

// ============================================================================
// Employee
// ============================================================================

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

  // Job Information
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

// ============================================================================
// Master Data
// ============================================================================

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

// ============================================================================
// Onboarding
// ============================================================================

export enum CandidateStatus {
  OFFER_RELEASED = 'offer_released',
  DOCUMENTS_PENDING = 'documents_pending',
  DOCUMENTS_SUBMITTED = 'documents_submitted',
  READY_TO_JOIN = 'ready_to_join',
  JOINED = 'joined',
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

// ============================================================================
// Attendance
// ============================================================================

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  HALF_DAY = 'half_day',
  LEAVE = 'leave',
  LATE = 'late',
  WEEKEND = 'weekend',
  HOLIDAY = 'holiday',
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

// ============================================================================
// Leave Management
// ============================================================================

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

export enum LeaveApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
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

// ============================================================================
// Performance Management
// ============================================================================

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

// ============================================================================
// Transfer & Promotion
// ============================================================================

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

// ============================================================================
// Confirmation
// ============================================================================

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

// ============================================================================
// Exit Management
// ============================================================================

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

// ============================================================================
// Documents
// ============================================================================

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

// ============================================================================
// API Response Types
// ============================================================================

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

// ============================================================================
// Form & Request Types
// ============================================================================

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

// ============================================================================
// HR Connect (Collaboration Hub)
// ============================================================================

export interface PostAttachment {
  attachmentId: string;
  fileName: string;
  fileUrl: string;
  fileType: 'image' | 'video' | 'document' | 'link';
  fileSize?: string;
  thumbnailUrl?: string;
}

export interface PostReaction {
  reactionId: string;
  userId: string;
  userName: string;
  reactionType: 'like' | 'love' | 'celebrate' | 'insightful';
  createdAt: string;
}

export interface Comment {
  commentId: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface HRPost {
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorDepartment?: string;
  authorDesignation?: string;
  author?: {
    firstName: string;
    lastName: string;
    department?: { name: string };
    designation?: { name: string };
  };
  title?: string;
  content: string;
  postType: 'announcement' | 'general' | 'event' | 'poll' | 'document' | 'discussion' | 'question';
  visibility: 'public' | 'department' | 'group' | 'hr_only' | 'group_only';
  groupId?: string;
  attachments?: PostAttachment[];
  reactions?: PostReaction[];
  comments?: Comment[];
  isPinned: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface GroupMember {
  userId: string;
  userName: string;
  userEmail?: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: string;
}

export interface Group {
  groupId: string;
  name: string;
  description?: string;
  groupType: 'department' | 'project' | 'topic' | 'social';
  type?: 'department' | 'project' | 'interest' | 'team'; // Legacy backward-compatibility support
  privacy: 'public' | 'private' | 'secret';
  memberCount: number;
  members: GroupMember[];
  createdBy: string;
  createdAt: string;
  isPrivate?: boolean;
}

// ============================================================================
// Digital Library & Generated Documents (Sprint 1)
// ============================================================================

export interface DigitalLibraryItem {
  libraryId: UUID;
  tenantId: UUID;
  employeeId: UUID;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  resourceType: 'image' | 'document' | 'video' | 'audio' | 'other';
  accessLevel: 'private' | 'shared' | 'public';
  category?: string;
  tags?: string[];
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GeneratedDocument {
  documentId: UUID;
  tenantId: UUID;
  templateId?: UUID;
  documentType: string; // maps to DocumentType enum
  documentName: string;
  employeeId?: UUID;
  status: 'draft' | 'generated' | 'issued' | 'sent' | 'received' | 'revoked';
  format: 'pdf' | 'docx' | 'html';
  filePath?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  issuedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

