import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let mockAuthService: { getToken: jest.Mock };

  beforeEach(() => {
    mockAuthService = { getToken: jest.fn().mockReturnValue(null) };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should not add Authorization header when no token exists', () => {
    // Given
    mockAuthService.getToken.mockReturnValue(null);

    // When
    httpClient.get('/api/test').subscribe();

    // Then
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should add Bearer token to Authorization header when token exists', () => {
    // Given
    mockAuthService.getToken.mockReturnValue('my-jwt-token');

    // When
    httpClient.get('/api/test').subscribe();

    // Then
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-jwt-token');
    req.flush({});
  });
});
