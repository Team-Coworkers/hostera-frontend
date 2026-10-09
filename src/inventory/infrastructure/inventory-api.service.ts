import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BaseApiService } from '../../shared/infrastructure/base-api.service';
import { InventoryItemResource } from './inventory-item.assembler';
import { PropertyResource } from './property.assembler';
import { StorageLocationResource } from './storage-location.assembler';

/**
 * Infrastructure gateway for Inventory bounded-context endpoints.
 */
@Injectable({ providedIn: 'root' })
export class InventoryApiService extends BaseApiService {
  private readonly propertiesEndpoint = this.createEndpoint<PropertyResource>(
    environment.propertiesEndpointPath,
  );
  private readonly inventoryItemsEndpoint =
    this.createEndpoint<InventoryItemResource>(
      environment.inventoryItemsEndpointPath,
    );
  private readonly storageLocationsEndpoint =
    this.createEndpoint<StorageLocationResource>(
      environment.storageLocationsEndpointPath,
    );

  /** Fetches all properties. */
  getProperties(): Observable<HttpResponse<PropertyResource[]>> {
    return this.propertiesEndpoint.getAll();
  }

  /** @param propertyId - The ID of the property whose inventory items are fetched. */
  getInventoryItems(
    propertyId: number,
  ): Observable<HttpResponse<InventoryItemResource[]>> {
    return this.inventoryItemsEndpoint.getAll({ propertyId });
  }

  /** @param resource - Inventory item resource payload. */
  createInventoryItem(
    resource: object,
  ): Observable<HttpResponse<InventoryItemResource>> {
    return this.inventoryItemsEndpoint.create(resource);
  }

  /** @param resource - Inventory item resource payload (must include id). */
  updateInventoryItem(resource: {
    id: number | null;
  }): Observable<HttpResponse<InventoryItemResource>> {
    return this.inventoryItemsEndpoint.update(resource.id!, resource);
  }

  /** @param propertyId - The ID of the property whose storage locations are fetched. */
  getStorageLocations(
    propertyId: number,
  ): Observable<HttpResponse<StorageLocationResource[]>> {
    return this.storageLocationsEndpoint.getAll({ propertyId });
  }

  /** @param resource - Storage location resource payload. */
  createStorageLocation(
    resource: object,
  ): Observable<HttpResponse<StorageLocationResource>> {
    return this.storageLocationsEndpoint.create(resource);
  }

  /** @param resource - Storage location resource payload (must include id). */
  updateStorageLocation(resource: {
    id: number | null;
  }): Observable<HttpResponse<StorageLocationResource>> {
    return this.storageLocationsEndpoint.update(resource.id!, resource);
  }

  /** @param id - The ID of the storage location to delete. */
  deleteStorageLocation(id: number): Observable<HttpResponse<unknown>> {
    return this.storageLocationsEndpoint.delete(id);
  }
}
