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
}

/**
 * Property reference used by the Inventory bounded context to scope its stock.
 */
export class Property implements PropertyAttributes {
  id: number | null;
  organizationId: number | null;
  name: string;
  city: string;

  /**
   * @param params - Entity attributes.
   */
  constructor({
    id = null,
    organizationId = null,
    name = '',
    city = '',
  }: Partial<PropertyAttributes> = {}) {
    this.id = id;
    this.organizationId = organizationId;
    this.name = name;
    this.city = city;
  }
}
