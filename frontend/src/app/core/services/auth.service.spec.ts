import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { AuthResponse } from '../models/auth.model';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockAuthResponse: AuthResponse = {
    token: 'mock-jwt-token',
    user: { id: 'user-1', username: 'admin', role: 'ADMIN' },
  };

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  describe('login', () => {
    it('should send POST to /auth/login and store session', () => {
      // Given
      const credentials = { username: 'admin', password: 'admin123' };

      // When
      service.login(credentials).subscribe((response) => {
        // Then
        expect(response).toEqual(mockAuthResponse);
        expect(service.isAuthenticated()).toBe(true);
        expect(service.isAdmin()).toBe(true);
        expect(service.user()?.username).toBe('admin');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockAuthResponse);
    });

    it('should store token in sessionStorage after login', () => {
      // Given
      const credentials = { username: 'admin', password: 'admin123' };

      // When
      service.login(credentials).subscribe();
      httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(mockAuthResponse);

      // Then
      expect(service.getToken()).toBe('mock-jwt-token');
    });
  });

  describe('logout', () => {
    it('should clear session and reset user state', () => {
      // Given — login first
      service.login({ username: 'admin', password: 'admin123' }).subscribe();
      httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(mockAuthResponse);
      expect(service.isAuthenticated()).toBe(true);

      // When
      service.logout();

      // Then
      expect(service.isAuthenticated()).toBe(false);
      expect(service.isAdmin()).toBe(false);
      expect(service.user()).toBeNull();
      expect(service.getToken()).toBeNull();
    });
  });

  describe('getToken', () => {
    it('should return null when no token is stored', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should return the stored token after login', () => {
      // Given
      service.login({ username: 'admin', password: 'admin123' }).subscribe();
      httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(mockAuthResponse);

      // Then
      expect(service.getToken()).toBe('mock-jwt-token');
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no user is logged in', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return true after successful login', () => {
      // Given
      service.login({ username: 'admin', password: 'admin123' }).subscribe();
      httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(mockAuthResponse);

      // Then
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('isAdmin', () => {
    it('should return false for OPERADOR role', () => {
      // Given
      const operadorResponse: AuthResponse = {
        token: 'token',
        user: { id: 'user-2', username: 'operador', role: 'OPERADOR' },
      };

      service.login({ username: 'operador', password: 'operador123' }).subscribe();
      httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(operadorResponse);

      // Then
      expect(service.isAdmin()).toBe(false);
    });

    it('should return true for ADMIN role', () => {
      // Given
      service.login({ username: 'admin', password: 'admin123' }).subscribe();
      httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(mockAuthResponse);

      // Then
      expect(service.isAdmin()).toBe(true);
    });
  });

  describe('session persistence', () => {
    it('should load user from sessionStorage on init', () => {
      // Given — simulate stored session
      sessionStorage.setItem('trackroute_token', 'stored-token');
      sessionStorage.setItem(
        'trackroute_user',
        JSON.stringify({ id: 'user-1', username: 'admin', role: 'ADMIN' })
      );

      // When — create a new service instance
      const freshService = TestBed.inject(AuthService);

      // Then
      expect(freshService.getToken()).toBe('stored-token');
    });
  });
});
