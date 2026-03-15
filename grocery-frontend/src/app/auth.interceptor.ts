import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isBrowser = typeof window !== 'undefined';

  if (isBrowser) {
    const token = localStorage.getItem('authToken');

    // If the request is going to Google Sheets, DO NOT attach the token!
    // Just send the request exactly as it is.
    if (req.url.includes('script.google.com')) {
      return next(req);
    }

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

  // If no token, just send the request normally
  return next(req);
};
