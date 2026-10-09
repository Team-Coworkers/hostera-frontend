import { SubscriptionPlan } from './subscription-plan.entity';

/** Reasons a registration cannot be submitted, used as message keys. */
export type RegistrationError =
  | 'full-name-required'
  | 'email-invalid'
  | 'organization-required'
  | 'plan-does-not-fit';

/** Simple e-mail shape check; the RESTful API confirms the address. */
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Request to create a Hostera account with an initial subscription plan.
 */
export class AccountRegistration {
  /**
   * @param fullName - Name of the person who registers.
   * @param email - Work e-mail used to sign in.
   * @param organizationName - Hotel or hotel chain name.
   * @param plan - Chosen subscription plan.
   * @param propertyCount - Properties of the organization.
   * @param roomCount - Rooms across those properties.
   */
  constructor(
    readonly fullName: string,
    readonly email: string,
    readonly organizationName: string,
    readonly plan: SubscriptionPlan,
    readonly propertyCount: number,
    readonly roomCount: number,
  ) {}

  /** @returns Monthly price of the chosen plan for this operation, in soles. */
  get monthlyPrice(): number {
    return this.plan.monthlyPrice(this.propertyCount, this.roomCount);
  }

  /** @returns The first reason the registration is invalid, or null. */
  validate(): RegistrationError | null {
    if (!this.fullName.trim()) return 'full-name-required';
    if (!emailPattern.test(this.email.trim())) return 'email-invalid';
    if (!this.organizationName.trim()) return 'organization-required';
    if (!this.plan.accepts(this.propertyCount, this.roomCount))
      return 'plan-does-not-fit';
    return null;
  }
}
