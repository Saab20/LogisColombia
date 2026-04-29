import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';
import { User } from './core/models/auth.model';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockAuthService: {
    isAuthenticated: ReturnType<typeof signal>;
    isAdmin: ReturnType<typeof signal>;
    user: ReturnType<typeof signal>;
    logout: jest.Mock;
  };
  let router: Router;

  beforeEach(async () => {
    mockAuthService = {
      isAuthenticated: signal(false),
      isAdmin: signal(false),
      user: signal<User | null>(null),
      logout: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create the app component', () => {
    expect(component).toBeTruthy();
  });

  describe('mobileMenuOpen', () => {
    it('should start with mobile menu closed', () => {
      expect(component.mobileMenuOpen()).toBe(false);
    });

    it('should toggle mobile menu open and closed', () => {
      // When
      component.toggleMobileMenu();
      expect(component.mobileMenuOpen()).toBe(true);

      // When
      component.toggleMobileMenu();
      expect(component.mobileMenuOpen()).toBe(false);
    });

    it('should close mobile menu explicitly', () => {
      // Given
      component.toggleMobileMenu();
      expect(component.mobileMenuOpen()).toBe(true);

      // When
      component.closeMobileMenu();

      // Then
      expect(component.mobileMenuOpen()).toBe(false);
    });
  });

  describe('logout', () => {
    it('should call authService.logout and navigate to /login', () => {
      // Given
      const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

      // When
      component.logout();

      // Then
      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });

    it('should close mobile menu on logout', () => {
      // Given
      jest.spyOn(router, 'navigate').mockResolvedValue(true);
      component.toggleMobileMenu();
      expect(component.mobileMenuOpen()).toBe(true);

      // When
      component.logout();

      // Then
      expect(component.mobileMenuOpen()).toBe(false);
    });
  });

  describe('authentication state', () => {
    it('should reflect authenticated state from AuthService', () => {
      // Given
      mockAuthService.isAuthenticated.set(true);
      mockAuthService.isAdmin.set(true);
      mockAuthService.user.set({ id: '1', username: 'admin', role: 'ADMIN' });

      // Then
      expect(component.isAuthenticated()).toBe(true);
      expect(component.isAdmin()).toBe(true);
      expect(component.user()?.username).toBe('admin');
    });

    it('should reflect unauthenticated state', () => {
      expect(component.isAuthenticated()).toBe(false);
      expect(component.isAdmin()).toBe(false);
      expect(component.user()).toBeNull();
    });
  });
});
