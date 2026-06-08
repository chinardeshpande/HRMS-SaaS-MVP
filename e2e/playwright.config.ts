import { defineConfig, devices } from '@playwright/test';

/**
 * AuroraHR E2E Test Configuration
 *
 * Prerequisites:
 *   1. npm install -D @playwright/test
 *   2. npx playwright install chromium
 *   3. Backend running: cd backend && npm run dev
 *   4. Frontend running: cd frontend-web && npm run dev
 *   5. Test DB seeded: cd backend && npm run test:qa (runs globalSetup seed)
 *
 * Run:
 *   npx playwright test                    # headless
 *   npx playwright test --headed           # visible browser
 *   npx playwright test --ui               # interactive UI mode
 *   npx playwright test specs/auth.spec.ts # single file
 */
export default defineConfig({
  testDir: './specs',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [
    ['html', { open: 'never', outputFolder: '../docs/qa/playwright-e2e-foundation/html-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'off',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: 'test-results',
});
