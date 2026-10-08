import { AccessEvent } from '../domain/model/access-event.entity.js';

/**
 * Maps access event resources into Access Control domain entities.
 *
 * @class AccessEventAssembler
 */
export class AccessEventAssembler {
  /**
   * @param {Object} resource - Access event resource payload.
   * @returns {AccessEvent} Access event entity.
   */
  static toEntityFromResource(resource) {
    return new AccessEvent({ ...resource });
  }

  /**
   * Parses access event resources from a response and maps them into entities.
   *
   * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with access event resources.
   * @returns {AccessEvent[]} Access event entities.
   */
  static toEntitiesFromResponse(response) {
    if (response.status !== 200) {
      console.error(`${response.status}, ${response.statusText}`);
      return [];
    }
    let resources =
      response.data instanceof Array
        ? response.data
        : response.data['access-events'];

    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}
