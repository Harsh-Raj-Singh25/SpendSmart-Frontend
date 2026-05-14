import { Component, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationService } from '../../../core/services/notification.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent {
  isLoggedIn = computed(() => !!this.authService.getCurrentUser());
  showProfileDropdown = false;
  currentRoute = '';

  constructor(
    public authService: AuthService,
    public notificationService: NotificationService,
    public themeService: ThemeService,
    private router: Router
  ) {
    // Track current route for conditional navbar rendering
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(event => {
      this.currentRoute = event.urlAfterRedirects || event.url;
      this.showProfileDropdown = false; // close dropdown on route change
    });

    const user = this.authService.getCurrentUser();
    if (user?.userId) {
      this.notificationService.loadNotifications(user.userId);
    }
  }

  /**
   * Check if user is on an auth page (login, register, forgot-password).
   * On these pages, we hide dashboard/transaction/premium links.
   */
  isAuthPage(): boolean {
    return ['/login', '/register', '/forgot-password'].some(p => this.currentRoute.startsWith(p));
  }

  /**
   * Check if user is on the landing page.
   */
  isLandingPage(): boolean {
    return this.currentRoute === '/';
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (this.currentRoute !== '/') {
      this.router.navigate(['/']).then(() => {
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      });
    }
  }

  /**
   * Show full nav links only when logged in AND not on auth pages.
   */
  showAppLinks(): boolean {
    return this.isLoggedIn() && !this.isAuthPage();
  }

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return (user?.role || '').toUpperCase() === 'ADMIN';
  }

  isDarkMode() {
    return this.themeService.isDarkMode();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleProfileDropdown() {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  goToProfile() {
    this.showProfileDropdown = false;
    this.router.navigate(['/profile']);
  }

  getUserName(): string {
    const user = this.authService.getCurrentUser();
    return user?.fullName || 'User';
  }

  getUserEmail(): string {
    const user = this.authService.getCurrentUser();
    return user?.email || '';
  }

  getUserInitial(): string {
    const name = this.getUserName();
    return name.charAt(0).toUpperCase();
  }

  logout() {
    this.showProfileDropdown = false;
    this.authService.logout();
  }
}
