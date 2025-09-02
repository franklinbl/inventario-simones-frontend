import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, tap, map, catchError, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface LoginResponse {
  accessToken: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

interface UserLogin {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated = signal<boolean>(false);
  private readonly API_URL = environment.apiUrl;

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    // Verificar si hay un token guardado al iniciar
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.isAuthenticated.set(true);
    }
  }

  login(user: UserLogin): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.API_URL}/auth/login`,
      user,
      { withCredentials: true }
    ).pipe(
      tap({
        next: (response) => {
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.isAuthenticated.set(true);
        },
        error: () => {
          this.isAuthenticated.set(false);
        }
      }),
      catchError((error) => {
        this.isAuthenticated.set(false);
        return throwError(() => error.error);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    this.isAuthenticated.set(false);

    this.http.post(`${this.API_URL}/auth/logout`, {}, { withCredentials: true })
      .subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: () => {
          // aunque falle, igual navegamos
          this.router.navigate(['/login']);
        }
      });
  }

  isAuthenticated$(): Observable<boolean> {
    return of(this.isAuthenticated());
  }

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // auth.service.ts
  refreshToken() {
    return this.http.post<{ accessToken: string }>(
      `${this.API_URL}/auth/refreshToken`,
      {},
      { withCredentials: true }  // importante para que envíe la cookie
    );
  }
}