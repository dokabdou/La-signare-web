import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service'; // Adjust path if needed!
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Tell Angular to allow the browser to attach the HttpOnly cookies!
  req = req.clone({
    withCredentials: true,
  });

  // Send the request and listen for the Bouncer's response
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // If Java says "Unauthorized" (401) or "Forbidden" (403)
      if (error.status === 401 || error.status === 403) {
        console.warn('Security Token Expired or Invalid! Auto-logging out...');
        authService.logout(); // Triggers the logout process
      }
      return throwError(() => error);
    }),
  );
};
