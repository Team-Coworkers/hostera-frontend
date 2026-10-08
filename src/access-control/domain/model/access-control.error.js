/**
 * Business-rule violation raised within the Access Control bounded context.
 *
 * @class AccessControlError
 * @extends Error
 */
export class AccessControlError extends Error {
  /**
   * @param {string} code - Identifier of the violated business rule.
   */
  constructor(code) {
    super(code);
    this.name = 'AccessControlError';
    this.code = code;
  }
}
