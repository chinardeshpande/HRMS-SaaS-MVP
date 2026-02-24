export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TaskCategory {
  DOCUMENT_UPLOAD = 'document_upload',
  DOCUMENT_VERIFICATION = 'document_verification',
  PAYROLL_SETUP = 'payroll_setup',
  IT_PROVISIONING = 'it_provisioning',
  ORIENTATION = 'orientation',
  REVIEW = 'review',
  HR_INTERVENTION = 'hr_intervention',
  APPROVAL = 'approval',
  GENERAL = 'general'
}
