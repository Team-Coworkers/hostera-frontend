/** Attributes of a {@link Property}, as exchanged with the API. */
export interface PropertyAttributes {
  /** Property identifier. */
  id: number | null;
  /** Identifier of the operating organization. */
  organizationId: number | null;
  /** Property name. */
  name: string;
  /** City where the property is located. */
  city: string;
  /** ISO 4217 currency in which the property sells its rooms. */
  currency: string;
}

/**
 * Property reference used by the Rooms bounded context to scope its rooms.
 */
export class Property implements PropertyAttributes {
  id: number | null;
  organizationId: number | null;
  name: string;
  city: string;
  currency: string;

  /**
   * @param params - Entity attributes.
   */
  constructor({
    id = null,
    organizationId = null,
    name = '',
    city = '',
    currency = 'PEN',
  }: Partial<PropertyAttributes> = {}) {
    this.id = id;
    this.organizationId = organizationId;
    this.name = name;
    this.city = city;
    this.currency = currency;
  }
}
