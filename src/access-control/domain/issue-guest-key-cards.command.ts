/**
 * Command used to register the key cards encoded for a guest during check-in.
 */
export class IssueGuestKeyCardsCommand {
  /** Identifier of the booking. */
  readonly bookingId: number | null;
  /** Code of the booking. */
  readonly bookingCode: string;
  /** Room the cards open. */
  readonly roomId: number | null;
  /** Guest who holds the cards. */
  readonly holderName: string;
  /** ISO day the stay ends; access lasts until the check-out time. */
  readonly checkOutDate: string;
  /** IDs of the encoded cards. */
  readonly cardIds: string[];

  /**
   * @param params - Command attributes.
   */
  constructor({
    bookingId,
    bookingCode,
    roomId,
    holderName,
    checkOutDate,
    cardIds,
  }: {
    bookingId: number | null;
    bookingCode: string;
    roomId: number | null;
    holderName: string;
    checkOutDate: string;
    cardIds: string[];
  }) {
    this.bookingId = bookingId;
    this.bookingCode = bookingCode;
    this.roomId = roomId;
    this.holderName = holderName;
    this.checkOutDate = checkOutDate;
    this.cardIds = cardIds;
  }
}
