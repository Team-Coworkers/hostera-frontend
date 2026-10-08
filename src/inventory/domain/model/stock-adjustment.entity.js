/**
 * Stock adjustment entity within the Inventory bounded context.
 * It records a stock-in or stock-out at one storage location.
 *
 * @class StockAdjustment
 */
export class StockAdjustment {
  /**
   * Reasons allowed for each requested stock operation.
   * @type {Object<string, string[]>}
   */
  static reasons = {
    in: [
      'opening-stock',
      'supplier-delivery',
      'return-to-storage',
      'inventory-correction',
      'other',
    ],
    out: [
      'operational-consumption',
      'damaged-or-expired',
      'lost-item',
      'inventory-correction',
      'other',
    ],
    transfer: ['internal-transfer'],
  };

  /**
   * @param {Object} params - Entity attributes.
   * @param {string} params.id - Stock adjustment identifier.
   * @param {'in'|'out'} params.operation - Direction of the quantity change.
   * @param {number} params.quantity - Adjusted quantity.
   * @param {number} params.locationId - Identifier of the adjusted storage location.
   * @param {string} params.locationName - Storage location name at the time of the adjustment.
   * @param {string} params.reason - Adjustment reason.
   * @param {string} [params.note=''] - Optional explanation.
   * @param {string} params.recordedAt - ISO date when the adjustment was recorded.
   * @param {string} params.operator - Operator who recorded the adjustment.
   * @param {?string} [params.transferId=null] - Identifier linking both sides of a stock transfer.
   */
  constructor({
    id,
    operation,
    quantity,
    locationId,
    locationName,
    reason,
    note = '',
    recordedAt,
    operator,
    transferId = null,
  }) {
    this.id = id;
    this.operation = operation;
    this.quantity = quantity;
    this.locationId = locationId;
    this.locationName = locationName;
    this.reason = reason;
    this.note = note.trim();
    this.recordedAt = recordedAt;
    this.operator = operator;
    this.transferId = transferId;
  }
}
