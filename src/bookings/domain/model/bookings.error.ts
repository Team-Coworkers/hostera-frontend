/**
 * Business-rule violation raised within the Bookings bounded context.
 */
export class BookingsError extends Error {
  /** Identifier of the violated business rule. */
  readonly code: string;

  /**
   * @param code - Identifier of the violated business rule.
   */
  constructor(code: string) {
    super(code);
    this.name = 'BookingsError';
    this.code = code;
  }
}
