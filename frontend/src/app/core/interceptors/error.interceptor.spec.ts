import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { Router } from '@angular/router';
import { errorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth.service';

describe('errorInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let mockAuthService: { logout: jest.Mock };
  let mockRouter: { navigate: jest.Mock };

  beforeEach(() => {
    mockAuthService = { logout: jest.fn() };
    mockRouter = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should logout and redirect to /login on 401 error', () => {
    // When
    httpClient.get('/api/test').subscribe({
      error: (err: HttpErrorResponse) => {
        // Then
        expect(err.status).toBe(401);
        expect(mockAuthService.logout).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      },
    });

    httpMock.expectOne('/api/test').flush(
      { error: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' }
    );
  });

  it('should log error on 500 server error', () => {
    // Given
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    // When
    httpClient.get('/api/test').subscribe({
      error: (err: HttpErrorResponse) => {
        // Then
        expect(err.status).toBe(500);
        expect(consoleSpy).toHaveBeenCalled();
      },
    });

    httpMock.expectOne('/api/test').flush(
      { error: 'Internal server error' },
      { status: 500, statusText: 'Internal Server Error' }
    );

    consoleSpy.mockRestore();
  });

  it('should not logout on non-401 client errors', () => {
    // When
    httpClient.get('/api/test').subscribe({
      error: (err: HttpErrorResponse) => {
        // Then
        expect(err.status).toBe(404);
        expect(mockAuthService.logout).not.toHaveBeenCalled();
      },
    });

    httpMock.expectOne('/api/test').flush(
      { error: 'Not found' },
      { status: 404, statusText: 'Not Found' }
    );
  });
});
