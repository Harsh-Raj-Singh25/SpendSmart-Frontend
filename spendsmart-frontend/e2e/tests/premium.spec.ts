/**
 * ============================================================
 *  PREMIUM PAGE — E2E TESTS
 * ============================================================
 *
 * WHAT ARE WE TESTING?
 * The Premium upgrade page shows:
 *   - Pricing card with ₹100/month
 *   - Feature list (4 benefits)
 *   - "Upgrade Now" CTA button
 *   - Razorpay secure checkout badge
 *
 * This is a relatively simple page but important to verify
 * because it's the monetization funnel of the app.
 *
 * NOTE: We can't actually test the Razorpay payment flow
 * because it opens an external popup. We just verify the
 * page renders correctly and the button is clickable.
 * ============================================================
 */

import { test, expect } from '../fixtures/auth.fixture';

test.describe('Premium Page', () => {

  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/premium');
    await authenticatedPage.waitForLoadState('networkidle');
  });


  // ── TEST 1: Heading and Description ─────────────────────
  test('should display premium heading', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Check the heading "SpendSmart Premium"
    await expect(page.getByText('SpendSmart Premium')).toBeVisible();

    // Check the descriptive subtitle
    await expect(page.getByText(/take full control/i)).toBeVisible();
  });


  // ── TEST 2: Pricing Displayed Correctly ─────────────────
  test('should display correct price', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // The pricing section shows:
    //   ₹ 100 / month
    // These are in separate <span> elements with classes:
    //   .currency (₹), .amount (100), .period (/ month)
    await expect(page.locator('.currency')).toContainText('₹');
    await expect(page.locator('.amount')).toContainText('100');
    await expect(page.locator('.period')).toContainText('/ month');
  });


  // ── TEST 3: Feature List Contains All Items ──────────────
  test('should list all premium features', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // The features list has 4 <li> items
    const features = page.locator('.features-list li');
    await expect(features).toHaveCount(4);

    // Verify specific feature texts
    await expect(page.getByText(/unlimited daily transactions/i)).toBeVisible();
    await expect(page.getByText(/advanced analytics/i)).toBeVisible();
    await expect(page.getByText(/priority customer support/i)).toBeVisible();
    await expect(page.getByText(/custom transaction categories/i)).toBeVisible();
  });


  // ── TEST 4: Upgrade Button ──────────────────────────────
  test('should display enabled upgrade button', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // The "Upgrade Now" button should be visible and enabled
    const upgradeBtn = page.getByRole('button', { name: /upgrade now/i });
    await expect(upgradeBtn).toBeVisible();
    await expect(upgradeBtn).toBeEnabled();
  });


  // ── TEST 5: PRO Badge ──────────────────────────────────
  test('should display PRO badge', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // There's a "PRO" badge at the top of the pricing card
    await expect(page.locator('.pro-badge')).toBeVisible();
    await expect(page.locator('.pro-badge')).toContainText('PRO');
  });


  // ── TEST 6: Secure Checkout Badge ───────────────────────
  test('should display Razorpay secure checkout text', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // At the bottom of the pricing card:
    //   🔒 Secure checkout powered by Razorpay
    await expect(page.getByText(/secure checkout/i)).toBeVisible();
    await expect(page.getByText(/razorpay/i)).toBeVisible();
  });
});
