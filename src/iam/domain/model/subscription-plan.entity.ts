/** Identifier of a self-service subscription plan. */
export type PlanId = 'starter' | 'professional';

/** How a plan charges its monthly price. */
export type PricingUnit = 'property' | 'room';

/**
 * Self-service subscription plan offered on the landing page. Starter charges per
 * property for one hotel with up to 10 rooms; Professional charges per room for chains
 * with 2 to 5 properties. Enterprise is sold through the sales team, not this catalog.
 */
export class SubscriptionPlan {
  static readonly starter = new SubscriptionPlan(
    'starter',
    'property',
    39,
    1,
    1,
    10,
  );
  static readonly professional = new SubscriptionPlan(
    'professional',
    'room',
    8,
    2,
    5,
    null,
  );

  /** Plans in the order they are offered. */
  static readonly all: readonly SubscriptionPlan[] = [
    SubscriptionPlan.starter,
    SubscriptionPlan.professional,
  ];

  /** Currency of every plan price. */
  static readonly currency = 'PEN';

  /**
   * @param id - Plan identifier.
   * @param pricingUnit - Unit the monthly price is charged by.
   * @param unitPrice - Monthly price per unit, in soles.
   * @param minProperties - Fewest properties the plan accepts.
   * @param maxProperties - Most properties the plan accepts.
   * @param maxRoomsPerProperty - Room limit of each property, or null for no limit.
   */
  private constructor(
    readonly id: PlanId,
    readonly pricingUnit: PricingUnit,
    readonly unitPrice: number,
    readonly minProperties: number,
    readonly maxProperties: number,
    readonly maxRoomsPerProperty: number | null,
  ) {}

  /**
   * @param id - Plan identifier, such as the `plan` query parameter.
   * @returns The plan, or Starter when the identifier is unknown.
   */
  static fromId(id: string | null | undefined): SubscriptionPlan {
    return (
      SubscriptionPlan.all.find((plan) => plan.id === id) ??
      SubscriptionPlan.starter
    );
  }

  /**
   * @param propertyCount - Properties to subscribe.
   * @param roomCount - Rooms across those properties.
   * @returns Monthly price in soles.
   */
  monthlyPrice(propertyCount: number, roomCount: number): number {
    const units = this.pricingUnit === 'property' ? propertyCount : roomCount;
    return this.unitPrice * Math.max(0, Math.floor(units));
  }

  /**
   * @param propertyCount - Properties to subscribe.
   * @param roomCount - Rooms across those properties.
   * @returns Whether the plan covers that operation.
   */
  accepts(propertyCount: number, roomCount: number): boolean {
    if (!Number.isInteger(propertyCount) || !Number.isInteger(roomCount))
      return false;
    if (
      propertyCount < this.minProperties ||
      propertyCount > this.maxProperties
    )
      return false;
    if (roomCount < propertyCount) return false;
    return (
      this.maxRoomsPerProperty === null ||
      roomCount <= this.maxRoomsPerProperty * propertyCount
    );
  }
}
