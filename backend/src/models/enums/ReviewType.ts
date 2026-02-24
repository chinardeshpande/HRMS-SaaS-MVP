export enum ReviewType {
  DAY_30 = '30_day',
  DAY_60 = '60_day',
  FINAL = 'final'
}

export enum ReviewStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  HR_APPROVED = 'hr_approved',
  HR_REJECTED = 'hr_rejected'
}

export enum MonitoringStatus {
  ON_TRACK = 'on_track',
  NEEDS_MONITORING = 'needs_monitoring',
  AT_RISK = 'at_risk'
}

export enum ProbationRecommendation {
  CONFIRM = 'confirm',
  EXTEND = 'extend',
  TERMINATE = 'terminate'
}
