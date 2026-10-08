/**
 * Daily performance entity within the Overview bounded context.
 * It records the room revenue earned on one night and how many rooms were sold for it.
 *
 * @class DailyPerformance
 */
export class DailyPerformance {
  /**
   * Booking statuses whose nights count as sold and earn revenue.
   * @type {string[]}
   */
  static revenueStatuses = ['confirmed', 'checked-in', 'checked-out'];

  /**
   * @param {Object} params - Entity attributes.
   * @param {string} [params.date=''] - ISO day of the night.
   * @param {number} [params.revenue=0] - Room revenue of the night.
   * @param {number} [params.soldRooms=0] - Rooms sold for the night.
   * @param {number} [params.roomsCount=0] - Rooms of the property.
   */
  constructor({ date = '', revenue = 0, soldRooms = 0, roomsCount = 0 }) {
    this.date = date;
    this.revenue = revenue;
    this.soldRooms = soldRooms;
    this.roomsCount = roomsCount;
  }

  /**
   * Share of the property's rooms sold for the night.
   * @returns {number} Rate between 0 and 1.
   */
  get occupancyRate() {
    return this.roomsCount ? this.soldRooms / this.roomsCount : 0;
  }

  /**
   * Builds the performance of each night of a range from bookings.
   * Each booking's saved total is spread evenly across its nights.
   * @param {Object} params - Inputs.
   * @param {{status: string, nights: string[], totalAmount: number}[]} params.bookings - Bookings of the property.
   * @param {string[]} params.dates - ISO days of the range.
   * @param {number} params.roomsCount - Rooms of the property.
   * @returns {DailyPerformance[]} One entry per day, in order.
   */
  static series({ bookings, dates, roomsCount }) {
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
          revenue: Math.round(days.get(date).revenue * 100) / 100,
          soldRooms: days.get(date).soldRooms,
          roomsCount,
        }),
    );
  }
}
