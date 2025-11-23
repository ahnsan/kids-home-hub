import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Kids Home Hub PWA
 *
 * Tests the PWA at http://localhost:3000 (dev) or configured TEST_URL
 * Supports multiple browsers and mobile devices
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Test timeout: 30 seconds per test
  timeout: 30000,

  // Expect timeout: 5 seconds for assertions
  expect: {
    timeout: 5000,
  },

  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/e2e/results.json' }],
    ['junit', { outputFile: 'test-results/e2e/results.xml' }],
    ['list'], // Console output
  ],

  use: {
    // Base URL for the PWA (dev server)
    baseURL: process.env.TEST_URL || 'http://localhost:3000',

    // Collect trace on first retry for debugging
    trace: 'on-first-retry',

    // Screenshots and videos for debugging failures
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Action timeout: 10 seconds
    actionTimeout: 10000,

    // Navigation timeout: 15 seconds
    navigationTimeout: 15000,
  },

  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },

    // Mobile browsers (PWA targets)
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        // Test in both portrait and landscape
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'iPad',
      use: {
        ...devices['iPad Pro'],
        isMobile: true,
        hasTouch: true,
      },
    },
  ],

  // Start dev server before tests (if not already running)
  webServer: process.env.CI ? undefined : {
    command: 'pnpm --filter @kids-hub/pwa dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
