import './testEnv';
import { AppDataSource } from '../../src/config/database';
import { config } from '../../src/config/config';
import { seedQaFoundationData } from './seedTestData';

const assertSafeTestDatabase = () => {
  if (config.nodeEnv !== 'test') {
    throw new Error(`Refusing to reset database outside NODE_ENV=test. Current NODE_ENV=${config.nodeEnv}`);
  }

  if (!config.database.name.toLowerCase().includes('test') && process.env.ALLOW_NON_TEST_DB_FOR_TESTS !== 'true') {
    throw new Error(
      `Refusing to reset database "${config.database.name}". ` +
        'Use a DB_NAME/TEST_DB_NAME containing "test", or set ALLOW_NON_TEST_DB_FOR_TESTS=true only in disposable CI.'
    );
  }
};

export default async function globalSetup() {
  assertSafeTestDatabase();

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  await AppDataSource.synchronize(true);
  await seedQaFoundationData();
  await AppDataSource.destroy();
}
