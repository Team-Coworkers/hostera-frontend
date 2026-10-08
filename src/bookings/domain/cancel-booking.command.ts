import { CancellationReason } from './model/booking.entity';

/**
 * Command used by the Bookings application layer to cancel a pending or confirmed booking.
 */
export class CancelBookingCommand {
  /** Identifier of the booking. */
  readonly bookingId: number;
  /** Cancellation reason. */
  readonly reason: CancellationReason | null;
  /** Internal note, required for the Other reason. */
  readonly note: string;

  /**
   * @param params - Command attributes.
   */
  constructor({
    bookingId,
    reason,
    note = '',
  }: {
    bookingId: number;
    reason: CancellationReason | null;
    note?: string;
  }) {
    this.bookingId = bookingId;
    this.reason = reason;
    this.note = note;
  }
}
