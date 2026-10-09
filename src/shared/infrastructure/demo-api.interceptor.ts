import {
  HttpBackend,
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  catchError,
  filter,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  throwError,
} from 'rxjs';
import { environment } from '../../environments/environment';

/** Record stored by the demonstration API; every resource has an `id`. */
type DemoRecord = Record<string, unknown> & { id: number | string };

/** Collections already loaded from the fixtures, kept for the browser session. */
const collections = new Map<string, Observable<DemoRecord[] | null>>();

/**
 * Demonstration API that runs inside the browser.
 *
 * When `environment.demoApiEnabled` is true, requests to `environment.hosteraApiUrl` are
 * answered from the `server/data` fixtures, published as `demo-data/<resource>.json`,
 * instead of the network. It follows the JSON Server conventions used by the gateways:
 * equality filters, `_sort`, `_order` and `_limit` on collections, and `GET`, `POST`,
 * `PUT`, `PATCH` and `DELETE` by id. Changes live in memory until the page is reloaded.
 *
 * It lets the SPA deployed on GitHub Pages show data before the Spring Boot RESTful API
 * is deployed. Set `demoApiEnabled` to false to send the requests to `hosteraApiUrl`.
 */
export const demoApiInterceptor: HttpInterceptorFn = (request, next) => {
  const baseUrl = environment.hosteraApiUrl;
  if (!environment.demoApiEnabled || !request.url.startsWith(baseUrl))
    return next(request);

  const [resource, id] = request.url
    .slice(baseUrl.length)
    .split('?')[0]
    .split('/')
    .filter(Boolean);
  if (!resource) return notFound(request);

  return loadCollection(resource, inject(HttpBackend)).pipe(
    switchMap((records) =>
      records ? handle(request, records, id) : notFound(request),
    ),
  );
};

/**
 * Loads the fixture of a resource once per session.
 * @param resource - Plural kebab-case resource name, such as `bookings`.
 * @param backend - HTTP backend, which bypasses the interceptors.
 * @returns The collection, or null when the resource has no fixture.
 */
function loadCollection(
  resource: string,
  backend: HttpBackend,
): Observable<DemoRecord[] | null> {
  let collection = collections.get(resource);
  if (!collection) {
    const url = new URL(`demo-data/${resource}.json`, document.baseURI).href;
    collection = backend.handle(new HttpRequest('GET', url)).pipe(
      filter((event) => event instanceof HttpResponse),
      map((response) => {
        const body = response.body as Record<string, DemoRecord[]> | null;
        return body?.[resource] ?? null;
      }),
      catchError(() => of(null)),
      shareReplay(1),
    );
    collections.set(resource, collection);
  }
  return collection;
}

/**
 * Applies a request to an in-memory collection.
 * @param request - Intercepted request.
 * @param records - Collection of the requested resource.
 * @param id - Resource id from the URL, if any.
 * @returns The JSON Server style response.
 */
function handle(
  request: HttpRequest<unknown>,
  records: DemoRecord[],
  id?: string,
): Observable<HttpEvent<unknown>> {
  const index = id ? records.findIndex((item) => String(item.id) === id) : -1;
  const body = request.body as Partial<DemoRecord> | null;

  switch (request.method) {
    case 'GET':
      if (!id) return ok(request, query(records, request));
      return index < 0 ? notFound(request) : ok(request, records[index]);
    case 'POST': {
      const created = {
        ...body,
        id: body?.id ?? nextId(records),
      } as DemoRecord;
      records.push(created);
      return ok(request, created, 201);
    }
    case 'PUT':
    case 'PATCH': {
      if (index < 0) return notFound(request);
      const base = request.method === 'PATCH' ? records[index] : {};
      records[index] = {
        ...base,
        ...body,
        id: records[index].id,
      } as DemoRecord;
      return ok(request, records[index]);
    }
    case 'DELETE':
      if (index < 0) return notFound(request);
      records.splice(index, 1);
      return ok(request, {});
    default:
      return notFound(request);
  }
}

/**
 * Filters, sorts and limits a collection with the JSON Server query parameters.
 * Repeated parameters match any of their values, as in JSON Server.
 */
function query(
  records: DemoRecord[],
  request: HttpRequest<unknown>,
): DemoRecord[] {
  const params = request.params;
  let result = records.filter((item) =>
    params
      .keys()
      .filter((key) => !key.startsWith('_'))
      .every((key) =>
        (params.getAll(key) ?? []).includes(String(item[key] ?? '')),
      ),
  );
  const sortKey = params.get('_sort');
  if (sortKey) {
    const direction = params.get('_order') === 'desc' ? -1 : 1;
    result = [...result].sort(
      (a, b) =>
        direction *
        String(a[sortKey] ?? '').localeCompare(
          String(b[sortKey] ?? ''),
          undefined,
          { numeric: true },
        ),
    );
  }
  const limit = Number(params.get('_limit'));
  return limit > 0 ? result.slice(0, limit) : result;
}

/** @returns The next numeric id of a collection. */
function nextId(records: DemoRecord[]): number {
  return (
    records.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
  );
}

function ok(
  request: HttpRequest<unknown>,
  body: unknown,
  status = 200,
): Observable<HttpEvent<unknown>> {
  return of(
    new HttpResponse({ status, body: structuredClone(body), url: request.url }),
  );
}

function notFound(request: HttpRequest<unknown>): Observable<never> {
  return throwError(
    () =>
      new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
        url: request.url,
      }),
  );
}
