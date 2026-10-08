/** Attributes of a {@link PropertyOverview}. */
export interface PropertyOverviewAttributes {
  /** Identifier of the property. */
  propertyId: number | null;
  /** Property name. */
  name: string;
  /** Rooms of the property. */
  roomsCount: number;
  /** Rooms held tonight by a booking or stay. */
  heldRooms: number;
  /** Rooms that need cleaning today. */
  roomsNeedingCleaning: number;
  /** Rooms blocked or out of service today. */
  roomsOutOfOrder: number;
}

/**
 * Property overview value within the Overview bounded context.
 * It summarizes tonight's occupancy and the rooms needing attention in one property.
 */
export class PropertyOverview implements PropertyOverviewAttributes {
  propertyId: number | null;
  name: string;
  roomsCount: number;
  heldRooms: number;
  roomsNeedingCleaning: number;
  roomsOutOfOrder: number;

  /**
   * @param params - Value attributes.
   */
  constructor({
    propertyId = null,
    name = '',
    roomsCount = 0,
    heldRooms = 0,
    roomsNeedingCleaning = 0,
    roomsOutOfOrder = 0,
  }: Partial<PropertyOverviewAttributes> = {}) {
    this.propertyId = propertyId;
    this.name = name;
    this.roomsCount = roomsCount;
    this.heldRooms = heldRooms;
    this.roomsNeedingCleaning = roomsNeedingCleaning;
    this.roomsOutOfOrder = roomsOutOfOrder;
  }

  /** Share of the rooms held tonight. */
  get occupancyRate(): number {
    return this.roomsCount ? this.heldRooms / this.roomsCount : 0;
  }

  /** Rooms that can still be sold tonight. */
  get availableRooms(): number {
    return Math.max(this.roomsCount - this.heldRooms - this.roomsOutOfOrder, 0);
  }

  /** Rooms needing attention today. */
  get alertsCount(): number {
    return this.roomsNeedingCleaning + this.roomsOutOfOrder;
  }
}
