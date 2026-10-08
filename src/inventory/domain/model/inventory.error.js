/**
 * Business-rule violation raised within the Inventory bounded context.
 *
 * @class InventoryError
 * @extends Error
 */
export class InventoryError extends Error {
  /**
   * @param {string} code - Identifier of the violated business rule.
   */
  constructor(code) {
    super(code);
    this.name = 'InventoryError';
    this.code = code;
  }
}
