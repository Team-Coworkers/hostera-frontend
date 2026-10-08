import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AdjustStockCommand } from '../domain/adjust-stock.command';
import { InventoryItem } from '../domain/model/inventory-item.entity';
import { InventoryError } from '../domain/model/inventory.error';
import { Property } from '../domain/model/property.entity';
import { StorageLocation } from '../domain/model/storage-location.entity';
import { InventoryApiService } from '../infrastructure/inventory-api.service';
import {
  InventoryItemAssembler,
  InventoryItemResource,
} from '../infrastructure/inventory-item.assembler';
import { PropertyAssembler } from '../infrastructure/property.assembler';
import { StorageLocationAssembler } from '../infrastructure/storage-location.assembler';

/** Operator recorded in stock adjustments until IAM is implemented. */
const demoOperator = 'Demo operator';

/**
 * Application service store for the Inventory bounded context, replacing the `inventory`
 * Pinia store. It coordinates inventory item, storage location, and stock use cases and
 * keeps UI-facing state in signals. Inventory selects its property on its own.
 */
@Injectable({ providedIn: 'root' })
export class InventoryStore {
  private readonly inventoryApi = inject(InventoryApiService);

  /** Property references whose inventory can be managed. */
  readonly properties = signal<Property[]>([]);
  /** Inventory items of the current property. */
  readonly inventoryItems = signal<InventoryItem[]>([]);
  /** Storage locations of the current property. */
  readonly storageLocations = signal<StorageLocation[]>([]);
  /** Errors encountered during API operations. */
  readonly errors = signal<unknown[]>([]);
  /** Whether properties have been loaded from the API. */
  readonly propertiesLoaded = signal(false);
  /** Whether inventory items have been loaded from the API. */
  readonly inventoryItemsLoaded = signal(false);
  /** Whether storage locations have been loaded from the API. */
  readonly storageLocationsLoaded = signal(false);
  /** Whether a create, update, or delete operation is in progress. */
  readonly saving = signal(false);
  /** Identifier of the property whose inventory is managed. */
  readonly currentPropertyId = signal<number | null>(null);

  /** Property whose inventory is managed. */
  readonly currentProperty = computed(() =>
    this.properties().find(
      (property) => property.id === this.currentPropertyId(),
    ),
  );
  /** Number of loaded inventory items. */
  readonly inventoryItemsCount = computed(() =>
    this.inventoryItemsLoaded() ? this.inventoryItems().length : 0,
  );
  /** Number of loaded storage locations. */
  readonly storageLocationsCount = computed(() =>
    this.storageLocationsLoaded() ? this.storageLocations().length : 0,
  );

  /** Loads properties and selects the current or first available property. */
  fetchProperties(): void {
    this.errors.set([]);
    firstValueFrom(this.inventoryApi.getProperties())
      .then((response) => {
        this.properties.set(PropertyAssembler.toEntitiesFromResponse(response));
        this.propertiesLoaded.set(true);
        const propertyId = this.currentPropertyId() ?? this.properties()[0]?.id;
        if (propertyId) this.selectProperty(propertyId);
      })
      .catch((error) => this.recordError(error));
  }

  /**
   * Selects the property whose inventory is managed and loads its items and locations.
   * @param propertyId - Property identifier.
   */
  selectProperty(propertyId: number | null): void {
    this.currentPropertyId.set(propertyId);
    this.errors.set([]);
    this.fetchInventoryItems();
    this.fetchStorageLocations();
  }

  /** Loads the current property's inventory items. */
  fetchInventoryItems(): void {
    const propertyId = this.currentPropertyId();
    this.inventoryItems.set([]);
    this.inventoryItemsLoaded.set(false);
    if (propertyId === null) return;
    firstValueFrom(this.inventoryApi.getInventoryItems(propertyId))
      .then((response) => {
        if (propertyId !== this.currentPropertyId()) return;
        this.inventoryItems.set(
          InventoryItemAssembler.toEntitiesFromResponse(response),
        );
        this.inventoryItemsLoaded.set(true);
      })
      .catch((error) => {
        if (propertyId === this.currentPropertyId()) this.recordError(error);
      });
  }

  /** Loads the current property's storage locations. */
  fetchStorageLocations(): void {
    const propertyId = this.currentPropertyId();
    this.storageLocations.set([]);
    this.storageLocationsLoaded.set(false);
    if (propertyId === null) return;
    firstValueFrom(this.inventoryApi.getStorageLocations(propertyId))
      .then((response) => {
        if (propertyId !== this.currentPropertyId()) return;
        this.storageLocations.set(
          StorageLocationAssembler.toEntitiesFromResponse(response),
        );
        this.storageLocationsLoaded.set(true);
      })
      .catch((error) => {
        if (propertyId === this.currentPropertyId()) this.recordError(error);
      });
  }

  /**
   * Finds an inventory item entity by identifier.
   * @param id - Inventory item identifier.
   */
  getInventoryItemById(id: number | string | null): InventoryItem | undefined {
    const idNum = Number(id);
    return this.inventoryItems().find(
      (inventoryItem) => inventoryItem.id === idNum,
    );
  }

