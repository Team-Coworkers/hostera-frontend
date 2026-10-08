import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { BaseEndpoint } from './base-endpoint';

/**
 * Shared infrastructure base class for the API gateways of each bounded context.
 * It owns the HTTP client configured for the Hostera API and creates endpoint clients
 * relative to its base URL. JSON is HttpClient's default content type.
 *
 * Subclasses are `@Injectable` services, so `inject()` runs in an injection context.
 */
export abstract class BaseApiService {
  /** Angular HTTP client shared by every endpoint of the gateway. */
  protected readonly http = inject(HttpClient);

  /** Base URL of the Hostera API, from the active environment. */
  protected readonly baseUrl = environment.hosteraApiUrl;

  /**
   * Creates an endpoint client for a resource path.
   * @param endpointPath - Relative resource path, such as `/bookings`.
   * @returns Endpoint client bound to this gateway's HTTP client.
   */
  protected createEndpoint<TResource extends object>(
    endpointPath: string,
  ): BaseEndpoint<TResource> {
    return new BaseEndpoint<TResource>(
      this.http,
      `${this.baseUrl}${endpointPath}`,
    );
  }
}
