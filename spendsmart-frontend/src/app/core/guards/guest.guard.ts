import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth';

/**
 * GuestGuard — Redirects logged-in users away from auth pages.
 * Applied to /login, /register, /forgot-password routes.
 * If user already has a valid token, redirect to /dashboard.
 */
@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return false;
    }
    return true;
  }
}