  /**
   * Finds a storage location entity by identifier.
   * @param id - Storage location identifier.
   */
  getStorageLocationById(
    id: number | string | null,
  ): StorageLocation | undefined {
    const idNum = Number(id);
    return this.storageLocations().find(
      (storageLocation) => storageLocation.id === idNum,
    );
  }

  /**
   * Finds a storage location that must exist.
   * @param id - Storage location identifier.
   * @throws InventoryError When the location does not exist.
   */
  private requireStorageLocation(id: number | null): StorageLocation {
    const storageLocation = this.getStorageLocationById(id);
    if (!storageLocation) throw new InventoryError('location-required');
    return storageLocation;
  }

  /**
   * Rejects an item whose code is already used in the property.
   * @param inventoryItem - Item to check.
   */
  private ensureUniqueItemCode(inventoryItem: InventoryItem): void {
    const code = inventoryItem.code.toLowerCase();
    if (
      this.inventoryItems().some(
        (entry) =>
          entry.id !== inventoryItem.id && entry.code.toLowerCase() === code,
      )
    )
      throw new InventoryError('duplicate-item-code');
  }

  /**
   * Rejects a storage location whose code or name is already used in the property.
   * @param storageLocation - Storage location to check.
   */
  private ensureUniqueStorageLocation(storageLocation: StorageLocation): void {
    const code = storageLocation.code.toLowerCase();
    const name = storageLocation.name.toLowerCase();
    if (
      this.storageLocations().some(
        (entry) =>
          entry.id !== storageLocation.id &&
          (entry.code.toLowerCase() === code ||
            entry.name.toLowerCase() === name),
      )
    )
      throw new InventoryError('duplicate-location');
  }

  /** Builds the identifier, moment, and operator of a new stock adjustment. */
  private createAdjustmentMetadata(): {
    id: string;
    recordedAt: string;
    operator: string;
  } {
    return {
      id: crypto.getRandomValues(new Uint32Array(4)).join('-'),
      recordedAt: new Date().toISOString(),
      operator: demoOperator,
    };
  }

  /** @param error - Error to record. */
  private recordError(error: unknown): void {
    this.errors.update((errors) => [...errors, error]);
  }

  /**
   * Tracks a create, update, or delete request and records its errors.
   * @param request - Pending infrastructure request.
   * @returns The same request result.
   */
  private trackSaving<T>(request: Promise<T>): Promise<T> {
    this.saving.set(true);
    return request
      .catch((error) => {
        this.recordError(error);
        throw error;
      })
      .finally(() => this.saving.set(false));
  }

  /**
   * Replaces an inventory item in local state with its persisted version.
   * @param resource - Persisted inventory item resource.
   * @returns Persisted inventory item.
   */
  private replaceInventoryItem(resource: InventoryItemResource): InventoryItem {
    const updatedInventoryItem =
      InventoryItemAssembler.toEntityFromResource(resource);
    this.inventoryItems.update((items) =>
      items.map((item) =>
        item.id === updatedInventoryItem.id ? updatedInventoryItem : item,
      ),
    );
    return updatedInventoryItem;
  }

  /**
   * Creates an inventory item at its primary location, recording its opening stock when positive.
   * @param inventoryItem - Inventory item to persist.
   * @param openingQuantity - Quantity received at the primary location.
   * @throws InventoryError When a business rule is violated.
   */
  addInventoryItem(
    inventoryItem: InventoryItem,
    openingQuantity = 0,
  ): Promise<InventoryItem> {
    inventoryItem.validate();
    const primaryLocation = this.requireStorageLocation(
      inventoryItem.primaryLocationId,
    );
    this.ensureUniqueItemCode(inventoryItem);
    InventoryItem.validateQuantity(openingQuantity, inventoryItem.unit, true);
    let newInventoryItem = inventoryItem.assignStorageLocation(
      primaryLocation.id!,
    );
    if (openingQuantity > 0)
      newInventoryItem = newInventoryItem.applyStockAdjustment({
        ...this.createAdjustmentMetadata(),
        operation: 'in',
        quantity: openingQuantity,
        locationId: primaryLocation.id,
        locationName: primaryLocation.name,
        reason: 'opening-stock',
      });
    return this.trackSaving(
      firstValueFrom(
        this.inventoryApi.createInventoryItem(newInventoryItem),
      ).then((response) => {
        const createdInventoryItem =
          InventoryItemAssembler.toEntityFromResource(response.body!);
        this.inventoryItems.update((items) => [...items, createdInventoryItem]);
        return createdInventoryItem;
      }),
    );
  }

  /**
   * Updates an inventory item; its unit is fixed once it has movement history.
   * @param inventoryItem - Inventory item with updated data.
   * @throws InventoryError When a business rule is violated.
   */
  updateInventoryItem(inventoryItem: InventoryItem): Promise<InventoryItem> {
    const currentInventoryItem = this.getInventoryItemById(inventoryItem.id);
    if (!currentInventoryItem) throw new InventoryError('not-found');
    inventoryItem.validate();
    const primaryLocation = this.requireStorageLocation(
      inventoryItem.primaryLocationId,
    );
    this.ensureUniqueItemCode(inventoryItem);
    if (
      currentInventoryItem.adjustments.length &&
      currentInventoryItem.unit !== inventoryItem.unit
    )
      throw new InventoryError('unit-locked');
    const updatedInventoryItem = inventoryItem.assignStorageLocation(
      primaryLocation.id!,
    );
    return this.trackSaving(
      firstValueFrom(
        this.inventoryApi.updateInventoryItem(updatedInventoryItem),
      ).then((response) => this.replaceInventoryItem(response.body!)),
    );
  }

