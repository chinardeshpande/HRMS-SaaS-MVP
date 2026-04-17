import { AppDataSource } from '../config/database';
import logger from '../utils/logger';

async function runReportingMigration() {
  try {
    // Initialize connection
    await AppDataSource.initialize();
    logger.info('Database connection initialized');

    // Run the AddReportingAndAnalyticsTables migration
    logger.info('Running reporting platform migration...');

    // Import and run migration
    const { AddReportingAndAnalyticsTables1743998400000 } = await import(
      '../migrations/AddReportingAndAnalyticsTables'
    );

    const migration = new AddReportingAndAnalyticsTables1743998400000();

    await migration.up(AppDataSource.createQueryRunner());

    logger.info('✅ Reporting platform migration completed successfully!');
    logger.info('Created tables: saved_reports, generated_documents, analytics_metrics');
    logger.info('Created materialized views: 5 performance-optimized views');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error: any) {
    logger.error('Migration failed:', error);

    if (error.message && error.message.includes('already exists')) {
      logger.info('Tables already exist - skipping migration');
      await AppDataSource.destroy();
      process.exit(0);
    }

    await AppDataSource.destroy();
    process.exit(1);
  }
}

runReportingMigration();
