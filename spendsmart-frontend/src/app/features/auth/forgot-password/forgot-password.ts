import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss']
})
export class ForgotPasswordComponent {
  emailForm: FormGroup;
  otpForm: FormGroup;
  
  step: 'EMAIL' | 'OTP' = 'EMAIL';
  loading = false;
  emailSentTo = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
    
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  requestOtp() {
    if (this.emailForm.invalid) return;
    this.loading = true;
    const email = this.emailForm.value.email;
    
    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.loading = false;
        this.step = 'OTP';
        this.emailSentTo = email;
        this.snackBar.open('OTP sent to your email', 'Close', { duration: 3000 });
        this.cdr.detectChanges(); // Force view update safely
      },
      error: (err) => {
        this.loading = false;
        let errorMessage = 'Failed to send OTP';
        if (err.error && typeof err.error === 'string') {
          errorMessage = err.error;
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        this.cdr.detectChanges(); // Force view update safely
      }
    });
  }

  resetPassword() {
    if (this.otpForm.invalid) return;
    this.loading = true;
    
    const data = {
      email: this.emailSentTo,
      otp: this.otpForm.value.otp,
      newPassword: this.otpForm.value.newPassword
    };

    this.authService.resetPassword(data).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Password reset successfully. Please login.', 'Close', { duration: 3000 });
        this.cdr.detectChanges(); // Force view update safely
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        let errorMessage = 'Failed to reset password';
        if (err.error && typeof err.error === 'string') {
          errorMessage = err.error;
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        this.cdr.detectChanges(); // Force view update safely
      }
    });
  }
}
