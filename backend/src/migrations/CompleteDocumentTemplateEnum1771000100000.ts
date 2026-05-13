import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompleteDocumentTemplateEnum1771000100000 implements MigrationInterface {
  name = 'CompleteDocumentTemplateEnum1771000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const values = [
      'promotion_letter',
      'transfer_letter',
      'resignation_acceptance',
      'relieving_letter',
    ];

    for (const value of values) {
      await queryRunner.query(`ALTER TYPE "document_templates_templatename_enum" ADD VALUE IF NOT EXISTS '${value}'`);
    }
  }

  public async down(): Promise<void> {
    // PostgreSQL enum values cannot be removed safely without rebuilding dependent columns.
  }
}
