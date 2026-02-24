export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export enum ApprovalEntityType {
  CANDIDATE = 'candidate',
  PROBATION_REVIEW = 'probation_review',
  PROBATION_EXTENSION = 'probation_extension',
  PROBATION_TERMINATION = 'probation_termination',
  DOCUMENT = 'document'
}

export enum ApprovalType {
  OFFER_APPROVAL = 'offer_approval',
  REVIEW_APPROVAL = 'review_approval',
  EXTENSION_APPROVAL = 'extension_approval',
  TERMINATION_APPROVAL = 'termination_approval',
  DOCUMENT_APPROVAL = 'document_approval'
}
