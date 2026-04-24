/**
 * ============================================================
 *  CENTRALIZED API MOCKS
 * ============================================================
 *
 * WHY MOCK APIs?
 * In E2E tests, we don't want to depend on a live backend.
 * Instead, we intercept HTTP requests at the browser/network level
 * and return fake (mock) responses. This makes tests:
 *   1. FAST        → No real network calls
 *   2. RELIABLE    → No flaky failures from backend downtime
 *   3. REPEATABLE  → Same data every run
 *
 * HOW IT WORKS:
 * Playwright page.route(urlPattern, handler) intercepts any
 * request matching the pattern. The handler can return a custom
 * JSON body, status code, and headers - the browser thinks it
 * received a real response from the server.
 *
 * IMPORTANT: We use "http://localhost:8080/**" as the base pattern
 * so that we ONLY intercept API calls to the backend gateway, and
 * NOT the Angular dev server (localhost:4200) page navigations.
 * Without this, navigating to /notifications would be intercepted
 * and return raw JSON instead of the Angular page!
 *
 * USAGE:
 *   import { mockAllApiRoutes, MOCK_DATA } from '../mocks/api-mocks';
 *   test.beforeEach(async ({ page }) => {
 *     await mockAllApiRoutes(page);
 *   });
 * ============================================================
 */

import { Page, Route } from '@playwright/test';

// ─── CONSTANTS ──────────────────────────────────────────────
// The backend gateway URL. All API calls go through this host.
// We use this prefix in route patterns so we ONLY intercept
// backend requests, not Angular dev server page loads.
// ─────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8080';

// ─── MOCK DATA ──────────────────────────────────────────────
// Centralized fake data used across all mock responses.
// Change these values to test different scenarios.
// ─────────────────────────────────────────────────────────────

