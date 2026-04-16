import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDarkMode = signal<boolean>(false);

  constructor() {
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.setDarkTheme();
    } else if (savedTheme === 'light') {
      this.setLightTheme();
    } else {
      // Check system preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        this.setDarkTheme();
      } else {
        // We'll default to light if not explicitly dark, though modern usually prefers dark.
        // Let's set it based on media match.
        this.setLightTheme();
      }
    }
  }

  toggleTheme() {
    if (this.isDarkMode()) {
      this.setLightTheme();
    } else {
      this.setDarkTheme();
    }
  }

  setDarkTheme() {
    document.documentElement.setAttribute('theme', 'dark');
    this.isDarkMode.set(true);
    localStorage.setItem('theme', 'dark');
  }

  setLightTheme() {
    document.documentElement.removeAttribute('theme');
    this.isDarkMode.set(false);
    localStorage.setItem('theme', 'light');
  }
}
