/**
 * Property reference used by the Rooms bounded context to scope its rooms.
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
   * @param {string} [params.currency='PEN'] - ISO 4217 currency in which the property sells its rooms.
   */
  constructor({
    id = null,
    organizationId = null,
    name = '',
    city = '',
    currency = 'PEN',
  }) {
    this.id = id;
    this.organizationId = organizationId;
    this.name = name;
    this.city = city;
    this.currency = currency;
  }
}