export const MOCK_DATA = {

  /**
   * A fake JWT token.
   * In a real app, this would be a signed JWT. For testing,
   * we just need any non-empty string - the backend is not
   * verifying it since we are mocking all API calls.
   */
  token: 'fake-jwt-token-for-testing-purposes',

  /**
   * The authenticated user object.
   * This mirrors the AuthResponse interface from user.model.ts.
   * The dashboard, navbar, and profile components all read from this.
   */
  user: {
    token: 'fake-jwt-token-for-testing-purposes',
    userId: 1,
    fullName: 'Test User',
    email: 'test@example.com',
    role: 'USER',
    subscriptionType: 'FREE',
  },

  /**
   * A second user with PREMIUM subscription.
   * Useful for testing premium-specific UI states.
   */
  premiumUser: {
    token: 'fake-jwt-token-premium',
    userId: 2,
    fullName: 'Premium User',
    email: 'premium@example.com',
    role: 'USER',
    subscriptionType: 'PREMIUM',
  },

  /**
   * An admin user for testing admin-only pages.
   */
  adminUser: {
    token: 'fake-jwt-token-admin',
    userId: 3,
    fullName: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
    subscriptionType: 'PREMIUM',
  },

  /**
   * Expense categories returned by the categories API.
   * These appear in the Quick Add dropdown and budget forms.
   */
  expenseCategories: [
    { categoryId: 1, name: 'Food', type: 'EXPENSE', userId: 1 },
    { categoryId: 2, name: 'Transport', type: 'EXPENSE', userId: 1 },
    { categoryId: 3, name: 'Shopping', type: 'EXPENSE', userId: 1 },
  ],

  /**
   * Income categories.
   */
  incomeCategories: [
    { categoryId: 4, name: 'Salary', type: 'INCOME', userId: 1 },
    { categoryId: 5, name: 'Freelance', type: 'INCOME', userId: 1 },
  ],

  /**
   * Sample expense transactions.
   * These appear in the Expenses tab of the dashboard.
   */
  expenseTransactions: [
    {
      transactionId: 101,
      amount: 500,
      type: 'EXPENSE',
      category: 'Food',
      description: 'Dinner at restaurant',
      date: '2026-04-20T18:30:00',
      userId: 1,
    },
    {
      transactionId: 102,
      amount: 200,
      type: 'EXPENSE',
      category: 'Transport',
      description: 'Cab ride',
      date: '2026-04-21T09:00:00',
      userId: 1,
    },
  ],

  /**
   * Sample income transactions.
   * These appear in the Incomes tab of the dashboard.
   */
  incomeTransactions: [
    {
      transactionId: 201,
      amount: 50000,
      type: 'INCOME',
      category: 'Salary',
      description: 'April salary',
      date: '2026-04-01T00:00:00',
      userId: 1,
    },
  ],

  /**
   * Budget data - used by the budget panel on the dashboard.
   * Each budget links a category to a spending limit.
   */
  budgets: [
    {
      budgetId: 1,
      categoryId: 1,
      limitAmount: 5000,
      spentAmount: 3500,
      userId: 1,
    },
  ],

  /**
   * Budget progress - returned by the budget progress API.
   * Shows how much of each budget has been used.
   */
  budgetProgress: [
    {
      budgetId: 1,
      limitAmount: 5000,
      spentAmount: 3500,
      percentageUsed: 70,
    },
  ],

  /**
   * Analytics - category breakdown for pie chart.
   */
  categoryBreakdown: [
    { category: 'Food', amount: 3500 },
    { category: 'Transport', amount: 1200 },
    { category: 'Shopping', amount: 800 },
  ],

  /**
   * Analytics - monthly trend for bar chart.
   */
  monthlyTrend: [
    { month: 'Jan', income: 50000, expense: 30000 },
    { month: 'Feb', income: 50000, expense: 28000 },
    { month: 'Mar', income: 52000, expense: 35000 },
  ],

  /**
   * Notifications - displayed on the alerts page.
   */
  notifications: [
    {
      notificationId: 1,
      message: 'Budget alert: Food spending at 70%',
      read: false,
      createdAt: '2026-04-22T10:00:00',
    },
    {
      notificationId: 2,
      message: 'New monthly report available',
      read: true,
      createdAt: '2026-04-21T08:00:00',
    },
  ],

  /**
   * Recurring transactions - displayed on the recurring page.
   */
  recurringTransactions: [
    {
      recurringId: 1,
      title: 'Netflix Subscription',
      amount: 499,
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      nextDueDate: '2026-05-01',
      userId: 1,
    },
    {
      recurringId: 2,
      title: 'Salary',
      amount: 50000,
      type: 'INCOME',
      frequency: 'MONTHLY',
      nextDueDate: '2026-05-01',
      userId: 1,
    },
  ],

  /**
   * Analytics advanced insights data.
   */
  healthScore: 72,
  spendingForecast: 32000,
  cashflow: { inflow: 50000, outflow: 35000, net: 15000 },
  topCategories: [
    { name: 'Food', amount: 3500 },
    { name: 'Transport', amount: 1200 },
  ],
};


// ─── ROUTE MOCKING FUNCTION ─────────────────────────────────
// This function intercepts ALL backend API calls and returns
// mock data. Call it in test.beforeEach() to set up mocks.
//
// CRITICAL: We match routes using the full backend URL prefix
// (http://localhost:8080) so we do NOT accidentally intercept
// requests to the Angular dev server (http://localhost:4200).
// ─────────────────────────────────────────────────────────────

