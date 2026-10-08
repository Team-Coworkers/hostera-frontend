import { CalendarDay } from './calendar-day';
import { RoomsError } from './rooms.error';

/** Attributes of a {@link DailyRate}, as exchanged with the API. */
export interface DailyRateAttributes {
  /** Daily rate identifier. */
  id: number | null;
  /** Identifier of the owning property. */
  propertyId: number | null;
  /** Identifier of the rate plan. */
  ratePlanId: number | null;
  /** Identifier of the room type. */
  roomTypeId: number | null;
  /** ISO day of the night. */
  date: string;
  /** Price of the night in the property's currency. */
  amount: number;
}

/**
 * Daily rate entity within the Rooms bounded context.
 * It sets the price of one night in a room type under a rate plan, replacing the base nightly rate.
 */
export class DailyRate implements DailyRateAttributes {
  id: number | null;
  propertyId: number | null;
  ratePlanId: number | null;
  roomTypeId: number | null;
  date: string;
  amount: number;

  /**
   * @param params - Entity attributes.
   */
  constructor({
    id = null,
    propertyId = null,
    ratePlanId = null,
    roomTypeId = null,
    date = '',
    amount = 0,
  }: Partial<DailyRateAttributes> = {}) {
    this.id = id;
    this.propertyId = propertyId;
    this.ratePlanId = ratePlanId;
    this.roomTypeId = roomTypeId;
    this.date = date;
    this.amount = amount;
  }

  /**
   * Lists the nights of an inclusive range of ISO calendar days.
   * @param startDate - First ISO day of the range.
   * @param endDate - Last ISO day of the range.
   * @returns ISO days from the first to the last night.
   * @throws RoomsError When a day is invalid or the range ends before it starts.
   */
  static nightsBetween(startDate: string, endDate: string): string[] {
    if (
      !CalendarDay.isCalendarDay(startDate) ||
      !CalendarDay.isCalendarDay(endDate) ||
      startDate > endDate
    )
      throw new RoomsError('invalid-date-range');
    const nights: string[] = [];
    for (
      let date = startDate;
      date <= endDate;
      date = CalendarDay.addDays(date, 1)
    )
      nights.push(date);
    return nights;
  }

  /**
   * Whether the daily rate prices a room type's night under a rate plan.
   * @param roomTypeId - Room type identifier.
   * @param ratePlanId - Rate plan identifier.
   * @param date - ISO calendar day.
   */
  prices(
    roomTypeId: number | null,
    ratePlanId: number | null,
    date: string,
  ): boolean {
    return (
      this.roomTypeId === roomTypeId &&
      this.ratePlanId === ratePlanId &&
      this.date === date
    );
  }

  /**
   * Validates the daily rate's attributes.
   * @throws RoomsError When a business rule is violated.
   */
  validate(): void {
    if (!this.ratePlanId || !this.roomTypeId)
      throw new RoomsError('required-fields');
    if (!CalendarDay.isCalendarDay(this.date))
      throw new RoomsError('invalid-date-range');
    if (!Number.isFinite(this.amount) || this.amount <= 0)
      throw new RoomsError('invalid-nightly-rate');
  }
}
