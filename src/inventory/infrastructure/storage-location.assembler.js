import { StorageLocation } from '../domain/model/storage-location.entity.js';

/**
 * Maps storage location resources into Inventory domain entities.
 *
 * @class StorageLocationAssembler
 */
export class StorageLocationAssembler {
  /**
   * @param {Object} resource - Storage location resource payload.
   * @returns {StorageLocation} Storage location entity.
   */
  static toEntityFromResource(resource) {
    return new StorageLocation({ ...resource });
  }

  /**
   * Parses storage location resources from a response and maps them into entities.
   *
   * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with storage location resources.
   * @returns {StorageLocation[]} Storage location entities.
   */
  static toEntitiesFromResponse(response) {
    if (response.status !== 200) {
      console.error(`${response.status}, ${response.statusText}`);
      return [];
    }
    let resources =
      response.data instanceof Array
        ? response.data
        : response.data['storage-locations'];

    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}
