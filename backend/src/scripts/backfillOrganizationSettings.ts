import { AppDataSource } from '../config/database';
import { Tenant } from '../models/Tenant';
import { OrganizationSettings } from '../models/OrganizationSettings';
import { OnboardingProgress } from '../models/OnboardingProgress';

/**
 * Backfill OrganizationSettings for existing tenants
 * This script creates OrganizationSettings records for tenants that completed onboarding
 * before the fix was implemented
 */
async function backfillOrganizationSettings() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const orgSettingsRepo = AppDataSource.getRepository(OrganizationSettings);
    const onboardingRepo = AppDataSource.getRepository(OnboardingProgress);

    // Get all tenants that completed onboarding
    const tenants = await tenantRepo.find({
      where: { onboardingCompleted: true },
    });

    console.log(`\n📊 Found ${tenants.length} tenant(s) that completed onboarding`);

    for (const tenant of tenants) {
      console.log(`\n🔍 Processing tenant: ${tenant.companyName} (${tenant.tenantId})`);

      // Check if OrganizationSettings already exists
      const existing = await orgSettingsRepo.findOne({
        where: { tenantId: tenant.tenantId },
      });

      if (existing) {
        console.log('  ⏭️  OrganizationSettings already exists - skipping');
        continue;
      }

      // Get onboarding progress to retrieve wizard data
      const onboardingProgress = await onboardingRepo.findOne({
        where: { tenantId: tenant.tenantId },
      });

      const companyDetails = onboardingProgress?.stepData?.companyDetails;

      // Create OrganizationSettings record
      const orgSettingsData: any = {
        tenantId: tenant.tenantId,
        companyName: tenant.companyName,
        timezone: companyDetails?.timeZone || 'UTC',
        defaultLanguage: 'en',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        fiscalYearStartMonth: 1,
        weekStartDay: 1,
        twoFactorAuthRequired: false,
        passwordExpiryDays: 90,
        maxLoginAttempts: 5,
        sessionTimeoutMinutes: 30,
        ipWhitelistEnabled: false,
      };

      // Add optional fields if provided
      if (companyDetails?.address) {
        orgSettingsData.address = companyDetails.address;
      }

      if (tenant.logoUrl || tenant.primaryColor) {
        orgSettingsData.branding = {
          primaryColor: tenant.primaryColor || '#3B82F6',
          secondaryColor: '#1E40AF',
          accentColor: '#10B981',
          logoUrl: tenant.logoUrl || '',
          faviconUrl: '',
        };
      }

      const orgSettings = orgSettingsRepo.create(orgSettingsData);
      await orgSettingsRepo.save(orgSettings);

      console.log('  ✅ Created OrganizationSettings successfully');
      console.log(`     - Company Name: ${orgSettingsData.companyName}`);
      console.log(`     - Timezone: ${orgSettingsData.timezone}`);
      console.log(`     - Address: ${orgSettingsData.address || 'Not set'}`);
      console.log(`     - Branding: ${orgSettingsData.branding ? 'Yes' : 'No'}`);
    }

    console.log('\n✅ Backfill completed successfully');
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during backfill:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

backfillOrganizationSettings();
