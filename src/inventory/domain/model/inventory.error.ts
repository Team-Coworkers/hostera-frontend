/**
 * Business-rule violation raised within the Inventory bounded context.
 */
export class InventoryError extends Error {
  /** Identifier of the violated business rule. */
  readonly code: string;

  /**
   * @param code - Identifier of the violated business rule.
   */
  constructor(code: string) {
    super(code);
    this.name = 'InventoryError';
    this.code = code;
  }
}
