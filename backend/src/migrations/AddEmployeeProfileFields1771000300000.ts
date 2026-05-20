import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmployeeProfileFields1771000300000 implements MigrationInterface {
  name = 'AddEmployeeProfileFields1771000300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "maritalStatus" character varying(30)'
    );
    await queryRunner.query(
      'ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "nationality" character varying(100)'
    );
    await queryRunner.query(
      'ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "emergencyContact" character varying(150)'
    );
    await queryRunner.query(
      'ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "emergencyPhone" character varying(30)'
    );
    await queryRunner.query(
      'ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "workLocation" character varying(150)'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "employees" DROP COLUMN IF EXISTS "workLocation"');
    await queryRunner.query('ALTER TABLE "employees" DROP COLUMN IF EXISTS "emergencyPhone"');
    await queryRunner.query('ALTER TABLE "employees" DROP COLUMN IF EXISTS "emergencyContact"');
    await queryRunner.query('ALTER TABLE "employees" DROP COLUMN IF EXISTS "nationality"');
    await queryRunner.query('ALTER TABLE "employees" DROP COLUMN IF EXISTS "maritalStatus"');
  }
}
