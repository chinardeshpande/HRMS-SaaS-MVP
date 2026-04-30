import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillTenantSettings1745749500000 implements MigrationInterface {
  name = 'BackfillTenantSettings1745749500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "subscriptions" (
        "tenantId",
        "plan",
        "status",
        "billingCycle",
        "price",
        "maxUsers",
        "currentUsers",
        "maxStorageGB",
        "currentStorageGB",
        "startDate",
        "trialEndDate",
        "nextBillingDate",
        "autoRenew",
        "features",
        "notes",
        "createdAt",
        "updatedAt"
      )
      SELECT
        t."tenantId",
        CASE
          WHEN lower(t."planType") IN ('starter', 'professional', 'enterprise') THEN lower(t."planType")
          ELSE 'free'
        END,
        CASE
          WHEN t."status" = 'active' AND COALESCE(t."isTrialActive", true) THEN 'trial'
          WHEN t."status" = 'active' THEN 'active'
          ELSE 'suspended'
        END,
        'monthly',
        CASE
          WHEN lower(t."planType") = 'starter' THEN 29
          WHEN lower(t."planType") = 'professional' THEN 79
          WHEN lower(t."planType") = 'enterprise' THEN 0
          ELSE 0
        END,
        CASE
          WHEN lower(t."planType") = 'starter' THEN 50
          WHEN lower(t."planType") = 'professional' THEN 200
          WHEN lower(t."planType") = 'enterprise' THEN 999999
          ELSE 10
        END,
        (
          SELECT COUNT(*)::integer
          FROM "users" u
          WHERE u."tenantId" = t."tenantId" AND u."isActive" = true
        ),
        CASE
          WHEN lower(t."planType") = 'starter' THEN 50
          WHEN lower(t."planType") = 'professional' THEN 200
          WHEN lower(t."planType") = 'enterprise' THEN 1000
          ELSE 5
        END,
        0,
        CURRENT_DATE,
        COALESCE(t."trialEndDate"::date, CURRENT_DATE + 14),
        COALESCE(t."trialEndDate"::date, CURRENT_DATE + 14),
        true,
        CASE
          WHEN lower(t."planType") = 'enterprise' THEN
            '{"advancedReporting":true,"apiAccess":true,"customBranding":true,"ssoIntegration":true,"prioritySupport":true,"customWorkflows":true,"aiInsights":true,"multiCurrency":true}'::jsonb
          WHEN lower(t."planType") = 'professional' THEN
            '{"advancedReporting":true,"apiAccess":true,"customBranding":true,"ssoIntegration":false,"prioritySupport":true,"customWorkflows":true,"aiInsights":true,"multiCurrency":true}'::jsonb
          WHEN lower(t."planType") = 'starter' THEN
            '{"advancedReporting":true,"apiAccess":false,"customBranding":false,"ssoIntegration":false,"prioritySupport":false,"customWorkflows":false,"aiInsights":false,"multiCurrency":false}'::jsonb
          ELSE
            '{"advancedReporting":false,"apiAccess":false,"customBranding":false,"ssoIntegration":false,"prioritySupport":false,"customWorkflows":false,"aiInsights":false,"multiCurrency":false}'::jsonb
        END,
        'Backfilled by production settings baseline migration',
        now(),
        now()
      FROM "tenants" t
      WHERE NOT EXISTS (
        SELECT 1
        FROM "subscriptions" s
        WHERE s."tenantId" = t."tenantId"
      )
    `);

    await queryRunner.query(`
      INSERT INTO "organization_settings" (
        "tenantId",
        "companyName",
        "timezone",
        "defaultLanguage",
        "currency",
        "dateFormat",
        "timeFormat",
        "fiscalYearStartMonth",
        "weekStartDay",
        "workingHours",
        "notificationSettings",
        "smtpConfig",
        "twoFactorAuthRequired",
        "passwordExpiryDays",
        "maxLoginAttempts",
        "sessionTimeoutMinutes",
        "ipWhitelistEnabled",
        "branding",
        "customFields",
        "createdAt",
        "updatedAt"
      )
      SELECT
        t."tenantId",
        t."companyName",
        'Asia/Kolkata',
        'en',
        'INR',
        'DD/MM/YYYY',
        '24h',
        4,
        1,
        '{
          "monday":{"enabled":true,"start":"09:00","end":"18:00"},
          "tuesday":{"enabled":true,"start":"09:00","end":"18:00"},
          "wednesday":{"enabled":true,"start":"09:00","end":"18:00"},
          "thursday":{"enabled":true,"start":"09:00","end":"18:00"},
          "friday":{"enabled":true,"start":"09:00","end":"18:00"},
          "saturday":{"enabled":false,"start":"09:00","end":"18:00"},
          "sunday":{"enabled":false,"start":"09:00","end":"18:00"}
        }'::jsonb,
        '{"emailNotifications":true,"smsNotifications":false,"pushNotifications":true,"slackIntegration":false,"teamsIntegration":false}'::jsonb,
        '{"enabled":false,"host":"","port":587,"secure":false,"username":"","password":"","fromEmail":"","fromName":""}'::jsonb,
        false,
        90,
        5,
        60,
        false,
        jsonb_build_object(
          'primaryColor', COALESCE(t."primaryColor", '#2563eb'),
          'secondaryColor', '#64748b',
          'accentColor', '#10b981',
          'logoUrl', COALESCE(t."logoUrl", ''),
          'faviconUrl', ''
        ),
        '{}'::jsonb,
        now(),
        now()
      FROM "tenants" t
      WHERE NOT EXISTS (
        SELECT 1
        FROM "organization_settings" os
        WHERE os."tenantId" = t."tenantId"
      )
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Data backfills are intentionally not reversed to avoid deleting live tenant settings.
  }
}
