/**
 * Command used by the Bookings application layer to check in the guest of a confirmed booking.
 *
 * @class CheckInBookingCommand
 */
export class CheckInBookingCommand {
  /**
   * @param {Object} params - Command attributes.
   * @param {number} params.bookingId - Identifier of the booking.
   * @param {string} params.documentType - Type of the identity document shown by the guest.
   * @param {string} params.documentNumber - Number of the identity document.
   * @param {boolean} params.documentVerified - Whether staff verified the original document.
   * @param {string[]} [params.keyCardIds=[]] - IDs of the key cards encoded for the guest.
   */
  constructor({
    bookingId,
    documentType,
    documentNumber,
    documentVerified,
    keyCardIds = [],
  }) {
    this.bookingId = bookingId;
    this.documentType = documentType;
    this.documentNumber = documentNumber;
    this.documentVerified = documentVerified;
    this.keyCardIds = keyCardIds;
  }
}
