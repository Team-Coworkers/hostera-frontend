import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const propertiesEndpointPath = import.meta.env.VITE_PROPERTIES_ENDPOINT_PATH;
const roomTypesEndpointPath = import.meta.env.VITE_ROOM_TYPES_ENDPOINT_PATH;
const roomsEndpointPath = import.meta.env.VITE_ROOMS_ENDPOINT_PATH;
const statusPeriodsEndpointPath = import.meta.env
  .VITE_STATUS_PERIODS_ENDPOINT_PATH;
const bookingsEndpointPath = import.meta.env.VITE_BOOKINGS_ENDPOINT_PATH;
const ratePlansEndpointPath = import.meta.env.VITE_RATE_PLANS_ENDPOINT_PATH;
const dailyRatesEndpointPath = import.meta.env.VITE_DAILY_RATES_ENDPOINT_PATH;

/**
 * Infrastructure gateway for Rooms bounded-context endpoints.
 *
 * @class RoomsApi
 * @extends BaseApi
 */
export class RoomsApi extends BaseApi {
  /**
   * @type {BaseEndpoint}
   * @private
   */
  #propertiesEndpoint;
  /**
   * @type {BaseEndpoint}
   * @private
   */
  #roomTypesEndpoint;
  /**
   * @type {BaseEndpoint}
   * @private
   */
  #roomsEndpoint;
  /**
   * @type {BaseEndpoint}
   * @private
   */
  #statusPeriodsEndpoint;
  /**
   * @type {BaseEndpoint}
   * @private
   */
  #roomAssignmentsEndpoint;
  /**
   * @type {BaseEndpoint}
   * @private
   */
  #ratePlansEndpoint;
  /**
   * @type {BaseEndpoint}
   * @private
   */
  #dailyRatesEndpoint;

  /** Creates endpoint clients for properties, room types, rooms, availability, and rates. */
  constructor() {
    super();
    this.#propertiesEndpoint = new BaseEndpoint(this, propertiesEndpointPath);
    this.#roomTypesEndpoint = new BaseEndpoint(this, roomTypesEndpointPath);
    this.#roomsEndpoint = new BaseEndpoint(this, roomsEndpointPath);
    this.#statusPeriodsEndpoint = new BaseEndpoint(
      this,
      statusPeriodsEndpointPath,
    );
    this.#roomAssignmentsEndpoint = new BaseEndpoint(
      this,
      bookingsEndpointPath,
    );
    this.#ratePlansEndpoint = new BaseEndpoint(this, ratePlansEndpointPath);
    this.#dailyRatesEndpoint = new BaseEndpoint(this, dailyRatesEndpointPath);
  }

  /**
   * Fetches all properties.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the properties' response.
   */
  getProperties() {
    return this.#propertiesEndpoint.getAll();
  }

  /**
   * Fetches the room types of a property.
   * @param {number|string} propertyId - The ID of the property.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the room types' response.
   */
  getRoomTypes(propertyId) {
    return this.#roomTypesEndpoint.getAll({ propertyId });
  }

  /**
   * Creates a room type resource.
   * @param {Object} resource - Room type resource payload.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the created room type response.
   */
  createRoomType(resource) {
    return this.#roomTypesEndpoint.create(resource);
  }

  /**
   * Updates a room type resource.
   * @param {Object} resource - Room type resource payload (must include id).
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the updated room type response.
   */
  updateRoomType(resource) {
    return this.#roomTypesEndpoint.update(resource.id, resource);
  }

  /**
   * Deletes a room type by its ID.
   * @param {number|string} id - The ID of the room type to delete.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the delete response.
   */
  deleteRoomType(id) {
    return this.#roomTypesEndpoint.delete(id);
  }

  /**
   * Fetches the rooms of a property.
   * @param {number|string} propertyId - The ID of the property.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the rooms' response.
   */
  getRooms(propertyId) {
    return this.#roomsEndpoint.getAll({ propertyId });
  }

  /**
   * Creates a room resource.
   * @param {Object} resource - Room resource payload.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the created room response.
   */
  createRoom(resource) {
    return this.#roomsEndpoint.create(resource);
  }

  /**
   * Updates a room resource.
   * @param {Object} resource - Room resource payload (must include id).
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the updated room response.
   */
  updateRoom(resource) {
    return this.#roomsEndpoint.update(resource.id, resource);
  }

  /**
   * Fetches the status periods of a property's rooms.
   * @param {number|string} propertyId - The ID of the property.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the status periods' response.
   */
  getStatusPeriods(propertyId) {
    return this.#statusPeriodsEndpoint.getAll({ propertyId });
  }

  /**
   * Creates a status period resource.
   * @param {Object} resource - Status period resource payload.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the created status period response.
   */
  createStatusPeriod(resource) {
    return this.#statusPeriodsEndpoint.create(resource);
  }

  /**
   * Updates a status period resource.
   * @param {Object} resource - Status period resource payload (must include id).
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the updated status period response.
   */
  updateStatusPeriod(resource) {
    return this.#statusPeriodsEndpoint.update(resource.id, resource);
  }

  /**
   * Deletes a status period by its ID.
   * @param {number|string} id - The ID of the status period to delete.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the delete response.
   */
  deleteStatusPeriod(id) {
    return this.#statusPeriodsEndpoint.delete(id);
  }

  /**
   * Fetches the bookings of a property, from which its room assignments are derived.
   * @param {number|string} propertyId - The ID of the property.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the bookings' response.
   */
  getRoomAssignments(propertyId) {
    return this.#roomAssignmentsEndpoint.getAll({ propertyId });
  }

  /**
   * Fetches the rate plans of a property.
   * @param {number|string} propertyId - The ID of the property.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the rate plans' response.
   */
  getRatePlans(propertyId) {
    return this.#ratePlansEndpoint.getAll({ propertyId });
  }

  /**
   * Creates a rate plan resource.
   * @param {Object} resource - Rate plan resource payload.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the created rate plan response.
   */
  createRatePlan(resource) {
    return this.#ratePlansEndpoint.create(resource);
  }

  /**
   * Updates a rate plan resource.
   * @param {Object} resource - Rate plan resource payload (must include id).
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the updated rate plan response.
   */
  updateRatePlan(resource) {
    return this.#ratePlansEndpoint.update(resource.id, resource);
  }

  /**
   * Fetches the daily rates of a property's rate plans.
   * @param {number|string} propertyId - The ID of the property.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the daily rates' response.
   */
  getDailyRates(propertyId) {
    return this.#dailyRatesEndpoint.getAll({ propertyId });
  }

  /**
   * Creates a daily rate resource.
   * @param {Object} resource - Daily rate resource payload.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the created daily rate response.
   */
  createDailyRate(resource) {
    return this.#dailyRatesEndpoint.create(resource);
  }

  /**
   * Updates a daily rate resource.
   * @param {Object} resource - Daily rate resource payload (must include id).
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the updated daily rate response.
   */
  updateDailyRate(resource) {
    return this.#dailyRatesEndpoint.update(resource.id, resource);
  }

  /**
   * Deletes a daily rate by its ID.
   * @param {number|string} id - The ID of the daily rate to delete.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the delete response.
   */
  deleteDailyRate(id) {
    return this.#dailyRatesEndpoint.delete(id);
  }
}
