import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const propertiesEndpointPath = import.meta.env.VITE_PROPERTIES_ENDPOINT_PATH;
const inventoryItemsEndpointPath = import.meta.env
  .VITE_INVENTORY_ITEMS_ENDPOINT_PATH;
const storageLocationsEndpointPath = import.meta.env
  .VITE_STORAGE_LOCATIONS_ENDPOINT_PATH;

/**
 * Infrastructure gateway for Inventory bounded-context endpoints.
 *
 * @class InventoryApi
 * @extends BaseApi
 */
export class InventoryApi extends BaseApi {
  /**
   * @type {BaseEndpoint}
   * @private
   */
  #propertiesEndpoint;
  /**
   * @type {BaseEndpoint}
   * @private
   */
  #inventoryItemsEndpoint;
  /**
   * @type {BaseEndpoint}
   * @private
   */
  #storageLocationsEndpoint;

  /** Creates endpoint clients for properties, inventory items, and storage locations. */
  constructor() {
    super();
    this.#propertiesEndpoint = new BaseEndpoint(this, propertiesEndpointPath);
    this.#inventoryItemsEndpoint = new BaseEndpoint(
      this,
      inventoryItemsEndpointPath,
    );
    this.#storageLocationsEndpoint = new BaseEndpoint(
      this,
      storageLocationsEndpointPath,
    );
  }

  /**
   * Fetches all properties.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the properties' response.
   */
  getProperties() {
    return this.#propertiesEndpoint.getAll();
  }

  /**
   * Fetches the inventory items of a property.
   * @param {number|string} propertyId - The ID of the property.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the inventory items' response.
   */
  getInventoryItems(propertyId) {
    return this.#inventoryItemsEndpoint.getAll({ propertyId });
  }

  /**
   * Creates an inventory item resource.
   * @param {Object} resource - Inventory item resource payload.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the created inventory item response.
   */
  createInventoryItem(resource) {
    return this.#inventoryItemsEndpoint.create(resource);
  }

  /**
   * Updates an inventory item resource.
   * @param {Object} resource - Inventory item resource payload (must include id).
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the updated inventory item response.
   */
  updateInventoryItem(resource) {
    return this.#inventoryItemsEndpoint.update(resource.id, resource);
  }

  /**
   * Fetches the storage locations of a property.
   * @param {number|string} propertyId - The ID of the property.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the storage locations' response.
   */
  getStorageLocations(propertyId) {
    return this.#storageLocationsEndpoint.getAll({ propertyId });
  }

  /**
   * Creates a storage location resource.
   * @param {Object} resource - Storage location resource payload.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the created storage location response.
   */
  createStorageLocation(resource) {
    return this.#storageLocationsEndpoint.create(resource);
  }

  /**
   * Updates a storage location resource.
   * @param {Object} resource - Storage location resource payload (must include id).
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the updated storage location response.
   */
  updateStorageLocation(resource) {
    return this.#storageLocationsEndpoint.update(resource.id, resource);
  }

  /**
   * Deletes a storage location by its ID.
   * @param {number|string} id - The ID of the storage location to delete.
   * @returns {Promise<import('axios').AxiosResponse>} Promise resolving to the delete response.
   */
  deleteStorageLocation(id) {
    return this.#storageLocationsEndpoint.delete(id);
  }
}
