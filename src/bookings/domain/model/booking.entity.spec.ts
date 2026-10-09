import { Booking } from './booking.entity';
import { Payment } from './payment.entity';

describe('Booking', () => {
  const stay = new Booking({
    status: 'confirmed',
    checkInDate: '2026-10-12',
    checkOutDate: '2026-10-15',
    totalAmount: 870,
  });

  describe('booking codes', () => {
    it('numbers each property in its own thousand', () => {
      expect(Booking.nextCode(1)).toBe('BKG-1001');
      expect(Booking.nextCode(1, 'BKG-1070')).toBe('BKG-1071');
      expect(Booking.nextCode(2, 'BKG-1070')).toBe('BKG-2001');
    });

    it('reads 0 from a code without a number', () => {
      expect(Booking.numberOf('ABC')).toBe(0);
      expect(Booking.numberOf(null)).toBe(0);
    });
  });

  it('lists the nights from check-in to the day before check-out', () => {
    expect(stay.nights).toEqual(['2026-10-12', '2026-10-13', '2026-10-14']);
    expect(stay.lastNight).toBe('2026-10-14');
  });

  it('overlaps another stay only when they share a night', () => {
    expect(stay.overlaps('2026-10-14', '2026-10-16')).toBeTrue();
    expect(stay.overlaps('2026-10-15', '2026-10-18')).toBeFalse();
  });

  it('derives the balance due and the payment status', () => {
    const deposit = new Payment({ amount: 300 });
    const rest = new Payment({ amount: 570 });

    expect(stay.paymentStatus([])).toBe('unpaid');
    expect(stay.balanceDue([deposit])).toBe(570);
    expect(stay.paymentStatus([deposit])).toBe('partially-paid');
    expect(stay.paymentStatus([deposit, rest])).toBe('paid');
  });

  it('allows check-in only for a confirmed booking during its nights', () => {
    expect(stay.canBeCheckedIn('2026-10-11')).toBeFalse();
    expect(stay.canBeCheckedIn('2026-10-12')).toBeTrue();
    expect(stay.canBeCheckedIn('2026-10-15')).toBeFalse();
    expect(
      new Booking({ ...stay, status: 'pending' }).canBeCheckedIn('2026-10-12'),
    ).toBeFalse();
  });
});
