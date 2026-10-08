import { InventoryError } from './inventory.error';

/** Kinds of place where stock is kept. */
export type StorageLocationType =
  'warehouse' | 'closet' | 'front-desk' | 'service-area';

/** Attributes of a {@link StorageLocation}, as exchanged with the API. */
export interface StorageLocationAttributes {
  /** Storage location identifier. */
  id: number | null;
  /** Identifier of the property. */
  propertyId: number | null;
  /** Name, unique within the property. */
  name: string;
  /** Code, unique within the property and fixed once created. */
  code: string;
  /** Kind of place. */
  type: StorageLocationType;
  /** Area of the property where it is. */
  area: string;
  /** Team responsible for its stock. */
  responsibleTeam: string;
  /** Free description. */
  description: string;
}

/**
 * Storage location entity within the Inventory bounded context.
 * It is a place of a property where inventory items are kept.
 */
export class StorageLocation implements StorageLocationAttributes {
  /** Kinds of place where stock is kept. */
  static readonly types: StorageLocationType[] = [
    'warehouse',
    'closet',
    'front-desk',
    'service-area',
  ];

  id: number | null;
  propertyId: number | null;
  name: string;
  code: string;
  type: StorageLocationType;
  area: string;
  responsibleTeam: string;
  description: string;

  /**
   * @param params - Entity attributes.
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
  }: Partial<StorageLocationAttributes> = {}) {
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
   * Validates the storage location's attributes.
   * @throws InventoryError When a business rule is violated.
   */
  validate(): void {
    if (!this.name || !this.code || !this.area || !this.responsibleTeam)
      throw new InventoryError('required-fields');
    if (!StorageLocation.types.includes(this.type))
      throw new InventoryError('invalid-location-type');
  }
}
