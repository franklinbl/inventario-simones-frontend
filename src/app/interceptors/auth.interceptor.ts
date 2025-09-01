// auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../shared/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const accessToken = localStorage.getItem('accessToken');

  const cloned = accessToken
    ? req.clone({
        headers: req.headers.set('Authorization', `Bearer ${accessToken}`)
      })
    : req;

  return next(cloned).pipe(
    catchError(error => {
      if (error.status === 401 || error.error?.message === 'Token invalido') {
        // intentar refrescar token
        return authService.refreshToken().pipe(
          switchMap((res: any) => {
            // guardar nuevo accessToken
            localStorage.setItem('accessToken', res.accessToken);

            // repetir la request original con nuevo token
            const retryReq = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${res.accessToken}`)
            });
            return next(retryReq);
          }),
          catchError(err => {
            // si el refresh falla => logout
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => err);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
