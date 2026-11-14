import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BaseApiService } from '../../shared/infrastructure/base-api.service';

/** Body of POST /users and POST /tokens of the Hostera RESTful API. */
export interface CredentialsResource {
  username: string;
  password: string;
}

/** Response of POST /users: the registered user and its roles. */
export interface UserResource {
  id: number;
  username: string;
  roles: string[];
}

/** Response of POST /tokens: the signed-in user and its JWT bearer token. */
export interface AuthenticatedUserResource {
  id: number;
  username: string;
  token: string;
}

/**
 * Client of the IAM endpoints of the Hostera RESTful API: sign-up creates the user and
 * sign-in returns the JWT that the bearer interceptor sends with every later request.
 */
@Injectable({ providedIn: 'root' })
export class AuthenticationApiService extends BaseApiService {
  signUp(credentials: CredentialsResource): Observable<UserResource> {
    return this.http.post<UserResource>(
      `${this.baseUrl}${environment.usersEndpointPath}`,
      credentials,
    );
  }

  signIn(
    credentials: CredentialsResource,
  ): Observable<AuthenticatedUserResource> {
    return this.http.post<AuthenticatedUserResource>(
      `${this.baseUrl}${environment.tokensEndpointPath}`,
      credentials,
    );
  }
}
