import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Query parameters accepted by a collection request, such as `{ propertyId: 1 }`.
 */
export type QueryParams = Record<
  string,
  string | number | boolean | ReadonlyArray<string | number | boolean>
>;

/**
 * Reusable endpoint client with CRUD operations over a resource collection.
 * Every request observes the full HTTP response, so assemblers can check its status
 * as they did with Axios in the Vue version.
 *
 * @typeParam TResource - Shape of the resource exchanged with the API.
 */
export class BaseEndpoint<TResource extends object = Record<string, unknown>> {
  /**
   * @param http - Angular HTTP client.
   * @param endpointUrl - Absolute URL of the resource collection.
   */
  constructor(
    private readonly http: HttpClient,
    readonly endpointUrl: string,
  ) {}

  /**
   * @param params - Query parameters used to filter the collection.
   * @returns HTTP response with the resource collection.
   */
  getAll(params: QueryParams = {}): Observable<HttpResponse<TResource[]>> {
    return this.http.get<TResource[]>(this.endpointUrl, {
      params: new HttpParams({ fromObject: params }),
      observe: 'response',
    });
  }

  /**
   * @param id - Resource identifier.
   * @returns HTTP response with one resource.
   */
  getById(id: string | number): Observable<HttpResponse<TResource>> {
    return this.http.get<TResource>(`${this.endpointUrl}/${id}`, {
      observe: 'response',
    });
  }

  /**
   * @param resource - Resource payload to create.
   * @returns HTTP response with the created resource.
   */
  create(resource: object): Observable<HttpResponse<TResource>> {
    return this.http.post<TResource>(this.endpointUrl, resource, {
      observe: 'response',
    });
  }

  /**
   * @param id - Resource identifier.
   * @param resource - Resource payload to update.
   * @returns HTTP response with the updated resource.
   */
  update(
    id: string | number,
    resource: object,
  ): Observable<HttpResponse<TResource>> {
    return this.http.put<TResource>(`${this.endpointUrl}/${id}`, resource, {
      observe: 'response',
    });
  }

  /**
   * @param id - Resource identifier.
   * @returns HTTP response for the delete operation.
   */
  delete(id: string | number): Observable<HttpResponse<unknown>> {
    return this.http.delete(`${this.endpointUrl}/${id}`, {
      observe: 'response',
    });
  }
}
