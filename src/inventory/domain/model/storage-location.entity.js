import { InventoryError } from './inventory.error.js';

/**
 * Storage location entity within the Inventory bounded context.
 *
 * @class StorageLocation
 */
export class StorageLocation {
  /**
   * Supported storage location types.
   * @type {string[]}
   */
  static types = ['warehouse', 'closet', 'front-desk', 'service-area'];

  /**
   * @param {Object} params - Entity attributes.
   * @param {?number} [params.id=null] - Storage location identifier.
   * @param {?number} [params.propertyId=null] - Identifier of the owning property.
   * @param {string} [params.name=''] - Storage location name.
   * @param {string} [params.code=''] - Storage location code, unique within the property.
   * @param {string} [params.type='warehouse'] - Storage location type.
   * @param {string} [params.area=''] - Floor or area within the property.
   * @param {string} [params.responsibleTeam=''] - Team responsible for the location.
   * @param {string} [params.description=''] - Optional description.
   */
  constructor({
    id = null,
    propertyId = null,
    name = '',
    code = '',
    type = 'warehouse',
    area = '',
    responsibleTeam = '',
    description = '',
  }) {
    this.id = id;
    this.propertyId = propertyId;
    this.name = name.trim();
    this.code = code.trim();
    this.type = type;
    this.area = area.trim();
    this.responsibleTeam = responsibleTeam.trim();
    this.description = description.trim();
  }

  /**
   * Validates the storage location's required attributes.
   * @throws {InventoryError} When a business rule is violated.
   */
  validate() {
    if (!this.name || !this.code || !this.area || !this.responsibleTeam)
      throw new InventoryError('required-fields');
    if (!StorageLocation.types.includes(this.type))
      throw new InventoryError('invalid-location-type');
  }
}
