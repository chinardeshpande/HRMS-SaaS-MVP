import { AppDataSource } from '../config/database';
import { Designation } from '../models/Designation';
import { Tenant } from '../models/Tenant';
import logger from '../utils/logger';

/**
 * Add designations to Campuslife tenant
 */
async function addDesignations() {
  try {
    logger.info('🚀 Starting designation import...');

    await AppDataSource.initialize();
    logger.info('✅ Database connection established');

    // Find Campuslife tenant
    const tenantRepo = AppDataSource.getRepository(Tenant);
    const campuslifeTenant = await tenantRepo.findOne({
      where: { companyName: 'Campuslife' }
    });

    if (!campuslifeTenant) {
      logger.error('❌ Campuslife tenant not found');
      process.exit(1);
    }

    logger.info(`Found tenant: ${campuslifeTenant.companyName} (ID: ${campuslifeTenant.tenantId})`);

    // List of designations from CSV
    const designationNames = [
      'Senior Frontend Engineer',
      'Software Engineer',
      'Frontend Engineer',
      'Engineering Lead',
      'Frontend Developer',
      'Sage X3 Consultant',
      'Software Engineer (Mobile)',
      'Sage X3 Developer',
      'Platform Engineer',
      'Senior Machine Learning Engineer',
      'Machine Learning Engineer II',
      'Machine Learning Engineer I',
      'Digital Analyst',
      'Network Engineer',
      'Talent Partner',
      'Full Stack Engineer',
      'UX Designer',
      'Data Engineer II',
      'Senior ML Ops Engineer',
      'Senior Vulnerability Analyst',
      'Staff Technology Engineer',
      'Lead Talent Partner',
      'Software Engineer (Backend)',
      'Principal Security Engineer',
      'Head Of Delivery',
      'Web Analyst',
      'Senior Platform Engineer',
    ];

    const designationRepo = AppDataSource.getRepository(Designation);

    // Check existing designations
    const existing = await designationRepo.find({
      where: { tenantId: campuslifeTenant.tenantId }
    });
    logger.info(`Found ${existing.length} existing designations`);

    let addedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < designationNames.length; i++) {
      const name = designationNames[i];

      // Check if already exists
      const exists = existing.find(d => d.name === name);
      if (exists) {
        logger.info(`⏭️  Skipping "${name}" - already exists`);
        skippedCount++;
        continue;
      }

      // Create new designation
      const designation = designationRepo.create({
        tenantId: campuslifeTenant.tenantId,
        name,
        level: i + 1, // Sequential level
      });

      await designationRepo.save(designation);
      logger.info(`✅ Added: ${name} (Level: ${i + 1})`);
      addedCount++;
    }

    logger.info('');
    logger.info('✅ Designation import completed!');
    logger.info(`📊 Summary:`);
    logger.info(`   - Added: ${addedCount}`);
    logger.info(`   - Skipped: ${skippedCount}`);
    logger.info(`   - Total: ${addedCount + skippedCount}`);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Error adding designations:', error);
    process.exit(1);
  }
}

addDesignations();
