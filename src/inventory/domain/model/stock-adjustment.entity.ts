/** Operations that change stock. */
export type StockOperation = 'in' | 'out' | 'transfer';

/** Attributes of a {@link StockAdjustment}, as stored in its inventory item. */
export interface StockAdjustmentAttributes {
  /** Adjustment identifier. */
  id: string;
  /** Direction of the recorded quantity change. */
  operation: 'in' | 'out';
  /** Quantity moved, in the item's unit. */
  quantity: number;
  /** Storage location whose stock changed. */
  locationId: number;
  /** Name of the storage location when the change was recorded. */
  locationName: string;
  /** Why the stock changed. */
  reason: string;
  /** Internal note, required for the Other reason. */
  note: string;
  /** ISO date-time of the change. */
  recordedAt: string;
  /** Operator who recorded the change. */
  operator: string;
  /** Identifier shared by both records of a transfer. */
  transferId: string | null;
}

/**
 * Stock adjustment value within the Inventory bounded context.
 * It is an entry of an inventory item's movement history: stock that came in or went out of a location.
 */
export class StockAdjustment implements StockAdjustmentAttributes {
  /** Reasons that each operation accepts. */
  static readonly reasons: Record<StockOperation, string[]> = {
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

  id: string;
  operation: 'in' | 'out';
  quantity: number;
  locationId: number;
  locationName: string;
  reason: string;
  note: string;
  recordedAt: string;
  operator: string;
  transferId: string | null;

  /**
   * @param params - Entity attributes.
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
  }: Omit<StockAdjustmentAttributes, 'note' | 'transferId'> &
    Partial<Pick<StockAdjustmentAttributes, 'note' | 'transferId'>>) {
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
