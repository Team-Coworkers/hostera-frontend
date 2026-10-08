/**
 * Command used by the Bookings application layer to cancel a pending or confirmed booking.
 *
 * @class CancelBookingCommand
 */
export class CancelBookingCommand {
  /**
   * @param {Object} params - Command attributes.
   * @param {number} params.bookingId - Identifier of the booking.
   * @param {string} params.reason - Cancellation reason.
   * @param {string} [params.note=''] - Internal note, required for the Other reason.
   */
  constructor({ bookingId, reason, note = '' }) {
    this.bookingId = bookingId;
    this.reason = reason;
    this.note = note;
  }
}
