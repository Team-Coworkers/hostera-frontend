import { DailyRate } from '../domain/model/daily-rate.entity.js';

/**
 * Maps daily rate resources into Rooms domain entities.
 *
 * @class DailyRateAssembler
 */
export class DailyRateAssembler {
  /**
   * @param {Object} resource - Daily rate resource payload.
   * @returns {DailyRate} Daily rate entity.
   */
  static toEntityFromResource(resource) {
    return new DailyRate({ ...resource });
  }

  /**
   * Parses daily rate resources from a response and maps them into entities.
   *
   * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with daily rate resources.
   * @returns {DailyRate[]} Daily rate entities.
   */
  static toEntitiesFromResponse(response) {
    if (response.status !== 200) {
      console.error(`${response.status}, ${response.statusText}`);
      return [];
    }
    let resources =
      response.data instanceof Array
        ? response.data
        : response.data['daily-rates'];

    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}
