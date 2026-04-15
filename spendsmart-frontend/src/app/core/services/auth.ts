import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';

// @Injectable({ providedIn: 'root' }) makes this a singleton service
// available throughout the entire app without needing to add it to any module's providers
@Injectable({ providedIn: 'root' })
export class AuthService {

  private baseUrl = 'http://localhost:8081/auth';

  // BehaviorSubject holds the current value AND emits it to new subscribers immediately
  // This is how all components stay in sync with the logged-in user state
  // null means no user is logged in
  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(null);

  // Expose as Observable — components can subscribe but can't call .next() from outside
  // This protects the auth state from being modified by any component directly
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // On app startup, check if a token already exists in localStorage
    // This keeps the user logged in across browser refreshes
    const stored = localStorage.getItem('auth');
    if (stored) this.currentUserSubject.next(JSON.parse(stored));
  }

  register(request: RegisterRequest): Observable<User> {
    // Returns the created User object — the caller (RegisterComponent) decides what to do next
    return this.http.post<User>(`${this.baseUrl}/register`, request);
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request).pipe(
      // tap() performs a side effect without modifying the stream value
      // Here we persist the token and update the BehaviorSubject when login succeeds
      tap(response => {
        localStorage.setItem('auth', JSON.stringify(response)); // persist full auth object
        localStorage.setItem('token', response.token);          // persist token separately for quick access
        this.currentUserSubject.next(response);                  // notify all subscribers of login
      })
    );
  }

  logout(): void {
    // Clear everything from localStorage so there's no stale token on next visit
    localStorage.removeItem('auth');
    localStorage.removeItem('token');
    // null tells all subscribers (navbar, guards) that no one is logged in
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    // Simple getter used by the JWT interceptor to attach the token to every request
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    // AuthGuard uses this to decide whether to allow route navigation
    return !!this.getToken(); // !! converts string | null to boolean
  }

  getCurrentUser(): AuthResponse | null {
    // .value gives the current snapshot of the BehaviorSubject
    // Use this when you need the value once, not a reactive stream
    return this.currentUserSubject.value;
  }

  getProfile(userId: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/profile/${userId}`);
  }

  updateProfile(userId: number, data: Partial<User>): Observable<User> {
    // Partial<User> means any subset of User fields is valid
    return this.http.put<User>(`${this.baseUrl}/profile/${userId}`, data);
  }

  changePassword(userId: number, data: { currentPassword: string; newPassword: string }): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/password/${userId}`, data);
  }

  updateCurrency(userId: number, currency: string): Observable<void> {
    // currency is a query param, not a request body, matching the BE endpoint signature
    return this.http.put<void>(`${this.baseUrl}/currency/${userId}?currency=${currency}`, {});
  }
}