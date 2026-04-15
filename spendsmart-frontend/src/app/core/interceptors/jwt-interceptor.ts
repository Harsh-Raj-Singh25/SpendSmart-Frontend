import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

// HttpInterceptor sits in the middle of every HTTP request/response cycle
// It intercepts outgoing requests to add the token, and incoming responses to handle errors
@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    if (token) {
      // HttpRequest is immutable — .clone() creates a modified copy
      // We add the Authorization header to every request that goes out
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }

    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        // 401 Unauthorized = token missing or invalid
        // 403 Forbidden = token valid but user lacks permission
        // In both cases, clear local state and send user back to login
        if (err.status === 401 || err.status === 403) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
        // Re-throw the error so individual components can still handle it if needed
        return throwError(() => err);
      })
    );
  }
}