import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPayrollPartnerRole1786400000000 implements MigrationInterface {
  name = 'AddPayrollPartnerRole1786400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."user_invitations_role_enum" ADD VALUE IF NOT EXISTS 'payroll_partner'`);
  }

  // PostgreSQL cannot safely remove a live enum value without rebuilding the type.
  // Keeping the value on rollback avoids invalidating historical invitations.
  async down(_queryRunner: QueryRunner): Promise<void> {}
}
