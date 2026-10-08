import { Booking } from '../domain/model/booking.entity.js';

/**
 * Maps booking resources into Bookings domain entities.
 *
 * @class BookingAssembler
 */
export class BookingAssembler {
  /**
   * @param {Object} resource - Booking resource payload.
   * @returns {Booking} Booking entity.
   */
  static toEntityFromResource(resource) {
    return new Booking({ ...resource });
  }

  /**
   * Parses booking resources from a response and maps them into entities.
   *
   * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with booking resources.
   * @returns {Booking[]} Booking entities.
   */
  static toEntitiesFromResponse(response) {
    if (response.status !== 200) {
      console.error(`${response.status}, ${response.statusText}`);
      return [];
    }
    let resources =
      response.data instanceof Array
        ? response.data
        : response.data['bookings'];

    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}
