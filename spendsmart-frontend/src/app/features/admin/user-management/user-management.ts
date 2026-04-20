import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface AdminUserView {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  active: boolean;
}

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

  private readonly reportEndpoints = {
    csv: `${environment.apiUrl}/reports/export/csv`,
    pdf: `${environment.apiUrl}/reports/export/pdf`
  };

  constructor(private http: HttpClient) {}

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
    this.http.get<AdminUserView[]>(`${environment.apiUrl}/auth/admin/users`).subscribe({
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
      ? `${environment.apiUrl}/auth/admin/users/${user.userId}/reactivate`
      : `${environment.apiUrl}/auth/admin/users/${user.userId}/suspend`;

    this.http.put(endpoint, {})
      .subscribe({
        error: () => {
          user.active = previous;
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
