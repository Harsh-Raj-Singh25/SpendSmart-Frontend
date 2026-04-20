import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth';
import { Notification, NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: false,
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.scss']
})
export class NotificationsComponent implements OnInit {
  userId: number | null = null;
  notifications: Notification[] = [];
  loading = false;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user?.userId) return;

    this.userId = user.userId;
    this.loadNotifications();
  }

  loadNotifications(): void {
    if (!this.userId) return;

    this.loading = true;
    this.notificationService.getByRecipient(this.userId).subscribe({
      next: (items) => {
        this.notifications = (items || []).sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.loading = false;
      },
      error: () => {
        this.notifications = [];
        this.loading = false;
      }
    });

    this.notificationService.getUnreadCount(this.userId).subscribe({
      next: (count) => this.notificationService.unreadCount.set(count),
      error: () => this.notificationService.unreadCount.set(0)
    });
  }

  markRead(item: Notification): void {
    this.notificationService.markAsRead(item.notificationId).subscribe({
      next: () => {
        item.isRead = true;
        if (this.userId) {
          this.notificationService.getUnreadCount(this.userId).subscribe({
            next: (count) => this.notificationService.unreadCount.set(count)
          });
        }
      }
    });
  }

  markAllRead(): void {
    if (!this.userId) return;
    this.notificationService.markAllRead(this.userId).subscribe({
      next: () => {
        this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
        this.notificationService.unreadCount.set(0);
      }
    });
  }

  acknowledge(item: Notification): void {
    this.notificationService.acknowledge(item.notificationId).subscribe({
      next: () => {
        item.isAcknowledged = true;
      }
    });
  }

  remove(item: Notification): void {
    this.notificationService.delete(item.notificationId).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.notificationId !== item.notificationId);
        this.snackBar.open('Notification removed', 'Close', { duration: 1800 });
      }
    });
  }
}