/**
 * Intercepts all API routes and returns mock responses.
 *
 * How page.route() works:
 *   page.route(urlPattern, handlerFunction)
 *
 *   - urlPattern: A string or regex that matches the request URL.
 *     We prefix patterns with the backend URL to be specific.
 *
 *   - handlerFunction: Receives a route object. You call:
 *       route.fulfill({...})  to return a fake response
 *       route.continue()      to let the request go through normally
 *       route.abort()         to block the request entirely
 *
 * CORS HANDLING:
 *   When the Angular app (localhost:4200) makes requests to the backend
 *   (localhost:8080), the browser treats this as a cross-origin request.
 *   For POST requests with JSON body, the browser sends a preflight
 *   OPTIONS request first. Our mocks must:
 *     1. Handle OPTIONS with proper Access-Control-Allow-* headers
 *     2. Include CORS headers in all responses
//  *
//  * // @param page - The Playwright Page object from the test
//  */
// export async function mockAllApiRoutes(page: Page): Promise<void> {

  // ── CORS HEADERS ──────────────────────────────────────────
  // These headers tell the browser "yes, localhost:4200 is allowed
  // to make requests to localhost:8080". Without these, the browser
  // silently blocks cross-origin responses.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function handleCors(route: Route): Promise<boolean> {
  if (route.request().method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: corsHeaders });
    return true;
  }
  return false;
}

