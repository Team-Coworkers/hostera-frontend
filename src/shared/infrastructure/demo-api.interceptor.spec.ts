import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { demoApiInterceptor } from './demo-api.interceptor';

describe('demoApiInterceptor', () => {
  const api = environment.hosteraApiUrl;
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    environment.demoApiEnabled = true;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([demoApiInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    environment.demoApiEnabled = false;
    backend.verify();
  });

  /** Answers the fixture request of a resource, as the build's demo-data/ copy would. */
  const flushFixture = (resource: string, records: object[]) =>
    backend
      .expectOne((request) =>
        request.url.endsWith(`demo-data/${resource}.json`),
      )
      .flush({ [resource]: records });

  it('filters, sorts and limits a collection like JSON Server', async () => {
    const response = firstValueFrom(
      http.get<{ code: string }[]>(`${api}/bookings`, {
        params: { propertyId: 1, _sort: 'code', _order: 'desc', _limit: 1 },
      }),
    );
    flushFixture('bookings', [
      { id: 1, propertyId: 1, code: 'BKG-1001' },
      { id: 2, propertyId: 1, code: 'BKG-1070' },
      { id: 3, propertyId: 2, code: 'BKG-2001' },
    ]);

    expect(await response).toEqual([
      jasmine.objectContaining({ code: 'BKG-1070' }),
    ]);
  });

  it('creates, updates and deletes records in memory', async () => {
    const created = firstValueFrom(
      http.post<{ id: number }>(`${api}/rooms`, { number: '502' }),
    );
    flushFixture('rooms', [{ id: 7, number: '501' }]);
    expect((await created).id).toBe(8);

    const updated = await firstValueFrom(
      http.put<{ number: string }>(`${api}/rooms/8`, { number: '503' }),
    );
    expect(updated.number).toBe('503');

    await firstValueFrom(http.delete(`${api}/rooms/7`));
    const remaining = await firstValueFrom(http.get<object[]>(`${api}/rooms`));
    expect(remaining).toEqual([{ id: 8, number: '503' }]);
  });

  it('answers 404 for a missing record', async () => {
    const request = firstValueFrom(http.get(`${api}/payments/99`));
    flushFixture('payments', []);

    await expectAsync(request).toBeRejectedWith(
      jasmine.objectContaining<HttpErrorResponse>({ status: 404 }),
    );
  });

  it('lets other requests through to the network', () => {
    http.get('https://date.nager.at/api/v3/PublicHolidays/2026/PE').subscribe();
    backend
      .expectOne('https://date.nager.at/api/v3/PublicHolidays/2026/PE')
      .flush([]);
  });
});
