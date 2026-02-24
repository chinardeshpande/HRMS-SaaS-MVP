export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_OVERDUE = 'task_overdue',
  TASK_COMPLETED = 'task_completed',
  REVIEW_DUE = 'review_due',
  REVIEW_SUBMITTED = 'review_submitted',
  APPROVAL_PENDING = 'approval_pending',
  APPROVAL_APPROVED = 'approval_approved',
  APPROVAL_REJECTED = 'approval_rejected',
  STATE_CHANGE = 'state_change',
  DOCUMENT_UPLOADED = 'document_uploaded',
  DOCUMENT_VERIFIED = 'document_verified',
  DOCUMENT_REJECTED = 'document_rejected',
  AT_RISK_FLAGGED = 'at_risk_flagged',
  PROBATION_EXTENDED = 'probation_extended',
  PROBATION_CONFIRMED = 'probation_confirmed',
  PROBATION_TERMINATED = 'probation_terminated',
  GENERAL = 'general'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}
