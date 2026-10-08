/**
 * Application service store for the Inventory bounded context.
 * It coordinates inventory item, storage location, and stock adjustment use cases and keeps UI-facing state.
 *
 * @module useInventoryStore
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { InventoryApi } from '../infrastructure/inventory-api.js';
import { PropertyAssembler } from '../infrastructure/property.assembler.js';
import { InventoryItemAssembler } from '../infrastructure/inventory-item.assembler.js';
import { StorageLocationAssembler } from '../infrastructure/storage-location.assembler.js';
import { InventoryItem } from '../domain/model/inventory-item.entity.js';
import { InventoryError } from '../domain/model/inventory.error.js';

const inventoryApi = new InventoryApi();

/**
 * Operator recorded in stock adjustments until IAM is implemented.
 * @type {string}
 */
const demoOperator = 'Demo operator';

/**
 * Reactive store that exposes Inventory commands and queries.
 *
 * @returns {Object} Store state and actions.
 */
const useInventoryStore = defineStore('inventory', () => {
  /**
   * List of property references whose inventory can be managed.
   * @type {import('vue').Ref<Property[]>}
   */
  const properties = ref([]);
  /**
   * List of inventory item entities of the current property.
   * @type {import('vue').Ref<InventoryItem[]>}
   */
  const inventoryItems = ref([]);
  /**
   * List of storage location entities of the current property.
   * @type {import('vue').Ref<StorageLocation[]>}
   */
  const storageLocations = ref([]);
  /**
   * List of errors encountered during API operations.
   * @type {import('vue').Ref<Error[]>}
   */
  const errors = ref([]);
  /**
   * Whether properties have been loaded from the API.
   * @type {import('vue').Ref<boolean>}
   */
  const propertiesLoaded = ref(false);
  /**
   * Whether inventory items have been loaded from the API.
   * @type {import('vue').Ref<boolean>}
   */
  const inventoryItemsLoaded = ref(false);
  /**
   * Whether storage locations have been loaded from the API.
   * @type {import('vue').Ref<boolean>}
   */
  const storageLocationsLoaded = ref(false);
  /**
   * Whether a create, update, or delete operation is in progress.
   * @type {import('vue').Ref<boolean>}
   */
  const saving = ref(false);
  /**
   * Identifier of the property whose inventory is being managed.
   * @type {import('vue').Ref<?number>}
   */
  const currentPropertyId = ref(null);
  /**
   * Property whose inventory is being managed.
   * @type {import('vue').ComputedRef<Property|undefined>}
   */
  const currentProperty = computed(() =>
    properties.value.find(
      (property) => property['id'] === currentPropertyId.value,
    ),
  );
  /**
   * Number of loaded inventory items.
   * @type {import('vue').ComputedRef<number>}
   */
  const inventoryItemsCount = computed(() => {
    return inventoryItemsLoaded.value ? inventoryItems.value.length : 0;
  });
  /**
   * Number of loaded storage locations.
   * @type {import('vue').ComputedRef<number>}
   */
  const storageLocationsCount = computed(() => {
    return storageLocationsLoaded.value ? storageLocations.value.length : 0;
  });

  /**
   * Loads properties and selects the current or first available property.
   * @returns {void}
   */
  function fetchProperties() {
    errors.value = [];
    inventoryApi
      .getProperties()
      .then((response) => {
        properties.value = PropertyAssembler.toEntitiesFromResponse(response);
        propertiesLoaded.value = true;
        const propertyId = currentPropertyId.value ?? properties.value[0]?.id;
        if (propertyId) selectProperty(propertyId);
      })
      .catch((error) => {
        errors.value.push(error);
      });
  }

  /**
   * Selects the property whose inventory is managed and loads its inventory.
   * @param {number} propertyId - Property identifier.
   * @returns {void}
   */
  function selectProperty(propertyId) {
    currentPropertyId.value = propertyId;
    errors.value = [];
    fetchInventoryItems();
    fetchStorageLocations();
  }

  /**
   * Loads the current property's inventory items and updates the application state.
   * @returns {void}
   */
  function fetchInventoryItems() {
    const propertyId = currentPropertyId.value;
    inventoryItems.value = [];
    inventoryItemsLoaded.value = false;
    inventoryApi
      .getInventoryItems(propertyId)
      .then((response) => {
        if (propertyId !== currentPropertyId.value) return;
        inventoryItems.value =
          InventoryItemAssembler.toEntitiesFromResponse(response);
        inventoryItemsLoaded.value = true;
      })
      .catch((error) => {
        if (propertyId === currentPropertyId.value) errors.value.push(error);
      });
  }

  /**
   * Loads the current property's storage locations and updates the application state.
   * @returns {void}
   */
  function fetchStorageLocations() {
    const propertyId = currentPropertyId.value;
    storageLocations.value = [];
    storageLocationsLoaded.value = false;
    inventoryApi
      .getStorageLocations(propertyId)
      .then((response) => {
        if (propertyId !== currentPropertyId.value) return;
        storageLocations.value =
          StorageLocationAssembler.toEntitiesFromResponse(response);
        storageLocationsLoaded.value = true;
      })
      .catch((error) => {
        if (propertyId === currentPropertyId.value) errors.value.push(error);
      });
  }

  /**
   * Finds an inventory item entity by identifier.
   * @param {number|string} id - Inventory item identifier.
   * @returns {InventoryItem|undefined} Matching inventory item, if available.
   */
  function getInventoryItemById(id) {
    let idNum = parseInt(id);
    return inventoryItems.value.find(
      (inventoryItem) => inventoryItem['id'] === idNum,
    );
  }

  /**
   * Finds a storage location entity by identifier.
   * @param {number|string} id - Storage location identifier.
   * @returns {StorageLocation|undefined} Matching storage location, if available.
   */
  function getStorageLocationById(id) {
    let idNum = parseInt(id);
    return storageLocations.value.find(
      (storageLocation) => storageLocation['id'] === idNum,
    );
  }

  /**
   * Finds a storage location of the current property or rejects the request.
   * @param {?number} id - Storage location identifier.
   * @returns {StorageLocation} Matching storage location.
   * @throws {InventoryError} When the storage location is not available.
   */
  function requireStorageLocation(id) {
    const storageLocation = getStorageLocationById(id);
    if (!storageLocation) throw new InventoryError('location-required');
    return storageLocation;
  }

  /**
   * Rejects an inventory item whose code is already used in the property.
   * @param {InventoryItem} inventoryItem - Inventory item to check.
   * @throws {InventoryError} When the item code is duplicated.
   */
  function ensureUniqueItemCode(inventoryItem) {
    const code = inventoryItem.code.toLowerCase();
    if (
      inventoryItems.value.some(
        (entry) =>
          entry['id'] !== inventoryItem.id && entry.code.toLowerCase() === code,
      )
    )
      throw new InventoryError('duplicate-item-code');
  }

  /**
   * Rejects a storage location whose name or code is already used in the property.
   * @param {StorageLocation} storageLocation - Storage location to check.
   * @throws {InventoryError} When the name or code is duplicated.
   */
  function ensureUniqueStorageLocation(storageLocation) {
    const code = storageLocation.code.toLowerCase();
    const name = storageLocation.name.toLowerCase();
    if (
      storageLocations.value.some(
        (entry) =>
          entry['id'] !== storageLocation.id &&
          (entry.code.toLowerCase() === code ||
            entry.name.toLowerCase() === name),
      )
    )
      throw new InventoryError('duplicate-location');
  }

  /**
   * Creates the audit information of a new stock adjustment.
   * @returns {{id: string, recordedAt: string, operator: string}} Adjustment metadata.
   */
  function createAdjustmentMetadata() {
    return {
      id: crypto.getRandomValues(new Uint32Array(4)).join('-'),
      recordedAt: new Date().toISOString(),
      operator: demoOperator,
    };
  }

  /**
   * Tracks a create, update, or delete request and records its errors.
   * @template T
   * @param {Promise<T>} request - Pending infrastructure request.
   * @returns {Promise<T>} The same request result.
   */
  function trackSaving(request) {
    saving.value = true;
    return request
      .catch((error) => {
        errors.value.push(error);
        throw error;
      })
      .finally(() => {
        saving.value = false;
      });
  }

  /**
   * Replaces an inventory item in local state with its persisted version.
   * @param {Object} resource - Persisted inventory item resource.
   * @returns {InventoryItem} Updated inventory item entity.
   */
  function replaceInventoryItem(resource) {
    const updatedInventoryItem =
      InventoryItemAssembler.toEntityFromResource(resource);
    const index = inventoryItems.value.findIndex(
      (i) => i['id'] === updatedInventoryItem.id,
    );
    if (index !== -1) inventoryItems.value[index] = updatedInventoryItem;
    return updatedInventoryItem;
  }

  /**
   * Creates an inventory item, recording a positive opening quantity in its stock history.
   * @param {InventoryItem} inventoryItem - Inventory item entity to persist.
   * @param {number} [openingQuantity=0] - Quantity received at the primary storage location.
   * @returns {Promise<InventoryItem>} Created inventory item.
   * @throws {InventoryError} When a business rule is violated.
   */
  function addInventoryItem(inventoryItem, openingQuantity = 0) {
    inventoryItem.validate();
    const primaryLocation = requireStorageLocation(
      inventoryItem.primaryLocationId,
    );
    ensureUniqueItemCode(inventoryItem);
    InventoryItem.validateQuantity(openingQuantity, inventoryItem.unit, true);
    let newInventoryItem = inventoryItem.assignStorageLocation(
      primaryLocation.id,
    );
    if (openingQuantity > 0)
      newInventoryItem = newInventoryItem.applyStockAdjustment({
        ...createAdjustmentMetadata(),
        operation: 'in',
        quantity: openingQuantity,
        locationId: primaryLocation.id,
        locationName: primaryLocation.name,
        reason: 'opening-stock',
      });
    return trackSaving(
      inventoryApi.createInventoryItem(newInventoryItem).then((response) => {
        const resource = response.data;
        const createdInventoryItem =
          InventoryItemAssembler.toEntityFromResource(resource);
        inventoryItems.value.push(createdInventoryItem);
        return createdInventoryItem;
      }),
    );
  }

  /**
   * Updates an existing inventory item and synchronizes local state.
   * @param {InventoryItem} inventoryItem - Inventory item entity with updated data.
   * @returns {Promise<InventoryItem>} Updated inventory item.
   * @throws {InventoryError} When a business rule is violated.
   */
  function updateInventoryItem(inventoryItem) {
    const currentInventoryItem = getInventoryItemById(inventoryItem.id);
    if (!currentInventoryItem) throw new InventoryError('not-found');
    inventoryItem.validate();
    const primaryLocation = requireStorageLocation(
      inventoryItem.primaryLocationId,
    );
    ensureUniqueItemCode(inventoryItem);
    if (
      currentInventoryItem.adjustments.length &&
      currentInventoryItem.unit !== inventoryItem.unit
    )
      throw new InventoryError('unit-locked');
    const updatedInventoryItem = inventoryItem.assignStorageLocation(
      primaryLocation.id,
    );
    return trackSaving(
      inventoryApi
        .updateInventoryItem(updatedInventoryItem)
        .then((response) => replaceInventoryItem(response.data)),
    );
  }

  /**
   * Records a stock adjustment or transfer for an inventory item.
   * @param {import('../domain/adjust-stock.command.js').AdjustStockCommand} adjustStockCommand - Adjust-stock command.
   * @returns {Promise<InventoryItem>} Inventory item with its updated quantities and history.
   * @throws {InventoryError} When a business rule is violated.
   */
  function adjustStock(adjustStockCommand) {
    const inventoryItem = getInventoryItemById(
      adjustStockCommand.inventoryItemId,
    );
    if (!inventoryItem) throw new InventoryError('not-found');
    const originLocation = requireStorageLocation(
      adjustStockCommand.locationId,
    );
    const destinationLocation =
      adjustStockCommand.operation === 'transfer'
        ? requireStorageLocation(adjustStockCommand.destinationLocationId)
        : null;
    const adjustedInventoryItem = inventoryItem.applyStockAdjustment({
      ...adjustStockCommand,
      ...createAdjustmentMetadata(),
      locationName: originLocation.name,
      destinationLocationName: destinationLocation?.name,
    });
    return trackSaving(
      inventoryApi
        .updateInventoryItem(adjustedInventoryItem)
        .then((response) => replaceInventoryItem(response.data)),
    );
  }

  /**
   * Removes an empty secondary storage location assignment from an inventory item.
   * @param {InventoryItem} inventoryItem - Inventory item to update.
   * @param {number} storageLocationId - Storage location identifier.
   * @returns {Promise<InventoryItem>} Updated inventory item.
   * @throws {InventoryError} When a business rule is violated.
   */
  function unassignStorageLocation(inventoryItem, storageLocationId) {
    const currentInventoryItem = getInventoryItemById(inventoryItem.id);
    if (!currentInventoryItem) throw new InventoryError('not-found');
    const updatedInventoryItem =
      currentInventoryItem.unassignStorageLocation(storageLocationId);
    return trackSaving(
      inventoryApi
        .updateInventoryItem(updatedInventoryItem)
        .then((response) => replaceInventoryItem(response.data)),
    );
  }

  /**
   * Creates a storage location through infrastructure and appends it to local state.
   * @param {StorageLocation} storageLocation - Storage location entity to persist.
   * @returns {Promise<StorageLocation>} Created storage location.
   * @throws {InventoryError} When a business rule is violated.
   */
  function addStorageLocation(storageLocation) {
    storageLocation.validate();
    ensureUniqueStorageLocation(storageLocation);
    return trackSaving(
      inventoryApi.createStorageLocation(storageLocation).then((response) => {
        const resource = response.data;
        const newStorageLocation =
          StorageLocationAssembler.toEntityFromResource(resource);
        storageLocations.value.push(newStorageLocation);
        return newStorageLocation;
      }),
    );
  }

  /**
   * Updates an existing storage location and synchronizes local state.
   * @param {StorageLocation} storageLocation - Storage location entity with updated data.
   * @returns {Promise<StorageLocation>} Updated storage location.
   * @throws {InventoryError} When a business rule is violated.
   */
  function updateStorageLocation(storageLocation) {
    const currentStorageLocation = getStorageLocationById(storageLocation.id);
    if (!currentStorageLocation) throw new InventoryError('not-found');
    storageLocation.validate();
    if (currentStorageLocation.code !== storageLocation.code)
      throw new InventoryError('location-code-locked');
    ensureUniqueStorageLocation(storageLocation);
    return trackSaving(
      inventoryApi.updateStorageLocation(storageLocation).then((response) => {
        const resource = response.data;
        const updatedStorageLocation =
          StorageLocationAssembler.toEntityFromResource(resource);
        const index = storageLocations.value.findIndex(
          (s) => s['id'] === updatedStorageLocation.id,
        );
        if (index !== -1)
          storageLocations.value[index] = updatedStorageLocation;
        return updatedStorageLocation;
      }),
    );
  }

  /**
   * Deletes an unused storage location and removes it from local state.
   * @param {StorageLocation} storageLocation - Storage location entity to remove.
   * @returns {Promise<void>}
   * @throws {InventoryError} When the storage location is still in use.
   */
  function deleteStorageLocation(storageLocation) {
    if (!getStorageLocationById(storageLocation.id))
      throw new InventoryError('not-found');
    if (
      inventoryItems.value.some(
        (inventoryItem) =>
          inventoryItem.primaryLocationId === storageLocation.id ||
          inventoryItem.stocks.some(
            (stock) => stock.locationId === storageLocation.id,
          ),
      )
    )
      throw new InventoryError('location-in-use');
    return trackSaving(
      inventoryApi.deleteStorageLocation(storageLocation.id).then(() => {
        const index = storageLocations.value.findIndex(
          (s) => s['id'] === storageLocation.id,
        );
        if (index !== -1) storageLocations.value.splice(index, 1);
      }),
    );
  }

  return {
    properties,
    inventoryItems,
    storageLocations,
    errors,
    propertiesLoaded,
    inventoryItemsLoaded,
    storageLocationsLoaded,
    saving,
    currentPropertyId,
    currentProperty,
    inventoryItemsCount,
    storageLocationsCount,
    fetchProperties,
    selectProperty,
    fetchInventoryItems,
    fetchStorageLocations,
    getInventoryItemById,
    getStorageLocationById,
    addInventoryItem,
    updateInventoryItem,
    adjustStock,
    unassignStorageLocation,
    addStorageLocation,
    updateStorageLocation,
    deleteStorageLocation,
  };
});

export default useInventoryStore;
