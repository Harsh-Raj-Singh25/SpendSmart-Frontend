import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth';
import { ModalService } from '../../../shared/services/modal.service';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  loading = false;
  saving = false;
  userId: number | null = null;

  readonly currencies = ['INR', 'USD', 'EUR', 'GBP'];
  readonly timezones = [
    'Asia/Kolkata',
    'UTC',
    'Europe/London',
    'America/New_York',
    'Asia/Singapore'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private modalService: ModalService
  ) {
    this.profileForm = this.fb.group({
      fullName: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      avatarUrl: [''],
      bio: [''],
      timezone: ['Asia/Kolkata', Validators.required],
      currency: ['INR', Validators.required]
    });
  }

  ngOnInit(): void {
    const current = this.authService.getCurrentUser();
    if (!current?.userId) {
      return;
    }

    this.userId = current.userId;
    this.profileForm.patchValue({
      fullName: current.fullName,
      email: current.email
    });

    this.loadProfile();
  }

  loadProfile(): void {
    if (!this.userId) return;

    this.loading = true;
    this.authService.getProfile(this.userId).subscribe({
      next: (profile) => {
        this.profileForm.patchValue({
          fullName: profile.fullName || '',
          email: profile.email || '',
          avatarUrl: profile.avatarUrl || '',
          bio: profile.bio || '',
          timezone: profile.timezone || 'Asia/Kolkata',
          currency: profile.currency || 'INR'
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load profile', 'Close', { duration: 3000 });
      }
    });
  }

  saveProfile(): void {
    if (!this.userId || this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const value = this.profileForm.getRawValue();

    this.authService.updateProfile(this.userId, {
      fullName: value.fullName,
      avatarUrl: value.avatarUrl,
      bio: value.bio,
      timezone: value.timezone
    }).subscribe({
      next: () => {
        this.authService.updateCurrency(this.userId!, value.currency).subscribe({
          next: () => {
            this.saving = false;
            const current = this.authService.getCurrentUser();
            if (current) {
              localStorage.setItem('auth', JSON.stringify({
                ...current,
                fullName: value.fullName,
                email: value.email
              }));
            }
            this.snackBar.open('Profile updated', 'Close', { duration: 2500 });
          },
          error: () => {
            this.saving = false;
            this.snackBar.open('Profile saved but currency update failed', 'Close', { duration: 3000 });
          }
        });
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(err.error?.message || 'Failed to update profile', 'Close', { duration: 3000 });
      }
    });
  }

  deactivateAccount(): void {
    if (!this.userId) return;

    this.modalService.confirm({
      title: 'Deactivate Account',
      message: 'Deactivate your account? You will be logged out.',
      confirmText: 'Deactivate',
      cancelText: 'Cancel',
      confirmClass: 'warning'
    }).then(confirmed => {
      if (!confirmed) return;

      this.authService.deactivateAccount(this.userId!).subscribe({
        next: () => {
          this.snackBar.open('Account deactivated', 'Close', { duration: 2500 });
          this.authService.logout();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Could not deactivate account', 'Close', { duration: 3000 });
        }
      });
    });
  }
}
