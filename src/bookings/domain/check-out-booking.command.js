/**
 * Command used by the Bookings application layer to check out the guest of a checked-in booking.
 *
 * @class CheckOutBookingCommand
 */
export class CheckOutBookingCommand {
  /**
   * @param {Object} params - Command attributes.
   * @param {number} params.bookingId - Identifier of the booking.
   * @param {string} params.roomCondition - Room condition reported at departure.
   * @param {string} [params.note=''] - Internal note about the departure.
   */
  constructor({ bookingId, roomCondition, note = '' }) {
    this.bookingId = bookingId;
    this.roomCondition = roomCondition;
    this.note = note;
  }
}
