import { HttpResponse } from '@angular/common/http';

/**
 * Parses the resources of a collection response, as every assembler of the Vue version did:
 * a non-200 response logs its status and yields no resources, and a wrapped payload
 * is read from its collection key.
 *
 * @param response - HTTP response with a resource array or a wrapper object.
 * @param collectionKey - Key of the array when the payload is wrapped, such as `bookings`.
 * @returns Resource payloads.
 */
export function resourcesFromResponse<TResource>(
  response: HttpResponse<unknown>,
  collectionKey: string,
): TResource[] {
  if (response.status !== 200) {
    console.error(`${response.status}, ${response.statusText}`);
    return [];
  }
  const body = response.body;
  if (Array.isArray(body)) return body as TResource[];
  const wrapped = (body as Record<string, unknown> | null)?.[collectionKey];
  return Array.isArray(wrapped) ? (wrapped as TResource[]) : [];
}
