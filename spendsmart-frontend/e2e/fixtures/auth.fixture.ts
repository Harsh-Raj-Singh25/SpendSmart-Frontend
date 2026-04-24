/**
 * ============================================================
 *  AUTH FIXTURE — Pre-Authenticated Test Context
 * ============================================================
 *
 * WHAT IS A FIXTURE?
 * A fixture is a piece of reusable setup logic that Playwright
 * injects into your tests. Think of it as a "helper" that
 * prepares a specific state before each test runs.
 *
 * WHY DO WE NEED THIS?
 * Many pages (dashboard, premium, recurring, etc.) require the
 * user to be logged in. Without this fixture, every single test
 * would need to:
 *   1. Go to the login page
 *   2. Fill in credentials
 *   3. Submit the form
 *   4. Wait for redirect
 *
 * That's repetitive, slow, and fragile. Instead, this fixture
 * directly injects auth data into localStorage BEFORE the page
 * loads, so the Angular app thinks the user is already logged in.
 *
 * HOW FIXTURES WORK:
 *   1. We call test.extend<T>() to create a custom version of `test`
 *   2. We define named fixtures (like 'authenticatedPage')
 *   3. Tests that need auth import this custom `test` and use
 *      the fixture by name in their function parameters
 *
 * USAGE:
 *   import { test, expect } from '../fixtures/auth.fixture';
 *   test('should show dashboard', async ({ authenticatedPage }) => {
 *     await authenticatedPage.goto('/dashboard');
 *     // ... the user is already "logged in"
 *   });
 * ============================================================
 */

import { test as base, expect, Page } from '@playwright/test';
import { MOCK_DATA, mockAllApiRoutes } from '../mocks/api-mocks';

/**
 * Define the shape of our custom fixtures.
 * TypeScript uses this interface to provide autocomplete
 * and type checking in test files.
 */
interface AuthFixtures {
  /** A Page with auth state pre-loaded in localStorage */
  authenticatedPage: Page;
}

/**
 * Extend Playwright's base `test` object with our custom fixture.
 *
 * base.extend<AuthFixtures>({...}) creates a new version of `test`
 * that has all the standard fixtures (page, context, browser, etc.)
 * PLUS our custom `authenticatedPage` fixture.
 */
export const test = base.extend<AuthFixtures>({

  /**
   * The `authenticatedPage` fixture.
   *
   * Parameters:
   *   - { page }:  The standard Playwright page fixture (a blank browser tab)
   *   - use:       A function we call to "provide" the fixture value to the test.
   *                Everything before `use()` is SETUP.
   *                Everything after `use()` is TEARDOWN.
   *
   * Flow:
   *   1. Navigate to the app (this loads Angular and creates localStorage)
   *   2. Inject auth data into localStorage
   *   3. Mock all API routes to avoid real backend calls
   *   4. Call use(page) to hand the prepared page to the test
   *   5. After the test finishes, we could do cleanup here (but don't need to
   *      because each test gets a fresh browser context anyway)
   */
  authenticatedPage: async ({ page }, use) => {

    // Step 1: Set up API mocks FIRST (before any navigation).
    // This ensures that even the initial page load won't make real API calls.
    await mockAllApiRoutes(page);

    // Step 2: Navigate to the app's root URL.
    // We go to '/' first to let Angular initialize and create localStorage.
    // Angular's router will redirect to /login since there's no token yet.
    await page.goto('/');

    // Step 3: Inject auth state into localStorage.
    //
    // page.evaluate() runs JavaScript IN THE BROWSER (not in Node.js).
    // Whatever function you pass gets executed inside the browser's JS engine.
    //
    // We set two keys, matching what AuthService.setAuthState() does:
    //   - 'token': The JWT token string (used by AuthGuard.isLoggedIn())
    //   - 'auth':  The full user object as JSON (used by restoreAuthState())
    //
    // The second argument ({ token, user }) is passed FROM Node.js TO the browser.
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('auth', JSON.stringify(user));
    }, {
      token: MOCK_DATA.user.token,
      user: MOCK_DATA.user,
    });

    // Step 4: Reload the page so Angular picks up the new localStorage state.
    // On reload, AuthService.restoreAuthState() reads from localStorage
    // and sets isAuthenticated to true.
    await page.reload();

    // Step 5: Wait for Angular to finish rendering.
    // waitForLoadState('networkidle') waits until there are no more
    // than 0 or 1 network connections for at least 500ms.
    await page.waitForLoadState('networkidle');

    // Step 6: Hand the prepared page to the test function.
    // The test can now use this page as if the user is logged in.
    await use(page);
  },
});

// Re-export expect so test files only need one import
export { expect };
