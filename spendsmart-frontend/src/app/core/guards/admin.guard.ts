import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  canActivate(): boolean {
    const user = this.authService.getCurrentUser();
    
    // Check if the user's role is ADMIN
    if (user && user.role === 'ADMIN') {
      return true;
    }
    
    this.snackBar.open('Access denied. Administrators only.', 'Close', { duration: 3000 });
    this.router.navigate(['/dashboard']);
    return false;
  }
}
