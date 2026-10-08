import { RoomsError } from './rooms.error.js';

/**
 * Rate plan entity within the Rooms bounded context.
 * It names the commercial conditions under which room types are sold, in the property's currency.
 *
 * @class RatePlan
 */
export class RatePlan {
  /**
   * Supported rate plan statuses.
   * @type {string[]}
   */
  static statuses = ['active', 'inactive'];

  /**
   * Services a rate plan can include besides the room.
   * @type {string[]}
   */
  static includedServicesOptions = [
    'room-only',
    'breakfast-included',
    'half-board',
    'full-board',
  ];

  /**
   * @param {Object} params - Entity attributes.
   * @param {?number} [params.id=null] - Rate plan identifier.
   * @param {?number} [params.propertyId=null] - Identifier of the owning property.
   * @param {string} [params.name=''] - Rate plan name, unique within the property.
   * @param {number[]} [params.roomTypeIds=[]] - Room types sold under the plan; empty for all room types.
   * @param {'room-only'|'breakfast-included'|'half-board'|'full-board'} [params.includedServices='room-only'] - Included services.
   * @param {boolean} [params.refundable=true] - Whether the cancellation policy applies.
   * @param {string} [params.cancellationPolicy=''] - Cancellation conditions; kept only for refundable plans.
   * @param {'active'|'inactive'} [params.status='active'] - Rate plan status.
   */
  constructor({
    id = null,
    propertyId = null,
    name = '',
    roomTypeIds = [],
    includedServices = 'room-only',
    refundable = true,
    cancellationPolicy = '',
    status = 'active',
  }) {
    this.id = id;
    this.propertyId = propertyId;
    this.name = name.trim();
    this.roomTypeIds = [...roomTypeIds];
    this.includedServices = includedServices;
    this.refundable = refundable;
    this.cancellationPolicy = refundable ? cancellationPolicy.trim() : '';
    this.status = status;
  }

  /**
   * Whether the rate plan is offered for sale.
   * @returns {boolean}
   */
  get isActive() {
    return this.status === 'active';
  }

  /**
   * Whether the plan applies to every room type of the property, including ones added later.
   * @returns {boolean}
   */
  get appliesToAllRoomTypes() {
    return !this.roomTypeIds.length;
  }

  /**
   * Whether a room type is sold under the plan.
   * @param {number} roomTypeId - Room type identifier.
   * @returns {boolean}
   */
  appliesTo(roomTypeId) {
    return this.appliesToAllRoomTypes || this.roomTypeIds.includes(roomTypeId);
  }

  /**
   * Validates the rate plan's attributes.
   * @throws {RoomsError} When a business rule is violated.
   */
  validate() {
    if (!this.name) throw new RoomsError('required-fields');
    if (!RatePlan.includedServicesOptions.includes(this.includedServices))
      throw new RoomsError('invalid-included-services');
    if (this.refundable && !this.cancellationPolicy)
      throw new RoomsError('cancellation-policy-required');
    if (!RatePlan.statuses.includes(this.status))
      throw new RoomsError('invalid-rate-plan-status');
  }
}
