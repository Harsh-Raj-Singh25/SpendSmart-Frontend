import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { throwError, Observable, BehaviorSubject } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';

/**
 * UNIFIED AuthService - Single source of truth for auth state
 * 
 * Usage:
 * - login() → POST /auth/login → saves token → navigates to dashboard
 * - isLoggedIn() → checks token existence
 * - getCurrentUser() → returns cached user data
 * - logout() → clears token → navigates to login
 * 
 * All API calls go through the Gateway (localhost:8080)
 * Token is stored in localStorage under key 'token'
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'auth';
  private readonly GATEWAY_URL = environment.apiUrl;

  // BehaviorSubject for reactive user state
  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  // Signal for dashboard/navbar reactivity
  currentUser = signal<AuthResponse | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor() {
    this.restoreAuthState();
  }

  /**
   * Restore auth state from localStorage on app startup.
   * Keeps user logged in across browser refreshes.
   */
  private restoreAuthState(): void {
    const token = this.getToken();
    const stored = localStorage.getItem(this.USER_KEY);

    if (token && stored) {
      try {
        const user = JSON.parse(stored) as AuthResponse;
        this.currentUserSubject.next(user);
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      } catch {
        this.clearAuthState();
      }
    }
  }

  /**
   * Register a new user.
   */
  register(request: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.GATEWAY_URL}/auth/register`, request);
  }

  /**
   * Login with email/password.
   * POST goes through gateway to auth-service (/auth/login).
   * Backend returns AuthResponse { token, userId, fullName, email, role }
   */
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.GATEWAY_URL}/auth/login`, request).pipe(
      tap(response => {
        this.setAuthState(response);
        this.router.navigate(['/dashboard']);
      }),
      catchError(err => throwError(() => err))
    );
  }

  /**
   * Save auth response to localStorage and update auth state.
   */
  private setAuthState(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response));
    this.currentUserSubject.next(response);
    this.currentUser.set(response);
    this.isAuthenticated.set(true);
  }

  /**
   * Logout — clear token and redirect to login.
   */
  logout(): void {
    this.clearAuthState();
    this.router.navigate(['/login']);
  }

  /**
   * Clear all auth state and localStorage.
   */
  private clearAuthState(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  /**
   * Get JWT token from localStorage.
   * Used by interceptors to attach Authorization header.
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Check if user is logged in.
   * Used by AuthGuard to protect routes.
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Get cached user data (synchronous snapshot).
   */
  getCurrentUser(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  /**
   * Forgot password — Step 1: Send OTP to email.
   */
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.GATEWAY_URL}/auth/forgot-password`,
      { email }
    );
  }

  /**
   * Reset password — Step 2: Verify OTP and set new password.
   */
  resetPassword(data: { email: string; otp: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.GATEWAY_URL}/auth/reset-password`,
      data
    );
  }

  /**
   * Google OAuth2 login — sends the Google ID token to the backend
   * for server-side verification. Backend verifies the token,
   * finds or creates the user, and returns our own JWT.
   */
  googleLogin(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.GATEWAY_URL}/auth/google`, { idToken }).pipe(
      tap(response => {
        this.setAuthState(response);
        this.router.navigate(['/dashboard']);
      }),
      catchError(err => throwError(() => err))
    );
  }

  /**
   * Get user profile by ID.
   */
  getProfile(userId: number): Observable<User> {
    return this.http.get<User>(`${this.GATEWAY_URL}/auth/profile/${userId}`);
  }

  /**
   * Update user profile.
   */
  updateProfile(userId: number, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.GATEWAY_URL}/auth/profile/${userId}`, data);
  }

  /**
   * Change password.
   */
  changePassword(userId: number, data: { currentPassword: string; newPassword: string }): Observable<void> {
    return this.http.put<void>(`${this.GATEWAY_URL}/auth/password/${userId}`, data);
  }

  /**
   * Update currency setting.
   */
  updateCurrency(userId: number, currency: string): Observable<void> {
    return this.http.put<void>(
      `${this.GATEWAY_URL}/auth/currency/${userId}?currency=${currency}`,
      {}
    );
  }

  /**
   * Deactivate account.
   */
  deactivateAccount(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.GATEWAY_URL}/auth/deactivate/${userId}`);
  }
}