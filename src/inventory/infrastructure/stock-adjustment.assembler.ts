import {
  StockAdjustment,
  StockAdjustmentAttributes,
} from '../domain/model/stock-adjustment.entity';

/**
 * Maps the movement history entries stored in an inventory item resource into stock adjustments.
 */
export class StockAdjustmentAssembler {
  /**
   * @param resource - Stock adjustment payload.
   * @returns Stock adjustment entity.
   */
  static toEntityFromResource(
    resource: StockAdjustmentAttributes,
  ): StockAdjustment {
    return new StockAdjustment({ ...resource });
  }
}
