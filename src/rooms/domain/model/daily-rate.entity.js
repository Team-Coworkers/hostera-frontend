import { RoomsError } from './rooms.error.js';

/**
 * Daily rate entity within the Rooms bounded context.
 * It sets the price of one night in a room type under a rate plan, replacing the base nightly rate.
 *
 * @class DailyRate
 */
export class DailyRate {
  /**
   * Checks whether a value is an existing calendar day in ISO `YYYY-MM-DD` format.
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
   * @param {?number} [params.id=null] - Daily rate identifier.
   * @param {?number} [params.propertyId=null] - Identifier of the owning property.
   * @param {?number} [params.ratePlanId=null] - Identifier of the rate plan.
   * @param {?number} [params.roomTypeId=null] - Identifier of the room type.
   * @param {string} [params.date=''] - ISO day of the night.
   * @param {number} [params.amount=0] - Price of the night in the property's currency.
   */
  constructor({
    id = null,
    propertyId = null,
    ratePlanId = null,
    roomTypeId = null,
    date = '',
    amount = 0,
  }) {
    this.id = id;
    this.propertyId = propertyId;
    this.ratePlanId = ratePlanId;
    this.roomTypeId = roomTypeId;
    this.date = date;
    this.amount = amount;
  }

  /**
   * Lists the nights of an inclusive range of ISO calendar days.
   * @param {string} startDate - First ISO day of the range.
   * @param {string} endDate - Last ISO day of the range.
   * @returns {string[]} ISO days from the first to the last night.
   * @throws {RoomsError} When a day is invalid or the range ends before it starts.
   */
  static nightsBetween(startDate, endDate) {
    if (
      !DailyRate.#isCalendarDay(startDate) ||
      !DailyRate.#isCalendarDay(endDate) ||
      startDate > endDate
    )
      throw new RoomsError('invalid-date-range');
    const nights = [];
    for (
      let date = startDate;
      date <= endDate;
      date = DailyRate.#addDays(date, 1)
    )
      nights.push(date);
    return nights;
  }

  /**
   * Whether the daily rate prices a room type's night under a rate plan.
   * @param {number} roomTypeId - Room type identifier.
   * @param {number} ratePlanId - Rate plan identifier.
   * @param {string} date - ISO calendar day.
   * @returns {boolean}
   */
  prices(roomTypeId, ratePlanId, date) {
    return (
      this.roomTypeId === roomTypeId &&
      this.ratePlanId === ratePlanId &&
      this.date === date
    );
  }

  /**
   * Validates the daily rate's attributes.
   * @throws {RoomsError} When a business rule is violated.
   */
  validate() {
    if (!this.ratePlanId || !this.roomTypeId)
      throw new RoomsError('required-fields');
    if (!DailyRate.#isCalendarDay(this.date))
      throw new RoomsError('invalid-date-range');
    if (!Number.isFinite(this.amount) || this.amount <= 0)
      throw new RoomsError('invalid-nightly-rate');
  }
}
