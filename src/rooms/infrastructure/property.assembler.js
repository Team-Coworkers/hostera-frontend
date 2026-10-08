import { Property } from '../domain/model/property.entity.js';

/**
 * Maps property resources into Rooms domain entities.
 *
 * @class PropertyAssembler
 */
export class PropertyAssembler {
  /**
   * @param {Object} resource - Property resource payload.
   * @returns {Property} Property entity.
   */
  static toEntityFromResource(resource) {
    return new Property({ ...resource });
  }

  /**
   * Parses property resources from a response and maps them into entities.
   *
   * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with property resources.
   * @returns {Property[]} Property entities.
   */
  static toEntitiesFromResponse(response) {
    if (response.status !== 200) {
      console.error(`${response.status}, ${response.statusText}`);
      return [];
    }
    let resources =
      response.data instanceof Array
        ? response.data
        : response.data['properties'];

    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}
