import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const roomsEndpointPath = import.meta.env.VITE_ROOMS_ENDPOINT_PATH;
const bookingsEndpointPath = import.meta.env.VITE_BOOKINGS_ENDPOINT_PATH;
const statusPeriodsEndpointPath = import.meta.env
  .VITE_STATUS_PERIODS_ENDPOINT_PATH;

/**
 * Read-only infrastructure gateway for the Overview bounded context.
 * It reads the rooms, bookings, and operational statuses of every property to compare them.
 *
 * @class OverviewApi
 * @extends BaseApi
 */
export class OverviewApi extends BaseApi {
  /**
   * @type {BaseEndpoint}
   * @private
   */
  #roomsEndpoint;
  /**
   * @type {BaseEndpoint}
   * @private
   */
  #bookingsEndpoint;
  /**
   * @type {BaseEndpoint}
   * @private
   */
  #statusPeriodsEndpoint;

  /** Creates endpoint clients for rooms, bookings, and status periods. */
  constructor() {
    super();
    this.#roomsEndpoint = new BaseEndpoint(this, roomsEndpointPath);
    this.#bookingsEndpoint = new BaseEndpoint(this, bookingsEndpointPath);
    this.#statusPeriodsEndpoint = new BaseEndpoint(
      this,
      statusPeriodsEndpointPath,
    );
  }

  /**
   * Fetches the rooms, bookings, and status periods of all properties.
   * @returns {Promise<import('axios').AxiosResponse[]>} Responses for rooms, bookings, and status periods.
   */
  getPortfolio() {
    return Promise.all([
      this.#roomsEndpoint.getAll(),
      this.#bookingsEndpoint.getAll(),
      this.#statusPeriodsEndpoint.getAll(),
    ]);
  }
}
