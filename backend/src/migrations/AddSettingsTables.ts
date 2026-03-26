import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettingsTables1234567890123 implements MigrationInterface {
  name = 'AddSettingsTables1234567890123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create subscriptions table
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "subscriptionId" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "plan" varchar(50) NOT NULL DEFAULT 'free',
        "status" varchar(50) NOT NULL DEFAULT 'trial',
        "billingCycle" varchar(50) NOT NULL DEFAULT 'monthly',
        "price" decimal(10,2) NOT NULL DEFAULT 0,
        "maxUsers" integer NOT NULL DEFAULT 10,
        "currentUsers" integer NOT NULL DEFAULT 0,
        "maxStorageGB" integer NOT NULL DEFAULT 5,
        "currentStorageGB" decimal(10,2) NOT NULL DEFAULT 0,
        "startDate" date,
        "endDate" date,
        "trialEndDate" date,
        "nextBillingDate" date,
        "autoRenew" boolean NOT NULL DEFAULT true,
        "features" jsonb,
        "notes" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_subscription_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE
      )
    `);

    // Create organization_settings table
    await queryRunner.query(`
      CREATE TABLE "organization_settings" (
        "settingId" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL UNIQUE,
        "companyName" varchar(255) NOT NULL,
        "companyDescription" text,
        "industry" varchar(255),
        "registrationNumber" varchar(20),
        "taxId" varchar(20),
        "logo" text,
        "email" varchar(255),
        "phone" varchar(20),
        "website" varchar(255),
        "address" text,
        "city" varchar(100),
        "state" varchar(100),
        "postalCode" varchar(20),
        "country" varchar(100),
        "timezone" varchar(50) NOT NULL DEFAULT 'UTC',
        "defaultLanguage" varchar(10) NOT NULL DEFAULT 'en',
        "currency" varchar(10) NOT NULL DEFAULT 'USD',
        "dateFormat" varchar(20) NOT NULL DEFAULT 'MM/DD/YYYY',
        "timeFormat" varchar(20) NOT NULL DEFAULT '12h',
        "fiscalYearStartMonth" integer NOT NULL DEFAULT 1,
        "weekStartDay" integer NOT NULL DEFAULT 0,
        "workingHours" jsonb,
        "notificationSettings" jsonb,
        "twoFactorAuthRequired" boolean NOT NULL DEFAULT true,
        "passwordExpiryDays" integer NOT NULL DEFAULT 30,
        "maxLoginAttempts" integer NOT NULL DEFAULT 5,
        "sessionTimeoutMinutes" integer NOT NULL DEFAULT 30,
        "ipWhitelistEnabled" boolean NOT NULL DEFAULT false,
        "allowedIpAddresses" text[],
        "branding" jsonb,
        "customFields" jsonb,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_org_settings_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE
      )
    `);

    // Create payment_history table
    await queryRunner.query(`
      CREATE TABLE "payment_history" (
        "paymentId" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "subscriptionId" uuid,
        "invoiceNumber" varchar(50) NOT NULL UNIQUE,
        "amount" decimal(10,2) NOT NULL,
        "currency" varchar(10) NOT NULL DEFAULT 'USD',
        "status" varchar(50) NOT NULL DEFAULT 'pending',
        "paymentMethod" varchar(50) NOT NULL,
        "transactionId" varchar(255),
        "paymentGatewayId" varchar(255),
        "description" text,
        "billingPeriodStart" date NOT NULL,
        "billingPeriodEnd" date NOT NULL,
        "taxAmount" decimal(10,2) NOT NULL DEFAULT 0,
        "discountAmount" decimal(10,2) NOT NULL DEFAULT 0,
        "totalAmount" decimal(10,2) NOT NULL,
        "paidAt" timestamp,
        "dueDate" timestamp,
        "invoiceUrl" text,
        "receiptUrl" text,
        "metadata" jsonb,
        "failureReason" text,
        "notes" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_payment_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE,
        CONSTRAINT "FK_payment_subscription" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("subscriptionId") ON DELETE SET NULL
      )
    `);

    // Create permissions table
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "permissionId" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "permissionCode" varchar(100) NOT NULL UNIQUE,
        "permissionName" varchar(255) NOT NULL,
        "description" text,
        "module" varchar(50) NOT NULL,
        "action" varchar(50) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "isSystemPermission" boolean NOT NULL DEFAULT false,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create roles table
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "roleId" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "roleName" varchar(100) NOT NULL,
        "description" text,
        "isSystemRole" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "level" integer NOT NULL DEFAULT 0,
        "employeeCount" integer NOT NULL DEFAULT 0,
        "dataAccessRules" jsonb,
        "customPermissions" jsonb,
        "notes" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_role_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE
      )
    `);

    // Create role_permissions junction table
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "roleId" uuid NOT NULL,
        "permissionId" uuid NOT NULL,
        PRIMARY KEY ("roleId", "permissionId"),
        CONSTRAINT "FK_role_perm_role" FOREIGN KEY ("roleId") REFERENCES "roles"("roleId") ON DELETE CASCADE,
        CONSTRAINT "FK_role_perm_permission" FOREIGN KEY ("permissionId") REFERENCES "permissions"("permissionId") ON DELETE CASCADE
      )
    `);

    // Create business_rules table
    await queryRunner.query(`
      CREATE TABLE "business_rules" (
        "ruleId" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "category" varchar(50) NOT NULL,
        "ruleName" varchar(255) NOT NULL,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "leaveRules" jsonb,
        "attendanceRules" jsonb,
        "payrollRules" jsonb,
        "performanceRules" jsonb,
        "onboardingRules" jsonb,
        "exitRules" jsonb,
        "customWorkflows" jsonb,
        "priority" integer NOT NULL DEFAULT 0,
        "effectiveFrom" date,
        "effectiveTo" date,
        "notes" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_rule_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE
      )
    `);

    // Add roleId column to employees table
    await queryRunner.query(`
      ALTER TABLE "employees" ADD COLUMN "roleId" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "employees" ADD CONSTRAINT "FK_employee_role" FOREIGN KEY ("roleId") REFERENCES "roles"("roleId") ON DELETE SET NULL
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_subscription_tenant" ON "subscriptions" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_payment_tenant" ON "payment_history" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_payment_status" ON "payment_history" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_role_tenant" ON "roles" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_rule_tenant" ON "business_rules" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_rule_category" ON "business_rules" ("category")`);
    await queryRunner.query(`CREATE INDEX "IDX_employee_role" ON "employees" ("roleId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_employee_role"`);
    await queryRunner.query(`DROP INDEX "IDX_rule_category"`);
    await queryRunner.query(`DROP INDEX "IDX_rule_tenant"`);
    await queryRunner.query(`DROP INDEX "IDX_role_tenant"`);
    await queryRunner.query(`DROP INDEX "IDX_payment_status"`);
    await queryRunner.query(`DROP INDEX "IDX_payment_tenant"`);
    await queryRunner.query(`DROP INDEX "IDX_subscription_tenant"`);

    // Drop foreign key and column from employees
    await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_employee_role"`);
    await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "roleId"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "business_rules"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TABLE "payment_history"`);
    await queryRunner.query(`DROP TABLE "organization_settings"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
  }
}
