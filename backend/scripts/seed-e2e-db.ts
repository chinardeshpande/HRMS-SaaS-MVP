/**
 * Standalone E2E database seed script.
 *
 * Seeds the test database with synthetic QA data for Playwright E2E tests.
 * Reuses the same seed logic as the Jest globalSetup but can run independently.
 *
 * Usage:
 *   cd backend
 *   DB_NAME=hrms_saas_test npx ts-node scripts/seed-e2e-db.ts
 *
 * Or via npm script:
 *   DB_NAME=hrms_saas_test npm run seed:e2e
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

// Force test environment
process.env.NODE_ENV = 'test';
if (!process.env.DB_NAME || !process.env.DB_NAME.toLowerCase().includes('test')) {
  process.env.DB_NAME = process.env.TEST_DB_NAME || 'hrms_saas_test';
}

import { AppDataSource } from '../src/config/database';
import { seedQaFoundationData } from '../tests/setup/seedTestData';

async function main() {
  const dbName = process.env.DB_NAME;
  console.log(`[seed-e2e-db] Seeding database: ${dbName}`);

  if (!dbName?.toLowerCase().includes('test')) {
    console.error(`FATAL: Refusing to seed non-test database "${dbName}"`);
    process.exit(1);
  }

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('[seed-e2e-db] Dropping and recreating schema...');
    await AppDataSource.synchronize(true);

    console.log('[seed-e2e-db] Inserting seed data...');
    await seedQaFoundationData();

    console.log('[seed-e2e-db] Seed complete. Database is ready for E2E tests.');
  } catch (error: any) {
    console.error('[seed-e2e-db] FATAL:', error.message);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

main();
