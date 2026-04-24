/**
 * ============================================================
 *  PLAYWRIGHT CONFIGURATION FILE
 * ============================================================
 *
 * This file tells Playwright HOW to run your tests:
 *   - Which browsers to use
 *   - Where to find test files
 *   - Timeouts, retries, screenshots, etc.
 *   - Whether to start a dev server automatically
 *
 * Docs: https://playwright.dev/docs/test-configuration
 * ============================================================
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({

  // ── Where are the test files? ──────────────────────────────
  // Playwright will look for files matching *.spec.ts inside this folder.
  testDir: './e2e/tests',

  // ── Parallel Execution ─────────────────────────────────────
  // "fullyParallel: true" means every individual test can run at the
  // same time as other tests (in separate browser contexts).
  // This speeds up the test suite significantly.
  fullyParallel: true,

  // ── Forbid test.only() in CI ───────────────────────────────
  // If you accidentally leave a `test.only(...)` in your code and
  // push to CI, this flag will make the CI build FAIL instead of
  // silently skipping all other tests.
  forbidOnly: !!process.env['CI'],

  // ── Retries ────────────────────────────────────────────────
  // How many times to retry a failing test before marking it as failed.
  // 0 locally (fail fast), 2 in CI (handle flakiness).
  retries: process.env['CI'] ? 2 : 0,

  // ── Number of Parallel Workers ─────────────────────────────
  // In CI we use 1 worker to avoid resource contention.
  // Locally, Playwright picks a sensible default based on CPU cores.
  workers: process.env['CI'] ? 1 : undefined,

  // ── Reporter ───────────────────────────────────────────────
  // 'html' generates a beautiful interactive HTML report.
  // After running tests, open it with: npx playwright show-report
  reporter: 'html',

  // ── Shared Settings for ALL Projects ───────────────────────
  // These settings apply to every test unless overridden per-project.
  use: {
    // Base URL for all page.goto() calls.
    // Instead of writing: await page.goto('http://localhost:4200/login')
    // You can write:      await page.goto('/login')
    baseURL: 'http://localhost:4200',

    // Capture a screenshot ONLY when a test fails.
    // Helps with debugging without slowing down passing tests.
    screenshot: 'only-on-failure',

    // Collect a trace on the FIRST retry of a failed test.
    // Traces include screenshots, DOM snapshots, network logs and more.
    // View with: npx playwright show-trace trace.zip
    trace: 'on-first-retry',
  },

  // ── Browser Projects ───────────────────────────────────────
  // Each "project" is a browser configuration. Playwright will run
  // ALL your tests once for each project listed here.
  projects: [
    {
      name: 'chromium',
      use: {
        // devices['Desktop Chrome'] provides realistic viewport size,
        // user-agent string, and other Chrome-specific settings.
        ...devices['Desktop Chrome'],
      },
    },

    // Uncomment below to also test in Firefox and Safari:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // ── Web Server ─────────────────────────────────────────────
  // Playwright can automatically start your Angular dev server before
  // running tests and shut it down after.
  //
  // "command"     → the shell command to start the server
  // "url"         → Playwright waits until this URL responds before tests run
  // "reuseExistingServer" → if the server is already running (e.g., you ran
  //                          `ng serve` manually), Playwright will reuse it
  //                          instead of starting a new one. Useful during dev.
  webServer: {
    command: 'npx ng serve',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    // Give the server up to 2 minutes to compile and start.
    timeout: 120000,
  },
});
