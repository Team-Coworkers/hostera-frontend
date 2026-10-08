import { Payment } from '../domain/model/payment.entity.js';

/**
 * Maps payment resources into Bookings domain entities.
 *
 * @class PaymentAssembler
 */
export class PaymentAssembler {
  /**
   * @param {Object} resource - Payment resource payload.
   * @returns {Payment} Payment entity.
   */
  static toEntityFromResource(resource) {
    return new Payment({ ...resource });
  }

  /**
   * Parses payment resources from a response and maps them into entities.
   *
   * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with payment resources.
   * @returns {Payment[]} Payment entities.
   */
  static toEntitiesFromResponse(response) {
    if (response.status !== 200) {
      console.error(`${response.status}, ${response.statusText}`);
      return [];
    }
    let resources =
      response.data instanceof Array
        ? response.data
        : response.data['payments'];

    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}
