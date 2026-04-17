import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface Notification {
  notificationId: number;
  recipientId: number;
  type: string;
  severity: string;
  title: string;
  message: string;
  isRead: boolean;
  isAcknowledged: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/notifications`;

  unreadCount = signal<number>(0);
  notifications = signal<Notification[]>([]);

  /**
   * Get all notifications for a user.
   */
  getByRecipient(recipientId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.BASE}/recipient/${recipientId}`);
  }

  /**
   * Get unread notification count.
   */
  getUnreadCount(recipientId: number): Observable<number> {
    return this.http.get<number>(`${this.BASE}/recipient/${recipientId}/unread-count`);
  }

  /**
   * Mark a notification as read.
   */
  markAsRead(notificationId: number): Observable<void> {
    return this.http.patch<void>(`${this.BASE}/${notificationId}/read`, {});
  }

  /**
   * Mark all notifications as read.
   */
  markAllRead(recipientId: number): Observable<void> {
    return this.http.patch<void>(`${this.BASE}/recipient/${recipientId}/read-all`, {});
  }

  /**
   * Send budget alert notification.
   */
  sendBudgetAlert(recipientId: number, title: string, amount: number): Observable<void> {
    return this.http.post<void>(
      `${this.BASE}/budget-alert?recipientId=${recipientId}&title=${encodeURIComponent(title)}&amount=${amount}`,
      {}
    );
  }

  /**
   * Load notifications and unread count for a user.
   */
  loadNotifications(recipientId: number): void {
    this.getByRecipient(recipientId).subscribe({
      next: (notifs) => this.notifications.set(notifs),
      error: () => this.notifications.set([])
    });
    this.getUnreadCount(recipientId).subscribe({
      next: (count) => this.unreadCount.set(count),
      error: () => this.unreadCount.set(0)
    });
  }
}
