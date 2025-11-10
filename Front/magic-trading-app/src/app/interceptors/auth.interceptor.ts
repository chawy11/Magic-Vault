import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * HTTP Interceptor for authentication
 * Automatically adds JWT token to requests and handles auth errors
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  // Clone request and add Authorization header if token exists
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Handle the request and catch authentication errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle authentication errors
      if (error.status === 401 || error.status === 403) {
        // Clear stored credentials
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        localStorage.removeItem('userId');
        
        // Redirect to login
        router.navigate(['/login']);
      }
      
      // Re-throw the error
      return throwError(() => error);
    })
  );
};
