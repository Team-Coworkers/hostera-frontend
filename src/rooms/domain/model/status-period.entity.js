import { RoomsError } from './rooms.error.js';

/**
 * Status period entity within the Rooms bounded context.
 * It records the days on which property staff set one operational status for a room.
 *
 * @class StatusPeriod
 */
export class StatusPeriod {
  /**
   * Operational statuses that property staff can set.
   * @type {string[]}
   */
  static statuses = ['blocked', 'out-of-service', 'needs-cleaning'];

  /**
   * Checks whether a value is an existing calendar day in ISO `YYYY-MM-DD` format.
   * ISO days compare chronologically as text, so periods keep them as strings.
   * @param {*} value - Value to check.
   * @private
   * @returns {boolean}
   */
  static #isCalendarDay(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
      return false;
    const date = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }

  /**
   * Moves an ISO calendar day by a number of days.
   * @param {string} value - ISO calendar day.
   * @param {number} days - Days to add; negative values move backwards.
   * @private
   * @returns {string} ISO calendar day.
   */
  static #addDays(value, days) {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  /**
   * @param {Object} params - Entity attributes.
   * @param {?number} [params.id=null] - Status period identifier.
   * @param {?number} [params.propertyId=null] - Identifier of the property that owns the room.
   * @param {?number} [params.roomId=null] - Identifier of the room.
   * @param {'blocked'|'out-of-service'|'needs-cleaning'} [params.status='blocked'] - Operational status.
   * @param {string} [params.startDate=''] - First ISO day covered by the period.
   * @param {string} [params.endDate=''] - Last ISO day covered by the period.
   * @param {string} [params.reason=''] - Why the status was set.
   */
  constructor({
    id = null,
    propertyId = null,
    roomId = null,
    status = 'blocked',
    startDate = '',
    endDate = '',
    reason = '',
  }) {
    this.id = id;
    this.propertyId = propertyId;
    this.roomId = roomId;
    this.status = status;
    this.startDate = startDate;
    this.endDate = endDate;
    this.reason = reason.trim();
  }

  /**
   * Whether the status keeps the room from being booked; a room that needs cleaning can still be booked.
   * @returns {boolean}
   */
  get preventsBooking() {
    return this.status !== 'needs-cleaning';
  }

  /**
   * Whether the period covers a calendar day.
   * @param {string} date - ISO calendar day.
   * @returns {boolean}
   */
  covers(date) {
    return this.startDate <= date && date <= this.endDate;
  }

  /**
   * Whether the period shares at least one day with a date range.
   * @param {string} startDate - First ISO day of the range.
   * @param {string} endDate - Last ISO day of the range.
   * @returns {boolean}
   */
  overlaps(startDate, endDate) {
    return this.startDate <= endDate && startDate <= this.endDate;
  }

  /**
   * Validates an inclusive range of ISO calendar days.
   * @param {string} startDate - First ISO day of the range.
   * @param {string} endDate - Last ISO day of the range.
   * @throws {RoomsError} When a day is invalid or the range ends before it starts.
   */
  static validateDateRange(startDate, endDate) {
    if (
      !StatusPeriod.#isCalendarDay(startDate) ||
      !StatusPeriod.#isCalendarDay(endDate) ||
      startDate > endDate
    )
      throw new RoomsError('invalid-date-range');
  }

  /**
   * Removes a date range from the period, so another status can take those days.
   * A period that surrounds the range keeps its first part and continues as a new period.
   * @param {string} startDate - First ISO day to remove.
   * @param {string} endDate - Last ISO day to remove.
   * @returns {StatusPeriod[]} Remaining periods: none, the trimmed period, or both split parts.
   */
  withoutDays(startDate, endDate) {
    if (!this.overlaps(startDate, endDate)) return [this];
    const remaining = [];
    if (this.startDate < startDate)
      remaining.push(
        new StatusPeriod({
          ...this,
          endDate: StatusPeriod.#addDays(startDate, -1),
        }),
      );
    if (this.endDate > endDate)
      remaining.push(
        new StatusPeriod({
          ...this,
          id: remaining.length ? null : this.id,
          startDate: StatusPeriod.#addDays(endDate, 1),
        }),
      );
    return remaining;
  }

  /**
   * Validates the status period's attributes.
   * @throws {RoomsError} When a business rule is violated.
   */
  validate() {
    if (!this.roomId) throw new RoomsError('required-fields');
    if (!StatusPeriod.statuses.includes(this.status))
      throw new RoomsError('invalid-status');
    StatusPeriod.validateDateRange(this.startDate, this.endDate);
    if (!this.reason) throw new RoomsError('reason-required');
  }
}
