/**
 * ============================================================
 *  FORGOT PASSWORD PAGE — E2E TESTS
 * ============================================================
 *
 * WHAT ARE WE TESTING?
 * The password recovery flow is a TWO-STEP process:
 *   Step 1 (EMAIL): User enters their email → backend sends OTP
 *   Step 2 (OTP):   User enters OTP + new password → password resets
 *
 * The component uses a `step` variable ('EMAIL' or 'OTP') to
 * conditionally show different forms with *ngIf.
 *
 * NEW PLAYWRIGHT CONCEPTS:
 *
 * 1. Testing multi-step forms — We verify state transitions by
 *    checking which elements are visible/hidden at each step.
 *
 * 2. expect(locator).toBeHidden() — Opposite of toBeVisible().
 *    Asserts the element is NOT visible on the page.
 *
 * 3. Sequential actions — In multi-step flows, each action
 *    depends on the previous one. We perform them in order
 *    and verify the intermediate states.
 * ============================================================
 */

import { test, expect } from '@playwright/test';
import { mockAllApiRoutes } from '../mocks/api-mocks';

test.describe('Forgot Password Page', () => {

  test.beforeEach(async ({ page }) => {
    await mockAllApiRoutes(page);
    await page.goto('/forgot-password');
  });


  // ── TEST 1: Step 1 (Email) Initially Shown ──────────────
  test('should show email step initially', async ({ page }) => {
    // The heading should say "Password Recovery"
    await expect(page.getByRole('heading', { name: /password recovery/i }))
      .toBeVisible();

    // The subtitle instructs user to enter their email
    await expect(page.getByText(/enter your email to receive an otp/i))
      .toBeVisible();

    // The email input should be visible (we look for it by placeholder)
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();

    // The "Send OTP" button should be visible
    await expect(page.getByRole('button', { name: /send otp/i }))
      .toBeVisible();

    // The OTP input should NOT be visible yet (it's on step 2)
    await expect(page.getByPlaceholder('123456')).toBeHidden();
  });


  // ── TEST 2: Send OTP → Move to Step 2 ──────────────────
  test('should send OTP and transition to step 2', async ({ page }) => {
    // Add logging to console to debug why Angular hangs
    page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.type()} - ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));
    page.on('request', req => console.log(`REQUEST: ${req.method()} ${req.url()}`));
    page.on('response', res => console.log(`RESPONSE: ${res.status()} ${res.url()}`));

    // Fill in the email.
    // IMPORTANT: Angular reactive forms listen for specific keyboard events
    // to update FormControl values. Playwright's fill() sets the value
    // directly but may NOT trigger Angular's change detection.
    // pressSequentially() (formerly known as type()) types one character
    // at a time, which fires keydown → keypress → input → keyup events
    // that Angular's DefaultValueAccessor listens for.
    const emailInput = page.getByPlaceholder('you@example.com');
    await emailInput.click();
    await emailInput.pressSequentially('test@example.com', { delay: 20 });

    // Small wait for Angular's change detection cycle to process
    await page.waitForTimeout(300);

    // At this point the emailForm should be valid and the button enabled
    const sendOtpBtn = page.getByRole('button', { name: /send otp/i });
    await expect(sendOtpBtn).toBeEnabled({ timeout: 3000 });

    console.log('TEST: Clicking send OTP button');
    // Click "Send OTP" and simultaneously wait for the API response
    const [response] = await Promise.all([
      page.waitForResponse(resp =>
        resp.url().includes('/auth/forgot-password') && resp.status() === 200
      ),
      sendOtpBtn.click(),
    ]);

    console.log(`TEST: Got response with status ${response.status()} from ${response.url()}`);

    // After the mock API responds, the component switches step to OTP.
    // The template shows <label>Enter OTP</label> on step 2.
    await expect(page.getByText(/enter otp/i)).toBeVisible({ timeout: 10000 });

    // And the "Reset Password" button should appear
    await expect(page.getByRole('button', { name: /reset password/i }))
      .toBeVisible();
  });


  // ── TEST 3: Complete Password Reset ─────────────────────
  test('should reset password successfully', async ({ page }) => {
    // Step 1: Enter email and send OTP
    const emailInput = page.getByPlaceholder('you@example.com');
    await emailInput.click();
    await emailInput.pressSequentially('test@example.com', { delay: 20 });
    await page.waitForTimeout(300);

    // Click Send OTP and wait for the API response
    const sendOtpBtn = page.getByRole('button', { name: /send otp/i });
    await expect(sendOtpBtn).toBeEnabled({ timeout: 3000 });

    await Promise.all([
      page.waitForResponse(resp =>
        resp.url().includes('/auth/forgot-password') && resp.status() === 200
      ),
      sendOtpBtn.click(),
    ]);

    // Wait for step 2 form to appear
    await expect(page.getByText(/enter otp/i)).toBeVisible({ timeout: 10000 });

    // Step 2: Fill OTP and new password using pressSequentially
    const otpInput = page.getByPlaceholder('123456');
    await otpInput.click();
    await otpInput.pressSequentially('654321', { delay: 20 });

    const pwInput = page.getByPlaceholder('••••••••');
    await pwInput.click();
    await pwInput.pressSequentially('newPassword123', { delay: 20 });

    await page.waitForTimeout(300);

    // Submit the reset form and wait for response
    const resetBtn = page.getByRole('button', { name: /reset password/i });
    await expect(resetBtn).toBeEnabled({ timeout: 3000 });

    await Promise.all([
      page.waitForResponse(resp =>
        resp.url().includes('/auth/reset-password') && resp.status() === 200
      ),
      resetBtn.click(),
    ]);

    // After successful reset, the user should be redirected to login
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });


  // ── TEST 4: "Back to Login" Link Works ──────────────────
  test('should navigate back to login', async ({ page }) => {
    // The "Back to Login" link should always be visible (both steps)
    await page.getByRole('link', { name: /back to login/i }).click();

    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });


  // ── TEST 5: Send OTP Button Disabled When Email Empty ───
  test('should disable Send OTP button when email is empty', async ({ page }) => {
    // With no email filled in, the button should be disabled
    // because emailForm has Validators.required on the email field
    await expect(page.getByRole('button', { name: /send otp/i }))
      .toBeDisabled();
  });
});
