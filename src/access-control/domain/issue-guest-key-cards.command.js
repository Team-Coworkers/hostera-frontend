/**
 * Command used to register the key cards encoded for a guest during check-in.
 *
 * @class IssueGuestKeyCardsCommand
 */
export class IssueGuestKeyCardsCommand {
  /**
   * @param {Object} params - Command attributes.
   * @param {number} params.bookingId - Identifier of the booking.
   * @param {string} params.bookingCode - Code of the booking.
   * @param {number} params.roomId - Room the cards open.
   * @param {string} params.holderName - Guest who holds the cards.
   * @param {string} params.checkOutDate - ISO day the stay ends; access lasts until the check-out time.
   * @param {string[]} params.cardIds - IDs of the encoded cards.
   */
  constructor({
    bookingId,
    bookingCode,
    roomId,
    holderName,
    checkOutDate,
    cardIds,
  }) {
    this.bookingId = bookingId;
    this.bookingCode = bookingCode;
    this.roomId = roomId;
    this.holderName = holderName;
    this.checkOutDate = checkOutDate;
    this.cardIds = cardIds;
  }
}
