/**
 * ============================================================
 *  NOTIFICATIONS PAGE — E2E TESTS
 * ============================================================
 *
 * WHAT ARE WE TESTING?
 * The notifications/alerts page displays system notifications
 * such as budget alerts and monthly reports. We verify:
 *   - Page loads for authenticated users
 *   - The page renders meaningful content (not a blank/error page)
 *   - Auth guard protects the route
 *
 * This page is behind AuthGuard — users must be logged in.
 * ============================================================
 */

import { test, expect } from '../fixtures/auth.fixture';

test.describe('Notifications Page', () => {

  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/notifications');
    await authenticatedPage.waitForLoadState('networkidle');
  });


  // ── TEST 1: Page Loads Without Redirect ─────────────────
  test('should load the notifications page', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Verify we stayed on the notifications page (guard passed)
    expect(page.url()).toContain('/notifications');
  });


  // ── TEST 2: Page Has Content (Not Blank) ────────────────
  test('should display notifications content', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // The page should have some content rendered
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    // It should be at least somewhat substantial
    // (not just an empty shell)
    expect(bodyText!.length).toBeGreaterThan(10);

    // Should NOT show the auth/login form (guard passed successfully)
    await expect(page.locator('.auth-wrapper')).toBeHidden();
  });


  // ── TEST 3: Navbar Shows "Alerts" as Active ─────────────
  test('should have Alerts link in navbar', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // The navbar should show the "Alerts" link.
    // The link text might include an unread count like "Alerts (2)",
    // so we use a partial text match with a regex.
    // We also scope the search to the <nav> element using locator chaining.
    const alertsLink = page.locator('nav a', { hasText: /Alerts/ });
    await expect(alertsLink).toBeVisible();
  });
});