export async function mockAllApiRoutes(page: Page): Promise<void> {
  
  await page.route(`${API_BASE}/auth/login`, async (route) => {
    if (await handleCors(route)) return;
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify(MOCK_DATA.user),
      });
    } else {
      await route.continue();
    }
  });

  await page.route(`${API_BASE}/auth/register`, async (route) => {
    if (await handleCors(route)) return;
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({ userId: 1, fullName: 'Test User', email: 'test@example.com' }),
      });
    } else {
      await route.continue();
    }
  });

  await page.route(`${API_BASE}/auth/forgot-password`, async (route) => {
    if (await handleCors(route)) return;
    
    // Artificial delay to prevent Angular ExpressionChangedAfterItHasBeenCheckedError
    // caused by the mock resolving too fast.
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify({ message: 'OTP sent to your email' }),
    });
  });

  await page.route(`${API_BASE}/auth/reset-password`, async (route) => {
    if (await handleCors(route)) return;
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Password reset successful' }),
    });
  });

  await page.route(`${API_BASE}/auth/google`, async (route) => {
    if (await handleCors(route)) return;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify(MOCK_DATA.user),
    });
  });

  await page.route(`${API_BASE}/auth/profile/**`, async (route) => {
    if (await handleCors(route)) return;
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({
          userId: 1, fullName: 'Test User', email: 'test@example.com',
          currency: 'INR', timezone: 'Asia/Kolkata', avatarUrl: '', bio: '',
          role: 'USER', monthlyBudget: 50000, active: true,
        }),
      });
    } else {
      await route.continue();
    }
  });

  await page.route(`${API_BASE}/transactions/**`, async (route) => {
    if (await handleCors(route)) return;
    const method = route.request().method();
    if (method === 'GET') {
      const allTransactions = [...MOCK_DATA.expenseTransactions, ...MOCK_DATA.incomeTransactions];
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(allTransactions) });
    } else if (method === 'POST') {
      const body = route.request().postData();
      const newTx = body ? JSON.parse(body) : {};
      await route.fulfill({ status: 201, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify({ ...newTx, transactionId: 999 }) });
    } else if (method === 'DELETE') {
      await route.fulfill({ status: 204, headers: corsHeaders });
    } else {
      await route.continue();
    }
  });

  await page.route(`${API_BASE}/transactions`, async (route) => {
    if (await handleCors(route)) return;
    const method = route.request().method();
    if (method === 'GET') {
      const allTransactions = [...MOCK_DATA.expenseTransactions, ...MOCK_DATA.incomeTransactions];
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(allTransactions) });
    } else if (method === 'POST') {
      const body = route.request().postData();
      const newTx = body ? JSON.parse(body) : {};
      await route.fulfill({ status: 201, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify({ ...newTx, transactionId: 999 }) });
    } else {
      await route.continue();
    }
  });

  await page.route(`${API_BASE}/categories/**`, async (route) => {
    if (await handleCors(route)) return;
    const url = route.request().url();
    if (url.includes('EXPENSE') || url.includes('expense')) {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(MOCK_DATA.expenseCategories) });
    } else if (url.includes('INCOME') || url.includes('income')) {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(MOCK_DATA.incomeCategories) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify([...MOCK_DATA.expenseCategories, ...MOCK_DATA.incomeCategories]) });
    }
  });

  await page.route(`${API_BASE}/categories`, async (route) => {
    if (await handleCors(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify([...MOCK_DATA.expenseCategories, ...MOCK_DATA.incomeCategories]) });
  });

  await page.route(`${API_BASE}/budgets/**`, async (route) => {
    if (await handleCors(route)) return;
    const method = route.request().method();
    const url = route.request().url();
    if (url.includes('progress')) {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(MOCK_DATA.budgetProgress) });
    } else if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(MOCK_DATA.budgets) });
    } else if (method === 'POST') {
      const bodyStr = route.request().postData() || '{}';
      await route.fulfill({ status: 201, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify({ budgetId: 99, ...JSON.parse(bodyStr) }) });
    } else if (method === 'DELETE') {
      await route.fulfill({ status: 204, headers: corsHeaders });
    } else {
      await route.continue();
    }
  });

  await page.route(`${API_BASE}/budgets`, async (route) => {
    if (await handleCors(route)) return;
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(MOCK_DATA.budgets) });
    } else if (method === 'POST') {
      await route.fulfill({ status: 201, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify({ budgetId: 99 }) });
    } else {
      await route.continue();
    }
  });

  await page.route(`${API_BASE}/analytics/**`, async (route) => {
    if (await handleCors(route)) return;
    const url = route.request().url();
    if (url.includes('category-breakdown') || url.includes('categoryBreakdown')) {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(MOCK_DATA.categoryBreakdown) });
    } else if (url.includes('monthly') || url.includes('trend')) {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(MOCK_DATA.monthlyTrend) });
    } else if (url.includes('health')) {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify({ score: MOCK_DATA.healthScore }) });
    } else if (url.includes('forecast')) {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify({ forecast: MOCK_DATA.spendingForecast }) });
    } else if (url.includes('cashflow')) {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(MOCK_DATA.cashflow) });
    } else if (url.includes('top-categories') || url.includes('topCategories')) {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(MOCK_DATA.topCategories) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify({}) });
    }
  });

  await page.route(`${API_BASE}/notifications/**`, async (route) => {
    if (await handleCors(route)) return;
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(MOCK_DATA.notifications) });
    } else if (method === 'PUT') {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: '{}' });
    } else {
      await route.continue();
    }
  });

  await page.route(`${API_BASE}/notifications`, async (route) => {
    if (await handleCors(route)) return;
    await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(MOCK_DATA.notifications) });
  });

  await page.route(`${API_BASE}/recurring/**`, async (route) => {
    if (await handleCors(route)) return;
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(MOCK_DATA.recurringTransactions) });
    } else if (method === 'POST') {
      await route.fulfill({ status: 201, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify({ recurringId: 99 }) });
    } else if (method === 'DELETE') {
      await route.fulfill({ status: 204, headers: corsHeaders });
    } else {
      await route.continue();
    }
  });

  await page.route(`${API_BASE}/recurring`, async (route) => {
    if (await handleCors(route)) return;
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(MOCK_DATA.recurringTransactions) });
    } else {
      await route.continue();
    }
  });

  await page.route(`${API_BASE}/payment/**`, async (route) => {
    if (await handleCors(route)) return;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify({ orderId: 'order_mock123', amount: 10000, currency: 'INR' }),
    });
  });
}

export async function mockLoginFailure(page: Page): Promise<void> {
  await page.unroute(`${API_BASE}/auth/login`);
  await page.route(`${API_BASE}/auth/login`, async (route) => {
    if (await handleCors(route)) return;
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Invalid email or password' }),
    });
  });
}

export async function mockRegisterFailure(page: Page): Promise<void> {
  await page.unroute(`${API_BASE}/auth/register`);
  await page.route(`${API_BASE}/auth/register`, async (route) => {
    if (await handleCors(route)) return;
    await route.fulfill({
      status: 409,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Email already registered' }),
    });
  });
}
