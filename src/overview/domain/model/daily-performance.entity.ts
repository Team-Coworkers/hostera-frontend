/** Booking fields that daily performance reads. */
export interface PerformanceBooking {
  status: string;
  nights: string[];
  totalAmount: number;
}

/** Attributes of a {@link DailyPerformance}. */
export interface DailyPerformanceAttributes {
  /** ISO calendar day. */
  date: string;
  /** Room revenue of the day. */
  revenue: number;
  /** Rooms sold that night. */
  soldRooms: number;
  /** Rooms of the property. */
  roomsCount: number;
}

/**
 * Daily performance value within the Overview bounded context.
 * It is the room revenue and occupancy of a property on one night, derived from its bookings.
 */
export class DailyPerformance implements DailyPerformanceAttributes {
  /** Booking statuses whose nights count as sold. */
  static readonly revenueStatuses = ['confirmed', 'checked-in', 'checked-out'];

  date: string;
  revenue: number;
  soldRooms: number;
  roomsCount: number;

  /**
   * @param params - Value attributes.
   */
  constructor({
    date = '',
    revenue = 0,
    soldRooms = 0,
    roomsCount = 0,
  }: Partial<DailyPerformanceAttributes> = {}) {
    this.date = date;
    this.revenue = revenue;
    this.soldRooms = soldRooms;
    this.roomsCount = roomsCount;
  }

  /** Share of the property's rooms sold that night. */
  get occupancyRate(): number {
    return this.roomsCount ? this.soldRooms / this.roomsCount : 0;
  }

  /**
   * Derives the performance of each day, spreading a booking's total evenly across its nights.
   * @param params - Bookings of the property, days to derive, and the property's rooms count.
   * @returns Performance of each day, in the order of the days.
   */
  static series({
    bookings,
    dates,
    roomsCount,
  }: {
    bookings: PerformanceBooking[];
    dates: string[];
    roomsCount: number;
  }): DailyPerformance[] {
    const days = new Map(
      dates.map((date) => [date, { revenue: 0, soldRooms: 0 }]),
    );
    for (const booking of bookings) {
      if (!DailyPerformance.revenueStatuses.includes(booking.status)) continue;
      const nights = booking.nights;
      const nightlyRevenue = nights.length
        ? booking.totalAmount / nights.length
        : 0;
      for (const night of nights) {
        const day = days.get(night);
        if (!day) continue;
        day.revenue += nightlyRevenue;
        day.soldRooms += 1;
      }
    }
    return dates.map(
      (date) =>
        new DailyPerformance({
          date,
          revenue: Math.round(days.get(date)!.revenue * 100) / 100,
          soldRooms: days.get(date)!.soldRooms,
          roomsCount,
        }),
    );
  }
}
