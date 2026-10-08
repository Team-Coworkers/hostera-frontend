import { RoomsError } from './rooms.error.js';

/**
 * Room type entity within the Rooms bounded context.
 * It groups the rooms of a property that share capacity, beds, and base nightly rate.
 *
 * @class RoomType
 */
export class RoomType {
  /**
   * Supported room type statuses.
   * @type {string[]}
   */
  static statuses = ['active', 'inactive'];

  /**
   * Largest supported number of guests per room type.
   * @type {number}
   */
  static maxCapacity = 12;

  /**
   * @param {Object} params - Entity attributes.
   * @param {?number} [params.id=null] - Room type identifier.
   * @param {?number} [params.propertyId=null] - Identifier of the owning property.
   * @param {string} [params.name=''] - Room type name, unique within the property.
   * @param {number} [params.capacity=1] - Maximum number of guests.
   * @param {string} [params.bedConfiguration=''] - Beds the room type provides.
   * @param {number} [params.baseNightlyRate=0] - Default price of one night.
   * @param {'active'|'inactive'} [params.status='active'] - Room type status.
   */
  constructor({
    id = null,
    propertyId = null,
    name = '',
    capacity = 1,
    bedConfiguration = '',
    baseNightlyRate = 0,
    status = 'active',
  }) {
    this.id = id;
    this.propertyId = propertyId;
    this.name = name.trim();
    this.capacity = capacity;
    this.bedConfiguration = bedConfiguration.trim();
    this.baseNightlyRate = baseNightlyRate;
    this.status = status;
  }

  /**
   * Whether the room type may be assigned to rooms.
   * @returns {boolean}
   */
  get isActive() {
    return this.status === 'active';
  }

  /**
   * Derives the price of one night under a rate plan: its daily rate when set, otherwise the base nightly rate.
   * @param {string} date - ISO calendar day.
   * @param {number} ratePlanId - Rate plan identifier.
   * @param {import('./daily-rate.entity.js').DailyRate[]} dailyRates - Daily rates of the property.
   * @returns {number} Nightly rate in the property's currency.
   */
  nightlyRateOn(date, ratePlanId, dailyRates) {
    return (
      dailyRates.find((dailyRate) =>
        dailyRate.prices(this.id, ratePlanId, date),
      )?.amount ?? this.baseNightlyRate
    );
  }

  /**
   * Validates the room type's required attributes.
   * @throws {RoomsError} When a business rule is violated.
   */
  validate() {
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
