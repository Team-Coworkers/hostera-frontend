import { InventoryError } from './inventory.error';
import { StockAdjustment, StockOperation } from './stock-adjustment.entity';

/** Units in which an item is counted. */
export type InventoryUnit = 'units' | 'liters' | 'kilograms';

/** How much stock an item has compared with its threshold. */
export type StockCondition = 'in-stock' | 'low-stock' | 'out-of-stock';

/** Quantity of an item kept at a storage location. */
export interface Stock {
  locationId: number;
  quantity: number;
}

/** Attributes of an {@link InventoryItem}, as exchanged with the API. */
export interface InventoryItemAttributes {
  /** Inventory item identifier. */
  id: number | null;
  /** Identifier of the property. */
  propertyId: number | null;
  /** Item name. */
  name: string;
  /** Code, unique within the property. */
  code: string;
  /** Category of the item. */
  category: string;
  /** Unit in which the item is counted. */
  unit: InventoryUnit;
  /** Storage location where the item is usually kept. */
  primaryLocationId: number | null;
  /** Total quantity at or below which stock is low. */
  lowStockThreshold: number;
  /** Quantities by storage location. */
  stocks: Stock[];
  /** Movement history. */
  adjustments: StockAdjustment[];
}

/** Details of a stock change to apply, with its recording metadata. */
export interface StockAdjustmentData {
  operation: StockOperation;
  quantity: number;
  locationId: number | null;
  destinationLocationId?: number | null;
  reason: string;
  note?: string;
  id: string;
  recordedAt: string;
  operator: string;
  locationName: string;
  destinationLocationName?: string | null;
}

/**
 * Inventory item entity within the Inventory bounded context.
 * It is a supply the property keeps in stock across its storage locations, with its movement history.
 */
export class InventoryItem implements InventoryItemAttributes {
  /** Units in which an item is counted. */
  static readonly units: InventoryUnit[] = ['units', 'liters', 'kilograms'];

  /** Categories of inventory item. */
  static readonly categories = [
    'linen',
    'guest-amenities',
    'cleaning-supplies',
    'access-supplies',
  ];

  id: number | null;
  propertyId: number | null;
  name: string;
  code: string;
  category: string;
  unit: InventoryUnit;
  primaryLocationId: number | null;
  lowStockThreshold: number;
  stocks: Stock[];
  adjustments: StockAdjustment[];

  /**
   * @param params - Entity attributes.
   */
  constructor({
    id = null,
    propertyId = null,
    name = '',
    code = '',
    category = '',
    unit = 'units',
    primaryLocationId = null,
    lowStockThreshold = 0,
    stocks = [],
    adjustments = [],
  }: Partial<InventoryItemAttributes> = {}) {
    this.id = id;
    this.propertyId = propertyId;
    this.name = name.trim();
    this.code = code.trim();
    this.category = category.trim();
    this.unit = unit;
    this.primaryLocationId = primaryLocationId;
    this.lowStockThreshold = lowStockThreshold;
    this.stocks = stocks;
    this.adjustments = adjustments;
  }

  /**
   * Validates a quantity in a unit: never negative, and whole when counted in units.
   * @param quantity - Quantity to check.
   * @param unit - Unit of the quantity.
   * @param allowZero - Whether zero is accepted.
   * @throws InventoryError When the quantity is invalid.
   */
  static validateQuantity(
    quantity: number,
    unit: InventoryUnit,
    allowZero = false,
  ): void {
    if (
      !Number.isFinite(quantity) ||
      quantity < 0 ||
      (!allowZero && quantity === 0)
    )
      throw new InventoryError('invalid-quantity');
    if (unit === 'units' && !Number.isInteger(quantity))
      throw new InventoryError('whole-units');
  }

  /** Total quantity across storage locations. */
  get totalQuantity(): number {
    return Number(
      this.stocks
        .reduce((total, stock) => total + stock.quantity, 0)
        .toFixed(6),
    );
  }

  /** Stock condition compared with the low-stock threshold. */
  get stockCondition(): StockCondition {
    if (this.totalQuantity === 0) return 'out-of-stock';
    return this.totalQuantity <= this.lowStockThreshold
      ? 'low-stock'
      : 'in-stock';
  }

