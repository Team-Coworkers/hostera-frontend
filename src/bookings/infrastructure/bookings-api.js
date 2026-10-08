import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const bookingsEndpointPath = import.meta.env.VITE_BOOKINGS_ENDPOINT_PATH;
const paymentsEndpointPath = import.meta.env.VITE_PAYMENTS_ENDPOINT_PATH;

/**
 * Infrastructure gateway for Bookings bounded-context endpoints.
 *
 * @class BookingsApi
 * @extends BaseApi
 */
export class BookingsApi extends BaseApi {
  /**
   * @type {BaseEndpoint}
   * @private
   */
  #bookingsEndpoint;
  /**
   * @type {BaseEndpoint}
   * @private
   */
  #paymentsEndpoint;

  /** Creates the endpoint clients for bookings and their payments. */
  constructor() {
    super();
    this.#bookingsEndpoint = new BaseEndpoint(this, bookingsEndpointPath);
    this.#paymentsEndpoint = new BaseEndpoint(this, paymentsEndpointPath);
  }

  /**
   * Fetches the bookings of a property.
   * @param {number|string} propertyId - The ID of the property.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the bookings' response.
   */
  getBookings(propertyId) {
    return this.#bookingsEndpoint.getAll({ propertyId });
  }

  /**
   * Fetches the booking with the highest code of a property.
   * @param {number|string} propertyId - The ID of the property.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to a response with at most one booking.
   */
  getLatestBooking(propertyId) {
    return this.#bookingsEndpoint.getAll({
      propertyId,
      _sort: 'code',
      _order: 'desc',
      _limit: 1,
    });
  }

  /**
   * Creates a booking resource.
   * @param {Object} resource - Booking resource payload.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the created booking response.
   */
  createBooking(resource) {
    return this.#bookingsEndpoint.create(resource);
  }

  /**
   * Updates a booking resource.
   * @param {Object} resource - Booking resource payload (must include id).
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the updated booking response.
   */
  updateBooking(resource) {
    return this.#bookingsEndpoint.update(resource.id, resource);
  }

  /**
   * Fetches the payments of a property's bookings.
   * @param {number|string} propertyId - The ID of the property.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the payments' response.
   */
  getPayments(propertyId) {
    return this.#paymentsEndpoint.getAll({ propertyId });
  }

  /**
   * Creates a payment resource.
   * @param {Object} resource - Payment resource payload.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the created payment response.
   */
  createPayment(resource) {
    return this.#paymentsEndpoint.create(resource);
  }
}
