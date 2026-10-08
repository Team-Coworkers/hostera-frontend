import { RoomsError } from './rooms.error.js';

/**
 * Room entity within the Rooms bounded context.
 * It takes its capacity and bed configuration from its room type.
 *
 * @class Room
 */
export class Room {
  /**
   * Day statuses a room can have, from sellable to unusable.
   * @type {string[]}
   */
  static dayStatuses = [
    'available',
    'booked',
    'occupied',
    'needs-cleaning',
    'blocked',
    'out-of-service',
  ];

  /**
   * @param {Object} params - Entity attributes.
   * @param {?number} [params.id=null] - Room identifier.
   * @param {?number} [params.propertyId=null] - Identifier of the owning property.
   * @param {string} [params.number=''] - Room number, unique within the property.
   * @param {?number} [params.roomTypeId=null] - Identifier of the room type.
   * @param {?number} [params.floor=null] - Building level of the room.
   */
  constructor({
    id = null,
    propertyId = null,
    number = '',
    roomTypeId = null,
    floor = null,
  }) {
    this.id = id;
    this.propertyId = propertyId;
    this.number = String(number).trim();
    this.roomTypeId = roomTypeId;
    this.floor = floor;
  }

  /**
   * Derives the room's day status: its room assignment first, then its operational status, otherwise Available.
   * @param {string} date - ISO calendar day.
   * @param {import('./room-assignment.entity.js').RoomAssignment[]} roomAssignments - Room assignments of the property.
   * @param {import('./status-period.entity.js').StatusPeriod[]} statusPeriods - Status periods of the property.
   * @returns {'available'|'booked'|'occupied'|'needs-cleaning'|'blocked'|'out-of-service'}
   */
  dayStatusOn(date, roomAssignments, statusPeriods) {
    const coversRoomDay = (entry) =>
      entry.roomId === this.id && entry.covers(date);
    return (
      roomAssignments.find(coversRoomDay)?.status ??
      statusPeriods.find(coversRoomDay)?.status ??
      'available'
    );
  }

  /**
   * Validates the room's required attributes.
   * @throws {RoomsError} When a business rule is violated.
   */
  validate() {
    if (!this.number || !this.roomTypeId)
      throw new RoomsError('required-fields');
    if (this.floor !== null && !Number.isInteger(this.floor))
      throw new RoomsError('invalid-floor');
  }
}
