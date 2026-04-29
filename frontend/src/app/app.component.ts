import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isAuthenticated = this.authService.isAuthenticated;
  isAdmin = this.authService.isAdmin;
  user = this.authService.user;

  /** Controls mobile menu visibility. */
  mobileMenuOpen = signal(false);

  /** Toggles the mobile navigation menu. */
  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  /** Closes the mobile menu (used on link click). */
  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  /** Logs out the user and navigates to login. */
  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
    this.router.navigate(['/login']);
  }
}
