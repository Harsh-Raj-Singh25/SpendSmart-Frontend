import { Component, computed } from '@angular/core';
import { AuthService } from '../../../core/services/auth';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent {
  isLoggedIn = computed(() => !!this.authService.getCurrentUser());

  constructor(
    public authService: AuthService,
    public themeService: ThemeService
  ) {}

  isDarkMode() {
    return this.themeService.isDarkMode();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  logout() {
    this.authService.logout();
  }
}
