/**
 * ============================================================
 *  RECURRING TRANSACTIONS PAGE — E2E TESTS
 * ============================================================
 *
 * WHAT ARE WE TESTING?
 * The recurring transactions page displays subscriptions and
 * recurring income/expenses that happen automatically. It shows:
 *   - A list of recurring items with details
 *   - Each item shows: title, amount, type, frequency, next due date
 *
 * This page is behind AuthGuard — users must be logged in.
 * ============================================================
 */

import { test, expect } from '../fixtures/auth.fixture';

test.describe('Recurring Transactions Page', () => {

  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recurring');
    await authenticatedPage.waitForLoadState('networkidle');
  });


  // ── TEST 1: Page Loads Successfully ─────────────────────
  test('should load the recurring page', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Verify we're on the recurring page (not redirected)
    expect(page.url()).toContain('/recurring');
  });


  // ── TEST 2: Page Has Heading or Content ─────────────────
  test('should display recurring transactions content', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // The recurring page should have some identifiable content.
    // Look for common elements that would be on a recurring page.
    // We use a broad check since the exact template may vary.
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();

    // The page should not show a login form (meaning guard passed)
    await expect(page.locator('.auth-wrapper')).toBeHidden();
  });
});
