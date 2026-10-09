import { AccountRegistration } from './account-registration.entity';
import { SubscriptionPlan } from './subscription-plan.entity';

describe('AccountRegistration', () => {
  const registration = (
    overrides: Partial<{
      fullName: string;
      email: string;
      organizationName: string;
      plan: SubscriptionPlan;
      propertyCount: number;
      roomCount: number;
    }> = {},
  ) => {
    const values = {
      fullName: 'Ana Torres',
      email: 'ana@hotelcentral.pe',
      organizationName: 'Hotel Central',
      plan: SubscriptionPlan.starter,
      propertyCount: 1,
      roomCount: 8,
      ...overrides,
    };
    return new AccountRegistration(
      values.fullName,
      values.email,
      values.organizationName,
      values.plan,
      values.propertyCount,
      values.roomCount,
    );
  };

  it('is valid when every field is filled and the plan fits', () => {
    expect(registration().validate()).toBeNull();
  });

  it('requires the full name', () => {
    expect(registration({ fullName: '   ' }).validate()).toBe(
      'full-name-required',
    );
  });

  it('requires a valid e-mail', () => {
    expect(registration({ email: 'ana@hotel' }).validate()).toBe(
      'email-invalid',
    );
  });

  it('requires the hotel or chain name', () => {
    expect(registration({ organizationName: '' }).validate()).toBe(
      'organization-required',
    );
  });

  it('rejects an operation the plan does not cover', () => {
    expect(registration({ propertyCount: 3, roomCount: 30 }).validate()).toBe(
      'plan-does-not-fit',
    );
  });

  it('prices the operation with the chosen plan', () => {
    const chain = registration({
      plan: SubscriptionPlan.professional,
      propertyCount: 2,
      roomCount: 25,
    });
    expect(chain.validate()).toBeNull();
    expect(chain.monthlyPrice).toBe(200);
  });
});
