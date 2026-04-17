export enum DocumentCategory {
  SYSTEM_GENERATED = 'system_generated',
  CANDIDATE_UPLOAD = 'candidate_upload',
  HR_UPLOAD = 'hr_upload'
}

export enum DocumentType {
  // Pre-joining / Onboarding
  OFFER_LETTER = 'offer_letter',
  APPOINTMENT_LETTER = 'appointment_letter',
  INTERNSHIP_LETTER = 'internship_letter',
  NDA = 'nda',
  BGV_CONSENT = 'bgv_consent',
  JOINING_INSTRUCTIONS = 'joining_instructions',
  ASSET_ISSUE_FORM = 'asset_issue_form',
  EMPLOYEE_INFO_FORM = 'employee_info_form',
  CODE_OF_CONDUCT = 'code_of_conduct',
  IT_POLICY = 'it_policy',

  // Employment Lifecycle
  CONFIRMATION_LETTER = 'confirmation_letter',
  PROBATION_EXTENSION_LETTER = 'probation_extension_letter',
  TRANSFER_LETTER = 'transfer_letter',
  PROMOTION_LETTER = 'promotion_letter',
  SALARY_REVISION_LETTER = 'salary_revision_letter',
  WARNING_LETTER = 'warning_letter',
  ADVISORY_LETTER = 'advisory_letter',
  ID_CARD_FORM = 'id_card_form',
  EMPLOYMENT_CERTIFICATE = 'employment_certificate',

  // Leave / Attendance / Policy
  LEAVE_APPROVAL = 'leave_approval',
  LEAVE_REJECTION = 'leave_rejection',
  ATTENDANCE_WARNING = 'attendance_warning',
  WFH_APPROVAL = 'wfh_approval',
  SHIFT_CHANGE_NOTICE = 'shift_change_notice',
  POLICY_ACKNOWLEDGMENT = 'policy_acknowledgment',

  // Exit
  RESIGNATION_ACCEPTANCE = 'resignation_acceptance',
  NOTICE_RECOVERY_LETTER = 'notice_recovery_letter',
  NOTICE_WAIVER_LETTER = 'notice_waiver_letter',
  RELIEVING_LETTER = 'relieving_letter',
  EXPERIENCE_LETTER = 'experience_letter',
  FNF_STATEMENT = 'fnf_statement',
  EXIT_CLEARANCE_NOTE = 'exit_clearance_note',
  TERMINATION_LETTER = 'termination_letter',

  // Employee-uploaded documents
  AADHAR_CARD = 'aadhar_card',
  PAN_CARD = 'pan_card',
  PASSPORT = 'passport',
  EDUCATION_CERTIFICATE = 'education_certificate',
  PREVIOUS_EXPERIENCE_LETTER = 'previous_experience_letter',
  BANK_DETAILS = 'bank_details',
  PHOTO = 'photo',

  // System / Other
  EXTENSION_LETTER = 'extension_letter',
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
