/**
 * ============================================================
 *  REGISTER PAGE — E2E TESTS
 * ============================================================
 *
 * WHAT ARE WE TESTING?
 * The registration form with fields: Full Name, Email, Password,
 * Confirm Password. We test:
 *   - All form fields render correctly
 *   - Required field validations work
 *   - Password mismatch validation works
 *   - Successful registration → redirect to login
 *   - Failed registration (duplicate email) → error snackbar
 *   - Navigation link to login page works
 *
 * NEW PLAYWRIGHT CONCEPTS:
 *
 * 1. page.getByPlaceholder() — Finds inputs by placeholder text.
 *    Alternative to getByLabel when labels might be tricky.
 *
 * 2. expect(locator).toContainText() — Checks that an element
 *    contains specific text (partial match is OK).
 *
 * 3. expect(locator).toHaveCount(n) — Asserts exactly n elements
 *    match the locator.
 * ============================================================
 */

import { test, expect } from '@playwright/test';
import { mockAllApiRoutes, mockRegisterFailure } from '../mocks/api-mocks';

test.describe('Register Page', () => {

  test.beforeEach(async ({ page }) => {
    await mockAllApiRoutes(page);
    await page.goto('/register');
  });


  // ── TEST 1: All Form Fields Render ──────────────────────
  test('should display registration form with all fields', async ({ page }) => {
    // Check the page heading
    await expect(page.getByRole('heading', { name: /join spendsmart/i }))
      .toBeVisible();

    // Check all four input fields exist using their labels
    await expect(page.getByLabel('Full Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Confirm Password')).toBeVisible();

    // Check the submit button
    await expect(page.getByRole('button', { name: /create account/i }))
      .toBeVisible();
  });


  // ── TEST 2: Required Field Validation ───────────────────
  test('should show validation errors for empty required fields', async ({ page }) => {
    // Touch the Full Name field and leave it empty
    // .click() puts focus on the field (touches it)
    // Then clicking away triggers Angular's 'touched' state
    const fullNameInput = page.getByLabel('Full Name');
    await fullNameInput.click();
    await fullNameInput.fill('');  // ensure it's empty

    // Click away to a different field to trigger validation
    await page.getByLabel('Email').click();

    // Now the "Full Name is required." error message should appear
    await expect(page.getByText('Full Name is required')).toBeVisible();
  });


  // ── TEST 3: Password Mismatch Validation ────────────────
  test('should show password mismatch error when passwords differ', async ({ page }) => {
    // Fill in different passwords
    // We use { exact: true } to distinguish "Password" from "Confirm Password"
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('different456');

    // Click away (or on another field) to trigger validation
    await page.getByLabel('Full Name').click();

    // The mismatch error should appear
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });


  // ── TEST 4: Successful Registration → Login Page ────────
  test('should register successfully and redirect to login', async ({ page }) => {
    // Fill in all fields with valid data
    await page.getByLabel('Full Name').fill('Test User');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');

    // Submit the form
    await page.getByRole('button', { name: /create account/i }).click();

    // Wait for redirect to login page
    // After successful registration, the component calls:
    //   this.router.navigate(['/login'])
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });


  // ── TEST 5: Duplicate Email → Error Snackbar ────────────
  test('should show error snackbar on duplicate email', async ({ page }) => {
    // Override the register mock to return a 409 Conflict
    await mockRegisterFailure(page);

    // Fill in the form
    await page.getByLabel('Full Name').fill('Test User');
    await page.getByLabel('Email').fill('existing@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');

    // Submit
    await page.getByRole('button', { name: /create account/i }).click();

    // The snackbar should appear with an error message
    const snackbar = page.locator('simple-snack-bar, .mat-mdc-snack-bar-container, [matSnackBarLabel]');
    await expect(snackbar.first()).toBeVisible({ timeout: 5000 });
  });


  // ── TEST 6: Submit Button Disabled When Form Invalid ────
  test('should disable submit button when form is incomplete', async ({ page }) => {
    // Only fill in the name field — leave others empty
    await page.getByLabel('Full Name').fill('Test User');

    // The button should be disabled because email/password are empty
    await expect(page.getByRole('button', { name: /create account/i }))
      .toBeDisabled();
  });


  // ── TEST 7: Navigate to Login Page ──────────────────────
  test('should navigate to login page via Sign In link', async ({ page }) => {
    // The footer has "Already have an account? Sign In"
    await page.getByRole('link', { name: /sign in/i }).click();

    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });


  // ── TEST 8: Password Minimum Length Validation ──────────
  test('should show validation for short password', async ({ page }) => {
    // Fill password with fewer than 8 characters
    const passwordInput = page.getByLabel('Password', { exact: true });
    await passwordInput.fill('short');

    // Click away to trigger validation
    await page.getByLabel('Full Name').click();

    // The error "Password must be at least 8 characters" should show
    await expect(page.getByText(/password must be at least 8/i)).toBeVisible();
  });
});
