/** Day statuses that a room assignment controls. */
export type RoomAssignmentStatus = 'booked' | 'occupied';

/** Attributes of a {@link RoomAssignment}. */
export interface RoomAssignmentAttributes {
  /** Room assignment identifier. */
  id: number | null;
  /** Identifier of the property that owns the room. */
  propertyId: number | null;
  /** Identifier of the assigned room. */
  roomId: number | null;
  /** Identifier of the controlling booking. */
  bookingId: number | null;
  /** Code of the controlling booking. */
  bookingCode: string;
  /** Whether the guest is expected or staying. */
  status: RoomAssignmentStatus;
  /** First ISO night covered by the assignment. */
  startDate: string;
  /** Last ISO night covered by the assignment. */
  endDate: string;
}

/**
 * Room assignment entity within the Rooms bounded context.
 * It is a read-only reference to the booking or stay that controls a room's days, derived from the booking.
 */
export class RoomAssignment implements RoomAssignmentAttributes {
  /** Day statuses that a room assignment controls. */
  static readonly statuses: RoomAssignmentStatus[] = ['booked', 'occupied'];

  id: number | null;
  propertyId: number | null;
  roomId: number | null;
  bookingId: number | null;
  bookingCode: string;
  status: RoomAssignmentStatus;
  startDate: string;
  endDate: string;

  /**
   * @param params - Entity attributes.
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
  }: Partial<RoomAssignmentAttributes> = {}) {
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
   * @param date - ISO calendar day.
   */
  covers(date: string): boolean {
    return this.startDate <= date && date <= this.endDate;
  }

  /**
   * Whether the assignment shares at least one day with a date range.
   * @param startDate - First ISO day of the range.
   * @param endDate - Last ISO day of the range.
   */
  overlaps(startDate: string, endDate: string): boolean {
    return this.startDate <= endDate && startDate <= this.endDate;
  }
}
