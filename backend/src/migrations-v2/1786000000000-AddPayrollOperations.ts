import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPayrollOperations1786000000000 implements MigrationInterface {
  name = 'AddPayrollOperations1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "payroll_cycles" (
        "payrollCycleId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "month" integer NOT NULL,
        "year" integer NOT NULL,
        "version" integer NOT NULL DEFAULT 1,
        "status" varchar(40) NOT NULL DEFAULT 'draft',
        "exchangeFormatVersion" varchar(20) NOT NULL DEFAULT '1.0',
        "partnerName" varchar(160) NOT NULL,
        "employeeCount" integer NOT NULL DEFAULT 0,
        "grossTotal" numeric(14,2) NOT NULL DEFAULT 0,
        "deductionTotal" numeric(14,2) NOT NULL DEFAULT 0,
        "netTotal" numeric(14,2) NOT NULL DEFAULT 0,
        "partnerReference" varchar(160),
        "bankReference" varchar(160),
        "payslipSummary" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "notes" text,
        "approvedBy" uuid,
        "approvedAt" timestamp,
        "executedAt" timestamp,
        "createdBy" uuid,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payroll_cycles" PRIMARY KEY ("payrollCycleId")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_payroll_cycle_period_version" ON "payroll_cycles" ("tenantId", "year", "month", "version")`);
    await queryRunner.query(`CREATE INDEX "IDX_payroll_cycle_tenant_status" ON "payroll_cycles" ("tenantId", "status")`);

    await queryRunner.query(`
      CREATE TABLE "payroll_cycle_events" (
        "payrollCycleEventId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "payrollCycleId" uuid NOT NULL,
        "action" varchar(80) NOT NULL,
        "fromStatus" varchar(40),
        "toStatus" varchar(40),
        "actorUserId" uuid,
        "note" text,
        "details" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payroll_cycle_events" PRIMARY KEY ("payrollCycleEventId"),
        CONSTRAINT "FK_payroll_cycle_event_cycle" FOREIGN KEY ("payrollCycleId") REFERENCES "payroll_cycles"("payrollCycleId") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_payroll_cycle_event_timeline" ON "payroll_cycle_events" ("tenantId", "payrollCycleId", "createdAt")`);

    await queryRunner.query(`
      CREATE TABLE "payroll_tax_statements" (
        "payrollTaxStatementId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "employeeId" uuid NOT NULL,
        "financialYear" varchar(20) NOT NULL,
        "statementType" varchar(50) NOT NULL,
        "status" varchar(30) NOT NULL DEFAULT 'pending',
        "partnerReference" varchar(160),
        "notes" text,
        "updatedBy" uuid,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payroll_tax_statements" PRIMARY KEY ("payrollTaxStatementId"),
        CONSTRAINT "FK_payroll_tax_statement_employee" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_payroll_tax_statement_unique" ON "payroll_tax_statements" ("tenantId", "employeeId", "financialYear", "statementType")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "payroll_tax_statements"`);
    await queryRunner.query(`DROP TABLE "payroll_cycle_events"`);
    await queryRunner.query(`DROP TABLE "payroll_cycles"`);
  }
}
