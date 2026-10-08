import { HttpResponse } from '@angular/common/http';
import { resourcesFromResponse } from '../../shared/infrastructure/resources-from-response';
import {
  StorageLocation,
  StorageLocationAttributes,
} from '../domain/model/storage-location.entity';

/** Resource payload of a storage location, as exchanged with the API. */
export type StorageLocationResource = Partial<StorageLocationAttributes>;

/**
 * Maps storage location resources into Inventory domain entities.
 */
export class StorageLocationAssembler {
  /**
   * @param resource - Storage location resource payload.
   * @returns Storage location entity.
   */
  static toEntityFromResource(
    resource: StorageLocationResource,
  ): StorageLocation {
    return new StorageLocation({ ...resource });
  }

  /**
   * Parses storage location resources from a response and maps them into entities.
   * @param response - HTTP response with storage location resources.
   * @returns Storage location entities.
   */
  static toEntitiesFromResponse(
    response: HttpResponse<unknown>,
  ): StorageLocation[] {
    return resourcesFromResponse<StorageLocationResource>(
      response,
      'storage-locations',
    ).map((resource) => this.toEntityFromResource(resource));
  }
}
