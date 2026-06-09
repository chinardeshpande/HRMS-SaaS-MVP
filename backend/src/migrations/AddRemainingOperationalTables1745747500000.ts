import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRemainingOperationalTables1745747500000 implements MigrationInterface {
  name = 'AddRemainingOperationalTables1745747500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "compensation_history" (
        "historyId" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "employeeId" uuid NOT NULL,
        "changeType" varchar(50) NOT NULL,
        "component" varchar(50) NOT NULL DEFAULT 'base_salary',
        "previousAmount" decimal(12,2),
        "newAmount" decimal(12,2) NOT NULL,
        "changeAmount" decimal(12,2),
        "changePercentage" decimal(5,2),
        "currency" varchar(3) NOT NULL DEFAULT 'USD',
        "effectiveDate" date NOT NULL,
        "reason" text,
        "notes" text,
        "approvedBy" uuid,
        "approvedAt" timestamp,
        "performanceReviewId" uuid,
        "performanceRating" decimal(3,2),
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_comp_history_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE,
        CONSTRAINT "FK_comp_history_employee" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE CASCADE,
        CONSTRAINT "FK_comp_history_approver" FOREIGN KEY ("approvedBy") REFERENCES "employees"("employeeId") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "position_history" (
        "historyId" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "employeeId" uuid NOT NULL,
        "changeType" varchar(50) NOT NULL,
        "fromDepartmentId" uuid,
        "fromDesignationId" uuid,
        "fromJobTitle" varchar(255),
        "toDepartmentId" uuid,
        "toDesignationId" uuid,
        "toJobTitle" varchar(255),
        "effectiveDate" date NOT NULL,
        "reason" text,
        "notes" text,
        "approvedBy" uuid,
        "approvedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_position_history_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE,
        CONSTRAINT "FK_position_history_employee" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE CASCADE,
        CONSTRAINT "FK_position_history_from_department" FOREIGN KEY ("fromDepartmentId") REFERENCES "departments"("departmentId") ON DELETE SET NULL,
        CONSTRAINT "FK_position_history_from_designation" FOREIGN KEY ("fromDesignationId") REFERENCES "designations"("designationId") ON DELETE SET NULL,
        CONSTRAINT "FK_position_history_to_department" FOREIGN KEY ("toDepartmentId") REFERENCES "departments"("departmentId") ON DELETE SET NULL,
        CONSTRAINT "FK_position_history_to_designation" FOREIGN KEY ("toDesignationId") REFERENCES "designations"("designationId") ON DELETE SET NULL,
        CONSTRAINT "FK_position_history_approver" FOREIGN KEY ("approvedBy") REFERENCES "employees"("employeeId") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "training_records" (
        "trainingRecordId" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "employeeId" uuid,
        "candidateId" uuid,
        "trainingType" varchar(100) NOT NULL,
        "trainingName" varchar(255) NOT NULL,
        "description" text,
        "status" varchar(50) NOT NULL DEFAULT 'pending',
        "scheduledDate" date,
        "completionDate" date,
        "isRequired" boolean NOT NULL DEFAULT false,
        "isMandatory" boolean NOT NULL DEFAULT false,
        "durationHours" integer,
        "trainer" varchar(255),
        "location" varchar(255),
        "deliveryMode" varchar(50),
        "materialsProvided" text,
        "scoreObtained" integer,
        "scoreMaximum" integer,
        "certificateIssued" boolean NOT NULL DEFAULT false,
        "certificatePath" text,
        "completedBy" uuid,
        "verifiedBy" uuid,
        "verifiedDate" date,
        "feedbackComments" text,
        "feedbackRating" integer,
        "notes" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_training_records_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE,
        CONSTRAINT "FK_training_records_employee" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE SET NULL,
        CONSTRAINT "FK_training_records_candidate" FOREIGN KEY ("candidateId") REFERENCES "candidates"("candidateId") ON DELETE SET NULL,
        CONSTRAINT "FK_training_records_completed_by" FOREIGN KEY ("completedBy") REFERENCES "employees"("employeeId") ON DELETE SET NULL,
        CONSTRAINT "FK_training_records_verified_by" FOREIGN KEY ("verifiedBy") REFERENCES "employees"("employeeId") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "asset_records" (
        "assetRecordId" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "employeeId" uuid,
        "candidateId" uuid,
        "assetType" varchar(100) NOT NULL,
        "assetName" varchar(255) NOT NULL,
        "description" text,
        "brand" varchar(255),
        "model" varchar(255),
        "serialNumber" varchar(100) NOT NULL,
        "assetTag" varchar(100),
        "status" varchar(50) NOT NULL DEFAULT 'assigned',
        "assignedDate" date NOT NULL,
        "returnDate" date,
        "expectedReturnDate" date,
        "assignedBy" uuid,
        "returnedTo" uuid,
        "condition" varchar(50),
        "purchasePrice" decimal(10,2),
        "purchaseDate" date,
        "warrantyExpiryDate" date,
        "specifications" text,
        "location" varchar(255),
        "isReturnable" boolean NOT NULL DEFAULT false,
        "isReturned" boolean NOT NULL DEFAULT false,
        "requiresAcknowledgement" boolean NOT NULL DEFAULT false,
        "isAcknowledged" boolean NOT NULL DEFAULT false,
        "acknowledgementDate" date,
        "acknowledgementSignature" text,
        "damageReportDetails" text,
        "damageCharges" decimal(10,2),
        "returnConditionNotes" text,
        "notes" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_asset_records_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE,
        CONSTRAINT "FK_asset_records_employee" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE SET NULL,
        CONSTRAINT "FK_asset_records_candidate" FOREIGN KEY ("candidateId") REFERENCES "candidates"("candidateId") ON DELETE SET NULL,
        CONSTRAINT "FK_asset_records_assigned_by" FOREIGN KEY ("assignedBy") REFERENCES "employees"("employeeId") ON DELETE SET NULL,
        CONSTRAINT "FK_asset_records_returned_to" FOREIGN KEY ("returnedTo") REFERENCES "employees"("employeeId") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payroll_setups" (
        "payrollSetupId" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "employeeId" uuid,
        "candidateId" uuid,
        "bankName" varchar(255) NOT NULL,
        "bankBranch" varchar(100) NOT NULL,
        "accountNumber" varchar(50) NOT NULL,
        "ifscCode" varchar(50) NOT NULL,
        "accountHolderName" varchar(100),
        "accountType" varchar(50) NOT NULL DEFAULT 'savings',
        "bankDetailsVerified" boolean NOT NULL DEFAULT false,
        "bankDetailsVerifiedDate" date,
        "bankDetailsVerifiedBy" uuid,
        "panNumber" varchar(10) NOT NULL,
        "panHolderName" varchar(255),
        "panVerified" boolean NOT NULL DEFAULT false,
        "panVerifiedDate" date,
        "panVerifiedBy" uuid,
        "panDocumentPath" text,
        "uanNumber" varchar(12),
        "uanVerified" boolean NOT NULL DEFAULT false,
        "uanVerifiedDate" date,
        "uanVerifiedBy" uuid,
        "aadhaarNumber" varchar(12),
        "aadhaarVerified" boolean NOT NULL DEFAULT false,
        "aadhaarVerifiedDate" date,
        "aadhaarVerifiedBy" uuid,
        "aadhaarDocumentPath" text,
        "pfNumber" varchar(50),
        "pfApplicable" boolean NOT NULL DEFAULT false,
        "pfNomineeSubmitted" boolean NOT NULL DEFAULT false,
        "pfNomineeName" varchar(255),
        "pfNomineeRelation" varchar(100),
        "esiNumber" varchar(50),
        "esiApplicable" boolean NOT NULL DEFAULT false,
        "esiNomineeSubmitted" boolean NOT NULL DEFAULT false,
        "esiNomineeName" varchar(255),
        "esiNomineeRelation" varchar(100),
        "basicSalary" decimal(12,2),
        "hra" decimal(12,2),
        "specialAllowance" decimal(12,2),
        "otherAllowances" decimal(12,2),
        "grossSalary" decimal(12,2),
        "ctc" decimal(12,2),
        "taxRegime" varchar(50),
        "form16Available" boolean NOT NULL DEFAULT false,
        "form16Path" text,
        "investmentDeclarationSubmitted" boolean NOT NULL DEFAULT false,
        "verificationStatus" varchar(50) NOT NULL DEFAULT 'pending',
        "setupCompletedDate" date,
        "setupCompletedBy" uuid,
        "rejectionReason" text,
        "notes" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_payroll_setups_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE,
        CONSTRAINT "FK_payroll_setups_employee" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE SET NULL,
        CONSTRAINT "FK_payroll_setups_candidate" FOREIGN KEY ("candidateId") REFERENCES "candidates"("candidateId") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "company_registrations" (
        "registrationId" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "companyName" varchar(255) NOT NULL,
        "adminEmail" varchar(255) NOT NULL UNIQUE,
        "adminFullName" varchar(255) NOT NULL,
        "phone" varchar(20),
        "industry" varchar(100),
        "companySize" varchar(50),
        "registrationToken" varchar(255) NOT NULL UNIQUE,
        "tokenExpiry" timestamp NOT NULL,
        "isEmailVerified" boolean NOT NULL DEFAULT false,
        "status" varchar(50) NOT NULL DEFAULT 'pending',
        "selectedPlan" varchar(50),
        "selectedBillingCycle" varchar(50),
        "utmSource" varchar(100),
        "utmCampaign" varchar(100),
        "tenantId" uuid,
        "completedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "onboarding_progress" (
        "progressId" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "currentStep" integer NOT NULL DEFAULT 1,
        "completedSteps" text NOT NULL DEFAULT '',
        "stepData" jsonb NOT NULL DEFAULT '{}',
        "isComplete" boolean NOT NULL DEFAULT false,
        "skippedSteps" text,
        "completedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_onboarding_progress_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_invitations" (
        "invitationId" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "email" varchar(255) NOT NULL,
        "fullName" varchar(255) NOT NULL,
        "role" varchar(50) NOT NULL DEFAULT 'employee',
        "departmentId" uuid,
        "invitedBy" uuid NOT NULL,
        "invitationToken" varchar(255) NOT NULL UNIQUE,
        "tokenExpiry" timestamp NOT NULL,
        "status" varchar(50) NOT NULL DEFAULT 'pending',
        "acceptedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_user_invitations_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE,
        CONSTRAINT "FK_user_invitations_invited_by" FOREIGN KEY ("invitedBy") REFERENCES "users"("userId") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_compensation_history_tenant_employee_effective" ON "compensation_history" ("tenantId", "employeeId", "effectiveDate")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_position_history_tenant_employee_effective" ON "position_history" ("tenantId", "employeeId", "effectiveDate")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_training_records_tenant_employee" ON "training_records" ("tenantId", "employeeId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_training_records_tenant_candidate" ON "training_records" ("tenantId", "candidateId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_training_records_type_status" ON "training_records" ("tenantId", "trainingType", "status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_training_records_completion" ON "training_records" ("tenantId", "completionDate")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_asset_records_tenant_employee" ON "asset_records" ("tenantId", "employeeId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_asset_records_tenant_candidate" ON "asset_records" ("tenantId", "candidateId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_asset_records_type_status" ON "asset_records" ("tenantId", "assetType", "status")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_asset_records_serial" ON "asset_records" ("tenantId", "serialNumber")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_asset_records_assigned" ON "asset_records" ("tenantId", "assignedDate")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_payroll_setups_employee" ON "payroll_setups" ("tenantId", "employeeId") WHERE "employeeId" IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_payroll_setups_candidate" ON "payroll_setups" ("tenantId", "candidateId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_payroll_setups_status" ON "payroll_setups" ("tenantId", "verificationStatus")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_payroll_setups_pan" ON "payroll_setups" ("tenantId", "panNumber")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_invitations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "onboarding_progress"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "company_registrations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payroll_setups"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "asset_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "training_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "position_history"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "compensation_history"`);
  }
}