  /**
   * Receives, issues, or transfers stock of an item and records it in its history.
   * @param command - Adjust-stock command.
   * @throws InventoryError When a business rule is violated.
   */
  adjustStock(command: AdjustStockCommand): Promise<InventoryItem> {
    const inventoryItem = this.getInventoryItemById(command.inventoryItemId);
    if (!inventoryItem) throw new InventoryError('not-found');
    const originLocation = this.requireStorageLocation(command.locationId);
    const destinationLocation =
      command.operation === 'transfer'
        ? this.requireStorageLocation(command.destinationLocationId)
        : null;
    const adjustedInventoryItem = inventoryItem.applyStockAdjustment({
      ...command,
      ...this.createAdjustmentMetadata(),
      locationName: originLocation.name,
      destinationLocationName: destinationLocation?.name,
    });
    return this.trackSaving(
      firstValueFrom(
        this.inventoryApi.updateInventoryItem(adjustedInventoryItem),
      ).then((response) => this.replaceInventoryItem(response.body!)),
    );
  }

  /**
   * Removes an empty, non-primary storage location from an item.
   * @param inventoryItem - Inventory item.
   * @param storageLocationId - Storage location to remove.
   * @throws InventoryError When the location is in use.
   */
  unassignStorageLocation(
    inventoryItem: InventoryItem,
    storageLocationId: number,
  ): Promise<InventoryItem> {
    const currentInventoryItem = this.getInventoryItemById(inventoryItem.id);
    if (!currentInventoryItem) throw new InventoryError('not-found');
    const updatedInventoryItem =
      currentInventoryItem.unassignStorageLocation(storageLocationId);
    return this.trackSaving(
      firstValueFrom(
        this.inventoryApi.updateInventoryItem(updatedInventoryItem),
      ).then((response) => this.replaceInventoryItem(response.body!)),
    );
  }

  /**
   * Creates a storage location and appends it to local state.
   * @param storageLocation - Storage location to persist.
   * @throws InventoryError When a business rule is violated.
   */
  addStorageLocation(
    storageLocation: StorageLocation,
  ): Promise<StorageLocation> {
    storageLocation.validate();
    this.ensureUniqueStorageLocation(storageLocation);
    return this.trackSaving(
      firstValueFrom(
        this.inventoryApi.createStorageLocation(storageLocation),
      ).then((response) => {
        const newStorageLocation =
          StorageLocationAssembler.toEntityFromResource(response.body!);
        this.storageLocations.update((locations) => [
          ...locations,
          newStorageLocation,
        ]);
        return newStorageLocation;
      }),
    );
  }

  /**
   * Updates a storage location; its code is fixed once created.
   * @param storageLocation - Storage location with updated data.
   * @throws InventoryError When a business rule is violated.
   */
  updateStorageLocation(
    storageLocation: StorageLocation,
  ): Promise<StorageLocation> {
    const currentStorageLocation = this.getStorageLocationById(
      storageLocation.id,
    );
    if (!currentStorageLocation) throw new InventoryError('not-found');
    storageLocation.validate();
    if (currentStorageLocation.code !== storageLocation.code)
      throw new InventoryError('location-code-locked');
    this.ensureUniqueStorageLocation(storageLocation);
    return this.trackSaving(
      firstValueFrom(
        this.inventoryApi.updateStorageLocation(storageLocation),
      ).then((response) => {
        const updatedStorageLocation =
          StorageLocationAssembler.toEntityFromResource(response.body!);
        this.storageLocations.update((locations) =>
          locations.map((location) =>
            location.id === updatedStorageLocation.id
              ? updatedStorageLocation
              : location,
          ),
        );
        return updatedStorageLocation;
      }),
    );
  }

  /**
   * Deletes a storage location that no item uses.
   * @param storageLocation - Storage location to remove.
   * @throws InventoryError When the location is in use.
   */
  deleteStorageLocation(storageLocation: StorageLocation): Promise<void> {
    if (!this.getStorageLocationById(storageLocation.id))
      throw new InventoryError('not-found');
    if (
      this.inventoryItems().some(
        (inventoryItem) =>
          inventoryItem.primaryLocationId === storageLocation.id ||
          inventoryItem.stocks.some(
            (stock) => stock.locationId === storageLocation.id,
          ),
      )
    )
      throw new InventoryError('location-in-use');
    return this.trackSaving(
      firstValueFrom(
        this.inventoryApi.deleteStorageLocation(storageLocation.id!),
      ).then(() =>
        this.storageLocations.update((locations) =>
          locations.filter((location) => location.id !== storageLocation.id),
        ),
      ),
    );
  }
}
