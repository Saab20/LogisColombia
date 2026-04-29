import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard, adminGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('Guards', () => {
  let mockAuthService: { isAuthenticated: jest.Mock; isAdmin: jest.Mock };
  let mockRouter: { navigate: jest.Mock };

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    mockAuthService = {
      isAuthenticated: jest.fn().mockReturnValue(false),
      isAdmin: jest.fn().mockReturnValue(false),
    };
    mockRouter = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  describe('authGuard', () => {
    it('should allow access when user is authenticated', () => {
      // Given
      mockAuthService.isAuthenticated.mockReturnValue(true);

      // When
      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

      // Then
      expect(result).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should redirect to /login when user is not authenticated', () => {
      // Given
      mockAuthService.isAuthenticated.mockReturnValue(false);

      // When
      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

      // Then
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('adminGuard', () => {
    it('should allow access when user is admin', () => {
      // Given
      mockAuthService.isAdmin.mockReturnValue(true);

      // When
      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));

      // Then
      expect(result).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should redirect to /routes when user is not admin', () => {
      // Given
      mockAuthService.isAdmin.mockReturnValue(false);

      // When
      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));

      // Then
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/routes']);
    });
  });
});
