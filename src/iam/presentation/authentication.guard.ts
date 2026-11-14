import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { SessionStore } from '../application/session.store';

/**
 * Keeps the workspace behind sign-in once the frontend uses the RESTful API. With the
 * demonstration API (authenticationEnabled false) every route stays open.
 */
export const authenticationGuard: CanActivateFn = () => {
  if (!environment.authenticationEnabled) return true;
  return inject(SessionStore).isAuthenticated()
    ? true
    : inject(Router).parseUrl('/sign-in');
};