  /**
   * Quantity kept at a storage location.
   * @param locationId - Storage location identifier.
   */
  quantityAt(locationId: number | null): number {
    return (
      this.stocks.find((stock) => stock.locationId === locationId)?.quantity ??
      0
    );
  }

  /**
   * Validates the item's attributes.
   * @throws InventoryError When a business rule is violated.
   */
  validate(): void {
    if (!this.name || !this.code || !this.category || !this.primaryLocationId)
      throw new InventoryError('required-fields');
    if (!InventoryItem.units.includes(this.unit))
      throw new InventoryError('invalid-unit');
    InventoryItem.validateQuantity(this.lowStockThreshold, this.unit, true);
  }

  /**
   * Assigns a storage location to the item with no stock, when not assigned yet.
   * @param locationId - Storage location identifier.
   * @returns Item with the location assigned.
   */
  assignStorageLocation(locationId: number): InventoryItem {
    if (this.stocks.some((stock) => stock.locationId === locationId))
      return this;
    return new InventoryItem({
      ...this,
      stocks: [...this.stocks, { locationId, quantity: 0 }],
    });
  }

  /**
   * Removes a storage location from the item; only empty, non-primary locations can be removed.
   * @param locationId - Storage location identifier.
   * @returns Item without the location.
   * @throws InventoryError When the location is primary or has stock.
   */
  unassignStorageLocation(locationId: number): InventoryItem {
    if (
      this.primaryLocationId === locationId ||
      this.quantityAt(locationId) !== 0
    )
      throw new InventoryError('assignment-in-use');
    return new InventoryItem({
      ...this,
      stocks: this.stocks.filter((stock) => stock.locationId !== locationId),
    });
  }

  /**
   * Applies a stock change and records it in the movement history; a transfer records
   * an outgoing and an incoming entry that share its identifier.
   * @param adjustmentData - Stock change and its recording metadata.
   * @returns Item with the new stock and history.
   * @throws InventoryError When the change breaks a business rule.
   */
  applyStockAdjustment(adjustmentData: StockAdjustmentData): InventoryItem {
    const {
      operation,
      quantity,
      locationId,
      destinationLocationId = null,
      reason,
      note = '',
      id,
      recordedAt,
      operator,
      locationName,
      destinationLocationName = null,
    } = adjustmentData;
    InventoryItem.validateQuantity(quantity, this.unit);
    if (!StockAdjustment.reasons[operation]?.includes(reason))
      throw new InventoryError('invalid-reason');
    if (reason === 'other' && !note.trim())
      throw new InventoryError('note-required');
    if (!locationId) throw new InventoryError('location-required');
    if (
      operation === 'transfer' &&
      (!destinationLocationId || destinationLocationId === locationId)
    )
      throw new InventoryError('invalid-destination');
    if (operation !== 'in' && quantity > this.quantityAt(locationId))
      throw new InventoryError('insufficient-stock');

    const updatedStocks = this.stocks.map((stock) => ({ ...stock }));
    const newAdjustments: StockAdjustment[] = [];
    const recordQuantityChange = (
      targetId: number,
      targetName: string,
      direction: 'in' | 'out',
      recordId: string,
    ) => {
      let stock = updatedStocks.find((entry) => entry.locationId === targetId);
      if (!stock) {
        stock = { locationId: targetId, quantity: 0 };
        updatedStocks.push(stock);
      }
      stock.quantity = Number(
        (stock.quantity + (direction === 'in' ? quantity : -quantity)).toFixed(
          6,
        ),
      );
      newAdjustments.push(
        new StockAdjustment({
          id: recordId,
          operation: direction,
          quantity,
          locationId: targetId,
          locationName: targetName,
          reason,
          note,
          recordedAt,
          operator,
          transferId: operation === 'transfer' ? id : null,
        }),
      );
    };
    recordQuantityChange(
      locationId,
      locationName,
      operation === 'in' ? 'in' : 'out',
      id,
    );
    if (operation === 'transfer')
      recordQuantityChange(
        destinationLocationId!,
        destinationLocationName ?? '',
        'in',
        `${id}-in`,
      );
    return new InventoryItem({
      ...this,
      stocks: updatedStocks,
      adjustments: [...this.adjustments, ...newAdjustments],
    });
  }
}
