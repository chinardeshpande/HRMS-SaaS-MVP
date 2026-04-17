import { AppDataSource } from '../config/database';
import { Tenant } from '../models/Tenant';
import tenantInitializationService from '../services/tenantInitializationService';
import logger from '../utils/logger';

/**
 * One-time script to initialize the Campuslife tenant with default data
 */
async function initializeCampuslifeTenant() {
  try {
    logger.info('🚀 Starting Campuslife tenant initialization...');

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

    // Initialize tenant with default data
    await tenantInitializationService.initializeTenant(campuslifeTenant.tenantId);

    logger.info('✅ Campuslife tenant initialized successfully!');
    logger.info('The tenant now has:');
    logger.info('  - 8 document templates');
    logger.info('  - 5 leave policies');
    logger.info('  - 1 attendance policy');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Error initializing Campuslife tenant:', error);
    process.exit(1);
  }
}

initializeCampuslifeTenant();
