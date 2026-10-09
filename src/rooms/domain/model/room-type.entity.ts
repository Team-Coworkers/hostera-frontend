import { DailyRate } from './daily-rate.entity';
import { RoomsError } from './rooms.error';

/** Statuses of a room type. */
export type RoomTypeStatus = 'active' | 'inactive';

/** Attributes of a {@link RoomType}, as exchanged with the API. */
export interface RoomTypeAttributes {
  /** Room type identifier. */
  id: number | null;
  /** Identifier of the owning property. */
  propertyId: number | null;
  /** Room type name, unique within the property. */
  name: string;
  /** Maximum number of guests. */
  capacity: number;
  /** Beds the room type provides. */
  bedConfiguration: string;
  /** Default price of one night. */
  baseNightlyRate: number;
  /** Room type status. */
  status: RoomTypeStatus;
}

/**
 * Room type entity within the Rooms bounded context.
 * It groups the rooms of a property that share capacity, beds, and base nightly rate.
 */
export class RoomType implements RoomTypeAttributes {
  /** Supported room type statuses. */
  static readonly statuses: RoomTypeStatus[] = ['active', 'inactive'];

  /** Largest supported number of guests per room type. */
  static readonly maxCapacity = 12;

  id: number | null;
  propertyId: number | null;
  name: string;
  capacity: number;
  bedConfiguration: string;
  baseNightlyRate: number;
  status: RoomTypeStatus;

  /**
   * @param params - Entity attributes.
   */
  constructor({
    id = null,
    propertyId = null,
    name = '',
    capacity = 1,
    bedConfiguration = '',
    baseNightlyRate = 0,
    status = 'active',
  }: Partial<RoomTypeAttributes> = {}) {
    this.id = id;
    this.propertyId = propertyId;
    this.name = name.trim();
    this.capacity = capacity;
    this.bedConfiguration = bedConfiguration.trim();
    this.baseNightlyRate = baseNightlyRate;
    this.status = status;
  }

  /** Whether the room type may be assigned to rooms. */
  get isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Derives the price of one night under a rate plan: its daily rate when set, otherwise the base nightly rate.
   * @param date - ISO calendar day.
   * @param ratePlanId - Rate plan identifier.
   * @param dailyRates - Daily rates of the property.
   * @returns Nightly rate in the property's currency.
   */
  nightlyRateOn(
    date: string,
    ratePlanId: number | null,
    dailyRates: DailyRate[],
  ): number {
    return (
      dailyRates.find((dailyRate) =>
        dailyRate.prices(this.id, ratePlanId, date),
      )?.amount ?? this.baseNightlyRate
    );
  }

  /**
   * Validates the room type's required attributes.
   * @throws RoomsError When a business rule is violated.
   */
  validate(): void {
    if (!this.name || !this.bedConfiguration)
      throw new RoomsError('required-fields');
    if (
      !Number.isInteger(this.capacity) ||
      this.capacity < 1 ||
      this.capacity > RoomType.maxCapacity
    )
      throw new RoomsError('invalid-capacity');
    if (!Number.isFinite(this.baseNightlyRate) || this.baseNightlyRate <= 0)
      throw new RoomsError('invalid-rate');
    if (!RoomType.statuses.includes(this.status))
      throw new RoomsError('invalid-room-type-status');
  }
}
