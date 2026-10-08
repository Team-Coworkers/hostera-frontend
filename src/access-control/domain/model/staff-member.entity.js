/**
 * Staff member entity within the Access Control bounded context.
 * It is a read-only reference to a person who works at a property and can hold a staff credential.
 *
 * @class StaffMember
 */
export class StaffMember {
  /**
   * @param {Object} params - Entity attributes.
   * @param {?number} [params.id=null] - Staff member identifier.
   * @param {?number} [params.propertyId=null] - Identifier of the property.
   * @param {string} [params.name=''] - Full name.
   * @param {string} [params.role=''] - Job role at the property.
   */
  constructor({ id = null, propertyId = null, name = '', role = '' }) {
    this.id = id;
    this.propertyId = propertyId;
    this.name = name;
    this.role = role;
  }
}
