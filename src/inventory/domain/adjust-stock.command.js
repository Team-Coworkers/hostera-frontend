/**
 * Command used by the Inventory application layer to request a stock adjustment or transfer.
 *
 * @class AdjustStockCommand
 */
export class AdjustStockCommand {
  /**
   * Supported stock operations.
   * @type {string[]}
   */
  static operations = ['in', 'out', 'transfer'];

  /**
   * @param {Object} params - Command attributes.
   * @param {number} params.inventoryItemId - Identifier of the adjusted inventory item.
   * @param {'in'|'out'|'transfer'} params.operation - Requested stock operation.
   * @param {number} params.quantity - Quantity to adjust.
   * @param {number} params.locationId - Identifier of the adjusted or origin storage location.
   * @param {?number} [params.destinationLocationId=null] - Destination storage location for transfers.
   * @param {string} params.reason - Adjustment reason.
   * @param {string} [params.note=''] - Optional explanation, required when the reason is other.
   */
  constructor({
    inventoryItemId,
    operation,
    quantity,
    locationId,
    destinationLocationId = null,
    reason,
    note = '',
  }) {
    this.inventoryItemId = inventoryItemId;
    this.operation = operation;
    this.quantity = quantity;
    this.locationId = locationId;
    this.destinationLocationId = destinationLocationId;
    this.reason = reason;
    this.note = note;
  }
}
