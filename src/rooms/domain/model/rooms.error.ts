/**
 * Business-rule violation raised within the Rooms bounded context.
 */
export class RoomsError extends Error {
  /** Identifier of the violated business rule. */
  readonly code: string;

  /**
   * @param code - Identifier of the violated business rule.
   */
  constructor(code: string) {
    super(code);
    this.name = 'RoomsError';
    this.code = code;
  }
}
