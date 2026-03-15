import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service'; // Adjust path if needed!
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isBrowser = typeof window !== 'undefined';
  const authService = inject(AuthService);

  // If the request is going to Google Sheets, DO NOT attach the token!
  // Just send the request exactly as it is.
  if (req.url.includes('script.google.com')) {
    return next(req);
  }

  if (isBrowser) {
    const token = localStorage.getItem('authToken');
    // Otherwise, if it's going to our Java backend, attach the VIP pass
    // If we have a token, clone the request and staple the token to the header
    if (token) {
      const clonedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      return next(clonedReq);
    }
  }

  // Send the request and listen for the Bouncer's response
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // If Java says "Unauthorized" (401) or "Forbidden" (403)
      if (error.status === 401 || error.status === 403) {
        console.warn('Security Token Expired! Auto-logging out...');
        authService.logout(); // Wipes the bad token!
      }
      return throwError(() => error);
    }),
  );
};
