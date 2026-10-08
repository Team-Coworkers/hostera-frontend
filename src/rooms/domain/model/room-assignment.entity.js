/**
 * Room assignment entity within the Rooms bounded context.
 * It is a read-only reference to the booking or stay that controls a room's days, derived from the booking.
 *
 * @class RoomAssignment
 */
export class RoomAssignment {
  /**
   * Day statuses that a room assignment controls.
   * @type {string[]}
   */
  static statuses = ['booked', 'occupied'];

  /**
   * @param {Object} params - Entity attributes.
   * @param {?number} [params.id=null] - Room assignment identifier.
   * @param {?number} [params.propertyId=null] - Identifier of the property that owns the room.
   * @param {?number} [params.roomId=null] - Identifier of the assigned room.
   * @param {?number} [params.bookingId=null] - Identifier of the controlling booking.
   * @param {string} [params.bookingCode=''] - Code of the controlling booking.
   * @param {'booked'|'occupied'} [params.status='booked'] - Whether the guest is expected or staying.
   * @param {string} [params.startDate=''] - First ISO night covered by the assignment.
   * @param {string} [params.endDate=''] - Last ISO night covered by the assignment.
   */
  constructor({
    id = null,
    propertyId = null,
    roomId = null,
    bookingId = null,
    bookingCode = '',
    status = 'booked',
    startDate = '',
    endDate = '',
  }) {
    this.id = id;
    this.propertyId = propertyId;
    this.roomId = roomId;
    this.bookingId = bookingId;
    this.bookingCode = bookingCode;
    this.status = status;
    this.startDate = startDate;
    this.endDate = endDate;
  }

  /**
   * Whether the assignment covers a calendar day.
   * @param {string} date - ISO calendar day.
   * @returns {boolean}
   */
  covers(date) {
    return this.startDate <= date && date <= this.endDate;
  }

  /**
   * Whether the assignment shares at least one day with a date range.
   * @param {string} startDate - First ISO day of the range.
   * @param {string} endDate - Last ISO day of the range.
   * @returns {boolean}
   */
  overlaps(startDate, endDate) {
    return this.startDate <= endDate && startDate <= this.endDate;
  }
}
