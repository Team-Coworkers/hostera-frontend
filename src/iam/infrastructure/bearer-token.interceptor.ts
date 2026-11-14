import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { SessionStore } from '../application/session.store';

/**
 * Adds the JWT of the current session to the requests sent to the Hostera RESTful API,
 * and sends the user back to sign-in when the API rejects an expired or missing token.
 * Requests to other hosts, such as the Nager.Date holidays API, are left untouched.
 */
export const bearerTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionStore);
  const router = inject(Router);
  const toHosteraApi = request.url.startsWith(environment.hosteraApiUrl);
  const token = session.token();
  const authorized =
    toHosteraApi && token
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;
  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (
        toHosteraApi &&
        environment.authenticationEnabled &&
        error instanceof HttpErrorResponse &&
        error.status === 401
      ) {
        session.end();
        void router.navigateByUrl('/sign-in');
      }
      return throwError(() => error);
    }),
  );
};
