import { InventoryItem } from '../domain/model/inventory-item.entity.js';
import { StockAdjustmentAssembler } from './stock-adjustment.assembler.js';

/**
 * Maps inventory item resources, including their stock history, into Inventory domain entities.
 *
 * @class InventoryItemAssembler
 */
export class InventoryItemAssembler {
  /**
   * @param {Object} resource - Inventory item resource payload.
   * @returns {InventoryItem} Inventory item entity.
   */
  static toEntityFromResource(resource) {
    return new InventoryItem({
      ...resource,
      adjustments: (resource.adjustments ?? []).map((adjustment) =>
        StockAdjustmentAssembler.toEntityFromResource(adjustment),
      ),
    });
  }

  /**
   * Parses inventory item resources from a response and maps them into entities.
   *
   * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with inventory item resources.
   * @returns {InventoryItem[]} Inventory item entities.
   */
  static toEntitiesFromResponse(response) {
    if (response.status !== 200) {
      console.error(`${response.status}, ${response.statusText}`);
      return [];
    }
    let resources =
      response.data instanceof Array
        ? response.data
        : response.data['inventory-items'];

    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}
