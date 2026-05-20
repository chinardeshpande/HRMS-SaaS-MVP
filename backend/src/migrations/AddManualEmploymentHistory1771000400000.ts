import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddManualEmploymentHistory1771000400000 implements MigrationInterface {
  name = 'AddManualEmploymentHistory1771000400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'manual_employment_history_eventtype_enum') THEN
          CREATE TYPE "manual_employment_history_eventtype_enum" AS ENUM (
            'promotion',
            'transfer',
            'salary_increase',
            'bonus',
            'unpaid_break',
            'sabbatical',
            'role_change',
            'other'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "manual_employment_history" (
        "manualHistoryId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "employeeId" uuid NOT NULL,
        "eventType" "manual_employment_history_eventtype_enum" NOT NULL,
        "title" character varying(180) NOT NULL,
        "effectiveDate" date NOT NULL,
        "description" text,
        "fromValue" character varying(180),
        "toValue" character varying(180),
        "amount" numeric(12,2),
        "currency" character varying(3),
        "notes" text,
        "createdBy" uuid,
        "updatedBy" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_manual_employment_history" PRIMARY KEY ("manualHistoryId")
      )
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_manual_employment_history_tenant_employee_date" ON "manual_employment_history" ("tenantId", "employeeId", "effectiveDate")'
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_manual_employment_history_tenant" ON "manual_employment_history" ("tenantId")'
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_manual_employment_history_employee" ON "manual_employment_history" ("employeeId")'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_manual_employment_history_employee"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_manual_employment_history_tenant"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_manual_employment_history_tenant_employee_date"');
    await queryRunner.query('DROP TABLE IF EXISTS "manual_employment_history"');
    await queryRunner.query('DROP TYPE IF EXISTS "manual_employment_history_eventtype_enum"');
  }
}
