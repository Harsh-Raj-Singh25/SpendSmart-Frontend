import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';

export interface User {
  id?: number;
  email: string;
  name?: string;
  role?: string;
  isPremium?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Auth State
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  private readonly TOKEN_KEY = 'spendsmart_token';

  constructor() {
    this.checkInitialAuth();
  }

  private checkInitialAuth() {
    const token = this.getToken();
    if (token) {
      this.isAuthenticated.set(true);
      // In a real app we'd fetch profile here
      // this.fetchProfile().subscribe();
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.isAuthenticated.set(true);
  }

  clearToken() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }

  login(credentials: { email: string; password: string }) {
    // Note: The backend uses Gateway & Auth Service. Usually POST to /api/auth/login or similar.
    return this.http.post<{ token: string, user?: User }>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(res => {
          if (res.token) {
            this.setToken(res.token);
            if (res.user) {
              this.currentUser.set(res.user);
            }
            this.router.navigate(['/dashboard']);
          }
        }),
        catchError(err => throwError(() => err))
      );
  }

  register(userData: any) {
    return this.http.post(`${environment.apiUrl}/auth/register`, userData);
  }

  logout() {
    this.clearToken();
    this.router.navigate(['/login']);
  }
}
