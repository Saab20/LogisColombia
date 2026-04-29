import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, AuthResponse, User } from '../models/auth.model';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'trackroute_token';
const USER_KEY = 'trackroute_user';

/**
 * Authentication service.
 * Manages JWT token storage and user state using Angular signals.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(this.loadUser());
  private apiUrl = `${environment.apiUrl}/auth`;

  /** Reactive read-only user signal. */
  readonly user = this.currentUser.asReadonly();

  /** Whether the user is authenticated. */
  readonly isAuthenticated = computed(() => !!this.currentUser());

  /** Whether the user has ADMIN role. */
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  constructor(private http: HttpClient) {}

  /**
   * Authenticate user with credentials.
   * @param credentials Username and password
   * @returns Observable with auth response
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        this.storeSession(response);
      })
    );
  }

  /** Clear session and redirect to login. */
  logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  /** Get the stored JWT token. */
  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  /** Store token and user in sessionStorage. */
  private storeSession(response: AuthResponse): void {
    sessionStorage.setItem(TOKEN_KEY, response.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this.currentUser.set(response.user);
  }

  /** Load user from sessionStorage on init. */
  private loadUser(): User | null {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
