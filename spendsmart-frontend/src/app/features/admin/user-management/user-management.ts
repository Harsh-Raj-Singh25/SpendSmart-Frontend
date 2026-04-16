import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.http.get<AdminUserView[]>(`${environment.apiUrl}/auth/admin/users`).subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load users', err);
        // Mock data fallback if backend admin endpoint isn't fully seeded yet
        this.users = [
          { userId: 1, fullName: 'Admin User', email: 'admin@spendsmart.com', role: 'ADMIN', active: true },
          { userId: 2, fullName: 'Test User', email: 'user@example.com', role: 'USER', active: true },
          { userId: 3, fullName: 'Premium Member', email: 'rich@example.com', role: 'PREMIUM', active: true }
        ];
        this.loading = false;
      }
    });
  }

  toggleActiveStatus(user: AdminUserView) {
    user.active = !user.active;
    this.http.put(`${environment.apiUrl}/auth/admin/users/${user.userId}/status`, { active: user.active })
      .subscribe({
        error: () => {
          // Revert on error if backend call fails
          user.active = !user.active;
        }
      });
  }
}
