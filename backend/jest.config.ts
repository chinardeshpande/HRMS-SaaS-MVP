import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  setupFiles: ['<rootDir>/tests/setup/testEnv.ts'],
  globalSetup: '<rootDir>/tests/setup/globalSetup.ts',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jestSetup.ts'],
  testTimeout: 30000,
  maxWorkers: 1,
  verbose: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/scripts/**',
    '!src/jobs/**',
    '!src/migrations/**',
  ],
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
  },
};

export default config;
