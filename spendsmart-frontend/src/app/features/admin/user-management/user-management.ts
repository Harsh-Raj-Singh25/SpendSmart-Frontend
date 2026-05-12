import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AdminCreateUserRequest, AdminService, AdminUserView } from '../../../core/services/admin.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-user-management',
  standalone: false,
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.scss']
})
export class UserManagementComponent implements OnInit {
  users: AdminUserView[] = [];
  loading = true;
  reportingAvailable = false;
  submitting = false;

  newUser: AdminCreateUserRequest = {
    fullName: '',
    email: '',
    password: ''
  };

  private readonly reportEndpoints = {
    csv: `${environment.apiUrl}/reports/export/csv`,
    pdf: `${environment.apiUrl}/reports/export/pdf`
  };

  constructor(
    private adminService: AdminService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.detectReportingAvailability();
  }

  detectReportingAvailability() {
    // Keep report actions hidden unless concrete export endpoints are reachable.
    this.http.get(this.reportEndpoints.csv, { observe: 'response', responseType: 'blob' }).pipe(
      catchError(() => of(null))
    ).subscribe(resp => {
      this.reportingAvailable = !!resp;
    });
  }

  loadUsers() {
    this.adminService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.users = [];
        this.loading = false;
      }
    });
  }

  toggleActiveStatus(user: AdminUserView) {
    const previous = user.active;
    user.active = !user.active;

    const endpoint = user.active
      ? this.adminService.reactivateUser(user.userId)
      : this.adminService.suspendUser(user.userId);

    endpoint.subscribe({
      error: () => {
        user.active = previous;
      }
    });
  }

  togglePremium(user: AdminUserView) {
    const isPremium = (user.subscriptionType || '').toUpperCase() === 'PREMIUM';
    const request$ = isPremium
      ? this.adminService.revokePremium(user.userId)
      : this.adminService.grantPremium(user.userId);

    request$.subscribe({
      next: () => {
        user.subscriptionType = isPremium ? 'FREE' : 'PREMIUM';
      }
    });
  }

  deleteUser(user: AdminUserView) {
    const confirmed = window.confirm(`Delete user ${user.email}? This cannot be undone.`);
    if (!confirmed) return;

    this.adminService.deleteUser(user.userId).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.userId !== user.userId);
      }
    });
  }

  createUser() {
    if (!this.newUser.fullName.trim() || !this.newUser.email.trim() || !this.newUser.password.trim()) {
      return;
    }

    this.submitting = true;
    this.adminService.createUser(this.newUser).subscribe({
      next: (user) => {
        this.users = [user, ...this.users];
        this.newUser = { fullName: '', email: '', password: '' };
        this.submitting = false;
      },
      error: () => {
        this.submitting = false;
      }
    });
  }

  exportCsv() {
    if (!this.reportingAvailable) return;
    window.open(this.reportEndpoints.csv, '_blank');
  }

  exportPdf() {
    if (!this.reportingAvailable) return;
    window.open(this.reportEndpoints.pdf, '_blank');
  }
}
