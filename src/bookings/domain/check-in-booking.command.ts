import { DocumentType } from './model/booking.entity';

/**
 * Command used by the Bookings application layer to check in the guest of a confirmed booking.
 */
export class CheckInBookingCommand {
  /** Identifier of the booking. */
  readonly bookingId: number;
  /** Type of the identity document shown by the guest. */
  readonly documentType: DocumentType | null;
  /** Number of the identity document. */
  readonly documentNumber: string;
  /** Whether staff verified the original document. */
  readonly documentVerified: boolean;
  /** IDs of the key cards encoded for the guest. */
  readonly keyCardIds: string[];

  /**
   * @param params - Command attributes.
   */
  constructor({
    bookingId,
    documentType,
    documentNumber,
    documentVerified,
    keyCardIds = [],
  }: {
    bookingId: number;
    documentType: DocumentType | null;
    documentNumber: string;
    documentVerified: boolean;
    keyCardIds?: string[];
  }) {
    this.bookingId = bookingId;
    this.documentType = documentType;
    this.documentNumber = documentNumber;
    this.documentVerified = documentVerified;
    this.keyCardIds = keyCardIds;
  }
}
