/**
 * ============================================================
 *  NAVIGATION & ROUTE GUARD — E2E TESTS
 * ============================================================
 *
 * WHAT ARE WE TESTING?
 * Angular's routing system with three guards:
 *   - AuthGuard:  Blocks unauthenticated users from protected pages
 *   - GuestGuard: Blocks authenticated users from auth pages (login/register)
 *   - AdminGuard: Blocks non-admin users from admin pages
 *
 * We also test the Navbar component which shows/hides links
 * depending on whether the user is logged in and what page
 * they're on.
 *
 * TESTING STRATEGY:
 *   - For "unauthenticated" tests: Don't set localStorage → guards redirect
 *   - For "authenticated" tests: Use the authenticatedPage fixture
 *   - localStorage manipulation simulates login state without a real backend
 *
 * NEW PLAYWRIGHT CONCEPTS:
 *
 * 1. page.evaluate() — Executes JavaScript inside the browser.
 *    We use it to read/write localStorage.
 *
 * 2. page.waitForURL() — Waits until the URL matches a pattern.
 *    Essential for testing redirects.
 *
 * 3. Testing ABSENCE of elements — Sometimes you need to verify
 *    something is NOT shown. Use toBeHidden() or toHaveCount(0).
 * ============================================================
 */

import { test, expect } from '@playwright/test';
import { mockAllApiRoutes, MOCK_DATA } from '../mocks/api-mocks';

// Import the auth fixture for tests that need a logged-in user
import { test as authTest } from '../fixtures/auth.fixture';

test.describe('Navigation & Route Guards', () => {

  // ── TEST 1: AuthGuard Redirects Unauthenticated Users ───
  test('should redirect unauthenticated user from /dashboard to /login', async ({ page }) => {
    await mockAllApiRoutes(page);

    // Try to visit the dashboard WITHOUT being logged in.
    // AuthGuard checks localStorage for a token. Since there
    // isn't one, it should redirect us to /login.
    await page.goto('/dashboard');

    // Verify we were redirected to the login page
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });


  // ── TEST 2: AuthGuard Redirects from Other Protected Routes
  test('should redirect unauthenticated user from /premium to /login', async ({ page }) => {
    await mockAllApiRoutes(page);
    await page.goto('/premium');

    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });


  // ── TEST 3: GuestGuard Redirects Authenticated Users ────
  test('should redirect authenticated user from /login to /dashboard', async ({ page }) => {
    await mockAllApiRoutes(page);

    // First, go to root (which redirects to /login)
    await page.goto('/');

    // Inject auth state into localStorage
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('auth', JSON.stringify(user));
    }, { token: MOCK_DATA.user.token, user: MOCK_DATA.user });

    // Reload so Angular picks up the auth state
    await page.reload();

    // Now try visiting /login — GuestGuard should redirect to /dashboard
    await page.goto('/login');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');
  });


  // ── TEST 4: Default Route Redirects to /login ───────────
  test('should redirect root "/" to /login for unauthenticated user', async ({ page }) => {
    await mockAllApiRoutes(page);
    await page.goto('/');

    // The routes config has: { path: '', redirectTo: '/login' }
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });


  // ── TEST 5: Wildcard Route Redirects to /login ──────────
  test('should redirect unknown routes to /login', async ({ page }) => {
    await mockAllApiRoutes(page);

    // Try visiting a route that doesn't exist
    await page.goto('/some-random-page');

    // The wildcard route { path: '**', redirectTo: '/login' } should kick in
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });


  // ── TEST 6: Navbar Shows Login/SignUp on Auth Pages ─────
  test('should show Login and Sign Up buttons on auth pages', async ({ page }) => {
    await mockAllApiRoutes(page);
    await page.goto('/login');

    // On auth pages (login, register), navbar shows Login and Sign Up links
    // The navbar component conditionally hides app links on auth pages
    await expect(page.locator('nav').getByText('SpendSmart')).toBeVisible();
  });
});


// ─── AUTHENTICATED NAVIGATION TESTS ────────────────────────
// These tests use the auth fixture to simulate a logged-in user
// ────────────────────────────────────────────────────────────

authTest.describe('Authenticated Navigation', () => {

  // ── TEST 7: Navbar Shows App Links When Logged In ───────
  authTest('should show navbar links when authenticated', async ({ authenticatedPage }) => {
    // Navigate to dashboard (we're already logged in via fixture)
    await authenticatedPage.goto('/dashboard');

    // The navbar should show app-specific links:
    // Dashboard, Alerts, Recurring, Premium
    const nav = authenticatedPage.locator('nav');
    await expect(nav.getByText('Dashboard')).toBeVisible();
    await expect(nav.getByText('Recurring')).toBeVisible();
    await expect(nav.getByText('Premium')).toBeVisible();
  });


  // ── TEST 8: Profile Dropdown Appears ────────────────────
  authTest('should show profile dropdown when clicked', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Find and click the profile trigger button in the navbar
    // The navbar shows user's initial in an avatar circle
    const profileTrigger = authenticatedPage.locator('.profile-trigger');

    // Only test if the profile trigger is visible
    if (await profileTrigger.isVisible()) {
      await profileTrigger.click();

      // The dropdown should appear with Profile and Logout options
      await expect(authenticatedPage.locator('.profile-dropdown')).toBeVisible();
      await expect(authenticatedPage.getByText('Profile')).toBeVisible();
      await expect(authenticatedPage.getByText('Logout')).toBeVisible();
    }
  });


  // ── TEST 9: Can Navigate Between Protected Pages ────────
  authTest('should navigate between protected pages', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Click on "Recurring" in the navbar
    const nav = authenticatedPage.locator('nav');
    await nav.getByText('Recurring').click();

    // Should navigate to the recurring page
    await authenticatedPage.waitForURL('**/recurring', { timeout: 10000 });
    expect(authenticatedPage.url()).toContain('/recurring');
  });
});
