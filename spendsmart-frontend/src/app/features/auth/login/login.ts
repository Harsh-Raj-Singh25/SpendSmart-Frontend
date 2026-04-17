import { Component, OnInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth';
import { environment } from '../../../../environments/environment';

declare var google: any;

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private ngZone: NgZone
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Initialize Google Identity Services after the script loads
    this.initGoogleSignIn();
  }

  private initGoogleSignIn(): void {
    // Wait for the Google Identity Services script to load
    const checkGoogle = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        clearInterval(checkGoogle);
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: any) => {
            // ngZone.run ensures Angular change detection picks up the state change
            this.ngZone.run(() => {
              this.handleGoogleResponse(response);
            });
          }
        });
      }
    }, 100);

    // Stop checking after 10 seconds to prevent infinite loop
    setTimeout(() => clearInterval(checkGoogle), 10000);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.authService.login(this.form.value).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Login failed', 'Close', { duration: 3000 });
      }
    });
  }

  loginWithGoogle(): void {
    // Trigger the Google One Tap / popup sign-in flow
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback: use the popup method if One Tap is blocked
          google.accounts.id.renderButton(
            document.getElementById('google-signin-btn'),
            { theme: 'outline', size: 'large', width: '100%', text: 'continue_with' }
          );
          // Click the rendered button programmatically
          const btn = document.querySelector('#google-signin-btn div[role=button]') as HTMLElement;
          if (btn) btn.click();
        }
      });
    } else {
      this.snackBar.open('Google Sign-In is loading. Please try again.', 'Close', { duration: 3000 });
    }
  }

  private handleGoogleResponse(response: any): void {
    if (!response.credential) {
      this.snackBar.open('Google Sign-In failed. Please try again.', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;
    // Send the Google ID token to our backend for verification
    this.authService.googleLogin(response.credential).subscribe({
      next: () => {
        this.loading = false;
        // Navigation is handled inside authService.googleLogin()
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Google authentication failed. Please try again.';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
      }
    });
  }
}