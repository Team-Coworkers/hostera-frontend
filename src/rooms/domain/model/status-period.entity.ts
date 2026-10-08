import { CalendarDay } from './calendar-day';
import { RoomsError } from './rooms.error';

/** Operational statuses that property staff can set. */
export type OperationalStatus = 'blocked' | 'out-of-service' | 'needs-cleaning';

/** Attributes of a {@link StatusPeriod}, as exchanged with the API. */
export interface StatusPeriodAttributes {
  /** Status period identifier. */
  id: number | null;
  /** Identifier of the property that owns the room. */
  propertyId: number | null;
  /** Identifier of the room. */
  roomId: number | null;
  /** Operational status. */
  status: OperationalStatus;
  /** First ISO day covered by the period. */
  startDate: string;
  /** Last ISO day covered by the period. */
  endDate: string;
  /** Why the status was set. */
  reason: string;
}

/**
 * Status period entity within the Rooms bounded context.
 * It records the days on which property staff set one operational status for a room.
 */
export class StatusPeriod implements StatusPeriodAttributes {
  /** Operational statuses that property staff can set. */
  static readonly statuses: OperationalStatus[] = [
    'blocked',
    'out-of-service',
    'needs-cleaning',
  ];

  id: number | null;
  propertyId: number | null;
  roomId: number | null;
  status: OperationalStatus;
  startDate: string;
  endDate: string;
  reason: string;

  /**
   * @param params - Entity attributes.
   */
  constructor({
    id = null,
    propertyId = null,
    roomId = null,
    status = 'blocked',
    startDate = '',
    endDate = '',
    reason = '',
  }: Partial<StatusPeriodAttributes> = {}) {
    this.id = id;
    this.propertyId = propertyId;
    this.roomId = roomId;
    this.status = status;
    this.startDate = startDate;
    this.endDate = endDate;
    this.reason = reason.trim();
  }

  /** Whether the status keeps the room from being booked; a room that needs cleaning can still be booked. */
  get preventsBooking(): boolean {
    return this.status !== 'needs-cleaning';
  }

  /**
   * Whether the period covers a calendar day.
   * @param date - ISO calendar day.
   */
  covers(date: string): boolean {
    return this.startDate <= date && date <= this.endDate;
  }

  /**
   * Whether the period shares at least one day with a date range.
   * @param startDate - First ISO day of the range.
   * @param endDate - Last ISO day of the range.
   */
  overlaps(startDate: string, endDate: string): boolean {
    return this.startDate <= endDate && startDate <= this.endDate;
  }

  /**
   * Validates an inclusive range of ISO calendar days.
   * @param startDate - First ISO day of the range.
   * @param endDate - Last ISO day of the range.
   * @throws RoomsError When a day is invalid or the range ends before it starts.
   */
  static validateDateRange(startDate: string, endDate: string): void {
    if (
      !CalendarDay.isCalendarDay(startDate) ||
      !CalendarDay.isCalendarDay(endDate) ||
      startDate > endDate
    )
      throw new RoomsError('invalid-date-range');
  }

  /**
   * Removes a date range from the period, so another status can take those days.
   * A period that surrounds the range keeps its first part and continues as a new period.
   * @param startDate - First ISO day to remove.
   * @param endDate - Last ISO day to remove.
   * @returns Remaining periods: none, the trimmed period, or both split parts.
   */
  withoutDays(startDate: string, endDate: string): StatusPeriod[] {
    if (!this.overlaps(startDate, endDate)) return [this];
    const remaining: StatusPeriod[] = [];
    if (this.startDate < startDate)
      remaining.push(
        new StatusPeriod({
          ...this,
          endDate: CalendarDay.addDays(startDate, -1),
        }),
      );
    if (this.endDate > endDate)
      remaining.push(
        new StatusPeriod({
          ...this,
          id: remaining.length ? null : this.id,
          startDate: CalendarDay.addDays(endDate, 1),
        }),
      );
    return remaining;
  }

  /**
   * Validates the status period's attributes.
   * @throws RoomsError When a business rule is violated.
   */
  validate(): void {
    if (!this.roomId) throw new RoomsError('required-fields');
    if (!StatusPeriod.statuses.includes(this.status))
      throw new RoomsError('invalid-status');
    StatusPeriod.validateDateRange(this.startDate, this.endDate);
    if (!this.reason) throw new RoomsError('reason-required');
  }
}
