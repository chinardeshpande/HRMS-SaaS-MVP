import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

/**
 * AuroraHR E2E Test Configuration
 *
 * Local:
 *   cd e2e && npm install && npx playwright install chromium
 *   # Start backend + frontend in separate terminals, then:
 *   npx playwright test
 *
 * CI:
 *   The GitHub Actions workflow starts backend + frontend before running tests.
 *   webServer config below handles startup when PLAYWRIGHT_START_SERVERS=1.
 */
export default defineConfig({
  testDir: './specs',
  timeout: isCI ? 60_000 : 30_000,
  expect: { timeout: isCI ? 10_000 : 5_000 },
  fullyParallel: false,
  retries: isCI ? 2 : 1,
  workers: 1,
  reporter: isCI
    ? [['list'], ['json', { outputFile: 'test-results/results.json' }]]
    : [
        ['html', { open: 'never', outputFolder: '../docs/qa/playwright-e2e-foundation/html-report' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['list'],
      ],
  use: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:5173',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: isCI ? 'on-first-retry' : 'off',
    actionTimeout: isCI ? 15_000 : 10_000,
    navigationTimeout: isCI ? 30_000 : 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: 'test-results',
});
