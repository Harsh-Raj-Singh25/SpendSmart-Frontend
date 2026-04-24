/**
 * ============================================================
 *  LOGIN PAGE — E2E TESTS
 * ============================================================
 *
 * WHAT ARE WE TESTING?
 * These tests verify the Login page works correctly from a
 * user's perspective:
 *   - Form renders with all expected fields
 *   - Validation messages appear when needed
 *   - Successful login redirects to the dashboard
 *   - Failed login shows an error message
 *   - Navigation links work (register, forgot password)
 *
 * KEY PLAYWRIGHT CONCEPTS USED HERE:
 *
 * 1. test.describe() — Groups related tests together.
 *    Like a chapter in a book; helps organize output.
 *
 * 2. test.beforeEach() — Runs before EACH test in the describe block.
 *    We use it to set up API mocks and navigate to the page.
 *
 * 3. page.goto('/login') — Navigates the browser to a URL.
 *    Since we set baseURL in playwright.config.ts, we only
 *    need the path (not the full URL).
 *
 * 4. page.locator() — Finds elements on the page.
 *    Uses CSS selectors, similar to document.querySelector().
 *
 * 5. page.getByRole() — Finds elements by their ARIA role.
 *    This is the PREFERRED way to find elements because it
 *    mirrors how users (and screen readers) see the page.
 *    Examples: getByRole('button'), getByRole('heading'), etc.
 *
 * 6. page.getByLabel() — Finds form inputs by their <label> text.
 *    Example: getByLabel('Email') finds <input> with <label>Email</label>
 *
 * 7. page.getByText() — Finds elements by their visible text content.
 *
 * 8. expect(locator).toBeVisible() — Asserts the element is visible.
 *    Playwright auto-waits up to 5s for the assertion to pass.
 *
 * 9. locator.fill() — Types text into an input field.
 *    Unlike .type(), .fill() clears the field first.
 *
 * 10. locator.click() — Clicks an element.
 *     Playwright auto-waits for the element to be clickable.
 * ============================================================
 */

import { test, expect } from '@playwright/test';
import { mockAllApiRoutes, mockLoginFailure, MOCK_DATA } from '../mocks/api-mocks';

// ─── TEST SUITE: Login Page ─────────────────────────────────
// test.describe() creates a named group of tests.
// In the test report, you'll see:
//   Login Page
//     ✓ should display login form with email and password fields
//     ✓ should show validation error for invalid email
//     ✓ ...etc
// ─────────────────────────────────────────────────────────────
test.describe('Login Page', () => {

  // ── BEFORE EACH TEST ────────────────────────────────────
  // Runs before every test in this describe block.
  // We:
  //   1. Set up API mocks (so no real backend calls are made)
  //   2. Navigate to the login page
  // ────────────────────────────────────────────────────────
  test.beforeEach(async ({ page }) => {
    await mockAllApiRoutes(page);  // Intercept all API calls
    await page.goto('/login');      // Navigate to the login page
  });


  // ── TEST 1: Form Elements Render ────────────────────────
  test('should display login form with email and password fields', async ({ page }) => {
    // Check that the heading "Welcome to SpendSmart" is visible
    // getByRole('heading') finds <h1>, <h2>, etc. elements
    // { name: /welcome/i } filters by text content (case-insensitive regex)
    await expect(page.getByRole('heading', { name: /welcome to spendsmart/i }))
      .toBeVisible();

    // Check that the email input exists
    // getByLabel('Email') looks for an <input> associated with a <label>
    // that contains the text "Email"
    await expect(page.getByLabel('Email')).toBeVisible();

    // Check that the password input exists
    await expect(page.getByLabel('Password')).toBeVisible();

    // Check that the submit button exists
    // getByRole('button', { name: /sign in/i }) finds a <button>
    // whose visible text matches "Sign In"
    await expect(page.getByRole('button', { name: /sign in/i }))
      .toBeVisible();
  });


  // ── TEST 2: Submit Button Disabled When Form Is Invalid ──
  test('should disable submit button when form is empty', async ({ page }) => {
    // The Sign In button should be disabled when email and password are empty
    // because the form has Validators.required on both fields
    const submitBtn = page.getByRole('button', { name: /sign in/i });

    // toBeDisabled() checks the HTML 'disabled' attribute
    await expect(submitBtn).toBeDisabled();
  });


  // ── TEST 3: Email Validation ────────────────────────────
  test('should show validation error for invalid email', async ({ page }) => {
    const emailInput = page.getByLabel('Email');

    // Fill in an invalid email
    await emailInput.fill('not-an-email');

    // Click somewhere else to trigger the 'touched' state
    // (Angular only shows validation errors after the field is touched)
    await page.getByLabel('Password').click();

    // Check that the error message appears
    // getByText() finds any element containing the specified text
    await expect(page.getByText('Please enter a valid email'))
      .toBeVisible();
  });


  // ── TEST 4: Successful Login → Redirect to Dashboard ────
  test('should login successfully and redirect to dashboard', async ({ page }) => {
    // Fill in valid credentials
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');

    // Click the Sign In button
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for navigation to the dashboard
    // waitForURL() pauses the test until the browser's URL matches
    // the given pattern. The ** glob matches any characters.
    await page.waitForURL('**/dashboard');

    // Verify we're on the dashboard page
    // page.url() returns the current URL as a string
    expect(page.url()).toContain('/dashboard');
  });


  // ── TEST 5: Failed Login → Error Snackbar ───────────────
  test('should show error snackbar on failed login', async ({ page }) => {
    // Override the login mock to return a 401 error
    // This REPLACES the mock set in beforeEach
    await mockLoginFailure(page);

    // Fill in credentials and submit
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // waitForSelector() waits for an element matching the CSS selector
    // to appear in the DOM. The snackbar is an Angular Material component.
    // We wait up to 5 seconds for it to appear.
    const snackbar = page.locator('simple-snack-bar, .mat-mdc-snack-bar-container, [matSnackBarLabel]');
    await expect(snackbar.first()).toBeVisible({ timeout: 5000 });
  });


  // ── TEST 6: "Sign up now" Link → Register Page ──────────
  test('should navigate to register page', async ({ page }) => {
    // Find the "Sign up now" link and click it.
    // We use the EXACT text 'Sign up now' to avoid matching the navbar
    // 'Sign Up' button (which also matches /sign up/i).
    // When multiple elements match a locator, Playwright throws a
    // "strict mode violation" error to prevent ambiguous actions.
    await page.getByRole('link', { name: 'Sign up now' }).click();

    // Verify the URL changed to /register
    await page.waitForURL('**/register');
    expect(page.url()).toContain('/register');
  });


  // ── TEST 7: "Forgot password?" Link → Forgot Password ──
  test('should navigate to forgot password page', async ({ page }) => {
    await page.getByRole('link', { name: /forgot password/i }).click();

    await page.waitForURL('**/forgot-password');
    expect(page.url()).toContain('/forgot-password');
  });


  // ── TEST 8: Google Sign-In Button Exists ────────────────
  test('should display Google sign-in button', async ({ page }) => {
    // The Google button has text "Continue with Google"
    await expect(page.getByRole('button', { name: /continue with google/i }))
      .toBeVisible();
  });


  // ── TEST 9: Remember Me Checkbox Exists ─────────────────
  test('should display remember me checkbox', async ({ page }) => {
    // The checkbox is inside a <label> with text "Remember me"
    await expect(page.getByText(/remember me/i)).toBeVisible();
  });
});
