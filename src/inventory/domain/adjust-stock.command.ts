import { StockOperation } from './model/stock-adjustment.entity';

/**
 * Command used by the Inventory application layer to receive, issue, or transfer stock of an item.
 */
export class AdjustStockCommand {
  /** Operations that can be requested. */
  static readonly operations: StockOperation[] = ['in', 'out', 'transfer'];

  /** Identifier of the inventory item. */
  readonly inventoryItemId: number;
  /** Operation to apply. */
  readonly operation: StockOperation;
  /** Quantity to move, in the item's unit. */
  readonly quantity: number;
  /** Storage location whose stock changes; the origin of a transfer. */
  readonly locationId: number | null;
  /** Destination storage location of a transfer. */
  readonly destinationLocationId: number | null;
  /** Why the stock changes. */
  readonly reason: string;
  /** Internal note, required for the Other reason. */
  readonly note: string;

  /**
   * @param params - Command attributes.
   */
  constructor({
    inventoryItemId,
    operation,
    quantity,
    locationId,
    destinationLocationId = null,
    reason,
    note = '',
  }: {
    inventoryItemId: number;
    operation: StockOperation;
    quantity: number;
    locationId: number | null;
    destinationLocationId?: number | null;
    reason: string;
    note?: string;
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
