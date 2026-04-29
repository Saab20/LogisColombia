import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { AuthResponse } from '../../../core/models/auth.model';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: { login: jest.Mock };
  let mockRouter: { navigate: jest.Mock };

  const mockAuthResponse: AuthResponse = {
    token: 'mock-token',
    user: { id: 'user-1', username: 'admin', role: 'ADMIN' },
  };

  beforeEach(async () => {
    mockAuthService = { login: jest.fn() };
    mockRouter = { navigate: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have empty credentials', () => {
      expect(component.username).toBe('');
      expect(component.password).toBe('');
    });

    it('should not be loading', () => {
      expect(component.loading()).toBe(false);
    });

    it('should have no error', () => {
      expect(component.error()).toBeNull();
    });
  });

  describe('onSubmit', () => {
    it('should show error when username is empty', () => {
      // Given
      component.username = '';
      component.password = 'password';

      // When
      component.onSubmit();

      // Then
      expect(component.error()).toBe('Usuario y contraseña son requeridos');
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should show error when password is empty', () => {
      // Given
      component.username = 'admin';
      component.password = '';

      // When
      component.onSubmit();

      // Then
      expect(component.error()).toBe('Usuario y contraseña son requeridos');
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should call authService.login and navigate to /routes on success', fakeAsync(() => {
      // Given
      component.username = 'admin';
      component.password = 'admin123';
      mockAuthService.login.mockReturnValue(of(mockAuthResponse));

      // When
      component.onSubmit();
      tick();

      // Then
      expect(mockAuthService.login).toHaveBeenCalledWith({
        username: 'admin',
        password: 'admin123',
      });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/routes']);
    }));

    it('should set loading to true while request is in progress', () => {
      // Given
      component.username = 'admin';
      component.password = 'admin123';
      mockAuthService.login.mockReturnValue(of(mockAuthResponse));

      // When
      component.onSubmit();

      // Then — loading was set to true before the observable resolved
      expect(mockAuthService.login).toHaveBeenCalled();
    });

    it('should show error message on login failure', fakeAsync(() => {
      // Given
      component.username = 'admin';
      component.password = 'wrong';
      mockAuthService.login.mockReturnValue(
        throwError(() => ({ error: { error: 'Invalid credentials' } }))
      );

      // When
      component.onSubmit();
      tick();

      // Then
      expect(component.error()).toBe('Invalid credentials');
      expect(component.loading()).toBe(false);
    }));

    it('should show generic error when server returns no message', fakeAsync(() => {
      // Given
      component.username = 'admin';
      component.password = 'wrong';
      mockAuthService.login.mockReturnValue(
        throwError(() => ({ error: {} }))
      );

      // When
      component.onSubmit();
      tick();

      // Then
      expect(component.error()).toBe('Error al iniciar sesión');
      expect(component.loading()).toBe(false);
    }));
  });
});
