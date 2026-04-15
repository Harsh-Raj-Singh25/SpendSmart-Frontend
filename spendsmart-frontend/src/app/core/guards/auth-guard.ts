import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      // Token exists in localStorage — allow navigation to the requested route
      return true;
    }
    // No token — redirect to login and block the requested route
    // Angular Router will not activate the route if we return false
    this.router.navigate(['/login']);
    return false;
  }
}