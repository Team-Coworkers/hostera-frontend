/**
 * Business-rule violation raised within the Rooms bounded context.
 *
 * @class RoomsError
 * @extends Error
 */
export class RoomsError extends Error {
  /**
   * @param {string} code - Identifier of the violated business rule.
   */
  constructor(code) {
    super(code);
    this.name = 'RoomsError';
    this.code = code;
  }
}
