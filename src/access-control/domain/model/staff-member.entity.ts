/** Attributes of a {@link StaffMember}, as exchanged with the API. */
export interface StaffMemberAttributes {
  /** Staff member identifier. */
  id: number | null;
  /** Identifier of the property. */
  propertyId: number | null;
  /** Full name. */
  name: string;
  /** Job role at the property. */
  role: string;
}

/**
 * Staff member entity within the Access Control bounded context.
 * It is a read-only reference to a person who works at a property and can hold a staff credential.
 */
export class StaffMember implements StaffMemberAttributes {
  id: number | null;
  propertyId: number | null;
  name: string;
  role: string;

  /**
   * @param params - Entity attributes.
   */
  constructor({
    id = null,
    propertyId = null,
    name = '',
    role = '',
  }: Partial<StaffMemberAttributes> = {}) {
    this.id = id;
    this.propertyId = propertyId;
    this.name = name;
    this.role = role;
  }
}
