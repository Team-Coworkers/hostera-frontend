import { StockAdjustment } from '../domain/model/stock-adjustment.entity.js';

/**
 * Maps stock adjustment resources into Inventory domain entities.
 *
 * @class StockAdjustmentAssembler
 */
export class StockAdjustmentAssembler {
  /**
   * @param {Object} resource - Stock adjustment resource payload.
   * @returns {StockAdjustment} Stock adjustment entity.
   */
  static toEntityFromResource(resource) {
    return new StockAdjustment({ ...resource });
  }
}
