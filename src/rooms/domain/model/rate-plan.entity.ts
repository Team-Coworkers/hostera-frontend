import { RoomsError } from './rooms.error';

/** Statuses of a rate plan. */
export type RatePlanStatus = 'active' | 'inactive';

/** Services a rate plan can include besides the room. */
export type IncludedServices =
  'room-only' | 'breakfast-included' | 'half-board' | 'full-board';

/** Attributes of a {@link RatePlan}, as exchanged with the API. */
export interface RatePlanAttributes {
  /** Rate plan identifier. */
  id: number | null;
  /** Identifier of the owning property. */
  propertyId: number | null;
  /** Rate plan name, unique within the property. */
  name: string;
  /** Room types sold under the plan; empty for all room types. */
  roomTypeIds: number[];
  /** Included services. */
  includedServices: IncludedServices;
  /** Whether the cancellation policy applies. */
  refundable: boolean;
  /** Cancellation conditions; kept only for refundable plans. */
  cancellationPolicy: string;
  /** Rate plan status. */
  status: RatePlanStatus;
}

/**
 * Rate plan entity within the Rooms bounded context.
 * It names the commercial conditions under which room types are sold, in the property's currency.
 */
export class RatePlan implements RatePlanAttributes {
  /** Supported rate plan statuses. */
  static readonly statuses: RatePlanStatus[] = ['active', 'inactive'];

  /** Services a rate plan can include besides the room. */
  static readonly includedServicesOptions: IncludedServices[] = [
    'room-only',
    'breakfast-included',
    'half-board',
    'full-board',
  ];

  id: number | null;
  propertyId: number | null;
  name: string;
  roomTypeIds: number[];
  includedServices: IncludedServices;
  refundable: boolean;
  cancellationPolicy: string;
  status: RatePlanStatus;

  /**
   * @param params - Entity attributes.
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
  }: Partial<RatePlanAttributes> = {}) {
    this.id = id;
    this.propertyId = propertyId;
    this.name = name.trim();
    this.roomTypeIds = [...roomTypeIds];
    this.includedServices = includedServices;
    this.refundable = refundable;
    this.cancellationPolicy = refundable ? cancellationPolicy.trim() : '';
    this.status = status;
  }

  /** Whether the rate plan is offered for sale. */
  get isActive(): boolean {
    return this.status === 'active';
  }

  /** Whether the plan applies to every room type of the property, including ones added later. */
  get appliesToAllRoomTypes(): boolean {
    return !this.roomTypeIds.length;
  }

  /**
   * Whether a room type is sold under the plan.
   * @param roomTypeId - Room type identifier.
   */
  appliesTo(roomTypeId: number | null): boolean {
    return (
      this.appliesToAllRoomTypes ||
      (roomTypeId !== null && this.roomTypeIds.includes(roomTypeId))
    );
  }

  /**
   * Validates the rate plan's attributes.
   * @throws RoomsError When a business rule is violated.
   */
  validate(): void {
    if (!this.name) throw new RoomsError('required-fields');
    if (!RatePlan.includedServicesOptions.includes(this.includedServices))
      throw new RoomsError('invalid-included-services');
    if (this.refundable && !this.cancellationPolicy)
      throw new RoomsError('cancellation-policy-required');
    if (!RatePlan.statuses.includes(this.status))
      throw new RoomsError('invalid-rate-plan-status');
  }
}
