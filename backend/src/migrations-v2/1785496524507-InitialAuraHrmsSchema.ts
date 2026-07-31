import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialAuraHrmsSchema1785496524507 implements MigrationInterface {
    name = 'InitialAuraHrmsSchema1785496524507'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "departments" (
                "departmentId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "name" character varying(255) NOT NULL,
                "parentDeptId" uuid,
                "headEmployeeId" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_d9ac7b332995d6651ef42398069" PRIMARY KEY ("departmentId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_617394da01e48b2fea5dc80fe2" ON "departments" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_119d3439d334ce530468cfaf1b" ON "departments" ("tenantId", "name")
        `);
        await queryRunner.query(`
            CREATE TABLE "designations" (
                "designationId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "name" character varying(255) NOT NULL,
                "level" integer,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_718530f2c1434e4a20ac1ef5ace" PRIMARY KEY ("designationId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_13b9ac48f0fa4a277c821cdcc4" ON "designations" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_287bb78431339c80b125ee6563" ON "designations" ("tenantId", "name")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."permissions_module_enum" AS ENUM(
                'dashboard',
                'employees',
                'attendance',
                'leave',
                'payroll',
                'performance',
                'recruitment',
                'onboarding',
                'exit_management',
                'documents',
                'reports',
                'settings',
                'hr_connect',
                'calendar',
                'projects',
                'assets',
                'announcements'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."permissions_action_enum" AS ENUM(
                'view',
                'create',
                'edit',
                'delete',
                'approve',
                'reject',
                'export',
                'import',
                'manage'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "permissions" (
                "permissionId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "permissionCode" character varying(100) NOT NULL,
                "permissionName" character varying(255) NOT NULL,
                "description" text,
                "module" "public"."permissions_module_enum" NOT NULL,
                "action" "public"."permissions_action_enum" NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "isSystemPermission" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_048d885e86d4ba906cab6e4c9df" UNIQUE ("permissionCode"),
                CONSTRAINT "PK_b4b17d691e3c22be36b2b9f355a" PRIMARY KEY ("permissionId")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "roles" (
                "roleId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "roleName" character varying(100) NOT NULL,
                "description" text,
                "isSystemRole" boolean NOT NULL DEFAULT false,
                "isActive" boolean NOT NULL DEFAULT true,
                "level" integer NOT NULL DEFAULT '0',
                "employeeCount" integer NOT NULL DEFAULT '0',
                "dataAccessRules" jsonb,
                "customPermissions" jsonb,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_39bf7e8af8fe54d9d1c7a8efe6f" PRIMARY KEY ("roleId")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "employees" (
                "employeeId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "employeeCode" character varying(50) NOT NULL,
                "firstName" character varying(100) NOT NULL,
                "lastName" character varying(100) NOT NULL,
                "email" character varying(255) NOT NULL,
                "phone" character varying(20),
                "dateOfBirth" date,
                "gender" character varying(20),
                "maritalStatus" character varying(30),
                "nationality" character varying(100),
                "address" text,
                "emergencyContact" character varying(150),
                "emergencyPhone" character varying(30),
                "departmentId" uuid,
                "designationId" uuid,
                "managerId" uuid,
                "roleId" uuid,
                "dateOfJoining" date NOT NULL,
                "probationEndDate" date,
                "employmentType" character varying(50),
                "workLocation" character varying(150),
                "status" character varying(20) NOT NULL DEFAULT 'active',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_fa00ce161b51b02fdf992ea9528" PRIMARY KEY ("employeeId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ea6a339e5a0792172d53d405b0" ON "employees" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_faa35befc241081a6b05010396" ON "employees" ("status")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_5a00024776c7192f02e0ff6e8f" ON "employees" ("tenantId", "email")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_c7920fb29b588a51fdde280908" ON "employees" ("tenantId", "employeeCode")
        `);
        await queryRunner.query(`
            CREATE TABLE "users" (
                "userId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "email" character varying(255) NOT NULL,
                "passwordHash" character varying(255) NOT NULL,
                "fullName" character varying(255) NOT NULL,
                "role" character varying(50) NOT NULL,
                "employeeId" uuid,
                "profilePhotoUrl" character varying(500),
                "isActive" boolean NOT NULL DEFAULT true,
                "lastLogin" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_8bf09ba754322ab9c22a215c919" PRIMARY KEY ("userId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c58f7e88c286e5e3478960a998" ON "users" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_7346b08032078107fce81e014f" ON "users" ("tenantId", "email")
        `);
        await queryRunner.query(`
            CREATE TABLE "tenants" (
                "tenantId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "companyName" character varying(255) NOT NULL,
                "subdomain" character varying(100),
                "planType" character varying(50) NOT NULL DEFAULT 'basic',
                "status" character varying(20) NOT NULL DEFAULT 'active',
                "logoUrl" text,
                "primaryColor" character varying(7),
                "isTrialActive" boolean NOT NULL DEFAULT true,
                "trialStartDate" TIMESTAMP,
                "trialEndDate" TIMESTAMP,
                "onboardingCompleted" boolean NOT NULL DEFAULT false,
                "onboardingCompletedAt" TIMESTAMP,
                "employeeCount" integer NOT NULL DEFAULT '0',
                "setupWizardCompleted" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_21bb89e012fa5b58532009c1601" UNIQUE ("subdomain"),
                CONSTRAINT "PK_5d1f2d0d0b5f5c5e1720082ebbd" PRIMARY KEY ("tenantId")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."user_invitations_role_enum" AS ENUM(
                'employee',
                'manager',
                'hr_admin',
                'system_admin'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."user_invitations_status_enum" AS ENUM('pending', 'accepted', 'expired', 'cancelled')
        `);
        await queryRunner.query(`
            CREATE TABLE "user_invitations" (
                "invitationId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "email" character varying(255) NOT NULL,
                "fullName" character varying(255) NOT NULL,
                "role" "public"."user_invitations_role_enum" NOT NULL DEFAULT 'employee',
                "departmentId" uuid,
                "invitedBy" uuid NOT NULL,
                "invitationToken" character varying(255) NOT NULL,
                "tokenExpiry" TIMESTAMP NOT NULL,
                "status" "public"."user_invitations_status_enum" NOT NULL DEFAULT 'pending',
                "acceptedAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_3b4cfe0b9336e3c906dbbe727ba" UNIQUE ("invitationToken"),
                CONSTRAINT "PK_89cd4471e1804a509ba695ea8c9" PRIMARY KEY ("invitationId")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."candidates_currentstate_enum" AS ENUM(
                'offer_approved',
                'offer_sent',
                'offer_accepted',
                'docs_pending',
                'docs_submitted',
                'hr_review',
                'bgv_in_progress',
                'bgv_passed',
                'bgv_discrepancy',
                'pre_joining_setup',
                'joined',
                'orientation',
                'onboarding_complete'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "candidates" (
                "candidateId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "firstName" character varying(100) NOT NULL,
                "lastName" character varying(100) NOT NULL,
                "email" character varying(255) NOT NULL,
                "phone" character varying(20),
                "dateOfBirth" date,
                "gender" character varying(50),
                "currentState" "public"."candidates_currentstate_enum" NOT NULL DEFAULT 'offer_approved',
                "departmentId" uuid,
                "designationId" uuid,
                "reportingManagerId" uuid,
                "offeredSalary" numeric(12, 2) NOT NULL,
                "currency" character varying(3) NOT NULL DEFAULT 'INR',
                "expectedJoinDate" date NOT NULL,
                "actualJoinDate" date,
                "offerSentDate" date,
                "offerAcceptedDate" date,
                "offerExpiryDate" date,
                "employeeId" uuid,
                "employmentType" character varying(50),
                "workLocation" character varying(255),
                "address" text,
                "city" character varying(100),
                "state" character varying(100),
                "pincode" character varying(20),
                "emergencyContactName" character varying(255),
                "emergencyContactPhone" character varying(20),
                "emergencyContactRelation" character varying(100),
                "remarks" text,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "REL_4b5164be10928cde40c51a6278" UNIQUE ("employeeId"),
                CONSTRAINT "PK_0bd3de8cb6863cd20bab3da4289" PRIMARY KEY ("candidateId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_74ec758b7c9c0422b2dc4f708a" ON "candidates" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_9358f2da5870260a24e5431c5a" ON "candidates" ("tenantId", "expectedJoinDate")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_448a04b62704ca3549607375e0" ON "candidates" ("tenantId", "currentState")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_95715790f97a7c144db5dbdc18" ON "candidates" ("tenantId", "email")
        `);
        await queryRunner.query(`
            CREATE TABLE "training_records" (
                "trainingRecordId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "employeeId" uuid,
                "candidateId" uuid,
                "trainingType" character varying(100) NOT NULL,
                "trainingName" character varying(255) NOT NULL,
                "description" text,
                "status" character varying(50) NOT NULL DEFAULT 'pending',
                "scheduledDate" date,
                "completionDate" date,
                "isRequired" boolean NOT NULL DEFAULT false,
                "isMandatory" boolean NOT NULL DEFAULT false,
                "durationHours" integer,
                "trainer" character varying(255),
                "location" character varying(255),
                "deliveryMode" character varying(50),
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
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_ef9c1193ee9ca68548ae4757317" PRIMARY KEY ("trainingRecordId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6109771f8f3fb7e3194564185e" ON "training_records" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_28b721d715e7f45ead5b29f362" ON "training_records" ("tenantId", "completionDate")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_cb7ac60c24fe6cfa44b14001e4" ON "training_records" ("tenantId", "trainingType", "status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_d48b4c2fe6c931dba15bd01e2c" ON "training_records" ("tenantId", "candidateId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_a2a0460b4692dd714f7ce24992" ON "training_records" ("tenantId", "employeeId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."attendance_status_enum" AS ENUM(
                'present',
                'absent',
                'half_day',
                'on_leave',
                'holiday',
                'weekend'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "attendance" (
                "attendanceId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "employeeId" uuid NOT NULL,
                "tenantId" uuid NOT NULL,
                "date" date NOT NULL,
                "checkIn" TIMESTAMP,
                "checkOut" TIMESTAMP,
                "workMinutes" integer NOT NULL DEFAULT '0',
                "breakMinutes" integer NOT NULL DEFAULT '0',
                "overtimeMinutes" integer NOT NULL DEFAULT '0',
                "status" "public"."attendance_status_enum" NOT NULL DEFAULT 'absent',
                "isLate" boolean NOT NULL DEFAULT false,
                "lateMinutes" integer NOT NULL DEFAULT '0',
                "isEarlyOut" boolean NOT NULL DEFAULT false,
                "earlyMinutes" integer NOT NULL DEFAULT '0',
                "isManualOverride" boolean NOT NULL DEFAULT false,
                "overriddenBy" uuid,
                "overriddenAt" TIMESTAMP,
                "overrideReason" text,
                "notes" text,
                "ipAddress" character varying(50),
                "location" character varying(200),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_a34254a04b8d7f1379eeff6ea9a" PRIMARY KEY ("attendanceId")
            );
            COMMENT ON COLUMN "attendance"."workMinutes" IS 'Total work minutes';
            COMMENT ON COLUMN "attendance"."breakMinutes" IS 'Break minutes';
            COMMENT ON COLUMN "attendance"."overtimeMinutes" IS 'Overtime minutes'
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_07731c02b0333dc9b2678f9821" ON "attendance" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_180d196307c19bf2f3adcf04dc" ON "attendance" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_3916813c1eb0e44c0cff3f43e6" ON "attendance" ("tenantId", "date")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_9bc37e611804f2566dbb4c85d2" ON "attendance" ("employeeId", "date")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."time_entry_edits_status_enum" AS ENUM('pending', 'approved', 'rejected')
        `);
        await queryRunner.query(`
            CREATE TABLE "time_entry_edits" (
                "editId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "employeeId" uuid NOT NULL,
                "tenantId" uuid NOT NULL,
                "attendanceId" uuid NOT NULL,
                "originalCheckIn" TIMESTAMP,
                "originalCheckOut" TIMESTAMP,
                "requestedCheckIn" TIMESTAMP,
                "requestedCheckOut" TIMESTAMP,
                "reason" text NOT NULL,
                "status" "public"."time_entry_edits_status_enum" NOT NULL DEFAULT 'pending',
                "approverId" uuid,
                "approvedAt" TIMESTAMP,
                "approverComments" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_c0471b63ee788dd38ab5201a2ed" PRIMARY KEY ("editId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c15d6bbefa030f65c96efa844e" ON "time_entry_edits" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8576319b025393d5bb9f8da4c3" ON "time_entry_edits" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_87dd7a8abaafb3a8bddb259aea" ON "time_entry_edits" ("status", "tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_a3972e61258bd508990d6545ae" ON "time_entry_edits" ("employeeId", "attendanceId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."subscriptions_plan_enum" AS ENUM('free', 'starter', 'professional', 'enterprise')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."subscriptions_status_enum" AS ENUM(
                'active',
                'trial',
                'expired',
                'cancelled',
                'suspended'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."subscriptions_billingcycle_enum" AS ENUM('monthly', 'quarterly', 'yearly')
        `);
        await queryRunner.query(`
            CREATE TABLE "subscriptions" (
                "subscriptionId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "plan" "public"."subscriptions_plan_enum" NOT NULL DEFAULT 'free',
                "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'trial',
                "billingCycle" "public"."subscriptions_billingcycle_enum" NOT NULL DEFAULT 'monthly',
                "price" numeric(10, 2) NOT NULL DEFAULT '0',
                "maxUsers" integer NOT NULL DEFAULT '10',
                "currentUsers" integer NOT NULL DEFAULT '0',
                "maxStorageGB" integer NOT NULL DEFAULT '5',
                "currentStorageGB" numeric(10, 2) NOT NULL DEFAULT '0',
                "startDate" date,
                "endDate" date,
                "trialEndDate" date,
                "nextBillingDate" date,
                "autoRenew" boolean NOT NULL DEFAULT true,
                "features" jsonb,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_06ba17ac2e047b1ef52051edf09" PRIMARY KEY ("subscriptionId")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "status_transitions" (
                "transitionId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "entityType" character varying(50) NOT NULL,
                "entityId" uuid NOT NULL,
                "candidateId" uuid,
                "employeeId" uuid,
                "fromState" character varying(100) NOT NULL,
                "toState" character varying(100) NOT NULL,
                "transitionDate" TIMESTAMP NOT NULL DEFAULT now(),
                "triggeredBy" uuid NOT NULL,
                "triggerType" character varying(50) NOT NULL DEFAULT 'manual',
                "reason" text,
                "metadata" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_43312479bba6f934599bfe56b62" PRIMARY KEY ("transitionId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_da842c6cbd1c8640b6efd576d1" ON "status_transitions" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_08ef87528353c263a9a75ad994" ON "status_transitions" ("tenantId", "triggeredBy")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_119ec5abfc51f0c60363106579" ON "status_transitions" ("tenantId", "transitionDate")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_d4a3be05ff24e1ce108b4f7b05" ON "status_transitions" ("tenantId", "entityType", "entityId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."saved_reports_category_enum" AS ENUM(
                'workforce',
                'onboarding',
                'attendance',
                'leave',
                'performance',
                'confirmation',
                'exit',
                'compliance'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."saved_reports_reporttype_enum" AS ENUM(
                'headcount',
                'joiners_leavers',
                'org_movement',
                'span_of_control',
                'offer_conversion',
                'onboarding_status',
                'joining_readiness',
                'attendance_summary',
                'late_marks',
                'shift_adherence',
                'overtime_summary',
                'leave_balance',
                'leave_utilization',
                'leave_concentration',
                'leave_liability',
                'goal_completion',
                'review_completion',
                'rating_distribution',
                'confirmation_due',
                'probation_trends',
                'attrition',
                'exit_clearance',
                'notice_adherence',
                'missing_documents',
                'expiring_documents',
                'audit_trail',
                'policy_acknowledgment'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."saved_reports_outputformat_enum" AS ENUM('pdf', 'excel', 'csv', 'json')
        `);
        await queryRunner.query(`
            CREATE TABLE "saved_reports" (
                "reportId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "createdBy" uuid NOT NULL,
                "reportName" character varying(200) NOT NULL,
                "description" text,
                "category" "public"."saved_reports_category_enum" NOT NULL,
                "reportType" "public"."saved_reports_reporttype_enum" NOT NULL,
                "filterConfig" jsonb NOT NULL,
                "chartConfig" jsonb,
                "outputFormat" "public"."saved_reports_outputformat_enum" NOT NULL DEFAULT 'pdf',
                "scheduleConfig" jsonb,
                "isActive" boolean NOT NULL DEFAULT true,
                "isPublic" boolean NOT NULL DEFAULT false,
                "executionCount" integer NOT NULL DEFAULT '0',
                "lastExecutedAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_2af566b6bb3400b48cf72c09bf1" PRIMARY KEY ("reportId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_3b62a07d9c699845bb874440d2" ON "saved_reports" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_aeee0af6368802980a54fc4ab9" ON "saved_reports" ("tenantId", "reportType")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6dae104daa2f22af8b79db6737" ON "saved_reports" ("tenantId", "createdBy")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_d7b348ebc736b68119bf93db9c" ON "saved_reports" ("tenantId", "reportName")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."salary_component_type_enum" AS ENUM('earning', 'deduction', 'employer_contribution')
        `);
        await queryRunner.query(`
            CREATE TABLE "salary_components" (
                "componentId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "salaryStructureId" uuid NOT NULL,
                "componentName" character varying(120) NOT NULL,
                "componentType" "public"."salary_component_type_enum" NOT NULL DEFAULT 'earning',
                "monthlyAmount" numeric(12, 2) NOT NULL DEFAULT '0',
                "annualAmount" numeric(12, 2) NOT NULL DEFAULT '0',
                "taxable" boolean NOT NULL DEFAULT true,
                "statutory" boolean NOT NULL DEFAULT false,
                "displayOrder" integer NOT NULL DEFAULT '0',
                CONSTRAINT "PK_e54614f8ac6559cc2aa997dd6ad" PRIMARY KEY ("componentId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_9388ae90ef64f046042a665e86" ON "salary_components" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8c432f5b73f22738e44f96057c" ON "salary_components" ("salaryStructureId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c89c50be8ceb0cf9f4544d4c7e" ON "salary_components" ("tenantId", "salaryStructureId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."salary_structure_status_enum" AS ENUM('draft', 'active', 'superseded', 'archived')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."salary_approval_status_enum" AS ENUM('draft', 'pending', 'approved')
        `);
        await queryRunner.query(`
            CREATE TABLE "salary_structures" (
                "structureId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "employeeId" uuid NOT NULL,
                "structureName" character varying(120) NOT NULL DEFAULT 'Current Salary Structure',
                "effectiveFrom" date NOT NULL,
                "effectiveTo" date,
                "annualCtc" numeric(12, 2) NOT NULL DEFAULT '0',
                "monthlyGross" numeric(12, 2) NOT NULL DEFAULT '0',
                "monthlyNetEstimate" numeric(12, 2) NOT NULL DEFAULT '0',
                "currency" character varying(3) NOT NULL DEFAULT 'INR',
                "payFrequency" character varying(30) NOT NULL DEFAULT 'monthly',
                "paymentMode" character varying(50) NOT NULL DEFAULT 'bank_transfer',
                "status" "public"."salary_structure_status_enum" NOT NULL DEFAULT 'draft',
                "approvalStatus" "public"."salary_approval_status_enum" NOT NULL DEFAULT 'draft',
                "employeeVisible" boolean NOT NULL DEFAULT false,
                "remarks" text,
                "createdBy" uuid,
                "updatedBy" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_d4c8f76929688acd3ce63aa441a" PRIMARY KEY ("structureId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_bdf23dd39f3a096723d42824c4" ON "salary_structures" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e5ad710da2194f981364e75e0f" ON "salary_structures" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_1fd6fa93a7c4edd6759046c8f5" ON "salary_structures" ("tenantId", "employeeId", "status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_91c6a9823a9560cf91a3edde93" ON "salary_structures" ("tenantId", "employeeId", "effectiveFrom")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."probation_cases_currentstate_enum" AS ENUM(
                'probation_active',
                'review_30_pending',
                'review_30_done',
                'review_60_pending',
                'review_60_done',
                'final_review_pending',
                'decision_pending',
                'confirmed',
                'probation_extended',
                'extended_probation_active',
                'probation_termination'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "probation_cases" (
                "probationId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "employeeId" uuid NOT NULL,
                "currentState" "public"."probation_cases_currentstate_enum" NOT NULL DEFAULT 'probation_active',
                "probationStartDate" date NOT NULL,
                "probationEndDate" date NOT NULL,
                "probationDurationDays" integer NOT NULL DEFAULT '90',
                "review30DueDate" date,
                "review30Completed" boolean NOT NULL DEFAULT false,
                "review60DueDate" date,
                "review60Completed" boolean NOT NULL DEFAULT false,
                "finalReviewDueDate" date,
                "finalReviewCompleted" boolean NOT NULL DEFAULT false,
                "isExtended" boolean NOT NULL DEFAULT false,
                "extensionDurationDays" integer,
                "originalEndDate" date,
                "extensionReason" text,
                "improvementPlan" text,
                "extendedBy" uuid,
                "extensionDate" date,
                "isAtRisk" boolean NOT NULL DEFAULT false,
                "riskLevel" character varying(50),
                "riskReason" text,
                "riskFlaggedBy" uuid,
                "riskFlaggedDate" date,
                "finalDecision" character varying(50),
                "decisionDate" date,
                "decidedBy" uuid,
                "decisionNotes" text,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_e53ed2c2a8988c0a4c6d02a0ac8" PRIMARY KEY ("probationId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_712d110f5ffb226a11734194d0" ON "probation_cases" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_3c238aa17e4392614929ecfff1" ON "probation_cases" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_7be265b27ef3a40ee7ab504ac0" ON "probation_cases" ("isAtRisk")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5acde6b8feaea73c3139e2165b" ON "probation_cases" ("tenantId", "isAtRisk")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_bd5bd5048842b219561650da41" ON "probation_cases" ("tenantId", "probationEndDate")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_edfe879e36b11706bcec0845a8" ON "probation_cases" ("tenantId", "currentState")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_12446f8a7d4d426469556a1cb5" ON "probation_cases" ("tenantId", "employeeId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."probation_tasks_category_enum" AS ENUM(
                'document_upload',
                'document_verification',
                'payroll_setup',
                'it_provisioning',
                'orientation',
                'review',
                'hr_intervention',
                'approval',
                'general'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."probation_tasks_status_enum" AS ENUM(
                'pending',
                'in_progress',
                'completed',
                'overdue',
                'cancelled'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."probation_tasks_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')
        `);
        await queryRunner.query(`
            CREATE TABLE "probation_tasks" (
                "taskId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "probationId" uuid NOT NULL,
                "employeeId" uuid NOT NULL,
                "title" character varying(255) NOT NULL,
                "description" text,
                "taskType" character varying(100) NOT NULL,
                "category" "public"."probation_tasks_category_enum" NOT NULL DEFAULT 'general',
                "status" "public"."probation_tasks_status_enum" NOT NULL DEFAULT 'pending',
                "priority" "public"."probation_tasks_priority_enum" NOT NULL DEFAULT 'medium',
                "assignedTo" uuid,
                "assignedRole" character varying(50),
                "dueDate" date NOT NULL,
                "isRequired" boolean NOT NULL DEFAULT true,
                "isOverdue" boolean NOT NULL DEFAULT false,
                "escalationLevel" integer NOT NULL DEFAULT '0',
                "completedDate" date,
                "completedBy" uuid,
                "completionNotes" text,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_a43085518b559aef3b3c8779c6a" PRIMARY KEY ("taskId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_11256e3cb27bc9cc591c3e67f0" ON "probation_tasks" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_b74cc8da96a81ebcd864892e8a" ON "probation_tasks" ("probationId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_241dd5e4a6e3b640816605e4d3" ON "probation_tasks" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_99c0a23a056400dc054da78f97" ON "probation_tasks" ("isOverdue")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_29064a020710f0049b4a15048e" ON "probation_tasks" ("tenantId", "isOverdue")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_50a64fdc346d0f8eee67ffd71d" ON "probation_tasks" ("tenantId", "dueDate")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_79a944a5a2183edd85d22327d6" ON "probation_tasks" ("tenantId", "assignedTo", "status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_100921b228de87df8ec7836744" ON "probation_tasks" ("tenantId", "probationId", "status")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."probation_reviews_reviewtype_enum" AS ENUM('30_day', '60_day', 'final')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."probation_reviews_status_enum" AS ENUM(
                'pending',
                'in_progress',
                'submitted',
                'hr_approved',
                'hr_rejected'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."probation_reviews_monitoringstatus_enum" AS ENUM('on_track', 'needs_monitoring', 'at_risk')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."probation_reviews_recommendation_enum" AS ENUM('confirm', 'extend', 'terminate')
        `);
        await queryRunner.query(`
            CREATE TABLE "probation_reviews" (
                "reviewId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "probationId" uuid NOT NULL,
                "employeeId" uuid NOT NULL,
                "managerId" uuid NOT NULL,
                "reviewType" "public"."probation_reviews_reviewtype_enum" NOT NULL,
                "status" "public"."probation_reviews_status_enum" NOT NULL DEFAULT 'pending',
                "dueDate" date NOT NULL,
                "completedDate" date,
                "roleClarityRating" integer,
                "learningSpeedRating" integer,
                "communicationRating" integer,
                "cultureFitRating" integer,
                "hasRiskFlag" boolean NOT NULL DEFAULT false,
                "riskFlagReason" text,
                "kpiProgressRating" integer,
                "independenceRating" integer,
                "monitoringStatus" "public"."probation_reviews_monitoringstatus_enum",
                "recommendation" "public"."probation_reviews_recommendation_enum",
                "recommendedExtensionDays" integer,
                "improvementPlanRequired" boolean NOT NULL DEFAULT false,
                "improvementPlanDetails" text,
                "managerComments" text,
                "hrNotes" text,
                "hrReviewedBy" uuid,
                "hrReviewedDate" date,
                "hrApproved" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_a2e5aa0ad6b6a158152a76436a1" PRIMARY KEY ("reviewId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_494da37bddb408fa003344f0e9" ON "probation_reviews" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_1cfc8e4d2e643bc7effab7b88c" ON "probation_reviews" ("probationId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5df12789fc9319d8a34b6f5975" ON "probation_reviews" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_42ad189ecbed2f605d0aa65537" ON "probation_reviews" ("managerId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_bd232c5d45bfbd34c066f2737d" ON "probation_reviews" ("tenantId", "dueDate")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_fe486a3a67e35552c2fde7ed2b" ON "probation_reviews" ("tenantId", "managerId", "status")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_e9437996566e9f4919e3f891d9" ON "probation_reviews" ("tenantId", "probationId", "reviewType")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."position_history_changetype_enum" AS ENUM(
                'promotion',
                'transfer',
                'demotion',
                'joining',
                'role_change'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "position_history" (
                "historyId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "employeeId" uuid NOT NULL,
                "changeType" "public"."position_history_changetype_enum" NOT NULL,
                "fromDepartmentId" uuid,
                "fromDesignationId" uuid,
                "fromJobTitle" character varying(255),
                "toDepartmentId" uuid,
                "toDesignationId" uuid,
                "toJobTitle" character varying(255),
                "effectiveDate" date NOT NULL,
                "reason" text,
                "notes" text,
                "approvedBy" uuid,
                "approvedAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_c1100bbd06f7233c905234e3303" PRIMARY KEY ("historyId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4cd6a9c0b0ce1e90cb4eafee71" ON "position_history" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5a0c9786efe4e9922ee4bd4726" ON "position_history" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_31c5f2cb340c114406f9bc1edd" ON "position_history" ("tenantId", "employeeId", "effectiveDate")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."performance_reviews_currentstate_enum" AS ENUM(
                'goal_setting',
                'goals_submitted',
                'goals_approved',
                'mid_year_pending',
                'mid_year_submitted',
                'mid_year_completed',
                'annual_review_pending',
                'annual_review_submitted',
                'annual_review_completed',
                'rating_pending',
                'rating_submitted',
                'rating_approved',
                'development_plan',
                'cycle_complete'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "performance_reviews" (
                "reviewId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" character varying NOT NULL,
                "employeeId" uuid NOT NULL,
                "reviewerId" uuid NOT NULL,
                "reviewCycle" character varying(50) NOT NULL,
                "reviewStartDate" date NOT NULL,
                "reviewEndDate" date NOT NULL,
                "currentState" "public"."performance_reviews_currentstate_enum" NOT NULL DEFAULT 'goal_setting',
                "selfRatingMidYear" numeric(3, 2),
                "managerRatingMidYear" numeric(3, 2),
                "selfCommentsMidYear" text,
                "managerCommentsMidYear" text,
                "midYearSubmittedDate" date,
                "midYearCompletedDate" date,
                "selfRatingAnnual" numeric(3, 2),
                "managerRatingAnnual" numeric(3, 2),
                "selfCommentsAnnual" text,
                "managerCommentsAnnual" text,
                "annualSubmittedDate" date,
                "annualCompletedDate" date,
                "finalRating" numeric(3, 2),
                "normalizationRating" numeric(3, 2),
                "ratingCategory" character varying(50),
                "promotionRecommended" boolean NOT NULL DEFAULT false,
                "incrementPercentage" numeric(5, 2),
                "finalComments" text,
                "achievements" json,
                "challenges" json,
                "skillGaps" json,
                "trainingRecommendations" json,
                "careerAspirations" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_7fc215ebed6ae5a2fe48e143896" PRIMARY KEY ("reviewId")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "payslip_attachments" (
                "attachmentId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "payslipId" uuid NOT NULL,
                "fileName" character varying(255) NOT NULL,
                "fileType" character varying(100) NOT NULL,
                "fileUrl" text NOT NULL,
                "fileSize" bigint NOT NULL DEFAULT '0',
                "uploadedBy" uuid,
                "isPrimary" boolean NOT NULL DEFAULT true,
                "version" integer NOT NULL DEFAULT '1',
                "uploadedOn" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_0387ab2de24e2227bcbad2528d8" PRIMARY KEY ("attachmentId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_b6314322148eb15492ba838da9" ON "payslip_attachments" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_84eac2e90e90d4d87130f067e4" ON "payslip_attachments" ("payslipId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_d5251d2b345e1b5c5734627713" ON "payslip_attachments" ("tenantId", "payslipId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."payslip_status_enum" AS ENUM(
                'draft',
                'uploaded',
                'final',
                'shared',
                'corrected'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "payslips" (
                "payslipId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "employeeId" uuid NOT NULL,
                "salaryStructureId" uuid,
                "month" integer NOT NULL,
                "year" integer NOT NULL,
                "grossEarnings" numeric(12, 2) NOT NULL DEFAULT '0',
                "totalDeductions" numeric(12, 2) NOT NULL DEFAULT '0',
                "netPay" numeric(12, 2) NOT NULL DEFAULT '0',
                "paidDays" numeric(5, 2) NOT NULL DEFAULT '0',
                "lopDays" numeric(5, 2) NOT NULL DEFAULT '0',
                "paymentDate" date,
                "status" "public"."payslip_status_enum" NOT NULL DEFAULT 'draft',
                "employeeVisible" boolean NOT NULL DEFAULT false,
                "remarks" text,
                "internalNotes" text,
                "generatedBy" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_b34821093a0b5c11fa0513a5a43" PRIMARY KEY ("payslipId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_d40bea8734d147ea3354569d88" ON "payslips" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_3fa0aa64d0a6d751ea49e6cd80" ON "payslips" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_32aa464e93c033f9cbacf0320b" ON "payslips" ("tenantId", "status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_54d5f53a11ad2c1e1fde952188" ON "payslips" ("tenantId", "employeeId", "year", "month")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."payslip_component_type_enum" AS ENUM('earning', 'deduction', 'employer_contribution')
        `);
        await queryRunner.query(`
            CREATE TABLE "payslip_components" (
                "componentId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "payslipId" uuid NOT NULL,
                "componentName" character varying(120) NOT NULL,
                "componentType" "public"."payslip_component_type_enum" NOT NULL DEFAULT 'earning',
                "amount" numeric(12, 2) NOT NULL DEFAULT '0',
                "displayOrder" integer NOT NULL DEFAULT '0',
                CONSTRAINT "PK_1d9f27d88d486ec53cea73cb005" PRIMARY KEY ("componentId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_7d5eda1e644a19343e97dac9f3" ON "payslip_components" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_a9576ff85423ed0ab844e3a4e9" ON "payslip_components" ("payslipId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_43f909d822f2293869402bc3f6" ON "payslip_components" ("tenantId", "payslipId")
        `);
        await queryRunner.query(`
            CREATE TABLE "payroll_setups" (
                "payrollSetupId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "employeeId" uuid,
                "candidateId" uuid,
                "bankName" character varying(255) NOT NULL,
                "bankBranch" character varying(100) NOT NULL,
                "accountNumber" character varying(50) NOT NULL,
                "ifscCode" character varying(50) NOT NULL,
                "accountHolderName" character varying(100),
                "accountType" character varying(50) NOT NULL DEFAULT 'savings',
                "bankDetailsVerified" boolean NOT NULL DEFAULT false,
                "bankDetailsVerifiedDate" date,
                "bankDetailsVerifiedBy" uuid,
                "panNumber" character varying(10) NOT NULL,
                "panHolderName" character varying(255),
                "panVerified" boolean NOT NULL DEFAULT false,
                "panVerifiedDate" date,
                "panVerifiedBy" uuid,
                "panDocumentPath" text,
                "uanNumber" character varying(12),
                "uanVerified" boolean NOT NULL DEFAULT false,
                "uanVerifiedDate" date,
                "uanVerifiedBy" uuid,
                "aadhaarNumber" character varying(12),
                "aadhaarVerified" boolean NOT NULL DEFAULT false,
                "aadhaarVerifiedDate" date,
                "aadhaarVerifiedBy" uuid,
                "aadhaarDocumentPath" text,
                "pfNumber" character varying(50),
                "pfApplicable" boolean NOT NULL DEFAULT false,
                "pfNomineeSubmitted" boolean NOT NULL DEFAULT false,
                "pfNomineeName" character varying(255),
                "pfNomineeRelation" character varying(100),
                "esiNumber" character varying(50),
                "esiApplicable" boolean NOT NULL DEFAULT false,
                "esiNomineeSubmitted" boolean NOT NULL DEFAULT false,
                "esiNomineeName" character varying(255),
                "esiNomineeRelation" character varying(100),
                "basicSalary" numeric(12, 2),
                "hra" numeric(12, 2),
                "specialAllowance" numeric(12, 2),
                "otherAllowances" numeric(12, 2),
                "grossSalary" numeric(12, 2),
                "ctc" numeric(12, 2),
                "taxRegime" character varying(50),
                "form16Available" boolean NOT NULL DEFAULT false,
                "form16Path" text,
                "investmentDeclarationSubmitted" boolean NOT NULL DEFAULT false,
                "verificationStatus" character varying(50) NOT NULL DEFAULT 'pending',
                "setupCompletedDate" date,
                "setupCompletedBy" uuid,
                "rejectionReason" text,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_4754a3b7a04c74b6ed8d77952c7" UNIQUE ("panNumber"),
                CONSTRAINT "PK_140902faaa08c738cc56f764bce" PRIMARY KEY ("payrollSetupId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_82fcc8f8eef87703b89ce782af" ON "payroll_setups" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_adb246f4184956a1d4f2c80c6b" ON "payroll_setups" ("tenantId", "panNumber")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_d40f5902aa08aa04769fb7850e" ON "payroll_setups" ("tenantId", "verificationStatus")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_cce7217c7c636c16af134419a6" ON "payroll_setups" ("tenantId", "candidateId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_c694bd1046f06b33302a7702e6" ON "payroll_setups" ("tenantId", "employeeId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."payment_methods_type_enum" AS ENUM(
                'credit_card',
                'debit_card',
                'bank_account',
                'paypal',
                'stripe'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."payment_methods_cardbrand_enum" AS ENUM(
                'visa',
                'mastercard',
                'amex',
                'discover',
                'diners',
                'jcb',
                'unionpay'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "payment_methods" (
                "paymentMethodId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "type" "public"."payment_methods_type_enum" NOT NULL,
                "isDefault" boolean NOT NULL DEFAULT false,
                "isActive" boolean NOT NULL DEFAULT true,
                "cardLast4" character varying(255),
                "cardBrand" "public"."payment_methods_cardbrand_enum",
                "expiryMonth" character varying(2),
                "expiryYear" character varying(4),
                "cardholderName" character varying(255),
                "bankName" character varying(255),
                "accountLast4" character varying(4),
                "accountType" character varying(50),
                "routingNumber" character varying(255),
                "billingAddress" text,
                "billingCity" character varying(100),
                "billingState" character varying(100),
                "billingZip" character varying(20),
                "billingCountry" character varying(100),
                "stripePaymentMethodId" character varying(255),
                "stripeCustomerId" character varying(255),
                "paypalEmail" character varying(255),
                "metadata" jsonb,
                "nickname" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_d7f5fbb8810fd2ce0f8394b3b52" PRIMARY KEY ("paymentMethodId")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."payment_history_status_enum" AS ENUM(
                'pending',
                'completed',
                'failed',
                'refunded',
                'cancelled'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."payment_history_paymentmethod_enum" AS ENUM(
                'credit_card',
                'debit_card',
                'bank_transfer',
                'paypal',
                'stripe',
                'razorpay',
                'upi',
                'wallet'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "payment_history" (
                "paymentId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "subscriptionId" uuid,
                "invoiceNumber" character varying(50) NOT NULL,
                "amount" numeric(10, 2) NOT NULL,
                "currency" character varying(10) NOT NULL DEFAULT 'USD',
                "status" "public"."payment_history_status_enum" NOT NULL DEFAULT 'pending',
                "paymentMethod" "public"."payment_history_paymentmethod_enum" NOT NULL,
                "transactionId" character varying(255),
                "paymentGatewayId" character varying(255),
                "description" text,
                "billingPeriodStart" date NOT NULL,
                "billingPeriodEnd" date NOT NULL,
                "taxAmount" numeric(10, 2) NOT NULL DEFAULT '0',
                "discountAmount" numeric(10, 2) NOT NULL DEFAULT '0',
                "totalAmount" numeric(10, 2) NOT NULL,
                "paidAt" TIMESTAMP,
                "dueDate" TIMESTAMP,
                "invoiceUrl" text,
                "receiptUrl" text,
                "metadata" jsonb,
                "failureReason" text,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_7952e95a6aebf47dd225bdcbc18" UNIQUE ("invoiceNumber"),
                CONSTRAINT "PK_a3219994ab452282c74ef6de2ca" PRIMARY KEY ("paymentId")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "organization_settings" (
                "settingId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "companyName" character varying(255) NOT NULL,
                "companyDescription" text,
                "industry" character varying(255),
                "registrationNumber" character varying(20),
                "taxId" character varying(20),
                "logo" text,
                "email" character varying(255),
                "phone" character varying(20),
                "website" character varying(255),
                "address" text,
                "city" character varying(100),
                "state" character varying(100),
                "postalCode" character varying(20),
                "country" character varying(100),
                "timezone" character varying(50) NOT NULL DEFAULT 'UTC',
                "defaultLanguage" character varying(10) NOT NULL DEFAULT 'en',
                "currency" character varying(10) NOT NULL DEFAULT 'USD',
                "dateFormat" character varying(20) NOT NULL DEFAULT 'MM/DD/YYYY',
                "timeFormat" character varying(20) NOT NULL DEFAULT '12h',
                "fiscalYearStartMonth" integer NOT NULL DEFAULT '1',
                "weekStartDay" integer NOT NULL DEFAULT '0',
                "workingHours" jsonb,
                "notificationSettings" jsonb,
                "smtpConfig" jsonb,
                "twoFactorAuthRequired" boolean NOT NULL DEFAULT true,
                "passwordExpiryDays" integer NOT NULL DEFAULT '30',
                "maxLoginAttempts" integer NOT NULL DEFAULT '5',
                "sessionTimeoutMinutes" integer NOT NULL DEFAULT '30',
                "ipWhitelistEnabled" boolean NOT NULL DEFAULT false,
                "allowedIpAddresses" text,
                "branding" jsonb,
                "customFields" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_ed5523221fbe0507dc59330c78a" UNIQUE ("tenantId"),
                CONSTRAINT "PK_b710c746b6a5a717439c181b1ca" PRIMARY KEY ("settingId")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."onboarding_tasks_category_enum" AS ENUM(
                'document_upload',
                'document_verification',
                'payroll_setup',
                'it_provisioning',
                'orientation',
                'review',
                'hr_intervention',
                'approval',
                'general'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."onboarding_tasks_status_enum" AS ENUM(
                'pending',
                'in_progress',
                'completed',
                'overdue',
                'cancelled'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."onboarding_tasks_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')
        `);
        await queryRunner.query(`
            CREATE TABLE "onboarding_tasks" (
                "taskId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "candidateId" uuid NOT NULL,
                "title" character varying(255) NOT NULL,
                "description" text,
                "taskType" character varying(100) NOT NULL,
                "category" "public"."onboarding_tasks_category_enum" NOT NULL DEFAULT 'general',
                "status" "public"."onboarding_tasks_status_enum" NOT NULL DEFAULT 'pending',
                "priority" "public"."onboarding_tasks_priority_enum" NOT NULL DEFAULT 'medium',
                "assignedTo" uuid,
                "assignedRole" character varying(50),
                "dueDate" date NOT NULL,
                "isRequired" boolean NOT NULL DEFAULT true,
                "isOverdue" boolean NOT NULL DEFAULT false,
                "escalationLevel" integer NOT NULL DEFAULT '0',
                "completedDate" date,
                "completedBy" uuid,
                "completionNotes" text,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_11d91b01cdeed383b80c29b847e" PRIMARY KEY ("taskId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8a502da069442ef5a3e36c0296" ON "onboarding_tasks" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_3100c7b95a6be350c5d6a8466e" ON "onboarding_tasks" ("candidateId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ed7f7e55743c362da2b3f53a26" ON "onboarding_tasks" ("isOverdue")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_67c05a05b8de3e1acf44fd05d9" ON "onboarding_tasks" ("tenantId", "isOverdue")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_9960e688e91efd1fd037cd5388" ON "onboarding_tasks" ("tenantId", "dueDate")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_184ac5d3b4f08209c0efc96d55" ON "onboarding_tasks" ("tenantId", "assignedTo", "status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_7be27cb4883c254144c290f362" ON "onboarding_tasks" ("tenantId", "candidateId", "status")
        `);
        await queryRunner.query(`
            CREATE TABLE "onboarding_progress" (
                "progressId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "currentStep" integer NOT NULL DEFAULT '1',
                "completedSteps" text NOT NULL DEFAULT '',
                "stepData" jsonb NOT NULL DEFAULT '{}',
                "isComplete" boolean NOT NULL DEFAULT false,
                "skippedSteps" text,
                "completedAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_92a62a13a73f960c471b99fb9de" PRIMARY KEY ("progressId")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."onboarding_documents_documenttype_enum" AS ENUM(
                'offer_letter',
                'appointment_letter',
                'internship_letter',
                'nda',
                'bgv_consent',
                'joining_instructions',
                'asset_issue_form',
                'employee_info_form',
                'code_of_conduct',
                'it_policy',
                'confirmation_letter',
                'probation_extension_letter',
                'transfer_letter',
                'promotion_letter',
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
                'resignation_acceptance',
                'notice_recovery_letter',
                'notice_waiver_letter',
                'relieving_letter',
                'experience_letter',
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
                'other'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."onboarding_documents_category_enum" AS ENUM(
                'system_generated',
                'candidate_upload',
                'hr_upload'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."onboarding_documents_verificationstatus_enum" AS ENUM(
                'pending',
                'uploaded',
                'verified',
                'rejected',
                'missing'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "onboarding_documents" (
                "documentId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "candidateId" uuid,
                "employeeId" uuid,
                "templateId" uuid,
                "documentType" "public"."onboarding_documents_documenttype_enum" NOT NULL,
                "category" "public"."onboarding_documents_category_enum" NOT NULL,
                "fileName" character varying(255) NOT NULL,
                "filePath" text NOT NULL,
                "fileSize" integer,
                "mimeType" character varying(100),
                "version" integer NOT NULL DEFAULT '1',
                "isRequired" boolean NOT NULL DEFAULT false,
                "requiresSignature" boolean NOT NULL DEFAULT false,
                "isSigned" boolean NOT NULL DEFAULT false,
                "signedDate" date,
                "verificationStatus" "public"."onboarding_documents_verificationstatus_enum" NOT NULL DEFAULT 'pending',
                "verifiedBy" uuid,
                "verifiedDate" date,
                "verificationNotes" text,
                "rejectionReason" text,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_7c2067367c0a1bcfcb808a60970" PRIMARY KEY ("documentId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_1278e85ce4237fba1ae6997398" ON "onboarding_documents" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_aedb6ab5590666323ffe7f01b4" ON "onboarding_documents" ("tenantId", "category")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5c22c6b386e0550249b5437572" ON "onboarding_documents" ("tenantId", "verificationStatus")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_79b078ea08cb87502ca7b82b22" ON "onboarding_documents" ("tenantId", "candidateId", "documentType")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."onboarding_cases_currentstate_enum" AS ENUM(
                'offer_approved',
                'offer_sent',
                'offer_accepted',
                'docs_pending',
                'docs_submitted',
                'hr_review',
                'bgv_in_progress',
                'bgv_passed',
                'bgv_discrepancy',
                'pre_joining_setup',
                'joined',
                'orientation',
                'onboarding_complete'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."onboarding_cases_bgvstatus_enum" AS ENUM(
                'not_initiated',
                'in_progress',
                'passed',
                'discrepancy',
                'failed'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "onboarding_cases" (
                "caseId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "candidateId" uuid NOT NULL,
                "currentState" "public"."onboarding_cases_currentstate_enum" NOT NULL DEFAULT 'offer_approved',
                "completionPercentage" numeric(5, 2) NOT NULL DEFAULT '0',
                "offerSent" boolean NOT NULL DEFAULT false,
                "offerAccepted" boolean NOT NULL DEFAULT false,
                "documentsSubmitted" boolean NOT NULL DEFAULT false,
                "documentsVerified" boolean NOT NULL DEFAULT false,
                "bgvCompleted" boolean NOT NULL DEFAULT false,
                "preJoiningComplete" boolean NOT NULL DEFAULT false,
                "joined" boolean NOT NULL DEFAULT false,
                "orientationComplete" boolean NOT NULL DEFAULT false,
                "bgvStatus" "public"."onboarding_cases_bgvstatus_enum" NOT NULL DEFAULT 'not_initiated',
                "bgvVendor" character varying(100),
                "bgvReferenceId" character varying(100),
                "bgvInitiatedDate" date,
                "bgvCompletedDate" date,
                "bgvNotes" text,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_775fe29260cde9924a0b91752fc" PRIMARY KEY ("caseId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_69f78fb520627dc9f90298a255" ON "onboarding_cases" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_84ee165de912aec5f411319006" ON "onboarding_cases" ("candidateId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_569015517d2aacad0f06cbc28b" ON "onboarding_cases" ("tenantId", "currentState")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_5b5a523a5e3455a5c93eeed8b0" ON "onboarding_cases" ("tenantId", "candidateId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."notifications_notificationtype_enum" AS ENUM(
                'task_assigned',
                'task_overdue',
                'task_completed',
                'review_due',
                'review_submitted',
                'approval_pending',
                'approval_approved',
                'approval_rejected',
                'state_change',
                'document_uploaded',
                'document_verified',
                'document_rejected',
                'at_risk_flagged',
                'probation_extended',
                'probation_confirmed',
                'probation_terminated',
                'general'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."notifications_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')
        `);
        await queryRunner.query(`
            CREATE TABLE "notifications" (
                "notificationId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "recipientId" uuid NOT NULL,
                "recipientType" character varying(50) NOT NULL DEFAULT 'employee',
                "notificationType" "public"."notifications_notificationtype_enum" NOT NULL,
                "title" character varying(255) NOT NULL,
                "message" text NOT NULL,
                "priority" "public"."notifications_priority_enum" NOT NULL DEFAULT 'medium',
                "isRead" boolean NOT NULL DEFAULT false,
                "readAt" TIMESTAMP,
                "entityType" character varying(50),
                "entityId" uuid,
                "actionUrl" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_b39089dc8ff57d2bc507f08e52b" PRIMARY KEY ("notificationId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_d5b86bc522af7cc9e3e13960ff" ON "notifications" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_db873ba9a123711a4bff527ccd" ON "notifications" ("recipientId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8ba28344602d583583b9ea1a50" ON "notifications" ("isRead")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_97a4b8699af03b7372a511ce3d" ON "notifications" ("tenantId", "createdAt")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6d88608417d54f7bee8802364d" ON "notifications" ("tenantId", "notificationType")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_126be15a96309fba7823e75f57" ON "notifications" ("tenantId", "recipientId", "isRead")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."manual_employment_history_eventtype_enum" AS ENUM(
                'promotion',
                'transfer',
                'salary_increase',
                'bonus',
                'unpaid_break',
                'sabbatical',
                'role_change',
                'other'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "manual_employment_history" (
                "manualHistoryId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "employeeId" uuid NOT NULL,
                "eventType" "public"."manual_employment_history_eventtype_enum" NOT NULL,
                "title" character varying(180) NOT NULL,
                "effectiveDate" date NOT NULL,
                "description" text,
                "fromValue" character varying(180),
                "toValue" character varying(180),
                "amount" numeric(12, 2),
                "currency" character varying(3),
                "notes" text,
                "createdBy" uuid,
                "updatedBy" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_3787bbc292d7b460eaa190fafea" PRIMARY KEY ("manualHistoryId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_7ba8ce0d8f906079f82ab0741b" ON "manual_employment_history" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e784680d227197602ff34a62c5" ON "manual_employment_history" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_086c061c8bd512a43eece92cf0" ON "manual_employment_history" ("tenantId", "employeeId", "effectiveDate")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."leave_policies_leavetype_enum" AS ENUM(
                'sick',
                'casual',
                'earned',
                'maternity',
                'paternity',
                'unpaid',
                'compensatory'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "leave_policies" (
                "policyId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "policyName" character varying(100) NOT NULL,
                "leaveType" "public"."leave_policies_leavetype_enum" NOT NULL,
                "totalLeaves" integer NOT NULL,
                "maxConsecutiveDays" integer NOT NULL DEFAULT '0',
                "carryForward" boolean NOT NULL DEFAULT true,
                "maxCarryForward" integer NOT NULL DEFAULT '0',
                "encashable" boolean NOT NULL DEFAULT false,
                "minNoticeDays" integer NOT NULL DEFAULT '0',
                "requiresApproval" boolean NOT NULL DEFAULT true,
                "probationPeriod" integer NOT NULL DEFAULT '0',
                "applicableGender" character varying(50),
                "isActive" boolean NOT NULL DEFAULT true,
                "description" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_1f465421711cc8aa4930a80e333" PRIMARY KEY ("policyId")
            );
            COMMENT ON COLUMN "leave_policies"."totalLeaves" IS 'Total leaves allowed per year';
            COMMENT ON COLUMN "leave_policies"."maxConsecutiveDays" IS 'Maximum consecutive days allowed';
            COMMENT ON COLUMN "leave_policies"."maxCarryForward" IS 'Maximum leaves that can be carried forward';
            COMMENT ON COLUMN "leave_policies"."minNoticeDays" IS 'Minimum notice days required';
            COMMENT ON COLUMN "leave_policies"."probationPeriod" IS 'Probation period in months';
            COMMENT ON COLUMN "leave_policies"."applicableGender" IS 'Gender applicability: male, female, all'
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_9d5cad0c84d2832e48329a910f" ON "leave_policies" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_55b5b6b48ccf45074a994a2c22" ON "leave_policies" ("tenantId", "leaveType")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."leave_requests_leavetype_enum" AS ENUM(
                'sick',
                'casual',
                'earned',
                'maternity',
                'paternity',
                'unpaid',
                'compensatory'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."leave_requests_status_enum" AS ENUM('pending', 'approved', 'rejected', 'cancelled')
        `);
        await queryRunner.query(`
            CREATE TABLE "leave_requests" (
                "leaveId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "employeeId" uuid NOT NULL,
                "tenantId" uuid NOT NULL,
                "leaveType" "public"."leave_requests_leavetype_enum" NOT NULL,
                "startDate" date NOT NULL,
                "endDate" date NOT NULL,
                "numberOfDays" numeric(5, 2) NOT NULL,
                "reason" text NOT NULL,
                "status" "public"."leave_requests_status_enum" NOT NULL DEFAULT 'pending',
                "approverId" uuid,
                "approvedAt" TIMESTAMP,
                "approverComments" text,
                "attachmentUrl" text,
                "emergencyContact" character varying(500),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_5b261ec70bb436d90123ac61e69" PRIMARY KEY ("leaveId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4eda1468756ca831495e308e40" ON "leave_requests" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_091ffcec318214206f60315f30" ON "leave_requests" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_d2234f83aa1c148396f6147152" ON "leave_requests" ("status", "tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8a10335671f4018f4bd288610b" ON "leave_requests" ("employeeId", "startDate", "endDate")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."leave_balances_leavetype_enum" AS ENUM(
                'sick',
                'casual',
                'earned',
                'maternity',
                'paternity',
                'unpaid',
                'compensatory'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "leave_balances" (
                "balanceId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "employeeId" uuid NOT NULL,
                "tenantId" uuid NOT NULL,
                "policyId" uuid NOT NULL,
                "leaveType" "public"."leave_balances_leavetype_enum" NOT NULL,
                "year" integer NOT NULL,
                "totalAllocated" numeric(5, 2) NOT NULL DEFAULT '0',
                "used" numeric(5, 2) NOT NULL DEFAULT '0',
                "pending" numeric(5, 2) NOT NULL DEFAULT '0',
                "carriedForward" numeric(5, 2) NOT NULL DEFAULT '0',
                "encashed" numeric(5, 2) NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_c45fde3c6c8c9dca6f9956c2464" PRIMARY KEY ("balanceId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_1e0df1791c9344d4bdde694be6" ON "leave_balances" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4b454eb605d62e7213ddb1122d" ON "leave_balances" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_21fa461bf77cea4acc381c2ed9" ON "leave_balances" ("employeeId", "leaveType", "year")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."goals_category_enum" AS ENUM(
                'business',
                'personal',
                'technical',
                'leadership'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."goals_status_enum" AS ENUM(
                'draft',
                'submitted',
                'approved',
                'in_progress',
                'achieved',
                'not_achieved'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "goals" (
                "goalId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" character varying NOT NULL,
                "reviewId" uuid NOT NULL,
                "title" character varying(255) NOT NULL,
                "description" text NOT NULL,
                "category" "public"."goals_category_enum" NOT NULL DEFAULT 'business',
                "targetDate" date NOT NULL,
                "weightage" integer NOT NULL DEFAULT '0',
                "status" "public"."goals_status_enum" NOT NULL DEFAULT 'draft',
                "progress" integer NOT NULL DEFAULT '0',
                "notes" text,
                "managerFeedback" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_94e3a8e4d9b7fc611c68b5bacdc" PRIMARY KEY ("goalId")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."kpis_status_enum" AS ENUM('on_track', 'at_risk', 'off_track', 'achieved')
        `);
        await queryRunner.query(`
            CREATE TABLE "kpis" (
                "kpiId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" character varying NOT NULL,
                "goalId" uuid NOT NULL,
                "metric" character varying(255) NOT NULL,
                "target" character varying(100) NOT NULL,
                "actual" character varying(100),
                "unit" character varying(50) NOT NULL,
                "status" "public"."kpis_status_enum" NOT NULL DEFAULT 'on_track',
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_b5a563ec017f14b9e227a206849" PRIMARY KEY ("kpiId")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "hr_connect_comments" (
                "commentId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "postId" uuid NOT NULL,
                "authorId" uuid NOT NULL,
                "content" text NOT NULL,
                "parentCommentId" uuid,
                "attachments" jsonb,
                "isEdited" boolean NOT NULL DEFAULT false,
                "isDeleted" boolean NOT NULL DEFAULT false,
                "reactionCount" integer NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                CONSTRAINT "PK_b60ed7074f93485546e9e3bf0ad" PRIMARY KEY ("commentId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_1c4a0020fef5a217d34979bf57" ON "hr_connect_comments" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_dc382a274da295d4de29e11c26" ON "hr_connect_comments" ("postId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c55732fc0288533c92a47307b4" ON "hr_connect_comments" ("authorId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6e131100c58fa1fe4320abbcc0" ON "hr_connect_comments" ("tenantId", "authorId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_cf0b408e933e294403ab2faabd" ON "hr_connect_comments" ("tenantId", "postId", "createdAt")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."hr_connect_group_members_role_enum" AS ENUM('admin', 'moderator', 'member')
        `);
        await queryRunner.query(`
            CREATE TABLE "hr_connect_group_members" (
                "memberId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "groupId" uuid NOT NULL,
                "employeeId" uuid NOT NULL,
                "role" "public"."hr_connect_group_members_role_enum" NOT NULL DEFAULT 'member',
                "receiveNotifications" boolean NOT NULL DEFAULT true,
                "joinedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_12b9c61fcec2b149e57874e892a" UNIQUE ("groupId", "employeeId"),
                CONSTRAINT "PK_00de093f0d59bbf823c1c938b91" PRIMARY KEY ("memberId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_323e25c3d2a697439361a35058" ON "hr_connect_group_members" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_be70ce5167e89a2b28d796e65a" ON "hr_connect_group_members" ("groupId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_910c950599231451951330d1f6" ON "hr_connect_group_members" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_bfcaa4375b318aa88f471a3d4c" ON "hr_connect_group_members" ("tenantId", "employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4586962d39682f4f91c570a8a4" ON "hr_connect_group_members" ("tenantId", "groupId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."hr_connect_groups_grouptype_enum" AS ENUM('department', 'topic', 'project', 'social')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."hr_connect_groups_privacy_enum" AS ENUM('public', 'private', 'secret')
        `);
        await queryRunner.query(`
            CREATE TABLE "hr_connect_groups" (
                "groupId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "name" character varying(255) NOT NULL,
                "description" text,
                "groupType" "public"."hr_connect_groups_grouptype_enum" NOT NULL DEFAULT 'topic',
                "privacy" "public"."hr_connect_groups_privacy_enum" NOT NULL DEFAULT 'public',
                "createdBy" uuid NOT NULL,
                "departmentId" uuid,
                "coverImage" character varying(500),
                "icon" character varying(500),
                "memberCount" integer NOT NULL DEFAULT '0',
                "postCount" integer NOT NULL DEFAULT '0',
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_4ca96d22c9459bb61e1945927d8" PRIMARY KEY ("groupId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_821df459615e1bf04b34d17f28" ON "hr_connect_groups" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_1e1b5120d5a701fe434cea9e56" ON "hr_connect_groups" ("tenantId", "groupType")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f7b5e7c2ff29aa5b1044b3dde0" ON "hr_connect_groups" ("tenantId", "createdAt")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."hr_connect_posts_posttype_enum" AS ENUM('announcement', 'question', 'discussion', 'poll')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."hr_connect_posts_visibility_enum" AS ENUM('public', 'hr_only', 'group_only', 'department')
        `);
        await queryRunner.query(`
            CREATE TABLE "hr_connect_posts" (
                "postId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "authorId" uuid NOT NULL,
                "title" character varying(255) NOT NULL,
                "content" text NOT NULL,
                "postType" "public"."hr_connect_posts_posttype_enum" NOT NULL DEFAULT 'discussion',
                "visibility" "public"."hr_connect_posts_visibility_enum" NOT NULL DEFAULT 'public',
                "groupId" uuid,
                "departmentId" uuid,
                "attachments" jsonb,
                "pollOptions" jsonb,
                "isPinned" boolean NOT NULL DEFAULT false,
                "isLocked" boolean NOT NULL DEFAULT false,
                "isDeleted" boolean NOT NULL DEFAULT false,
                "viewCount" integer NOT NULL DEFAULT '0',
                "commentCount" integer NOT NULL DEFAULT '0',
                "reactionCount" integer NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                CONSTRAINT "PK_aa79df8eb32de4f85361b52c76e" PRIMARY KEY ("postId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_1dc1c00f34334e30d02275474f" ON "hr_connect_posts" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8292784dcc72410a2867c9c2f6" ON "hr_connect_posts" ("authorId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_9099e0e4a3e731f0305301c468" ON "hr_connect_posts" ("tenantId", "visibility")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_512400c9d73cad7bc313a4f296" ON "hr_connect_posts" ("tenantId", "postType")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f9475e606b33b3365c9e8e12e0" ON "hr_connect_posts" ("tenantId", "authorId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_baf3191f3f662b0728697fd661" ON "hr_connect_posts" ("tenantId", "createdAt")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."hr_connect_reactions_reactiontype_enum" AS ENUM(
                'like',
                'love',
                'helpful',
                'celebrate',
                'insightful',
                'support'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "hr_connect_reactions" (
                "reactionId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "postId" uuid,
                "commentId" uuid,
                "userId" uuid NOT NULL,
                "reactionType" "public"."hr_connect_reactions_reactiontype_enum" NOT NULL DEFAULT 'like',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_ba25a3916db399efce6ef7368ff" UNIQUE ("commentId", "userId", "reactionType"),
                CONSTRAINT "UQ_fa6f371b1dd4fb1a1314486802b" UNIQUE ("postId", "userId", "reactionType"),
                CONSTRAINT "PK_ec99329509bf1128ba9effcd60b" PRIMARY KEY ("reactionId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4c80636983202afd2654025235" ON "hr_connect_reactions" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_1369f2ce844f6eb35714158c5e" ON "hr_connect_reactions" ("userId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0c181396908108dde7e9ff2c93" ON "hr_connect_reactions" ("tenantId", "userId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8daa4ab99fead523909a4a0791" ON "hr_connect_reactions" ("tenantId", "commentId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_a5c185acee4ef8b91511be8712" ON "hr_connect_reactions" ("tenantId", "postId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."document_templates_templatename_enum" AS ENUM(
                'offer_letter',
                'appointment_letter',
                'internship_letter',
                'nda',
                'bgv_consent',
                'joining_instructions',
                'asset_issue_form',
                'employee_info_form',
                'code_of_conduct',
                'it_policy',
                'confirmation_letter',
                'probation_extension_letter',
                'transfer_letter',
                'promotion_letter',
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
                'resignation_acceptance',
                'notice_recovery_letter',
                'notice_waiver_letter',
                'relieving_letter',
                'experience_letter',
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
                'other'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "document_templates" (
                "templateId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "templateName" "public"."document_templates_templatename_enum" NOT NULL,
                "displayName" character varying(255) NOT NULL,
                "category" character varying(100),
                "htmlTemplate" text NOT NULL,
                "availableFields" jsonb NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "version" integer NOT NULL DEFAULT '1',
                "description" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_1a1d190569696dddceb490dbebf" PRIMARY KEY ("templateId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6a3594520b9c7394ea61d08852" ON "document_templates" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ed3b7442c29742a2cfb9352412" ON "document_templates" ("isActive")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c5af0b3580fdff6d86b52ea0ef" ON "document_templates" ("tenantId", "isActive")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_eec498fb5d0ec4f620ccebc97d" ON "document_templates" ("tenantId", "templateName")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."generated_documents_documenttype_enum" AS ENUM(
                'offer_letter',
                'appointment_letter',
                'internship_letter',
                'nda',
                'bgv_consent',
                'joining_instructions',
                'asset_issue_form',
                'employee_info_form',
                'code_of_conduct',
                'it_policy',
                'confirmation_letter',
                'probation_extension_letter',
                'transfer_letter',
                'promotion_letter',
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
                'resignation_acceptance',
                'notice_recovery_letter',
                'notice_waiver_letter',
                'relieving_letter',
                'experience_letter',
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
                'other'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."generated_documents_status_enum" AS ENUM(
                'draft',
                'generated',
                'issued',
                'sent',
                'received',
                'revoked'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."generated_documents_format_enum" AS ENUM('pdf', 'docx', 'html')
        `);
        await queryRunner.query(`
            CREATE TABLE "generated_documents" (
                "documentId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "templateId" uuid,
                "documentType" "public"."generated_documents_documenttype_enum" NOT NULL,
                "documentName" character varying(200) NOT NULL,
                "employeeId" uuid,
                "candidateId" uuid,
                "generatedBy" uuid NOT NULL,
                "status" "public"."generated_documents_status_enum" NOT NULL DEFAULT 'draft',
                "format" "public"."generated_documents_format_enum" NOT NULL DEFAULT 'pdf',
                "filePath" text,
                "fileUrl" character varying(100),
                "fileSizeBytes" integer,
                "metadata" jsonb NOT NULL,
                "notes" text,
                "issuedAt" TIMESTAMP,
                "sentAt" TIMESTAMP,
                "sentTo" character varying(255),
                "receivedAt" TIMESTAMP,
                "revokedAt" TIMESTAMP,
                "revocationReason" text,
                "hasWatermark" boolean NOT NULL DEFAULT false,
                "isConfidential" boolean NOT NULL DEFAULT false,
                "version" integer NOT NULL DEFAULT '1',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_53d151ca12cc92d16b11e8304f9" PRIMARY KEY ("documentId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_661b796a01149b013dedfc6404" ON "generated_documents" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_3cdebc4fd8de37342333580d4d" ON "generated_documents" ("tenantId", "generatedBy")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_b7735fa66cb984d7181bd212d8" ON "generated_documents" ("tenantId", "status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e6500185a691a9f4e6666a0071" ON "generated_documents" ("tenantId", "candidateId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_3f9d3f45c9d3898475b84f5d3b" ON "generated_documents" ("tenantId", "employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_d1c5c76404522696616ab45b00" ON "generated_documents" ("tenantId", "documentType")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."exit_cases_currentstate_enum" AS ENUM(
                'resignation_submitted',
                'resignation_approved',
                'resignation_rejected',
                'notice_period_active',
                'notice_period_buyout',
                'clearance_initiated',
                'clearance_in_progress',
                'assets_pending',
                'assets_returned',
                'exit_interview_pending',
                'exit_interview_completed',
                'settlement_calculated',
                'settlement_approved',
                'exit_completed'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."exit_cases_resignationtype_enum" AS ENUM(
                'voluntary',
                'involuntary',
                'termination',
                'retirement',
                'end_of_contract',
                'mutual_separation',
                'abscondment'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "exit_cases" (
                "exitId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "employeeId" uuid NOT NULL,
                "currentState" "public"."exit_cases_currentstate_enum" NOT NULL DEFAULT 'resignation_submitted',
                "resignationType" "public"."exit_cases_resignationtype_enum" NOT NULL DEFAULT 'voluntary',
                "resignationSubmittedDate" date NOT NULL,
                "resignationApprovedDate" date,
                "resignationRejectedDate" date,
                "resignationReason" text,
                "detailedReason" text,
                "approvedBy" uuid,
                "rejectionReason" text,
                "noticePeriodDays" integer NOT NULL DEFAULT '30',
                "noticePeriodStartDate" date,
                "noticePeriodEndDate" date,
                "isNoticePeriodBuyout" boolean NOT NULL DEFAULT false,
                "buyoutAmount" numeric(12, 2),
                "lastWorkingDate" date NOT NULL,
                "actualExitDate" date,
                "clearanceInitiatedDate" date,
                "clearanceCompletedDate" date,
                "allClearancesCleared" boolean NOT NULL DEFAULT false,
                "totalClearances" integer NOT NULL DEFAULT '0',
                "completedClearances" integer NOT NULL DEFAULT '0',
                "assetsReturnInitiatedDate" date,
                "assetsReturnedDate" date,
                "allAssetsReturned" boolean NOT NULL DEFAULT false,
                "totalAssets" integer NOT NULL DEFAULT '0',
                "returnedAssets" integer NOT NULL DEFAULT '0',
                "assetDamageDeduction" numeric(12, 2) NOT NULL DEFAULT '0',
                "exitInterviewScheduledDate" date,
                "exitInterviewCompletedDate" date,
                "exitInterviewCompleted" boolean NOT NULL DEFAULT false,
                "exitInterviewConductedBy" uuid,
                "settlementCalculatedDate" date,
                "settlementApprovedDate" date,
                "settlementPaidDate" date,
                "settlementAmount" numeric(12, 2),
                "totalDeductions" numeric(12, 2) NOT NULL DEFAULT '0',
                "netSettlementAmount" numeric(12, 2),
                "settlementApprovedBy" uuid,
                "settlementCalculatedBy" uuid,
                "isEligibleForRehire" boolean NOT NULL DEFAULT true,
                "rehireEligibilityNotes" text,
                "exitCompletedDate" date,
                "exitCompletedBy" uuid,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_421535cdaca81831b19d1a2436e" PRIMARY KEY ("exitId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6b2190c627ce3f9e7c2671dd66" ON "exit_cases" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4963e54b0260e377e61d566031" ON "exit_cases" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_515d15e775c5c1ba81890c2ba5" ON "exit_cases" ("tenantId", "resignationType")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_bc529a72f31819f1ac1256f9d5" ON "exit_cases" ("tenantId", "lastWorkingDate")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_42424dbc37952f79a10bd09532" ON "exit_cases" ("tenantId", "currentState")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_9821a2d8d6098f5db9e086fa9a" ON "exit_cases" ("tenantId", "employeeId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."final_settlements_status_enum" AS ENUM(
                'pending',
                'calculated',
                'approved',
                'rejected',
                'paid',
                'payment_failed'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "final_settlements" (
                "settlementId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "exitId" uuid NOT NULL,
                "employeeId" uuid NOT NULL,
                "status" "public"."final_settlements_status_enum" NOT NULL DEFAULT 'pending',
                "basicSalaryDue" numeric(12, 2) NOT NULL DEFAULT '0',
                "allowancesDue" numeric(12, 2) NOT NULL DEFAULT '0',
                "bonusDue" numeric(12, 2) NOT NULL DEFAULT '0',
                "incentivesDue" numeric(12, 2) NOT NULL DEFAULT '0',
                "overtimeDue" numeric(12, 2) NOT NULL DEFAULT '0',
                "commissionDue" numeric(12, 2) NOT NULL DEFAULT '0',
                "unUtilizedLeaveDays" integer NOT NULL DEFAULT '0',
                "leaveEncashmentAmount" numeric(12, 2) NOT NULL DEFAULT '0',
                "noticePeriodDays" integer NOT NULL DEFAULT '0',
                "noticePeriodServed" integer NOT NULL DEFAULT '0',
                "noticePeriodShortfall" integer NOT NULL DEFAULT '0',
                "noticePeriodRecovery" numeric(12, 2) NOT NULL DEFAULT '0',
                "noticePeriodBuyoutAmount" numeric(12, 2) NOT NULL DEFAULT '0',
                "gratuityAmount" numeric(12, 2) NOT NULL DEFAULT '0',
                "pfEmployeeContribution" numeric(12, 2) NOT NULL DEFAULT '0',
                "pfEmployerContribution" numeric(12, 2) NOT NULL DEFAULT '0',
                "pfInterest" numeric(12, 2) NOT NULL DEFAULT '0',
                "totalPfAmount" numeric(12, 2) NOT NULL DEFAULT '0',
                "loanRecovery" numeric(12, 2) NOT NULL DEFAULT '0',
                "advanceRecovery" numeric(12, 2) NOT NULL DEFAULT '0',
                "assetDamageDeduction" numeric(12, 2) NOT NULL DEFAULT '0',
                "otherDeductions" numeric(12, 2) NOT NULL DEFAULT '0',
                "deductionNotes" text,
                "tdsDeducted" numeric(12, 2) NOT NULL DEFAULT '0',
                "professionalTax" numeric(12, 2) NOT NULL DEFAULT '0',
                "totalEarnings" numeric(12, 2) NOT NULL DEFAULT '0',
                "totalDeductions" numeric(12, 2) NOT NULL DEFAULT '0',
                "netPayable" numeric(12, 2) NOT NULL DEFAULT '0',
                "calculatedBy" uuid,
                "calculatedDate" date,
                "approvedBy" uuid,
                "approvedDate" date,
                "approvalNotes" text,
                "rejectionReason" text,
                "paymentDate" date,
                "paymentMode" character varying(100),
                "paymentReferenceNumber" character varying(200),
                "paymentProcessedBy" uuid,
                "paymentProcessedDate" date,
                "isPaid" boolean NOT NULL DEFAULT false,
                "breakupDetails" json,
                "calculationNotes" text,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_86ccc9e85659e31d956542129b6" PRIMARY KEY ("settlementId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_b95ca55c2cfca0b2f3dc83e076" ON "final_settlements" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_eeb6672c177404cf08f7c5d75d" ON "final_settlements" ("exitId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6f22d9034b025d43f0f9994a58" ON "final_settlements" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5f169589b5cd39ded5b9198440" ON "final_settlements" ("tenantId", "status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ac672a41f1766d3f7308e924cb" ON "final_settlements" ("tenantId", "employeeId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_85596421aba48d46d8a6818bb4" ON "final_settlements" ("tenantId", "exitId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."feedback_360_relationship_enum" AS ENUM('peer', 'subordinate', 'stakeholder')
        `);
        await queryRunner.query(`
            CREATE TABLE "feedback_360" (
                "feedbackId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" character varying NOT NULL,
                "reviewId" uuid NOT NULL,
                "feedbackFromId" uuid NOT NULL,
                "relationship" "public"."feedback_360_relationship_enum" NOT NULL,
                "rating" numeric(3, 2) NOT NULL,
                "comments" text NOT NULL,
                "strengths" json,
                "areasOfImprovement" json,
                "isAnonymous" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_430b789175e2e4788c58db02766" PRIMARY KEY ("feedbackId")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "exit_interviews" (
                "exitInterviewId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "exitId" uuid NOT NULL,
                "employeeId" uuid NOT NULL,
                "conductedBy" uuid,
                "scheduledDate" date,
                "completedDate" date,
                "status" character varying(50) NOT NULL DEFAULT 'scheduled',
                "primaryReasonForLeaving" character varying(100),
                "detailedReasonForLeaving" text,
                "overallSatisfactionRating" integer,
                "managerRating" integer,
                "teamRating" integer,
                "roleRating" integer,
                "compensationRating" integer,
                "workLifeBalanceRating" integer,
                "learningOpportunitiesRating" integer,
                "workEnvironmentRating" integer,
                "benefitsRating" integer,
                "whatDidYouLikeMost" text,
                "whatDidYouLikeLeast" text,
                "suggestionsForImprovement" text,
                "feedbackOnManager" text,
                "feedbackOnTeam" text,
                "feedbackOnCompanyCulture" text,
                "wouldRecommendCompany" boolean NOT NULL DEFAULT false,
                "npsScore" integer,
                "wouldConsiderRejoining" boolean NOT NULL DEFAULT false,
                "newCompanyName" character varying(200),
                "newRole" character varying(100),
                "salaryIncreasePercentage" numeric(5, 2),
                "additionalComments" text,
                "hrNotes" text,
                "isConfidential" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_d7469878580748140a519d99d2e" PRIMARY KEY ("exitInterviewId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6faa85a9c3f12bd8daf569987e" ON "exit_interviews" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_1dbfb8ac17456e957d1c4f09b2" ON "exit_interviews" ("exitId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_697c5b6c6cdec3dc5a32866806" ON "exit_interviews" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f7be9fa88c64b2477e495e3af8" ON "exit_interviews" ("tenantId", "scheduledDate")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8f9dcf86b9cd25153dffaef493" ON "exit_interviews" ("tenantId", "employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5c0da9c94296994bc4abd38ef0" ON "exit_interviews" ("tenantId", "exitId")
        `);
        await queryRunner.query(`
            CREATE TABLE "employee_documents" (
                "documentId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "employeeId" uuid NOT NULL,
                "title" character varying(200) NOT NULL,
                "category" character varying(80) NOT NULL DEFAULT 'other',
                "description" text,
                "documentNumber" character varying(120),
                "issueDate" date,
                "expiryDate" date,
                "status" character varying(40) NOT NULL DEFAULT 'active',
                "verificationStatus" character varying(40) NOT NULL DEFAULT 'unverified',
                "fileName" character varying(255) NOT NULL,
                "originalFileName" character varying(255) NOT NULL,
                "fileUrl" text NOT NULL,
                "fileType" character varying(100) NOT NULL,
                "fileSize" bigint NOT NULL DEFAULT '0',
                "uploadedBy" uuid NOT NULL,
                "verifiedBy" uuid,
                "verifiedAt" TIMESTAMP,
                "notes" text,
                "metadata" jsonb NOT NULL DEFAULT '{}',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_594f4bdc650f594cc202034af61" PRIMARY KEY ("documentId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4d043d77efc32dcd104408f20c" ON "employee_documents" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_1e0b96137e88ec3ab8f14709f7" ON "employee_documents" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_7ecc5c6737fbda57c2c8497173" ON "employee_documents" ("tenantId", "verificationStatus")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_d5ec9dc7b1da349289d6e0dc0d" ON "employee_documents" ("tenantId", "employeeId", "status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_73dcb3db757f2fe04e13adff9f" ON "employee_documents" ("tenantId", "employeeId", "category")
        `);
        await queryRunner.query(`
            CREATE TABLE "document_category" (
                "categoryId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "name" character varying(100) NOT NULL,
                "description" text,
                "color" character varying(50),
                "icon" character varying(50),
                "isDefault" boolean NOT NULL DEFAULT false,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_409f330de22efb1017189f4bfbd" PRIMARY KEY ("categoryId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_fe2878916db7be7161d843151c" ON "document_category" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_be8469ba60aaf5400450012cea" ON "document_category" ("tenantId", "name")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."digital_library_resourcetype_enum" AS ENUM('image', 'document', 'video', 'audio', 'other')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."digital_library_accesslevel_enum" AS ENUM('private', 'shared', 'public')
        `);
        await queryRunner.query(`
            CREATE TABLE "digital_library" (
                "libraryId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "employeeId" uuid NOT NULL,
                "originalOwnerId" uuid,
                "fileName" character varying(255) NOT NULL,
                "fileUrl" text NOT NULL,
                "fileType" character varying(100) NOT NULL,
                "fileSize" bigint NOT NULL,
                "resourceType" "public"."digital_library_resourcetype_enum" NOT NULL DEFAULT 'document',
                "accessLevel" "public"."digital_library_accesslevel_enum" NOT NULL DEFAULT 'private',
                "isPaid" boolean NOT NULL DEFAULT false,
                "canDownload" boolean NOT NULL DEFAULT true,
                "canShare" boolean NOT NULL DEFAULT false,
                "canEdit" boolean NOT NULL DEFAULT false,
                "sourceType" character varying(100),
                "sourceId" uuid,
                "category" character varying(100),
                "tags" text,
                "description" text,
                "viewCount" integer NOT NULL DEFAULT '0',
                "downloadCount" integer NOT NULL DEFAULT '0',
                "lastAccessedAt" TIMESTAMP,
                "expiresAt" TIMESTAMP,
                "isArchived" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_3f6881db688082afcbd4a0c559b" PRIMARY KEY ("libraryId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_de2b632d6f7263b140b570b92b" ON "digital_library" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_d9ad8ab2c535ca55bf698fde56" ON "digital_library" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_48d38384a4e37b03b2c80d5d6d" ON "digital_library" ("tenantId", "accessLevel")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_1b8bca34d012a41a678b6a1896" ON "digital_library" ("tenantId", "resourceType")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_b57ed83b16f2bb8076e412fd3d" ON "digital_library" ("tenantId", "employeeId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."development_action_items_status_enum" AS ENUM(
                'pending',
                'in_progress',
                'completed',
                'cancelled'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "development_action_items" (
                "itemId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" character varying NOT NULL,
                "reviewId" uuid NOT NULL,
                "action" text NOT NULL,
                "timeline" character varying(100) NOT NULL,
                "status" "public"."development_action_items_status_enum" NOT NULL DEFAULT 'pending',
                "notes" text,
                "completedDate" date,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_4c54977e3ca8e1f30f6082106f9" PRIMARY KEY ("itemId")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."compensation_share_channel_enum" AS ENUM('email', 'whatsapp', 'hr_connect')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."compensation_share_status_enum" AS ENUM('logged', 'sent', 'failed', 'viewed')
        `);
        await queryRunner.query(`
            CREATE TABLE "compensation_share_logs" (
                "shareLogId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "employeeId" uuid NOT NULL,
                "payslipId" uuid,
                "channel" "public"."compensation_share_channel_enum" NOT NULL,
                "recipient" character varying(255),
                "status" "public"."compensation_share_status_enum" NOT NULL DEFAULT 'logged',
                "remarks" text,
                "sharedBy" uuid,
                "sharedOn" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_ec24185674bbc0508334efd521c" PRIMARY KEY ("shareLogId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_a2fd62c10350ccb6dc72fb09af" ON "compensation_share_logs" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c4e4f6e50d75e888d48c3d0bc6" ON "compensation_share_logs" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_078392a28c62ba1f631bcb9b78" ON "compensation_share_logs" ("tenantId", "payslipId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_a5998f4c3a4cee02966e982ad2" ON "compensation_share_logs" ("tenantId", "employeeId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."compensation_history_changetype_enum" AS ENUM(
                'initial_salary',
                'increment',
                'promotion',
                'bonus',
                'adjustment',
                'market_correction'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."compensation_history_component_enum" AS ENUM(
                'base_salary',
                'bonus',
                'allowance',
                'commission',
                'stock_options'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "compensation_history" (
                "historyId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "employeeId" uuid NOT NULL,
                "changeType" "public"."compensation_history_changetype_enum" NOT NULL,
                "component" "public"."compensation_history_component_enum" NOT NULL DEFAULT 'base_salary',
                "previousAmount" numeric(12, 2),
                "newAmount" numeric(12, 2) NOT NULL,
                "changeAmount" numeric(12, 2),
                "changePercentage" numeric(5, 2),
                "currency" character varying(3) NOT NULL DEFAULT 'USD',
                "effectiveDate" date NOT NULL,
                "reason" text,
                "notes" text,
                "approvedBy" uuid,
                "approvedAt" TIMESTAMP,
                "performanceReviewId" uuid,
                "performanceRating" numeric(3, 2),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_a16d962a063d614efe38308b224" PRIMARY KEY ("historyId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_41ea8d0bfa5f6ee535e3347c3f" ON "compensation_history" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_85d561ddcbfba8138586475007" ON "compensation_history" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_2d1fe8a6cbd22e96646ba9dd4d" ON "compensation_history" ("tenantId", "employeeId", "effectiveDate")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."company_registrations_status_enum" AS ENUM('pending', 'verified', 'completed', 'expired')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."company_registrations_selectedplan_enum" AS ENUM('free', 'starter', 'professional', 'enterprise')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."company_registrations_selectedbillingcycle_enum" AS ENUM('monthly', 'quarterly', 'yearly')
        `);
        await queryRunner.query(`
            CREATE TABLE "company_registrations" (
                "registrationId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "companyName" character varying(255) NOT NULL,
                "adminEmail" character varying(255) NOT NULL,
                "adminFullName" character varying(255) NOT NULL,
                "phone" character varying(20),
                "industry" character varying(100),
                "companySize" character varying(50),
                "registrationToken" character varying(255) NOT NULL,
                "tokenExpiry" TIMESTAMP NOT NULL,
                "isEmailVerified" boolean NOT NULL DEFAULT false,
                "status" "public"."company_registrations_status_enum" NOT NULL DEFAULT 'pending',
                "selectedPlan" "public"."company_registrations_selectedplan_enum",
                "selectedBillingCycle" "public"."company_registrations_selectedbillingcycle_enum",
                "utmSource" character varying(100),
                "utmCampaign" character varying(100),
                "tenantId" uuid,
                "completedAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_b743161829243f0946accbbef7b" UNIQUE ("adminEmail"),
                CONSTRAINT "UQ_b3b7b6f1903278b74b2b049ff8a" UNIQUE ("registrationToken"),
                CONSTRAINT "PK_1f47898a567cd0e046d34405d8c" PRIMARY KEY ("registrationId")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "company_documents" (
                "documentId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "title" character varying(200) NOT NULL,
                "category" character varying(80) NOT NULL DEFAULT 'other',
                "description" text,
                "documentNumber" character varying(120),
                "issuingAuthority" character varying(150),
                "issueDate" date,
                "expiryDate" date,
                "renewalOwner" character varying(150),
                "status" character varying(40) NOT NULL DEFAULT 'active',
                "verificationStatus" character varying(40) NOT NULL DEFAULT 'unverified',
                "fileName" character varying(255) NOT NULL,
                "originalFileName" character varying(255) NOT NULL,
                "fileUrl" text NOT NULL,
                "fileType" character varying(100) NOT NULL,
                "fileSize" bigint NOT NULL DEFAULT '0',
                "uploadedBy" uuid NOT NULL,
                "verifiedBy" uuid,
                "verifiedAt" TIMESTAMP,
                "notes" text,
                "metadata" jsonb NOT NULL DEFAULT '{}',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_d03e4eb21d360b9d5643cdb04de" PRIMARY KEY ("documentId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_85b8fd22be78b72eb535bd2700" ON "company_documents" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5f01814b049843d6c70fb6116e" ON "company_documents" ("tenantId", "expiryDate")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f01ff92293bb943440677f25ca" ON "company_documents" ("tenantId", "status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_1cdf55cdeeaa762c549c850dbd" ON "company_documents" ("tenantId", "category")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."clearances_status_enum" AS ENUM(
                'pending',
                'in_progress',
                'cleared',
                'pending_approval',
                'rejected',
                'escalated'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "clearances" (
                "clearanceId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "exitId" uuid NOT NULL,
                "employeeId" uuid NOT NULL,
                "departmentType" character varying(100) NOT NULL,
                "departmentId" uuid,
                "clearanceName" character varying(200) NOT NULL,
                "clearanceDescription" text,
                "status" "public"."clearances_status_enum" NOT NULL DEFAULT 'pending',
                "assignedTo" uuid,
                "dueDate" date,
                "initiatedDate" date,
                "completedDate" date,
                "isCleared" boolean NOT NULL DEFAULT false,
                "isRejected" boolean NOT NULL DEFAULT false,
                "rejectionReason" text,
                "requiresApproval" boolean NOT NULL DEFAULT false,
                "approvedBy" uuid,
                "approvedDate" date,
                "isEscalated" boolean NOT NULL DEFAULT false,
                "escalatedTo" uuid,
                "escalatedDate" date,
                "escalationReason" text,
                "checklistItems" json,
                "completedChecklistItems" json,
                "clearerComments" text,
                "hrNotes" text,
                "isRequired" boolean NOT NULL DEFAULT true,
                "priority" integer NOT NULL DEFAULT '0',
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_cc6eb7a67f298eef42f677e33c8" PRIMARY KEY ("clearanceId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_859ed168774e5d7d05c8652d05" ON "clearances" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0492d0e26361713f7e5c7ad968" ON "clearances" ("exitId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_d0e79283a6a9abed2d90644d67" ON "clearances" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_adf41e293d6c583dc9d9dfa5d9" ON "clearances" ("tenantId", "status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_455f2139a7e27a63a17064c577" ON "clearances" ("tenantId", "departmentType")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ca2c42e8bf28183e259346805d" ON "clearances" ("tenantId", "employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ded0458bd7394c6d0b448dace9" ON "clearances" ("tenantId", "exitId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."chat_messages_messagetype_enum" AS ENUM('text', 'image', 'file', 'system')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."chat_messages_status_enum" AS ENUM('sent', 'delivered', 'read', 'failed')
        `);
        await queryRunner.query(`
            CREATE TABLE "chat_messages" (
                "messageId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "conversationId" uuid NOT NULL,
                "senderId" uuid NOT NULL,
                "content" text NOT NULL,
                "messageType" "public"."chat_messages_messagetype_enum" NOT NULL DEFAULT 'text',
                "status" "public"."chat_messages_status_enum" NOT NULL DEFAULT 'sent',
                "attachments" jsonb,
                "replyToMessageId" uuid,
                "metadata" jsonb,
                "isEdited" boolean NOT NULL DEFAULT false,
                "editedAt" TIMESTAMP,
                "isDeleted" boolean NOT NULL DEFAULT false,
                "deletedAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_30251e3ffecb8151f2e4c7732c1" PRIMARY KEY ("messageId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0dc219ff9a27c1f67376c0f23e" ON "chat_messages" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_45745953065384cc9c4264c2a3" ON "chat_messages" ("conversationId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_fc6b58e41e9a871dacbe9077de" ON "chat_messages" ("senderId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_dd16beafcefadc6ad2f2e9f89c" ON "chat_messages" ("tenantId", "senderId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_687954466eb867e462f23a6448" ON "chat_messages" ("tenantId", "conversationId", "createdAt")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."chat_conversations_conversationtype_enum" AS ENUM('direct', 'group')
        `);
        await queryRunner.query(`
            CREATE TABLE "chat_conversations" (
                "conversationId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "conversationType" "public"."chat_conversations_conversationtype_enum" NOT NULL DEFAULT 'direct',
                "name" character varying(255),
                "description" text,
                "avatarUrl" character varying(500),
                "createdBy" uuid,
                "lastMessageAt" TIMESTAMP,
                "lastMessageText" text,
                "lastMessageBy" uuid,
                "messageCount" integer NOT NULL DEFAULT '0',
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_25fc7fc4eaf817de6cbc510c957" PRIMARY KEY ("conversationId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_78f8838f3f2d499a055e530b72" ON "chat_conversations" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4d458f108d348fe6e750d9da19" ON "chat_conversations" ("tenantId", "createdAt")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0acc1b62242760e51deb2810ae" ON "chat_conversations" ("tenantId", "conversationType")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."chat_participants_role_enum" AS ENUM('admin', 'member')
        `);
        await queryRunner.query(`
            CREATE TABLE "chat_participants" (
                "participantId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "conversationId" uuid NOT NULL,
                "employeeId" uuid NOT NULL,
                "role" "public"."chat_participants_role_enum" NOT NULL DEFAULT 'member',
                "lastReadAt" TIMESTAMP,
                "unreadCount" integer NOT NULL DEFAULT '0',
                "isMuted" boolean NOT NULL DEFAULT false,
                "isActive" boolean NOT NULL DEFAULT true,
                "joinedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_e10c9f3e5fe85fe79fbc7f95171" UNIQUE ("conversationId", "employeeId"),
                CONSTRAINT "PK_c4209d3554c47a84b6e402561bc" PRIMARY KEY ("participantId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0aa668a39ac30255298d7d6098" ON "chat_participants" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ffa48c8c78e4c4d0cb29bd6d12" ON "chat_participants" ("conversationId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_48393bdc4e9900662593216378" ON "chat_participants" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5f09b772e670f8d8fa5e2dc2dd" ON "chat_participants" ("tenantId", "employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6cc21304067ec16cad21fa2ef0" ON "chat_participants" ("tenantId", "conversationId")
        `);
        await queryRunner.query(`
            CREATE TABLE "calendar_events" (
                "eventId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "title" character varying(255) NOT NULL,
                "description" text,
                "eventType" character varying(50) NOT NULL DEFAULT 'meeting',
                "startDate" date NOT NULL,
                "endDate" date,
                "startTime" character varying(5),
                "endTime" character varying(5),
                "isAllDay" boolean NOT NULL DEFAULT false,
                "location" character varying(255),
                "organizerId" uuid,
                "attendees" jsonb,
                "status" character varying(20) NOT NULL DEFAULT 'scheduled',
                "relatedEntityId" uuid,
                "relatedEntityType" character varying(50),
                "navigationUrl" character varying(500),
                "metadata" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_78a7ec5e4c6be72dfa19b59ecd9" PRIMARY KEY ("eventId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_308935e3c4a04f451e6cd983dd" ON "calendar_events" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_b85f3c3b0bdfa58a2058a60e0f" ON "calendar_events" ("tenantId", "status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_b19961f427a3d3ef5ee1b51bf6" ON "calendar_events" ("tenantId", "eventType")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_aa23f3c4fa3b20a8a89db7438b" ON "calendar_events" ("tenantId", "startDate")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."business_rules_category_enum" AS ENUM(
                'leave',
                'attendance',
                'payroll',
                'performance',
                'onboarding',
                'exit',
                'general'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "business_rules" (
                "ruleId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "category" "public"."business_rules_category_enum" NOT NULL,
                "ruleName" character varying(255) NOT NULL,
                "description" text,
                "isActive" boolean NOT NULL DEFAULT true,
                "leaveRules" jsonb,
                "attendanceRules" jsonb,
                "payrollRules" jsonb,
                "performanceRules" jsonb,
                "onboardingRules" jsonb,
                "exitRules" jsonb,
                "customWorkflows" jsonb,
                "priority" integer NOT NULL DEFAULT '0',
                "effectiveFrom" date,
                "effectiveTo" date,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_b1fa9bf7eb82dd9465236253c7e" PRIMARY KEY ("ruleId")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "audit_logs" (
                "logId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "action" character varying(100) NOT NULL,
                "entityType" character varying(50) NOT NULL,
                "entityId" uuid,
                "oldValue" jsonb,
                "newValue" jsonb,
                "description" text,
                "ipAddress" character varying(45),
                "userAgent" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_5fcea42fc87104960b80f524901" PRIMARY KEY ("logId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_889633a4291bcb0bf4680fff23" ON "audit_logs" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_cfa83f61e4d27a87fcae1e025a" ON "audit_logs" ("userId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c69efb19bf127c97e6740ad530" ON "audit_logs" ("createdAt")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_807994ae5cd2699bf15832114e" ON "audit_logs" ("tenantId", "action")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_3ee33c20554a6d18d2e681d780" ON "audit_logs" ("tenantId", "userId", "createdAt")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_b1242ad5160aac0feb5da4aa15" ON "audit_logs" ("tenantId", "entityType", "entityId")
        `);
        await queryRunner.query(`
            CREATE TABLE "attendance_policies" (
                "policyId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "policyName" character varying(100) NOT NULL,
                "standardCheckIn" TIME NOT NULL,
                "standardCheckOut" TIME NOT NULL,
                "requiredWorkMinutes" integer NOT NULL DEFAULT '480',
                "lateGraceMinutes" integer NOT NULL DEFAULT '15',
                "earlyGraceMinutes" integer NOT NULL DEFAULT '15',
                "breakMinutes" integer NOT NULL DEFAULT '60',
                "trackBreaks" boolean NOT NULL DEFAULT false,
                "allowOvertime" boolean NOT NULL DEFAULT false,
                "maxOvertimeMinutes" integer NOT NULL DEFAULT '120',
                "workingDays" text NOT NULL,
                "allowHalfDay" boolean NOT NULL DEFAULT true,
                "halfDayMinutes" integer NOT NULL DEFAULT '240',
                "hasShifts" boolean NOT NULL DEFAULT false,
                "isActive" boolean NOT NULL DEFAULT true,
                "description" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_338260f50c09b61aea9cd1b73a8" PRIMARY KEY ("policyId")
            );
            COMMENT ON COLUMN "attendance_policies"."requiredWorkMinutes" IS 'Required work minutes per day';
            COMMENT ON COLUMN "attendance_policies"."lateGraceMinutes" IS 'Late check-in grace period in minutes';
            COMMENT ON COLUMN "attendance_policies"."earlyGraceMinutes" IS 'Early check-out grace period in minutes';
            COMMENT ON COLUMN "attendance_policies"."breakMinutes" IS 'Total break time in minutes';
            COMMENT ON COLUMN "attendance_policies"."maxOvertimeMinutes" IS 'Maximum overtime minutes per day';
            COMMENT ON COLUMN "attendance_policies"."workingDays" IS 'Working days: [1,2,3,4,5] for Mon-Fri';
            COMMENT ON COLUMN "attendance_policies"."halfDayMinutes" IS 'Minimum minutes for half day'
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_caee96d87ca37e2190b36835f7" ON "attendance_policies" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."asset_returns_status_enum" AS ENUM(
                'pending',
                'returned',
                'damaged',
                'missing',
                'not_applicable',
                'waived'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "asset_returns" (
                "assetReturnId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "exitId" uuid NOT NULL,
                "employeeId" uuid NOT NULL,
                "assetType" character varying(100) NOT NULL,
                "assetName" character varying(200),
                "assetId" character varying(100),
                "make" character varying(100),
                "model" character varying(100),
                "status" "public"."asset_returns_status_enum" NOT NULL DEFAULT 'pending',
                "issuedDate" date,
                "expectedReturnDate" date,
                "actualReturnDate" date,
                "isReturned" boolean NOT NULL DEFAULT false,
                "isDamaged" boolean NOT NULL DEFAULT false,
                "damageDescription" text,
                "damageCharge" numeric(12, 2) NOT NULL DEFAULT '0',
                "isMissing" boolean NOT NULL DEFAULT false,
                "replacementCost" numeric(12, 2) NOT NULL DEFAULT '0',
                "isWaived" boolean NOT NULL DEFAULT false,
                "waiverReason" text,
                "waivedBy" uuid,
                "waivedDate" date,
                "verifiedBy" uuid,
                "verifiedDate" date,
                "verificationNotes" text,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_8f1a7e0ec21d3e57545f9cddb85" PRIMARY KEY ("assetReturnId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6b6ea0a67e5370b2856906e6f0" ON "asset_returns" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_91b07c1ea788e0d9f0ec710873" ON "asset_returns" ("exitId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0c16720f07d01fca8f78773991" ON "asset_returns" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_b6730a1df5d51b676674c1c561" ON "asset_returns" ("tenantId", "status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6e4629b884509b248a0bc90b2c" ON "asset_returns" ("tenantId", "assetType")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_3b9439ae2b8c57f2df617e948d" ON "asset_returns" ("tenantId", "employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_fdce103014eae7ebd0bd6eabb6" ON "asset_returns" ("tenantId", "exitId")
        `);
        await queryRunner.query(`
            CREATE TABLE "asset_records" (
                "assetRecordId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "employeeId" uuid,
                "candidateId" uuid,
                "assetType" character varying(100) NOT NULL,
                "assetName" character varying(255) NOT NULL,
                "description" text,
                "brand" character varying(255),
                "model" character varying(255),
                "serialNumber" character varying(100) NOT NULL,
                "assetTag" character varying(100),
                "status" character varying(50) NOT NULL DEFAULT 'assigned',
                "assignedDate" date NOT NULL,
                "returnDate" date,
                "expectedReturnDate" date,
                "assignedBy" uuid,
                "returnedTo" uuid,
                "condition" character varying(50),
                "purchasePrice" numeric(10, 2),
                "purchaseDate" date,
                "warrantyExpiryDate" date,
                "specifications" text,
                "location" character varying(255),
                "isReturnable" boolean NOT NULL DEFAULT false,
                "isReturned" boolean NOT NULL DEFAULT false,
                "requiresAcknowledgement" boolean NOT NULL DEFAULT false,
                "isAcknowledged" boolean NOT NULL DEFAULT false,
                "acknowledgementDate" date,
                "acknowledgementSignature" text,
                "damageReportDetails" text,
                "damageCharges" numeric(10, 2),
                "returnConditionNotes" text,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_5a6df8a75df1d9ec31c77d5c8e3" UNIQUE ("serialNumber"),
                CONSTRAINT "PK_ff7f03ccce2ae04dd2bbb630a72" PRIMARY KEY ("assetRecordId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_1d9a446acc4536b7d41d328092" ON "asset_records" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_7a81435793064da52a4cb196ee" ON "asset_records" ("tenantId", "assignedDate")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_c78edf18410aad0e881a018115" ON "asset_records" ("tenantId", "serialNumber")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_daadae9b623b6f90442c20bf01" ON "asset_records" ("tenantId", "assetType", "status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ad22e14348a43ff7ea9309e287" ON "asset_records" ("tenantId", "candidateId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_defd0fdb467bd31c74d2d4f88e" ON "asset_records" ("tenantId", "employeeId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."approvals_entitytype_enum" AS ENUM(
                'candidate',
                'probation_review',
                'probation_extension',
                'probation_termination',
                'document'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."approvals_approvaltype_enum" AS ENUM(
                'offer_approval',
                'review_approval',
                'extension_approval',
                'termination_approval',
                'document_approval'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."approvals_status_enum" AS ENUM('pending', 'approved', 'rejected', 'cancelled')
        `);
        await queryRunner.query(`
            CREATE TABLE "approvals" (
                "approvalId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "entityType" "public"."approvals_entitytype_enum" NOT NULL,
                "entityId" uuid NOT NULL,
                "approvalType" "public"."approvals_approvaltype_enum" NOT NULL,
                "approvalLevel" integer NOT NULL DEFAULT '1',
                "approverId" uuid NOT NULL,
                "status" "public"."approvals_status_enum" NOT NULL DEFAULT 'pending',
                "requestedDate" date NOT NULL,
                "respondedDate" date,
                "comments" text,
                "rejectionReason" text,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_be1b41ed18758d99b4f3400eeca" PRIMARY KEY ("approvalId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5b6954ad452f1bab28491797c5" ON "approvals" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f5287ff42fc3f68220c38e6c3c" ON "approvals" ("approverId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_eaa4dc660e41abedf82123e6e5" ON "approvals" ("tenantId", "status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_164b0946546b5230d184e6634a" ON "approvals" ("tenantId", "approverId", "status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_787e3376f180583dfdf20f534a" ON "approvals" ("tenantId", "entityType", "entityId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."analytics_metrics_category_enum" AS ENUM(
                'workforce',
                'attendance',
                'leave',
                'performance',
                'attrition',
                'onboarding',
                'confirmation',
                'compliance'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."analytics_metrics_metrictype_enum" AS ENUM(
                'count',
                'percentage',
                'rate',
                'average',
                'trend',
                'distribution'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."analytics_metrics_aggregation_enum" AS ENUM(
                'sum',
                'count',
                'avg',
                'min',
                'max',
                'distinct_count'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "analytics_metrics" (
                "metricId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "metricName" character varying(100) NOT NULL,
                "displayName" character varying(200) NOT NULL,
                "description" text NOT NULL,
                "category" "public"."analytics_metrics_category_enum" NOT NULL,
                "metricType" "public"."analytics_metrics_metrictype_enum" NOT NULL,
                "aggregation" "public"."analytics_metrics_aggregation_enum" NOT NULL,
                "queryConfig" jsonb NOT NULL,
                "dimensions" jsonb,
                "unit" character varying(20),
                "thresholds" jsonb,
                "formula" text,
                "tags" text,
                "synonyms" text,
                "isActive" boolean NOT NULL DEFAULT true,
                "isCustom" boolean NOT NULL DEFAULT false,
                "usageCount" integer NOT NULL DEFAULT '0',
                "lastCalculatedAt" TIMESTAMP,
                "lastValue" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_9aa7a522826ed1191ff9151788e" PRIMARY KEY ("metricId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_2b49ba1e5af7cb70208ff26838" ON "analytics_metrics" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_23483fc204d26b6b585a95f3dd" ON "analytics_metrics" ("tenantId", "isActive")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_85b98e1ad18e17d8bd48fb6509" ON "analytics_metrics" ("tenantId", "category")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_44c1c93c6dc64d43a4f8cf688c" ON "analytics_metrics" ("tenantId", "metricName")
        `);
        await queryRunner.query(`
            CREATE TABLE "role_permissions" (
                "roleId" uuid NOT NULL,
                "permissionId" uuid NOT NULL,
                CONSTRAINT "PK_d430a02aad006d8a70f3acd7d03" PRIMARY KEY ("roleId", "permissionId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_b4599f8b8f548d35850afa2d12" ON "role_permissions" ("roleId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_06792d0c62ce6b0203c03643cd" ON "role_permissions" ("permissionId")
        `);
        await queryRunner.query(`
            ALTER TABLE "departments"
            ADD CONSTRAINT "FK_ce3de7742d5d2c394e1a1abf364" FOREIGN KEY ("parentDeptId") REFERENCES "departments"("departmentId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "departments"
            ADD CONSTRAINT "FK_03c2ff67cf9863fe56e12091691" FOREIGN KEY ("headEmployeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "roles"
            ADD CONSTRAINT "FK_c954ae3b1156e075ccd4e9ce3e6" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "employees"
            ADD CONSTRAINT "FK_4edfe103ebf2fcb98dbb582554b" FOREIGN KEY ("departmentId") REFERENCES "departments"("departmentId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "employees"
            ADD CONSTRAINT "FK_8eed4bfc75840eeb9780f017e9e" FOREIGN KEY ("designationId") REFERENCES "designations"("designationId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "employees"
            ADD CONSTRAINT "FK_114e0dcfc1b75a6e39ff7115dab" FOREIGN KEY ("managerId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "employees"
            ADD CONSTRAINT "FK_24d98872eb52c3edb30ce96c1e9" FOREIGN KEY ("roleId") REFERENCES "roles"("roleId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "FK_c58f7e88c286e5e3478960a998b" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "FK_a7191f881489123fab6c8e52738" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_invitations"
            ADD CONSTRAINT "FK_a12cf2521e6d41039a91d5a492d" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_invitations"
            ADD CONSTRAINT "FK_2449a13c790e9085bd886c9f475" FOREIGN KEY ("invitedBy") REFERENCES "users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "candidates"
            ADD CONSTRAINT "FK_74ec758b7c9c0422b2dc4f708af" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "candidates"
            ADD CONSTRAINT "FK_8e0b0910964828530c04be8c941" FOREIGN KEY ("departmentId") REFERENCES "departments"("departmentId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "candidates"
            ADD CONSTRAINT "FK_646581d1bb26d2509f120d1059c" FOREIGN KEY ("designationId") REFERENCES "designations"("designationId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "candidates"
            ADD CONSTRAINT "FK_7cb7cc3e71809694b99b80932b4" FOREIGN KEY ("reportingManagerId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "candidates"
            ADD CONSTRAINT "FK_4b5164be10928cde40c51a62783" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "training_records"
            ADD CONSTRAINT "FK_6109771f8f3fb7e3194564185ec" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "training_records"
            ADD CONSTRAINT "FK_31d021b560383c750e97342a4d5" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "training_records"
            ADD CONSTRAINT "FK_f5258de3a4cda0088213d2e3530" FOREIGN KEY ("candidateId") REFERENCES "candidates"("candidateId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "training_records"
            ADD CONSTRAINT "FK_094ecb7792427f85ce376f72a2c" FOREIGN KEY ("completedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "training_records"
            ADD CONSTRAINT "FK_47d2488087eb25fa5f68b7a5cc6" FOREIGN KEY ("verifiedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "attendance"
            ADD CONSTRAINT "FK_07731c02b0333dc9b2678f98213" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "attendance"
            ADD CONSTRAINT "FK_2f8820d9c231da238c41d35312d" FOREIGN KEY ("overriddenBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "time_entry_edits"
            ADD CONSTRAINT "FK_c15d6bbefa030f65c96efa844e3" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "time_entry_edits"
            ADD CONSTRAINT "FK_69048b32187636a5bb032a9212e" FOREIGN KEY ("attendanceId") REFERENCES "attendance"("attendanceId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "time_entry_edits"
            ADD CONSTRAINT "FK_714ff79e0112296f4fd319d07cb" FOREIGN KEY ("approverId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "subscriptions"
            ADD CONSTRAINT "FK_0c5fe8e5f9f4dd4a8c0134abc9c" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "status_transitions"
            ADD CONSTRAINT "FK_da842c6cbd1c8640b6efd576d1f" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "status_transitions"
            ADD CONSTRAINT "FK_ff83a9444afbf0d768e97567af0" FOREIGN KEY ("triggeredBy") REFERENCES "users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "saved_reports"
            ADD CONSTRAINT "FK_3b62a07d9c699845bb874440d23" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "saved_reports"
            ADD CONSTRAINT "FK_8262751551ee2fd0dd049b40283" FOREIGN KEY ("createdBy") REFERENCES "users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "salary_components"
            ADD CONSTRAINT "FK_8c432f5b73f22738e44f96057c1" FOREIGN KEY ("salaryStructureId") REFERENCES "salary_structures"("structureId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "salary_structures"
            ADD CONSTRAINT "FK_e5ad710da2194f981364e75e0f5" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_cases"
            ADD CONSTRAINT "FK_712d110f5ffb226a11734194d08" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_cases"
            ADD CONSTRAINT "FK_3c238aa17e4392614929ecfff15" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_cases"
            ADD CONSTRAINT "FK_3b66377a913379cb08aa8603dbd" FOREIGN KEY ("extendedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_cases"
            ADD CONSTRAINT "FK_f10d8ae789fd5d813cc0753dee1" FOREIGN KEY ("riskFlaggedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_cases"
            ADD CONSTRAINT "FK_8ea03ab7ad78b2f950ef9e2eab9" FOREIGN KEY ("decidedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_tasks"
            ADD CONSTRAINT "FK_11256e3cb27bc9cc591c3e67f01" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_tasks"
            ADD CONSTRAINT "FK_b74cc8da96a81ebcd864892e8a3" FOREIGN KEY ("probationId") REFERENCES "probation_cases"("probationId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_tasks"
            ADD CONSTRAINT "FK_241dd5e4a6e3b640816605e4d34" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_tasks"
            ADD CONSTRAINT "FK_5186c89804c3a03150abf7a2167" FOREIGN KEY ("assignedTo") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_tasks"
            ADD CONSTRAINT "FK_c1b684d8778946ff26f6d396bbc" FOREIGN KEY ("completedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_reviews"
            ADD CONSTRAINT "FK_494da37bddb408fa003344f0e98" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_reviews"
            ADD CONSTRAINT "FK_1cfc8e4d2e643bc7effab7b88c2" FOREIGN KEY ("probationId") REFERENCES "probation_cases"("probationId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_reviews"
            ADD CONSTRAINT "FK_5df12789fc9319d8a34b6f59758" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_reviews"
            ADD CONSTRAINT "FK_42ad189ecbed2f605d0aa65537c" FOREIGN KEY ("managerId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_reviews"
            ADD CONSTRAINT "FK_b3dc8d3f68d9c7c261169101592" FOREIGN KEY ("hrReviewedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "position_history"
            ADD CONSTRAINT "FK_5a0c9786efe4e9922ee4bd4726f" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "position_history"
            ADD CONSTRAINT "FK_f95deaa93cc737f0c361f73a413" FOREIGN KEY ("fromDepartmentId") REFERENCES "departments"("departmentId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "position_history"
            ADD CONSTRAINT "FK_aef4ca3a47f6980909de2ded724" FOREIGN KEY ("fromDesignationId") REFERENCES "designations"("designationId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "position_history"
            ADD CONSTRAINT "FK_232bb543e8b09af56e80f483afe" FOREIGN KEY ("toDepartmentId") REFERENCES "departments"("departmentId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "position_history"
            ADD CONSTRAINT "FK_e63086c6b932426a7400532e6c6" FOREIGN KEY ("toDesignationId") REFERENCES "designations"("designationId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "position_history"
            ADD CONSTRAINT "FK_8cc9e2418bf43516017c057f702" FOREIGN KEY ("approvedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "performance_reviews"
            ADD CONSTRAINT "FK_89c1585d31979b8f709928bd2bf" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "performance_reviews"
            ADD CONSTRAINT "FK_a3c7d2780b0f68ada057ee17cf1" FOREIGN KEY ("reviewerId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payslip_attachments"
            ADD CONSTRAINT "FK_84eac2e90e90d4d87130f067e4c" FOREIGN KEY ("payslipId") REFERENCES "payslips"("payslipId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payslip_attachments"
            ADD CONSTRAINT "FK_309bac3e3fdc1555d123e8247a3" FOREIGN KEY ("uploadedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payslips"
            ADD CONSTRAINT "FK_3fa0aa64d0a6d751ea49e6cd804" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payslips"
            ADD CONSTRAINT "FK_ae3eecdb27382d57ad9b6359dd6" FOREIGN KEY ("salaryStructureId") REFERENCES "salary_structures"("structureId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payslip_components"
            ADD CONSTRAINT "FK_a9576ff85423ed0ab844e3a4e9d" FOREIGN KEY ("payslipId") REFERENCES "payslips"("payslipId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payroll_setups"
            ADD CONSTRAINT "FK_82fcc8f8eef87703b89ce782afc" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payroll_setups"
            ADD CONSTRAINT "FK_09a28a0252b9646dbdcd4c6ea34" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payroll_setups"
            ADD CONSTRAINT "FK_ca16fc9a095e06203373e30ddce" FOREIGN KEY ("candidateId") REFERENCES "candidates"("candidateId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payroll_setups"
            ADD CONSTRAINT "FK_2f1297c2d5ecb0e4378ec5554dc" FOREIGN KEY ("bankDetailsVerifiedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payroll_setups"
            ADD CONSTRAINT "FK_02fbc0e10cbdd2c81a372d9f128" FOREIGN KEY ("panVerifiedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payroll_setups"
            ADD CONSTRAINT "FK_64243c01e7983395054018d2751" FOREIGN KEY ("uanVerifiedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payroll_setups"
            ADD CONSTRAINT "FK_ed733d9a9eab5d8910188ae5e2c" FOREIGN KEY ("aadhaarVerifiedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payroll_setups"
            ADD CONSTRAINT "FK_d5941d7701d8d33fa0ff876bfcf" FOREIGN KEY ("setupCompletedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payment_history"
            ADD CONSTRAINT "FK_9104bd0103296b0c8e5424e5bc0" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payment_history"
            ADD CONSTRAINT "FK_3309cd631d6c3263c550d19ff19" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("subscriptionId") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "organization_settings"
            ADD CONSTRAINT "FK_ed5523221fbe0507dc59330c78a" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "onboarding_tasks"
            ADD CONSTRAINT "FK_8a502da069442ef5a3e36c02964" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "onboarding_tasks"
            ADD CONSTRAINT "FK_3100c7b95a6be350c5d6a8466ea" FOREIGN KEY ("candidateId") REFERENCES "candidates"("candidateId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "onboarding_tasks"
            ADD CONSTRAINT "FK_fe8fa8f4dbdd00260dbdcf35ac1" FOREIGN KEY ("assignedTo") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "onboarding_tasks"
            ADD CONSTRAINT "FK_bf56df0d99fe91d9719409e8c3c" FOREIGN KEY ("completedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "onboarding_progress"
            ADD CONSTRAINT "FK_d7e40302edaabf40ab5c4b1ed90" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "onboarding_documents"
            ADD CONSTRAINT "FK_1278e85ce4237fba1ae6997398f" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "onboarding_documents"
            ADD CONSTRAINT "FK_b21e59f52f7485a049aea4b763b" FOREIGN KEY ("candidateId") REFERENCES "candidates"("candidateId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "onboarding_documents"
            ADD CONSTRAINT "FK_f1e326bdc9f2ac8212af67318de" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "onboarding_documents"
            ADD CONSTRAINT "FK_69281905099f2f4daf8018a2aa7" FOREIGN KEY ("verifiedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "onboarding_cases"
            ADD CONSTRAINT "FK_69f78fb520627dc9f90298a2550" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "onboarding_cases"
            ADD CONSTRAINT "FK_84ee165de912aec5f4113190066" FOREIGN KEY ("candidateId") REFERENCES "candidates"("candidateId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_d5b86bc522af7cc9e3e13960ffb" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_db873ba9a123711a4bff527ccd5" FOREIGN KEY ("recipientId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "manual_employment_history"
            ADD CONSTRAINT "FK_e784680d227197602ff34a62c58" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "manual_employment_history"
            ADD CONSTRAINT "FK_d12114ee7523e04a95d24611bd2" FOREIGN KEY ("createdBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "manual_employment_history"
            ADD CONSTRAINT "FK_a789ea1d3e278e705b4ed36c5db" FOREIGN KEY ("updatedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "leave_requests"
            ADD CONSTRAINT "FK_4eda1468756ca831495e308e407" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "leave_requests"
            ADD CONSTRAINT "FK_7e54f09b0d6fa86524cab451a49" FOREIGN KEY ("approverId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "leave_balances"
            ADD CONSTRAINT "FK_1e0df1791c9344d4bdde694be60" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "leave_balances"
            ADD CONSTRAINT "FK_a94cc1550524af5c66423293c17" FOREIGN KEY ("policyId") REFERENCES "leave_policies"("policyId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "goals"
            ADD CONSTRAINT "FK_5bd450a84c6c12ba57335f801bc" FOREIGN KEY ("reviewId") REFERENCES "performance_reviews"("reviewId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "kpis"
            ADD CONSTRAINT "FK_799560f4cd65142a1afb2e4815f" FOREIGN KEY ("goalId") REFERENCES "goals"("goalId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_comments"
            ADD CONSTRAINT "FK_1c4a0020fef5a217d34979bf57e" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_comments"
            ADD CONSTRAINT "FK_dc382a274da295d4de29e11c26d" FOREIGN KEY ("postId") REFERENCES "hr_connect_posts"("postId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_comments"
            ADD CONSTRAINT "FK_c55732fc0288533c92a47307b46" FOREIGN KEY ("authorId") REFERENCES "employees"("employeeId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_comments"
            ADD CONSTRAINT "FK_ef83fe5230a3a52546e50eca26c" FOREIGN KEY ("parentCommentId") REFERENCES "hr_connect_comments"("commentId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_group_members"
            ADD CONSTRAINT "FK_323e25c3d2a697439361a35058d" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_group_members"
            ADD CONSTRAINT "FK_be70ce5167e89a2b28d796e65a1" FOREIGN KEY ("groupId") REFERENCES "hr_connect_groups"("groupId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_group_members"
            ADD CONSTRAINT "FK_910c950599231451951330d1f69" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_groups"
            ADD CONSTRAINT "FK_821df459615e1bf04b34d17f285" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_groups"
            ADD CONSTRAINT "FK_d1a3160bc0e6de7ef845c85295b" FOREIGN KEY ("createdBy") REFERENCES "employees"("employeeId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_groups"
            ADD CONSTRAINT "FK_2a8a8cab14b5d3c97282a68caf6" FOREIGN KEY ("departmentId") REFERENCES "departments"("departmentId") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_posts"
            ADD CONSTRAINT "FK_1dc1c00f34334e30d02275474f0" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_posts"
            ADD CONSTRAINT "FK_8292784dcc72410a2867c9c2f69" FOREIGN KEY ("authorId") REFERENCES "employees"("employeeId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_posts"
            ADD CONSTRAINT "FK_68194b87dc89f43b8da88549016" FOREIGN KEY ("groupId") REFERENCES "hr_connect_groups"("groupId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_reactions"
            ADD CONSTRAINT "FK_4c80636983202afd26540252352" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_reactions"
            ADD CONSTRAINT "FK_e920834a55b1713c16628a289e1" FOREIGN KEY ("postId") REFERENCES "hr_connect_posts"("postId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_reactions"
            ADD CONSTRAINT "FK_0307823050251e7ba303b03b0d5" FOREIGN KEY ("commentId") REFERENCES "hr_connect_comments"("commentId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_reactions"
            ADD CONSTRAINT "FK_1369f2ce844f6eb35714158c5ee" FOREIGN KEY ("userId") REFERENCES "employees"("employeeId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "document_templates"
            ADD CONSTRAINT "FK_6a3594520b9c7394ea61d088525" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "generated_documents"
            ADD CONSTRAINT "FK_661b796a01149b013dedfc64047" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "generated_documents"
            ADD CONSTRAINT "FK_982dc1b5f6f3e92142da343403a" FOREIGN KEY ("templateId") REFERENCES "document_templates"("templateId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "generated_documents"
            ADD CONSTRAINT "FK_e3f4ab25d9249e06d1598c0aa69" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "generated_documents"
            ADD CONSTRAINT "FK_243acc04b695df6b57145ad770e" FOREIGN KEY ("candidateId") REFERENCES "candidates"("candidateId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "generated_documents"
            ADD CONSTRAINT "FK_d9979cf98698d971292a1dd9ef3" FOREIGN KEY ("generatedBy") REFERENCES "users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "exit_cases"
            ADD CONSTRAINT "FK_6b2190c627ce3f9e7c2671dd66b" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "exit_cases"
            ADD CONSTRAINT "FK_4963e54b0260e377e61d566031f" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "exit_cases"
            ADD CONSTRAINT "FK_feaf8cb2657c4ac86a634715420" FOREIGN KEY ("approvedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "exit_cases"
            ADD CONSTRAINT "FK_e17c57c90c9c0fa101ae4a7e05a" FOREIGN KEY ("exitInterviewConductedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "exit_cases"
            ADD CONSTRAINT "FK_6f1108e6398a580fc2b7d687017" FOREIGN KEY ("settlementApprovedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "exit_cases"
            ADD CONSTRAINT "FK_05f4c4491b23a7d498b05d49cc1" FOREIGN KEY ("settlementCalculatedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "exit_cases"
            ADD CONSTRAINT "FK_91b8e8c163a5885efc2e0094033" FOREIGN KEY ("exitCompletedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "final_settlements"
            ADD CONSTRAINT "FK_b95ca55c2cfca0b2f3dc83e0764" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "final_settlements"
            ADD CONSTRAINT "FK_eeb6672c177404cf08f7c5d75d7" FOREIGN KEY ("exitId") REFERENCES "exit_cases"("exitId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "final_settlements"
            ADD CONSTRAINT "FK_6f22d9034b025d43f0f9994a58e" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "final_settlements"
            ADD CONSTRAINT "FK_3299894e8062ca3a1f3b0408dd9" FOREIGN KEY ("calculatedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "final_settlements"
            ADD CONSTRAINT "FK_ea6ef6596755aebf2a672b5200b" FOREIGN KEY ("approvedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "final_settlements"
            ADD CONSTRAINT "FK_a25d26e4fa66d8c6aa7a103139b" FOREIGN KEY ("paymentProcessedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "feedback_360"
            ADD CONSTRAINT "FK_bb84f46bcb6f55d3cce18a648d1" FOREIGN KEY ("reviewId") REFERENCES "performance_reviews"("reviewId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "feedback_360"
            ADD CONSTRAINT "FK_396f3c8427ad7e9f6d19fa16bae" FOREIGN KEY ("feedbackFromId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "exit_interviews"
            ADD CONSTRAINT "FK_6faa85a9c3f12bd8daf569987e3" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "exit_interviews"
            ADD CONSTRAINT "FK_1dbfb8ac17456e957d1c4f09b2e" FOREIGN KEY ("exitId") REFERENCES "exit_cases"("exitId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "exit_interviews"
            ADD CONSTRAINT "FK_697c5b6c6cdec3dc5a32866806b" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "exit_interviews"
            ADD CONSTRAINT "FK_90b38f0d8b32ca7be825ed8dd86" FOREIGN KEY ("conductedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "employee_documents"
            ADD CONSTRAINT "FK_1e0b96137e88ec3ab8f14709f7c" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "employee_documents"
            ADD CONSTRAINT "FK_423155204b95dd197eade12e5b9" FOREIGN KEY ("uploadedBy") REFERENCES "users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "employee_documents"
            ADD CONSTRAINT "FK_3d513e63f632d9c2519e05781c7" FOREIGN KEY ("verifiedBy") REFERENCES "users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "digital_library"
            ADD CONSTRAINT "FK_d9ad8ab2c535ca55bf698fde56a" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "digital_library"
            ADD CONSTRAINT "FK_f80dbda1aade7edda32c8f21df8" FOREIGN KEY ("originalOwnerId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "development_action_items"
            ADD CONSTRAINT "FK_8acb3441de4f855cf4733cf1987" FOREIGN KEY ("reviewId") REFERENCES "performance_reviews"("reviewId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "compensation_share_logs"
            ADD CONSTRAINT "FK_c4e4f6e50d75e888d48c3d0bc6f" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "compensation_share_logs"
            ADD CONSTRAINT "FK_a8fe0b5169fa421beff6974b254" FOREIGN KEY ("payslipId") REFERENCES "payslips"("payslipId") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "compensation_history"
            ADD CONSTRAINT "FK_85d561ddcbfba8138586475007d" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "compensation_history"
            ADD CONSTRAINT "FK_1475fa78f3e2b6ba015c14392f7" FOREIGN KEY ("approvedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "company_documents"
            ADD CONSTRAINT "FK_163a1efb45654fe89ad3df15cb9" FOREIGN KEY ("uploadedBy") REFERENCES "users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "company_documents"
            ADD CONSTRAINT "FK_f9b8aa95cc5bd312261b0ca396e" FOREIGN KEY ("verifiedBy") REFERENCES "users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "clearances"
            ADD CONSTRAINT "FK_859ed168774e5d7d05c8652d05c" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "clearances"
            ADD CONSTRAINT "FK_0492d0e26361713f7e5c7ad9682" FOREIGN KEY ("exitId") REFERENCES "exit_cases"("exitId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "clearances"
            ADD CONSTRAINT "FK_d0e79283a6a9abed2d90644d670" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "clearances"
            ADD CONSTRAINT "FK_53be2ecd5db9ffa1e6de131a051" FOREIGN KEY ("departmentId") REFERENCES "departments"("departmentId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "clearances"
            ADD CONSTRAINT "FK_22c5f4b442a75cdb1416ce884cf" FOREIGN KEY ("assignedTo") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "clearances"
            ADD CONSTRAINT "FK_f64eafd0ee6741f3cc1f1ff0428" FOREIGN KEY ("approvedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "clearances"
            ADD CONSTRAINT "FK_fcdaa2855d2771e0bb2f521e722" FOREIGN KEY ("escalatedTo") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_messages"
            ADD CONSTRAINT "FK_45745953065384cc9c4264c2a3d" FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("conversationId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_messages"
            ADD CONSTRAINT "FK_fc6b58e41e9a871dacbe9077def" FOREIGN KEY ("senderId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_messages"
            ADD CONSTRAINT "FK_7f14f98223ed064c8904067dce1" FOREIGN KEY ("replyToMessageId") REFERENCES "chat_messages"("messageId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_conversations"
            ADD CONSTRAINT "FK_602725a64e15991d46a9429be1b" FOREIGN KEY ("createdBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_conversations"
            ADD CONSTRAINT "FK_c17d04a7c678fe256300d78e7b4" FOREIGN KEY ("lastMessageBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_participants"
            ADD CONSTRAINT "FK_ffa48c8c78e4c4d0cb29bd6d123" FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("conversationId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_participants"
            ADD CONSTRAINT "FK_48393bdc4e99006625932163787" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "calendar_events"
            ADD CONSTRAINT "FK_308935e3c4a04f451e6cd983ddc" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "calendar_events"
            ADD CONSTRAINT "FK_a007ca3d443825b41461d9da45c" FOREIGN KEY ("organizerId") REFERENCES "employees"("employeeId") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "business_rules"
            ADD CONSTRAINT "FK_3ca63e53156a1d73db571157580" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "audit_logs"
            ADD CONSTRAINT "FK_889633a4291bcb0bf4680fff234" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "audit_logs"
            ADD CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "asset_returns"
            ADD CONSTRAINT "FK_6b6ea0a67e5370b2856906e6f03" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "asset_returns"
            ADD CONSTRAINT "FK_91b07c1ea788e0d9f0ec710873c" FOREIGN KEY ("exitId") REFERENCES "exit_cases"("exitId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "asset_returns"
            ADD CONSTRAINT "FK_0c16720f07d01fca8f78773991f" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "asset_returns"
            ADD CONSTRAINT "FK_de3b56992867b855c8d39fedf84" FOREIGN KEY ("verifiedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "asset_returns"
            ADD CONSTRAINT "FK_de0813513c4d4200b7ae8e45a74" FOREIGN KEY ("waivedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "asset_records"
            ADD CONSTRAINT "FK_1d9a446acc4536b7d41d3280922" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "asset_records"
            ADD CONSTRAINT "FK_cd62196fb143dbffb858fb82e27" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "asset_records"
            ADD CONSTRAINT "FK_3c5e4f52a6609149f30102f8cff" FOREIGN KEY ("candidateId") REFERENCES "candidates"("candidateId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "asset_records"
            ADD CONSTRAINT "FK_253e7fd8110e6211e6408f60312" FOREIGN KEY ("assignedBy") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "asset_records"
            ADD CONSTRAINT "FK_955d7c0b063132f316d6a578e41" FOREIGN KEY ("returnedTo") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "approvals"
            ADD CONSTRAINT "FK_5b6954ad452f1bab28491797c5c" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "approvals"
            ADD CONSTRAINT "FK_f5287ff42fc3f68220c38e6c3cd" FOREIGN KEY ("approverId") REFERENCES "employees"("employeeId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "analytics_metrics"
            ADD CONSTRAINT "FK_2b49ba1e5af7cb70208ff26838d" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "role_permissions"
            ADD CONSTRAINT "FK_b4599f8b8f548d35850afa2d12c" FOREIGN KEY ("roleId") REFERENCES "roles"("roleId") ON DELETE CASCADE ON UPDATE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "role_permissions"
            ADD CONSTRAINT "FK_06792d0c62ce6b0203c03643cdd" FOREIGN KEY ("permissionId") REFERENCES "permissions"("permissionId") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_06792d0c62ce6b0203c03643cdd"
        `);
        await queryRunner.query(`
            ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_b4599f8b8f548d35850afa2d12c"
        `);
        await queryRunner.query(`
            ALTER TABLE "analytics_metrics" DROP CONSTRAINT "FK_2b49ba1e5af7cb70208ff26838d"
        `);
        await queryRunner.query(`
            ALTER TABLE "approvals" DROP CONSTRAINT "FK_f5287ff42fc3f68220c38e6c3cd"
        `);
        await queryRunner.query(`
            ALTER TABLE "approvals" DROP CONSTRAINT "FK_5b6954ad452f1bab28491797c5c"
        `);
        await queryRunner.query(`
            ALTER TABLE "asset_records" DROP CONSTRAINT "FK_955d7c0b063132f316d6a578e41"
        `);
        await queryRunner.query(`
            ALTER TABLE "asset_records" DROP CONSTRAINT "FK_253e7fd8110e6211e6408f60312"
        `);
        await queryRunner.query(`
            ALTER TABLE "asset_records" DROP CONSTRAINT "FK_3c5e4f52a6609149f30102f8cff"
        `);
        await queryRunner.query(`
            ALTER TABLE "asset_records" DROP CONSTRAINT "FK_cd62196fb143dbffb858fb82e27"
        `);
        await queryRunner.query(`
            ALTER TABLE "asset_records" DROP CONSTRAINT "FK_1d9a446acc4536b7d41d3280922"
        `);
        await queryRunner.query(`
            ALTER TABLE "asset_returns" DROP CONSTRAINT "FK_de0813513c4d4200b7ae8e45a74"
        `);
        await queryRunner.query(`
            ALTER TABLE "asset_returns" DROP CONSTRAINT "FK_de3b56992867b855c8d39fedf84"
        `);
        await queryRunner.query(`
            ALTER TABLE "asset_returns" DROP CONSTRAINT "FK_0c16720f07d01fca8f78773991f"
        `);
        await queryRunner.query(`
            ALTER TABLE "asset_returns" DROP CONSTRAINT "FK_91b07c1ea788e0d9f0ec710873c"
        `);
        await queryRunner.query(`
            ALTER TABLE "asset_returns" DROP CONSTRAINT "FK_6b6ea0a67e5370b2856906e6f03"
        `);
        await queryRunner.query(`
            ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab"
        `);
        await queryRunner.query(`
            ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_889633a4291bcb0bf4680fff234"
        `);
        await queryRunner.query(`
            ALTER TABLE "business_rules" DROP CONSTRAINT "FK_3ca63e53156a1d73db571157580"
        `);
        await queryRunner.query(`
            ALTER TABLE "calendar_events" DROP CONSTRAINT "FK_a007ca3d443825b41461d9da45c"
        `);
        await queryRunner.query(`
            ALTER TABLE "calendar_events" DROP CONSTRAINT "FK_308935e3c4a04f451e6cd983ddc"
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_participants" DROP CONSTRAINT "FK_48393bdc4e99006625932163787"
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_participants" DROP CONSTRAINT "FK_ffa48c8c78e4c4d0cb29bd6d123"
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_conversations" DROP CONSTRAINT "FK_c17d04a7c678fe256300d78e7b4"
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_conversations" DROP CONSTRAINT "FK_602725a64e15991d46a9429be1b"
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_7f14f98223ed064c8904067dce1"
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_fc6b58e41e9a871dacbe9077def"
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_45745953065384cc9c4264c2a3d"
        `);
        await queryRunner.query(`
            ALTER TABLE "clearances" DROP CONSTRAINT "FK_fcdaa2855d2771e0bb2f521e722"
        `);
        await queryRunner.query(`
            ALTER TABLE "clearances" DROP CONSTRAINT "FK_f64eafd0ee6741f3cc1f1ff0428"
        `);
        await queryRunner.query(`
            ALTER TABLE "clearances" DROP CONSTRAINT "FK_22c5f4b442a75cdb1416ce884cf"
        `);
        await queryRunner.query(`
            ALTER TABLE "clearances" DROP CONSTRAINT "FK_53be2ecd5db9ffa1e6de131a051"
        `);
        await queryRunner.query(`
            ALTER TABLE "clearances" DROP CONSTRAINT "FK_d0e79283a6a9abed2d90644d670"
        `);
        await queryRunner.query(`
            ALTER TABLE "clearances" DROP CONSTRAINT "FK_0492d0e26361713f7e5c7ad9682"
        `);
        await queryRunner.query(`
            ALTER TABLE "clearances" DROP CONSTRAINT "FK_859ed168774e5d7d05c8652d05c"
        `);
        await queryRunner.query(`
            ALTER TABLE "company_documents" DROP CONSTRAINT "FK_f9b8aa95cc5bd312261b0ca396e"
        `);
        await queryRunner.query(`
            ALTER TABLE "company_documents" DROP CONSTRAINT "FK_163a1efb45654fe89ad3df15cb9"
        `);
        await queryRunner.query(`
            ALTER TABLE "compensation_history" DROP CONSTRAINT "FK_1475fa78f3e2b6ba015c14392f7"
        `);
        await queryRunner.query(`
            ALTER TABLE "compensation_history" DROP CONSTRAINT "FK_85d561ddcbfba8138586475007d"
        `);
        await queryRunner.query(`
            ALTER TABLE "compensation_share_logs" DROP CONSTRAINT "FK_a8fe0b5169fa421beff6974b254"
        `);
        await queryRunner.query(`
            ALTER TABLE "compensation_share_logs" DROP CONSTRAINT "FK_c4e4f6e50d75e888d48c3d0bc6f"
        `);
        await queryRunner.query(`
            ALTER TABLE "development_action_items" DROP CONSTRAINT "FK_8acb3441de4f855cf4733cf1987"
        `);
        await queryRunner.query(`
            ALTER TABLE "digital_library" DROP CONSTRAINT "FK_f80dbda1aade7edda32c8f21df8"
        `);
        await queryRunner.query(`
            ALTER TABLE "digital_library" DROP CONSTRAINT "FK_d9ad8ab2c535ca55bf698fde56a"
        `);
        await queryRunner.query(`
            ALTER TABLE "employee_documents" DROP CONSTRAINT "FK_3d513e63f632d9c2519e05781c7"
        `);
        await queryRunner.query(`
            ALTER TABLE "employee_documents" DROP CONSTRAINT "FK_423155204b95dd197eade12e5b9"
        `);
        await queryRunner.query(`
            ALTER TABLE "employee_documents" DROP CONSTRAINT "FK_1e0b96137e88ec3ab8f14709f7c"
        `);
        await queryRunner.query(`
            ALTER TABLE "exit_interviews" DROP CONSTRAINT "FK_90b38f0d8b32ca7be825ed8dd86"
        `);
        await queryRunner.query(`
            ALTER TABLE "exit_interviews" DROP CONSTRAINT "FK_697c5b6c6cdec3dc5a32866806b"
        `);
        await queryRunner.query(`
            ALTER TABLE "exit_interviews" DROP CONSTRAINT "FK_1dbfb8ac17456e957d1c4f09b2e"
        `);
        await queryRunner.query(`
            ALTER TABLE "exit_interviews" DROP CONSTRAINT "FK_6faa85a9c3f12bd8daf569987e3"
        `);
        await queryRunner.query(`
            ALTER TABLE "feedback_360" DROP CONSTRAINT "FK_396f3c8427ad7e9f6d19fa16bae"
        `);
        await queryRunner.query(`
            ALTER TABLE "feedback_360" DROP CONSTRAINT "FK_bb84f46bcb6f55d3cce18a648d1"
        `);
        await queryRunner.query(`
            ALTER TABLE "final_settlements" DROP CONSTRAINT "FK_a25d26e4fa66d8c6aa7a103139b"
        `);
        await queryRunner.query(`
            ALTER TABLE "final_settlements" DROP CONSTRAINT "FK_ea6ef6596755aebf2a672b5200b"
        `);
        await queryRunner.query(`
            ALTER TABLE "final_settlements" DROP CONSTRAINT "FK_3299894e8062ca3a1f3b0408dd9"
        `);
        await queryRunner.query(`
            ALTER TABLE "final_settlements" DROP CONSTRAINT "FK_6f22d9034b025d43f0f9994a58e"
        `);
        await queryRunner.query(`
            ALTER TABLE "final_settlements" DROP CONSTRAINT "FK_eeb6672c177404cf08f7c5d75d7"
        `);
        await queryRunner.query(`
            ALTER TABLE "final_settlements" DROP CONSTRAINT "FK_b95ca55c2cfca0b2f3dc83e0764"
        `);
        await queryRunner.query(`
            ALTER TABLE "exit_cases" DROP CONSTRAINT "FK_91b8e8c163a5885efc2e0094033"
        `);
        await queryRunner.query(`
            ALTER TABLE "exit_cases" DROP CONSTRAINT "FK_05f4c4491b23a7d498b05d49cc1"
        `);
        await queryRunner.query(`
            ALTER TABLE "exit_cases" DROP CONSTRAINT "FK_6f1108e6398a580fc2b7d687017"
        `);
        await queryRunner.query(`
            ALTER TABLE "exit_cases" DROP CONSTRAINT "FK_e17c57c90c9c0fa101ae4a7e05a"
        `);
        await queryRunner.query(`
            ALTER TABLE "exit_cases" DROP CONSTRAINT "FK_feaf8cb2657c4ac86a634715420"
        `);
        await queryRunner.query(`
            ALTER TABLE "exit_cases" DROP CONSTRAINT "FK_4963e54b0260e377e61d566031f"
        `);
        await queryRunner.query(`
            ALTER TABLE "exit_cases" DROP CONSTRAINT "FK_6b2190c627ce3f9e7c2671dd66b"
        `);
        await queryRunner.query(`
            ALTER TABLE "generated_documents" DROP CONSTRAINT "FK_d9979cf98698d971292a1dd9ef3"
        `);
        await queryRunner.query(`
            ALTER TABLE "generated_documents" DROP CONSTRAINT "FK_243acc04b695df6b57145ad770e"
        `);
        await queryRunner.query(`
            ALTER TABLE "generated_documents" DROP CONSTRAINT "FK_e3f4ab25d9249e06d1598c0aa69"
        `);
        await queryRunner.query(`
            ALTER TABLE "generated_documents" DROP CONSTRAINT "FK_982dc1b5f6f3e92142da343403a"
        `);
        await queryRunner.query(`
            ALTER TABLE "generated_documents" DROP CONSTRAINT "FK_661b796a01149b013dedfc64047"
        `);
        await queryRunner.query(`
            ALTER TABLE "document_templates" DROP CONSTRAINT "FK_6a3594520b9c7394ea61d088525"
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_reactions" DROP CONSTRAINT "FK_1369f2ce844f6eb35714158c5ee"
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_reactions" DROP CONSTRAINT "FK_0307823050251e7ba303b03b0d5"
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_reactions" DROP CONSTRAINT "FK_e920834a55b1713c16628a289e1"
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_reactions" DROP CONSTRAINT "FK_4c80636983202afd26540252352"
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_posts" DROP CONSTRAINT "FK_68194b87dc89f43b8da88549016"
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_posts" DROP CONSTRAINT "FK_8292784dcc72410a2867c9c2f69"
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_posts" DROP CONSTRAINT "FK_1dc1c00f34334e30d02275474f0"
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_groups" DROP CONSTRAINT "FK_2a8a8cab14b5d3c97282a68caf6"
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_groups" DROP CONSTRAINT "FK_d1a3160bc0e6de7ef845c85295b"
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_groups" DROP CONSTRAINT "FK_821df459615e1bf04b34d17f285"
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_group_members" DROP CONSTRAINT "FK_910c950599231451951330d1f69"
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_group_members" DROP CONSTRAINT "FK_be70ce5167e89a2b28d796e65a1"
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_group_members" DROP CONSTRAINT "FK_323e25c3d2a697439361a35058d"
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_comments" DROP CONSTRAINT "FK_ef83fe5230a3a52546e50eca26c"
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_comments" DROP CONSTRAINT "FK_c55732fc0288533c92a47307b46"
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_comments" DROP CONSTRAINT "FK_dc382a274da295d4de29e11c26d"
        `);
        await queryRunner.query(`
            ALTER TABLE "hr_connect_comments" DROP CONSTRAINT "FK_1c4a0020fef5a217d34979bf57e"
        `);
        await queryRunner.query(`
            ALTER TABLE "kpis" DROP CONSTRAINT "FK_799560f4cd65142a1afb2e4815f"
        `);
        await queryRunner.query(`
            ALTER TABLE "goals" DROP CONSTRAINT "FK_5bd450a84c6c12ba57335f801bc"
        `);
        await queryRunner.query(`
            ALTER TABLE "leave_balances" DROP CONSTRAINT "FK_a94cc1550524af5c66423293c17"
        `);
        await queryRunner.query(`
            ALTER TABLE "leave_balances" DROP CONSTRAINT "FK_1e0df1791c9344d4bdde694be60"
        `);
        await queryRunner.query(`
            ALTER TABLE "leave_requests" DROP CONSTRAINT "FK_7e54f09b0d6fa86524cab451a49"
        `);
        await queryRunner.query(`
            ALTER TABLE "leave_requests" DROP CONSTRAINT "FK_4eda1468756ca831495e308e407"
        `);
        await queryRunner.query(`
            ALTER TABLE "manual_employment_history" DROP CONSTRAINT "FK_a789ea1d3e278e705b4ed36c5db"
        `);
        await queryRunner.query(`
            ALTER TABLE "manual_employment_history" DROP CONSTRAINT "FK_d12114ee7523e04a95d24611bd2"
        `);
        await queryRunner.query(`
            ALTER TABLE "manual_employment_history" DROP CONSTRAINT "FK_e784680d227197602ff34a62c58"
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "FK_db873ba9a123711a4bff527ccd5"
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "FK_d5b86bc522af7cc9e3e13960ffb"
        `);
        await queryRunner.query(`
            ALTER TABLE "onboarding_cases" DROP CONSTRAINT "FK_84ee165de912aec5f4113190066"
        `);
        await queryRunner.query(`
            ALTER TABLE "onboarding_cases" DROP CONSTRAINT "FK_69f78fb520627dc9f90298a2550"
        `);
        await queryRunner.query(`
            ALTER TABLE "onboarding_documents" DROP CONSTRAINT "FK_69281905099f2f4daf8018a2aa7"
        `);
        await queryRunner.query(`
            ALTER TABLE "onboarding_documents" DROP CONSTRAINT "FK_f1e326bdc9f2ac8212af67318de"
        `);
        await queryRunner.query(`
            ALTER TABLE "onboarding_documents" DROP CONSTRAINT "FK_b21e59f52f7485a049aea4b763b"
        `);
        await queryRunner.query(`
            ALTER TABLE "onboarding_documents" DROP CONSTRAINT "FK_1278e85ce4237fba1ae6997398f"
        `);
        await queryRunner.query(`
            ALTER TABLE "onboarding_progress" DROP CONSTRAINT "FK_d7e40302edaabf40ab5c4b1ed90"
        `);
        await queryRunner.query(`
            ALTER TABLE "onboarding_tasks" DROP CONSTRAINT "FK_bf56df0d99fe91d9719409e8c3c"
        `);
        await queryRunner.query(`
            ALTER TABLE "onboarding_tasks" DROP CONSTRAINT "FK_fe8fa8f4dbdd00260dbdcf35ac1"
        `);
        await queryRunner.query(`
            ALTER TABLE "onboarding_tasks" DROP CONSTRAINT "FK_3100c7b95a6be350c5d6a8466ea"
        `);
        await queryRunner.query(`
            ALTER TABLE "onboarding_tasks" DROP CONSTRAINT "FK_8a502da069442ef5a3e36c02964"
        `);
        await queryRunner.query(`
            ALTER TABLE "organization_settings" DROP CONSTRAINT "FK_ed5523221fbe0507dc59330c78a"
        `);
        await queryRunner.query(`
            ALTER TABLE "payment_history" DROP CONSTRAINT "FK_3309cd631d6c3263c550d19ff19"
        `);
        await queryRunner.query(`
            ALTER TABLE "payment_history" DROP CONSTRAINT "FK_9104bd0103296b0c8e5424e5bc0"
        `);
        await queryRunner.query(`
            ALTER TABLE "payroll_setups" DROP CONSTRAINT "FK_d5941d7701d8d33fa0ff876bfcf"
        `);
        await queryRunner.query(`
            ALTER TABLE "payroll_setups" DROP CONSTRAINT "FK_ed733d9a9eab5d8910188ae5e2c"
        `);
        await queryRunner.query(`
            ALTER TABLE "payroll_setups" DROP CONSTRAINT "FK_64243c01e7983395054018d2751"
        `);
        await queryRunner.query(`
            ALTER TABLE "payroll_setups" DROP CONSTRAINT "FK_02fbc0e10cbdd2c81a372d9f128"
        `);
        await queryRunner.query(`
            ALTER TABLE "payroll_setups" DROP CONSTRAINT "FK_2f1297c2d5ecb0e4378ec5554dc"
        `);
        await queryRunner.query(`
            ALTER TABLE "payroll_setups" DROP CONSTRAINT "FK_ca16fc9a095e06203373e30ddce"
        `);
        await queryRunner.query(`
            ALTER TABLE "payroll_setups" DROP CONSTRAINT "FK_09a28a0252b9646dbdcd4c6ea34"
        `);
        await queryRunner.query(`
            ALTER TABLE "payroll_setups" DROP CONSTRAINT "FK_82fcc8f8eef87703b89ce782afc"
        `);
        await queryRunner.query(`
            ALTER TABLE "payslip_components" DROP CONSTRAINT "FK_a9576ff85423ed0ab844e3a4e9d"
        `);
        await queryRunner.query(`
            ALTER TABLE "payslips" DROP CONSTRAINT "FK_ae3eecdb27382d57ad9b6359dd6"
        `);
        await queryRunner.query(`
            ALTER TABLE "payslips" DROP CONSTRAINT "FK_3fa0aa64d0a6d751ea49e6cd804"
        `);
        await queryRunner.query(`
            ALTER TABLE "payslip_attachments" DROP CONSTRAINT "FK_309bac3e3fdc1555d123e8247a3"
        `);
        await queryRunner.query(`
            ALTER TABLE "payslip_attachments" DROP CONSTRAINT "FK_84eac2e90e90d4d87130f067e4c"
        `);
        await queryRunner.query(`
            ALTER TABLE "performance_reviews" DROP CONSTRAINT "FK_a3c7d2780b0f68ada057ee17cf1"
        `);
        await queryRunner.query(`
            ALTER TABLE "performance_reviews" DROP CONSTRAINT "FK_89c1585d31979b8f709928bd2bf"
        `);
        await queryRunner.query(`
            ALTER TABLE "position_history" DROP CONSTRAINT "FK_8cc9e2418bf43516017c057f702"
        `);
        await queryRunner.query(`
            ALTER TABLE "position_history" DROP CONSTRAINT "FK_e63086c6b932426a7400532e6c6"
        `);
        await queryRunner.query(`
            ALTER TABLE "position_history" DROP CONSTRAINT "FK_232bb543e8b09af56e80f483afe"
        `);
        await queryRunner.query(`
            ALTER TABLE "position_history" DROP CONSTRAINT "FK_aef4ca3a47f6980909de2ded724"
        `);
        await queryRunner.query(`
            ALTER TABLE "position_history" DROP CONSTRAINT "FK_f95deaa93cc737f0c361f73a413"
        `);
        await queryRunner.query(`
            ALTER TABLE "position_history" DROP CONSTRAINT "FK_5a0c9786efe4e9922ee4bd4726f"
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_reviews" DROP CONSTRAINT "FK_b3dc8d3f68d9c7c261169101592"
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_reviews" DROP CONSTRAINT "FK_42ad189ecbed2f605d0aa65537c"
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_reviews" DROP CONSTRAINT "FK_5df12789fc9319d8a34b6f59758"
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_reviews" DROP CONSTRAINT "FK_1cfc8e4d2e643bc7effab7b88c2"
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_reviews" DROP CONSTRAINT "FK_494da37bddb408fa003344f0e98"
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_tasks" DROP CONSTRAINT "FK_c1b684d8778946ff26f6d396bbc"
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_tasks" DROP CONSTRAINT "FK_5186c89804c3a03150abf7a2167"
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_tasks" DROP CONSTRAINT "FK_241dd5e4a6e3b640816605e4d34"
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_tasks" DROP CONSTRAINT "FK_b74cc8da96a81ebcd864892e8a3"
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_tasks" DROP CONSTRAINT "FK_11256e3cb27bc9cc591c3e67f01"
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_cases" DROP CONSTRAINT "FK_8ea03ab7ad78b2f950ef9e2eab9"
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_cases" DROP CONSTRAINT "FK_f10d8ae789fd5d813cc0753dee1"
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_cases" DROP CONSTRAINT "FK_3b66377a913379cb08aa8603dbd"
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_cases" DROP CONSTRAINT "FK_3c238aa17e4392614929ecfff15"
        `);
        await queryRunner.query(`
            ALTER TABLE "probation_cases" DROP CONSTRAINT "FK_712d110f5ffb226a11734194d08"
        `);
        await queryRunner.query(`
            ALTER TABLE "salary_structures" DROP CONSTRAINT "FK_e5ad710da2194f981364e75e0f5"
        `);
        await queryRunner.query(`
            ALTER TABLE "salary_components" DROP CONSTRAINT "FK_8c432f5b73f22738e44f96057c1"
        `);
        await queryRunner.query(`
            ALTER TABLE "saved_reports" DROP CONSTRAINT "FK_8262751551ee2fd0dd049b40283"
        `);
        await queryRunner.query(`
            ALTER TABLE "saved_reports" DROP CONSTRAINT "FK_3b62a07d9c699845bb874440d23"
        `);
        await queryRunner.query(`
            ALTER TABLE "status_transitions" DROP CONSTRAINT "FK_ff83a9444afbf0d768e97567af0"
        `);
        await queryRunner.query(`
            ALTER TABLE "status_transitions" DROP CONSTRAINT "FK_da842c6cbd1c8640b6efd576d1f"
        `);
        await queryRunner.query(`
            ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_0c5fe8e5f9f4dd4a8c0134abc9c"
        `);
        await queryRunner.query(`
            ALTER TABLE "time_entry_edits" DROP CONSTRAINT "FK_714ff79e0112296f4fd319d07cb"
        `);
        await queryRunner.query(`
            ALTER TABLE "time_entry_edits" DROP CONSTRAINT "FK_69048b32187636a5bb032a9212e"
        `);
        await queryRunner.query(`
            ALTER TABLE "time_entry_edits" DROP CONSTRAINT "FK_c15d6bbefa030f65c96efa844e3"
        `);
        await queryRunner.query(`
            ALTER TABLE "attendance" DROP CONSTRAINT "FK_2f8820d9c231da238c41d35312d"
        `);
        await queryRunner.query(`
            ALTER TABLE "attendance" DROP CONSTRAINT "FK_07731c02b0333dc9b2678f98213"
        `);
        await queryRunner.query(`
            ALTER TABLE "training_records" DROP CONSTRAINT "FK_47d2488087eb25fa5f68b7a5cc6"
        `);
        await queryRunner.query(`
            ALTER TABLE "training_records" DROP CONSTRAINT "FK_094ecb7792427f85ce376f72a2c"
        `);
        await queryRunner.query(`
            ALTER TABLE "training_records" DROP CONSTRAINT "FK_f5258de3a4cda0088213d2e3530"
        `);
        await queryRunner.query(`
            ALTER TABLE "training_records" DROP CONSTRAINT "FK_31d021b560383c750e97342a4d5"
        `);
        await queryRunner.query(`
            ALTER TABLE "training_records" DROP CONSTRAINT "FK_6109771f8f3fb7e3194564185ec"
        `);
        await queryRunner.query(`
            ALTER TABLE "candidates" DROP CONSTRAINT "FK_4b5164be10928cde40c51a62783"
        `);
        await queryRunner.query(`
            ALTER TABLE "candidates" DROP CONSTRAINT "FK_7cb7cc3e71809694b99b80932b4"
        `);
        await queryRunner.query(`
            ALTER TABLE "candidates" DROP CONSTRAINT "FK_646581d1bb26d2509f120d1059c"
        `);
        await queryRunner.query(`
            ALTER TABLE "candidates" DROP CONSTRAINT "FK_8e0b0910964828530c04be8c941"
        `);
        await queryRunner.query(`
            ALTER TABLE "candidates" DROP CONSTRAINT "FK_74ec758b7c9c0422b2dc4f708af"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_invitations" DROP CONSTRAINT "FK_2449a13c790e9085bd886c9f475"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_invitations" DROP CONSTRAINT "FK_a12cf2521e6d41039a91d5a492d"
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "FK_a7191f881489123fab6c8e52738"
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "FK_c58f7e88c286e5e3478960a998b"
        `);
        await queryRunner.query(`
            ALTER TABLE "employees" DROP CONSTRAINT "FK_24d98872eb52c3edb30ce96c1e9"
        `);
        await queryRunner.query(`
            ALTER TABLE "employees" DROP CONSTRAINT "FK_114e0dcfc1b75a6e39ff7115dab"
        `);
        await queryRunner.query(`
            ALTER TABLE "employees" DROP CONSTRAINT "FK_8eed4bfc75840eeb9780f017e9e"
        `);
        await queryRunner.query(`
            ALTER TABLE "employees" DROP CONSTRAINT "FK_4edfe103ebf2fcb98dbb582554b"
        `);
        await queryRunner.query(`
            ALTER TABLE "roles" DROP CONSTRAINT "FK_c954ae3b1156e075ccd4e9ce3e6"
        `);
        await queryRunner.query(`
            ALTER TABLE "departments" DROP CONSTRAINT "FK_03c2ff67cf9863fe56e12091691"
        `);
        await queryRunner.query(`
            ALTER TABLE "departments" DROP CONSTRAINT "FK_ce3de7742d5d2c394e1a1abf364"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_06792d0c62ce6b0203c03643cd"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_b4599f8b8f548d35850afa2d12"
        `);
        await queryRunner.query(`
            DROP TABLE "role_permissions"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_44c1c93c6dc64d43a4f8cf688c"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_85b98e1ad18e17d8bd48fb6509"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_23483fc204d26b6b585a95f3dd"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_2b49ba1e5af7cb70208ff26838"
        `);
        await queryRunner.query(`
            DROP TABLE "analytics_metrics"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."analytics_metrics_aggregation_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."analytics_metrics_metrictype_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."analytics_metrics_category_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_787e3376f180583dfdf20f534a"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_164b0946546b5230d184e6634a"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_eaa4dc660e41abedf82123e6e5"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_f5287ff42fc3f68220c38e6c3c"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_5b6954ad452f1bab28491797c5"
        `);
        await queryRunner.query(`
            DROP TABLE "approvals"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."approvals_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."approvals_approvaltype_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."approvals_entitytype_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_defd0fdb467bd31c74d2d4f88e"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ad22e14348a43ff7ea9309e287"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_daadae9b623b6f90442c20bf01"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c78edf18410aad0e881a018115"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7a81435793064da52a4cb196ee"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1d9a446acc4536b7d41d328092"
        `);
        await queryRunner.query(`
            DROP TABLE "asset_records"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_fdce103014eae7ebd0bd6eabb6"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_3b9439ae2b8c57f2df617e948d"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6e4629b884509b248a0bc90b2c"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_b6730a1df5d51b676674c1c561"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_0c16720f07d01fca8f78773991"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_91b07c1ea788e0d9f0ec710873"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6b6ea0a67e5370b2856906e6f0"
        `);
        await queryRunner.query(`
            DROP TABLE "asset_returns"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."asset_returns_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_caee96d87ca37e2190b36835f7"
        `);
        await queryRunner.query(`
            DROP TABLE "attendance_policies"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_b1242ad5160aac0feb5da4aa15"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_3ee33c20554a6d18d2e681d780"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_807994ae5cd2699bf15832114e"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c69efb19bf127c97e6740ad530"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_cfa83f61e4d27a87fcae1e025a"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_889633a4291bcb0bf4680fff23"
        `);
        await queryRunner.query(`
            DROP TABLE "audit_logs"
        `);
        await queryRunner.query(`
            DROP TABLE "business_rules"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."business_rules_category_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_aa23f3c4fa3b20a8a89db7438b"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_b19961f427a3d3ef5ee1b51bf6"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_b85f3c3b0bdfa58a2058a60e0f"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_308935e3c4a04f451e6cd983dd"
        `);
        await queryRunner.query(`
            DROP TABLE "calendar_events"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6cc21304067ec16cad21fa2ef0"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_5f09b772e670f8d8fa5e2dc2dd"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_48393bdc4e9900662593216378"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ffa48c8c78e4c4d0cb29bd6d12"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_0aa668a39ac30255298d7d6098"
        `);
        await queryRunner.query(`
            DROP TABLE "chat_participants"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."chat_participants_role_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_0acc1b62242760e51deb2810ae"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_4d458f108d348fe6e750d9da19"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_78f8838f3f2d499a055e530b72"
        `);
        await queryRunner.query(`
            DROP TABLE "chat_conversations"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."chat_conversations_conversationtype_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_687954466eb867e462f23a6448"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_dd16beafcefadc6ad2f2e9f89c"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_fc6b58e41e9a871dacbe9077de"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_45745953065384cc9c4264c2a3"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_0dc219ff9a27c1f67376c0f23e"
        `);
        await queryRunner.query(`
            DROP TABLE "chat_messages"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."chat_messages_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."chat_messages_messagetype_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ded0458bd7394c6d0b448dace9"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ca2c42e8bf28183e259346805d"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_455f2139a7e27a63a17064c577"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_adf41e293d6c583dc9d9dfa5d9"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_d0e79283a6a9abed2d90644d67"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_0492d0e26361713f7e5c7ad968"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_859ed168774e5d7d05c8652d05"
        `);
        await queryRunner.query(`
            DROP TABLE "clearances"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."clearances_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1cdf55cdeeaa762c549c850dbd"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_f01ff92293bb943440677f25ca"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_5f01814b049843d6c70fb6116e"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_85b8fd22be78b72eb535bd2700"
        `);
        await queryRunner.query(`
            DROP TABLE "company_documents"
        `);
        await queryRunner.query(`
            DROP TABLE "company_registrations"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."company_registrations_selectedbillingcycle_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."company_registrations_selectedplan_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."company_registrations_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_2d1fe8a6cbd22e96646ba9dd4d"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_85d561ddcbfba8138586475007"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_41ea8d0bfa5f6ee535e3347c3f"
        `);
        await queryRunner.query(`
            DROP TABLE "compensation_history"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."compensation_history_component_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."compensation_history_changetype_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_a5998f4c3a4cee02966e982ad2"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_078392a28c62ba1f631bcb9b78"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c4e4f6e50d75e888d48c3d0bc6"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_a2fd62c10350ccb6dc72fb09af"
        `);
        await queryRunner.query(`
            DROP TABLE "compensation_share_logs"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."compensation_share_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."compensation_share_channel_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "development_action_items"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."development_action_items_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_b57ed83b16f2bb8076e412fd3d"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1b8bca34d012a41a678b6a1896"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_48d38384a4e37b03b2c80d5d6d"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_d9ad8ab2c535ca55bf698fde56"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_de2b632d6f7263b140b570b92b"
        `);
        await queryRunner.query(`
            DROP TABLE "digital_library"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."digital_library_accesslevel_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."digital_library_resourcetype_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_be8469ba60aaf5400450012cea"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_fe2878916db7be7161d843151c"
        `);
        await queryRunner.query(`
            DROP TABLE "document_category"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_73dcb3db757f2fe04e13adff9f"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_d5ec9dc7b1da349289d6e0dc0d"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7ecc5c6737fbda57c2c8497173"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1e0b96137e88ec3ab8f14709f7"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_4d043d77efc32dcd104408f20c"
        `);
        await queryRunner.query(`
            DROP TABLE "employee_documents"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_5c0da9c94296994bc4abd38ef0"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8f9dcf86b9cd25153dffaef493"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_f7be9fa88c64b2477e495e3af8"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_697c5b6c6cdec3dc5a32866806"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1dbfb8ac17456e957d1c4f09b2"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6faa85a9c3f12bd8daf569987e"
        `);
        await queryRunner.query(`
            DROP TABLE "exit_interviews"
        `);
        await queryRunner.query(`
            DROP TABLE "feedback_360"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."feedback_360_relationship_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_85596421aba48d46d8a6818bb4"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ac672a41f1766d3f7308e924cb"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_5f169589b5cd39ded5b9198440"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6f22d9034b025d43f0f9994a58"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_eeb6672c177404cf08f7c5d75d"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_b95ca55c2cfca0b2f3dc83e076"
        `);
        await queryRunner.query(`
            DROP TABLE "final_settlements"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."final_settlements_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_9821a2d8d6098f5db9e086fa9a"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_42424dbc37952f79a10bd09532"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_bc529a72f31819f1ac1256f9d5"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_515d15e775c5c1ba81890c2ba5"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_4963e54b0260e377e61d566031"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6b2190c627ce3f9e7c2671dd66"
        `);
        await queryRunner.query(`
            DROP TABLE "exit_cases"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."exit_cases_resignationtype_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."exit_cases_currentstate_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_d1c5c76404522696616ab45b00"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_3f9d3f45c9d3898475b84f5d3b"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e6500185a691a9f4e6666a0071"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_b7735fa66cb984d7181bd212d8"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_3cdebc4fd8de37342333580d4d"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_661b796a01149b013dedfc6404"
        `);
        await queryRunner.query(`
            DROP TABLE "generated_documents"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."generated_documents_format_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."generated_documents_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."generated_documents_documenttype_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_eec498fb5d0ec4f620ccebc97d"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c5af0b3580fdff6d86b52ea0ef"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ed3b7442c29742a2cfb9352412"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6a3594520b9c7394ea61d08852"
        `);
        await queryRunner.query(`
            DROP TABLE "document_templates"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."document_templates_templatename_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_a5c185acee4ef8b91511be8712"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8daa4ab99fead523909a4a0791"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_0c181396908108dde7e9ff2c93"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1369f2ce844f6eb35714158c5e"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_4c80636983202afd2654025235"
        `);
        await queryRunner.query(`
            DROP TABLE "hr_connect_reactions"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."hr_connect_reactions_reactiontype_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_baf3191f3f662b0728697fd661"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_f9475e606b33b3365c9e8e12e0"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_512400c9d73cad7bc313a4f296"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_9099e0e4a3e731f0305301c468"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8292784dcc72410a2867c9c2f6"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1dc1c00f34334e30d02275474f"
        `);
        await queryRunner.query(`
            DROP TABLE "hr_connect_posts"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."hr_connect_posts_visibility_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."hr_connect_posts_posttype_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_f7b5e7c2ff29aa5b1044b3dde0"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1e1b5120d5a701fe434cea9e56"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_821df459615e1bf04b34d17f28"
        `);
        await queryRunner.query(`
            DROP TABLE "hr_connect_groups"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."hr_connect_groups_privacy_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."hr_connect_groups_grouptype_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_4586962d39682f4f91c570a8a4"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_bfcaa4375b318aa88f471a3d4c"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_910c950599231451951330d1f6"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_be70ce5167e89a2b28d796e65a"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_323e25c3d2a697439361a35058"
        `);
        await queryRunner.query(`
            DROP TABLE "hr_connect_group_members"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."hr_connect_group_members_role_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_cf0b408e933e294403ab2faabd"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6e131100c58fa1fe4320abbcc0"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c55732fc0288533c92a47307b4"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_dc382a274da295d4de29e11c26"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1c4a0020fef5a217d34979bf57"
        `);
        await queryRunner.query(`
            DROP TABLE "hr_connect_comments"
        `);
        await queryRunner.query(`
            DROP TABLE "kpis"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."kpis_status_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "goals"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."goals_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."goals_category_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_21fa461bf77cea4acc381c2ed9"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_4b454eb605d62e7213ddb1122d"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1e0df1791c9344d4bdde694be6"
        `);
        await queryRunner.query(`
            DROP TABLE "leave_balances"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."leave_balances_leavetype_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8a10335671f4018f4bd288610b"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_d2234f83aa1c148396f6147152"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_091ffcec318214206f60315f30"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_4eda1468756ca831495e308e40"
        `);
        await queryRunner.query(`
            DROP TABLE "leave_requests"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."leave_requests_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."leave_requests_leavetype_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_55b5b6b48ccf45074a994a2c22"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_9d5cad0c84d2832e48329a910f"
        `);
        await queryRunner.query(`
            DROP TABLE "leave_policies"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."leave_policies_leavetype_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_086c061c8bd512a43eece92cf0"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e784680d227197602ff34a62c5"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7ba8ce0d8f906079f82ab0741b"
        `);
        await queryRunner.query(`
            DROP TABLE "manual_employment_history"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."manual_employment_history_eventtype_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_126be15a96309fba7823e75f57"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6d88608417d54f7bee8802364d"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_97a4b8699af03b7372a511ce3d"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8ba28344602d583583b9ea1a50"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_db873ba9a123711a4bff527ccd"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_d5b86bc522af7cc9e3e13960ff"
        `);
        await queryRunner.query(`
            DROP TABLE "notifications"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."notifications_priority_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."notifications_notificationtype_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_5b5a523a5e3455a5c93eeed8b0"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_569015517d2aacad0f06cbc28b"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_84ee165de912aec5f411319006"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_69f78fb520627dc9f90298a255"
        `);
        await queryRunner.query(`
            DROP TABLE "onboarding_cases"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."onboarding_cases_bgvstatus_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."onboarding_cases_currentstate_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_79b078ea08cb87502ca7b82b22"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_5c22c6b386e0550249b5437572"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_aedb6ab5590666323ffe7f01b4"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1278e85ce4237fba1ae6997398"
        `);
        await queryRunner.query(`
            DROP TABLE "onboarding_documents"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."onboarding_documents_verificationstatus_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."onboarding_documents_category_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."onboarding_documents_documenttype_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "onboarding_progress"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7be27cb4883c254144c290f362"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_184ac5d3b4f08209c0efc96d55"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_9960e688e91efd1fd037cd5388"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_67c05a05b8de3e1acf44fd05d9"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ed7f7e55743c362da2b3f53a26"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_3100c7b95a6be350c5d6a8466e"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8a502da069442ef5a3e36c0296"
        `);
        await queryRunner.query(`
            DROP TABLE "onboarding_tasks"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."onboarding_tasks_priority_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."onboarding_tasks_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."onboarding_tasks_category_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "organization_settings"
        `);
        await queryRunner.query(`
            DROP TABLE "payment_history"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."payment_history_paymentmethod_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."payment_history_status_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "payment_methods"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."payment_methods_cardbrand_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."payment_methods_type_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c694bd1046f06b33302a7702e6"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_cce7217c7c636c16af134419a6"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_d40f5902aa08aa04769fb7850e"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_adb246f4184956a1d4f2c80c6b"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_82fcc8f8eef87703b89ce782af"
        `);
        await queryRunner.query(`
            DROP TABLE "payroll_setups"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_43f909d822f2293869402bc3f6"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_a9576ff85423ed0ab844e3a4e9"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7d5eda1e644a19343e97dac9f3"
        `);
        await queryRunner.query(`
            DROP TABLE "payslip_components"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."payslip_component_type_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_54d5f53a11ad2c1e1fde952188"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_32aa464e93c033f9cbacf0320b"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_3fa0aa64d0a6d751ea49e6cd80"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_d40bea8734d147ea3354569d88"
        `);
        await queryRunner.query(`
            DROP TABLE "payslips"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."payslip_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_d5251d2b345e1b5c5734627713"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_84eac2e90e90d4d87130f067e4"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_b6314322148eb15492ba838da9"
        `);
        await queryRunner.query(`
            DROP TABLE "payslip_attachments"
        `);
        await queryRunner.query(`
            DROP TABLE "performance_reviews"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."performance_reviews_currentstate_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_31c5f2cb340c114406f9bc1edd"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_5a0c9786efe4e9922ee4bd4726"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_4cd6a9c0b0ce1e90cb4eafee71"
        `);
        await queryRunner.query(`
            DROP TABLE "position_history"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."position_history_changetype_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e9437996566e9f4919e3f891d9"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_fe486a3a67e35552c2fde7ed2b"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_bd232c5d45bfbd34c066f2737d"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_42ad189ecbed2f605d0aa65537"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_5df12789fc9319d8a34b6f5975"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1cfc8e4d2e643bc7effab7b88c"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_494da37bddb408fa003344f0e9"
        `);
        await queryRunner.query(`
            DROP TABLE "probation_reviews"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."probation_reviews_recommendation_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."probation_reviews_monitoringstatus_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."probation_reviews_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."probation_reviews_reviewtype_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_100921b228de87df8ec7836744"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_79a944a5a2183edd85d22327d6"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_50a64fdc346d0f8eee67ffd71d"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_29064a020710f0049b4a15048e"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_99c0a23a056400dc054da78f97"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_241dd5e4a6e3b640816605e4d3"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_b74cc8da96a81ebcd864892e8a"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_11256e3cb27bc9cc591c3e67f0"
        `);
        await queryRunner.query(`
            DROP TABLE "probation_tasks"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."probation_tasks_priority_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."probation_tasks_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."probation_tasks_category_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_12446f8a7d4d426469556a1cb5"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_edfe879e36b11706bcec0845a8"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_bd5bd5048842b219561650da41"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_5acde6b8feaea73c3139e2165b"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7be265b27ef3a40ee7ab504ac0"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_3c238aa17e4392614929ecfff1"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_712d110f5ffb226a11734194d0"
        `);
        await queryRunner.query(`
            DROP TABLE "probation_cases"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."probation_cases_currentstate_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_91c6a9823a9560cf91a3edde93"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1fd6fa93a7c4edd6759046c8f5"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e5ad710da2194f981364e75e0f"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_bdf23dd39f3a096723d42824c4"
        `);
        await queryRunner.query(`
            DROP TABLE "salary_structures"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."salary_approval_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."salary_structure_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c89c50be8ceb0cf9f4544d4c7e"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8c432f5b73f22738e44f96057c"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_9388ae90ef64f046042a665e86"
        `);
        await queryRunner.query(`
            DROP TABLE "salary_components"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."salary_component_type_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_d7b348ebc736b68119bf93db9c"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6dae104daa2f22af8b79db6737"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_aeee0af6368802980a54fc4ab9"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_3b62a07d9c699845bb874440d2"
        `);
        await queryRunner.query(`
            DROP TABLE "saved_reports"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."saved_reports_outputformat_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."saved_reports_reporttype_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."saved_reports_category_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_d4a3be05ff24e1ce108b4f7b05"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_119ec5abfc51f0c60363106579"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_08ef87528353c263a9a75ad994"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_da842c6cbd1c8640b6efd576d1"
        `);
        await queryRunner.query(`
            DROP TABLE "status_transitions"
        `);
        await queryRunner.query(`
            DROP TABLE "subscriptions"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."subscriptions_billingcycle_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."subscriptions_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."subscriptions_plan_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_a3972e61258bd508990d6545ae"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_87dd7a8abaafb3a8bddb259aea"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8576319b025393d5bb9f8da4c3"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c15d6bbefa030f65c96efa844e"
        `);
        await queryRunner.query(`
            DROP TABLE "time_entry_edits"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."time_entry_edits_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_9bc37e611804f2566dbb4c85d2"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_3916813c1eb0e44c0cff3f43e6"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_180d196307c19bf2f3adcf04dc"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_07731c02b0333dc9b2678f9821"
        `);
        await queryRunner.query(`
            DROP TABLE "attendance"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."attendance_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_a2a0460b4692dd714f7ce24992"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_d48b4c2fe6c931dba15bd01e2c"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_cb7ac60c24fe6cfa44b14001e4"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_28b721d715e7f45ead5b29f362"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6109771f8f3fb7e3194564185e"
        `);
        await queryRunner.query(`
            DROP TABLE "training_records"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_95715790f97a7c144db5dbdc18"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_448a04b62704ca3549607375e0"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_9358f2da5870260a24e5431c5a"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_74ec758b7c9c0422b2dc4f708a"
        `);
        await queryRunner.query(`
            DROP TABLE "candidates"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."candidates_currentstate_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "user_invitations"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."user_invitations_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."user_invitations_role_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "tenants"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7346b08032078107fce81e014f"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c58f7e88c286e5e3478960a998"
        `);
        await queryRunner.query(`
            DROP TABLE "users"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c7920fb29b588a51fdde280908"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_5a00024776c7192f02e0ff6e8f"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_faa35befc241081a6b05010396"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ea6a339e5a0792172d53d405b0"
        `);
        await queryRunner.query(`
            DROP TABLE "employees"
        `);
        await queryRunner.query(`
            DROP TABLE "roles"
        `);
        await queryRunner.query(`
            DROP TABLE "permissions"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."permissions_action_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."permissions_module_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_287bb78431339c80b125ee6563"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_13b9ac48f0fa4a277c821cdcc4"
        `);
        await queryRunner.query(`
            DROP TABLE "designations"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_119d3439d334ce530468cfaf1b"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_617394da01e48b2fea5dc80fe2"
        `);
        await queryRunner.query(`
            DROP TABLE "departments"
        `);
    }

}
