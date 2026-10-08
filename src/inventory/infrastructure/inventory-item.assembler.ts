import { HttpResponse } from '@angular/common/http';
import { resourcesFromResponse } from '../../shared/infrastructure/resources-from-response';
import {
  InventoryItem,
  InventoryItemAttributes,
} from '../domain/model/inventory-item.entity';
import { StockAdjustmentAttributes } from '../domain/model/stock-adjustment.entity';
import { StockAdjustmentAssembler } from './stock-adjustment.assembler';

/** Resource payload of an inventory item, with its stocks and movement history. */
export type InventoryItemResource = Partial<
  Omit<InventoryItemAttributes, 'adjustments'>
> & { adjustments?: StockAdjustmentAttributes[] };

/**
 * Maps inventory item resources, with their stocks and history, into Inventory domain entities.
 */
export class InventoryItemAssembler {
  /**
   * @param resource - Inventory item resource payload.
   * @returns Inventory item entity.
   */
  static toEntityFromResource(resource: InventoryItemResource): InventoryItem {
    return new InventoryItem({
      ...resource,
      adjustments: (resource.adjustments ?? []).map((adjustment) =>
        StockAdjustmentAssembler.toEntityFromResource(adjustment),
      ),
    });
  }

  /**
   * Parses inventory item resources from a response and maps them into entities.
   * @param response - HTTP response with inventory item resources.
   * @returns Inventory item entities.
   */
  static toEntitiesFromResponse(
    response: HttpResponse<unknown>,
  ): InventoryItem[] {
    return resourcesFromResponse<InventoryItemResource>(
      response,
      'inventory-items',
    ).map((resource) => this.toEntityFromResource(resource));
  }
}
