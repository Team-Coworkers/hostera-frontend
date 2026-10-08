/**
 * Business-rule violation raised within the Access Control bounded context.
 */
export class AccessControlError extends Error {
  /** Identifier of the violated business rule. */
  readonly code: string;

  /**
   * @param code - Identifier of the violated business rule.
   */
  constructor(code: string) {
    super(code);
    this.name = 'AccessControlError';
    this.code = code;
  }
}
