import { StatusPeriod } from '../domain/model/status-period.entity.js';

/**
 * Maps status period resources into Rooms domain entities.
 *
 * @class StatusPeriodAssembler
 */
export class StatusPeriodAssembler {
  /**
   * @param {Object} resource - Status period resource payload.
   * @returns {StatusPeriod} Status period entity.
   */
  static toEntityFromResource(resource) {
    return new StatusPeriod({ ...resource });
  }

  /**
   * Parses status period resources from a response and maps them into entities.
   *
   * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with status period resources.
   * @returns {StatusPeriod[]} Status period entities.
   */
  static toEntitiesFromResponse(response) {
    if (response.status !== 200) {
      console.error(`${response.status}, ${response.statusText}`);
      return [];
    }
    let resources =
      response.data instanceof Array
        ? response.data
        : response.data['status-periods'];

    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}
