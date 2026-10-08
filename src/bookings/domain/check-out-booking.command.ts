import { RoomCondition } from './model/booking.entity';

/**
 * Command used by the Bookings application layer to check out the guest of a checked-in booking.
 */
export class CheckOutBookingCommand {
  /** Identifier of the booking. */
  readonly bookingId: number;
  /** Room condition reported at departure. */
  readonly roomCondition: RoomCondition | null;
  /** Internal note about the departure. */
  readonly note: string;

  /**
   * @param params - Command attributes.
   */
  constructor({
    bookingId,
    roomCondition,
    note = '',
  }: {
    bookingId: number;
    roomCondition: RoomCondition | null;
    note?: string;
  }) {
    this.bookingId = bookingId;
    this.roomCondition = roomCondition;
    this.note = note;
  }
}
