import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompensationTracking1771000500000 implements MigrationInterface {
  name = 'AddCompensationTracking1771000500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "salary_structure_status_enum" AS ENUM ('draft', 'active', 'superseded', 'archived');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "salary_approval_status_enum" AS ENUM ('draft', 'pending', 'approved');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "salary_component_type_enum" AS ENUM ('earning', 'deduction', 'employer_contribution');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payslip_component_type_enum" AS ENUM ('earning', 'deduction', 'employer_contribution');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payslip_status_enum" AS ENUM ('draft', 'uploaded', 'final', 'shared', 'corrected');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "compensation_share_channel_enum" AS ENUM ('email', 'whatsapp', 'hr_connect');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "compensation_share_status_enum" AS ENUM ('logged', 'sent', 'failed', 'viewed');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "salary_structures" (
        "structureId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "employeeId" uuid NOT NULL,
        "structureName" varchar(120) NOT NULL DEFAULT 'Current Salary Structure',
        "effectiveFrom" date NOT NULL,
        "effectiveTo" date,
        "annualCtc" decimal(12,2) NOT NULL DEFAULT 0,
        "monthlyGross" decimal(12,2) NOT NULL DEFAULT 0,
        "monthlyNetEstimate" decimal(12,2) NOT NULL DEFAULT 0,
        "currency" varchar(3) NOT NULL DEFAULT 'INR',
        "payFrequency" varchar(30) NOT NULL DEFAULT 'monthly',
        "paymentMode" varchar(50) NOT NULL DEFAULT 'bank_transfer',
        "status" "salary_structure_status_enum" NOT NULL DEFAULT 'draft',
        "approvalStatus" "salary_approval_status_enum" NOT NULL DEFAULT 'draft',
        "employeeVisible" boolean NOT NULL DEFAULT false,
        "remarks" text,
        "createdBy" uuid,
        "updatedBy" uuid,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_salary_structures" PRIMARY KEY ("structureId"),
        CONSTRAINT "FK_salary_structures_employee" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "salary_components" (
        "componentId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "salaryStructureId" uuid NOT NULL,
        "componentName" varchar(120) NOT NULL,
        "componentType" "salary_component_type_enum" NOT NULL DEFAULT 'earning',
        "monthlyAmount" decimal(12,2) NOT NULL DEFAULT 0,
        "annualAmount" decimal(12,2) NOT NULL DEFAULT 0,
        "taxable" boolean NOT NULL DEFAULT true,
        "statutory" boolean NOT NULL DEFAULT false,
        "displayOrder" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_salary_components" PRIMARY KEY ("componentId"),
        CONSTRAINT "FK_salary_components_structure" FOREIGN KEY ("salaryStructureId") REFERENCES "salary_structures"("structureId") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payslips" (
        "payslipId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "employeeId" uuid NOT NULL,
        "salaryStructureId" uuid,
        "month" integer NOT NULL,
        "year" integer NOT NULL,
        "grossEarnings" decimal(12,2) NOT NULL DEFAULT 0,
        "totalDeductions" decimal(12,2) NOT NULL DEFAULT 0,
        "netPay" decimal(12,2) NOT NULL DEFAULT 0,
        "paidDays" decimal(5,2) NOT NULL DEFAULT 0,
        "lopDays" decimal(5,2) NOT NULL DEFAULT 0,
        "paymentDate" date,
        "status" "payslip_status_enum" NOT NULL DEFAULT 'draft',
        "employeeVisible" boolean NOT NULL DEFAULT false,
        "remarks" text,
        "internalNotes" text,
        "generatedBy" uuid,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payslips" PRIMARY KEY ("payslipId"),
        CONSTRAINT "FK_payslips_employee" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE CASCADE,
        CONSTRAINT "FK_payslips_structure" FOREIGN KEY ("salaryStructureId") REFERENCES "salary_structures"("structureId") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payslip_components" (
        "componentId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "payslipId" uuid NOT NULL,
        "componentName" varchar(120) NOT NULL,
        "componentType" "payslip_component_type_enum" NOT NULL DEFAULT 'earning',
        "amount" decimal(12,2) NOT NULL DEFAULT 0,
        "displayOrder" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_payslip_components" PRIMARY KEY ("componentId"),
        CONSTRAINT "FK_payslip_components_payslip" FOREIGN KEY ("payslipId") REFERENCES "payslips"("payslipId") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payslip_attachments" (
        "attachmentId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "payslipId" uuid NOT NULL,
        "fileName" varchar(255) NOT NULL,
        "fileType" varchar(100) NOT NULL,
        "fileUrl" text NOT NULL,
        "fileSize" bigint NOT NULL DEFAULT 0,
        "uploadedBy" uuid,
        "isPrimary" boolean NOT NULL DEFAULT true,
        "version" integer NOT NULL DEFAULT 1,
        "uploadedOn" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payslip_attachments" PRIMARY KEY ("attachmentId"),
        CONSTRAINT "FK_payslip_attachments_payslip" FOREIGN KEY ("payslipId") REFERENCES "payslips"("payslipId") ON DELETE CASCADE,
        CONSTRAINT "FK_payslip_attachments_uploader" FOREIGN KEY ("uploadedBy") REFERENCES "employees"("employeeId") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "compensation_share_logs" (
        "shareLogId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "employeeId" uuid NOT NULL,
        "payslipId" uuid,
        "channel" "compensation_share_channel_enum" NOT NULL,
        "recipient" varchar(255),
        "status" "compensation_share_status_enum" NOT NULL DEFAULT 'logged',
        "remarks" text,
        "sharedBy" uuid,
        "sharedOn" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_compensation_share_logs" PRIMARY KEY ("shareLogId"),
        CONSTRAINT "FK_compensation_share_logs_employee" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE CASCADE,
        CONSTRAINT "FK_compensation_share_logs_payslip" FOREIGN KEY ("payslipId") REFERENCES "payslips"("payslipId") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_salary_structures_tenant_employee_effective" ON "salary_structures" ("tenantId", "employeeId", "effectiveFrom")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_salary_structures_tenant_employee_status" ON "salary_structures" ("tenantId", "employeeId", "status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_salary_components_tenant_structure" ON "salary_components" ("tenantId", "salaryStructureId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payslips_tenant_employee_period" ON "payslips" ("tenantId", "employeeId", "year", "month")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payslips_tenant_status" ON "payslips" ("tenantId", "status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payslip_components_tenant_payslip" ON "payslip_components" ("tenantId", "payslipId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payslip_attachments_tenant_payslip" ON "payslip_attachments" ("tenantId", "payslipId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_comp_share_logs_tenant_employee" ON "compensation_share_logs" ("tenantId", "employeeId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_comp_share_logs_tenant_payslip" ON "compensation_share_logs" ("tenantId", "payslipId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "compensation_share_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payslip_attachments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payslip_components"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payslips"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "salary_components"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "salary_structures"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "compensation_share_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "compensation_share_channel_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payslip_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payslip_component_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "salary_component_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "salary_approval_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "salary_structure_status_enum"`);
  }
}
