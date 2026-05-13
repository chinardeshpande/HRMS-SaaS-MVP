import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandDocumentTemplateEnum1771000000000 implements MigrationInterface {
  name = 'ExpandDocumentTemplateEnum1771000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const values = [
      'internship_letter',
      'bgv_consent',
      'joining_instructions',
      'asset_issue_form',
      'employee_info_form',
      'code_of_conduct',
      'it_policy',
      'probation_extension_letter',
      'salary_revision_letter',
      'warning_letter',
      'advisory_letter',
      'id_card_form',
      'employment_certificate',
      'leave_approval',
      'leave_rejection',
      'attendance_warning',
      'wfh_approval',
      'shift_change_notice',
      'policy_acknowledgment',
      'notice_recovery_letter',
      'notice_waiver_letter',
      'fnf_statement',
      'exit_clearance_note',
      'termination_letter',
      'aadhar_card',
      'pan_card',
      'passport',
      'education_certificate',
      'previous_experience_letter',
      'bank_details',
      'photo',
      'extension_letter',
      'other',
    ];

    for (const value of values) {
      await queryRunner.query(`ALTER TYPE "document_templates_templatename_enum" ADD VALUE IF NOT EXISTS '${value}'`);
    }
  }

  public async down(): Promise<void> {
    // PostgreSQL does not support removing enum values safely without rebuilding dependent columns.
  }
}
