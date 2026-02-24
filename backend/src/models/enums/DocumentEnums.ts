export enum DocumentCategory {
  SYSTEM_GENERATED = 'system_generated',
  CANDIDATE_UPLOAD = 'candidate_upload',
  HR_UPLOAD = 'hr_upload'
}

export enum DocumentType {
  OFFER_LETTER = 'offer_letter',
  APPOINTMENT_LETTER = 'appointment_letter',
  NDA = 'nda',
  CODE_OF_CONDUCT = 'code_of_conduct',
  IT_POLICY = 'it_policy',
  CONFIRMATION_LETTER = 'confirmation_letter',
  EXTENSION_LETTER = 'extension_letter',
  TERMINATION_LETTER = 'termination_letter',
  AADHAR_CARD = 'aadhar_card',
  PAN_CARD = 'pan_card',
  PASSPORT = 'passport',
  EDUCATION_CERTIFICATE = 'education_certificate',
  EXPERIENCE_LETTER = 'experience_letter',
  BANK_DETAILS = 'bank_details',
  PHOTO = 'photo',
  OTHER = 'other'
}

export enum VerificationStatus {
  PENDING = 'pending',
  UPLOADED = 'uploaded',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  MISSING = 'missing'
}

export enum BGVStatus {
  NOT_INITIATED = 'not_initiated',
  IN_PROGRESS = 'in_progress',
  PASSED = 'passed',
  DISCREPANCY = 'discrepancy',
  FAILED = 'failed'
}
