import { RatePlan } from '../domain/model/rate-plan.entity.js';

/**
 * Maps rate plan resources into Rooms domain entities.
 *
 * @class RatePlanAssembler
 */
export class RatePlanAssembler {
  /**
   * @param {Object} resource - Rate plan resource payload.
   * @returns {RatePlan} Rate plan entity.
   */
  static toEntityFromResource(resource) {
    return new RatePlan({ ...resource });
  }

  /**
   * Parses rate plan resources from a response and maps them into entities.
   *
   * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with rate plan resources.
   * @returns {RatePlan[]} Rate plan entities.
   */
  static toEntitiesFromResponse(response) {
    if (response.status !== 200) {
      console.error(`${response.status}, ${response.statusText}`);
      return [];
    }
    let resources =
      response.data instanceof Array
        ? response.data
        : response.data['rate-plans'];

    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}
