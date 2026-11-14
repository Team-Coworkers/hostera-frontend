import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../environments/environment';
import { SessionStore } from '../application/session.store';
import { bearerTokenInterceptor } from './bearer-token.interceptor';

describe('bearerTokenInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem('hostera.session');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([bearerTokenInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    TestBed.inject(SessionStore).start({
      userId: 1,
      username: 'demo@hostera.pe',
      token: 'jwt',
    });
  });

  afterEach(() => controller.verify());

  it('sends the bearer token to the Hostera API', () => {
    http.get(`${environment.hosteraApiUrl}/properties`).subscribe();
    const request = controller.expectOne(
      `${environment.hosteraApiUrl}/properties`,
    );
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt');
    request.flush([]);
  });

  it('does not send the token to third-party APIs', () => {
    http.get('https://date.nager.at/api/v3/PublicHolidays/2026/PE').subscribe();
    const request = controller.expectOne(
      'https://date.nager.at/api/v3/PublicHolidays/2026/PE',
    );
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush([]);
  });
});
