import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBiometricAttendanceConfig1786291200000 implements MigrationInterface {
  name = 'AddBiometricAttendanceConfig1786291200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "biometric_attendance_configs" (
        "configId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "formatName" varchar(100) NOT NULL DEFAULT 'Default biometric format',
        "headerRow" integer NOT NULL DEFAULT 1,
        "sheetName" varchar(100),
        "columnMapping" jsonb NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_biometric_attendance_configs" PRIMARY KEY ("configId"),
        CONSTRAINT "UQ_biometric_attendance_configs_tenant" UNIQUE ("tenantId"),
        CONSTRAINT "FK_biometric_attendance_configs_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "biometric_attendance_configs"');
  }
}
