const testDatabaseName =
  process.env.TEST_DB_NAME || process.env.DB_NAME || 'hrms_saas_test';

process.env.NODE_ENV = 'test';
process.env.DB_NAME = testDatabaseName;
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'aurorahr-qa-foundation-test-secret';
process.env.JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';
process.env.JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '2h';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';
process.env.ENABLE_SWAGGER = 'false';
process.env.RATE_LIMIT_MAX_REQUESTS =
  process.env.RATE_LIMIT_MAX_REQUESTS || '10000';
