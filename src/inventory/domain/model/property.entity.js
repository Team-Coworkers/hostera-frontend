/**
 * Property reference used by the Inventory bounded context to scope its supplies.
 *
 * @class Property
 */
export class Property {
  /**
   * @param {Object} params - Entity attributes.
   * @param {?number} [params.id=null] - Property identifier.
   * @param {?number} [params.organizationId=null] - Identifier of the operating organization.
   * @param {string} [params.name=''] - Property name.
   * @param {string} [params.city=''] - City where the property is located.
   */
  constructor({ id = null, organizationId = null, name = '', city = '' }) {
    this.id = id;
    this.organizationId = organizationId;
    this.name = name;
    this.city = city;
  }
}
