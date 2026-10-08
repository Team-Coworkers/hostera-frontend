/**
 * Business-rule violation raised within the Bookings bounded context.
 *
 * @class BookingsError
 * @extends Error
 */
export class BookingsError extends Error {
  /**
   * @param {string} code - Identifier of the violated business rule.
   */
  constructor(code) {
    super(code);
    this.name = 'BookingsError';
    this.code = code;
  }
}
