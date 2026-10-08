/**
 * Property overview entity within the Overview bounded context.
 * It summarizes how full a property is tonight and which of its rooms need attention today.
 *
 * @class PropertyOverview
 */
export class PropertyOverview {
  /**
   * @param {Object} params - Entity attributes.
   * @param {?number} [params.propertyId=null] - Identifier of the property.
   * @param {string} [params.name=''] - Property name.
   * @param {number} [params.roomsCount=0] - Rooms of the property.
   * @param {number} [params.heldRooms=0] - Rooms held by a booking tonight.
   * @param {number} [params.roomsNeedingCleaning=0] - Rooms that need cleaning today.
   * @param {number} [params.roomsOutOfOrder=0] - Rooms blocked or out of service today.
   */
  constructor({
    propertyId = null,
    name = '',
    roomsCount = 0,
    heldRooms = 0,
    roomsNeedingCleaning = 0,
    roomsOutOfOrder = 0,
  }) {
    this.propertyId = propertyId;
    this.name = name;
    this.roomsCount = roomsCount;
    this.heldRooms = heldRooms;
    this.roomsNeedingCleaning = roomsNeedingCleaning;
    this.roomsOutOfOrder = roomsOutOfOrder;
  }

  /**
   * Share of the property's rooms held by a booking tonight.
   * @returns {number} Rate between 0 and 1.
   */
  get occupancyRate() {
    return this.roomsCount ? this.heldRooms / this.roomsCount : 0;
  }

  /**
   * Rooms that can still be sold tonight.
   * @returns {number}
   */
  get availableRooms() {
    return Math.max(this.roomsCount - this.heldRooms - this.roomsOutOfOrder, 0);
  }

  /**
   * Rooms that need attention today: cleaning, a block, or repairs.
   * @returns {number}
   */
  get alertsCount() {
    return this.roomsNeedingCleaning + this.roomsOutOfOrder;
  }
}
