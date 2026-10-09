import { SubscriptionPlan } from './subscription-plan.entity';

describe('SubscriptionPlan', () => {
  describe('fromId', () => {
    it('returns the plan with the given id', () => {
      expect(SubscriptionPlan.fromId('professional')).toBe(
        SubscriptionPlan.professional,
      );
    });

    it('falls back to Starter for an unknown or missing id', () => {
      expect(SubscriptionPlan.fromId('enterprise')).toBe(
        SubscriptionPlan.starter,
      );
      expect(SubscriptionPlan.fromId(undefined)).toBe(SubscriptionPlan.starter);
    });
  });

  describe('monthlyPrice', () => {
    it('charges Starter S/39 per property', () => {
      expect(SubscriptionPlan.starter.monthlyPrice(1, 10)).toBe(39);
    });

    it('charges Professional S/8 per room across the properties', () => {
      expect(SubscriptionPlan.professional.monthlyPrice(2, 25)).toBe(200);
      expect(SubscriptionPlan.professional.monthlyPrice(3, 40)).toBe(320);
    });

    it('never charges a negative or fractional number of units', () => {
      expect(SubscriptionPlan.professional.monthlyPrice(2, -5)).toBe(0);
      expect(SubscriptionPlan.professional.monthlyPrice(2, 10.7)).toBe(80);
    });
  });

  describe('accepts', () => {
    it('accepts one property with up to 10 rooms on Starter', () => {
      expect(SubscriptionPlan.starter.accepts(1, 10)).toBeTrue();
      expect(SubscriptionPlan.starter.accepts(1, 11)).toBeFalse();
      expect(SubscriptionPlan.starter.accepts(2, 10)).toBeFalse();
    });

    it('accepts 2 to 5 properties on Professional', () => {
      expect(SubscriptionPlan.professional.accepts(1, 20)).toBeFalse();
      expect(SubscriptionPlan.professional.accepts(2, 20)).toBeTrue();
      expect(SubscriptionPlan.professional.accepts(5, 300)).toBeTrue();
      expect(SubscriptionPlan.professional.accepts(6, 300)).toBeFalse();
    });

    it('rejects fewer rooms than properties and fractional counts', () => {
      expect(SubscriptionPlan.professional.accepts(3, 2)).toBeFalse();
      expect(SubscriptionPlan.professional.accepts(2.5, 20)).toBeFalse();
    });
  });
});
