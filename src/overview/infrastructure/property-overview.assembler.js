import { PropertyOverview } from '../domain/model/property-overview.entity.js';

/**
 * Maps the rooms, bookings, and status periods of all properties into property overviews.
 *
 * @class PropertyOverviewAssembler
 */
export class PropertyOverviewAssembler {
  /**
   * Booking statuses whose booking keeps its room for its nights.
   * @type {string[]}
   */
  static roomHoldingStatuses = ['pending', 'confirmed', 'checked-in'];

  /**
   * Reads the resources of a response.
   * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response.
   * @param {string} key - Collection key of a wrapped response.
   * @private
   * @returns {Object[]} Resources.
   */
  static #resources(response, key) {
    if (response.status !== 200) {
      console.error(`${response.status}, ${response.statusText}`);
      return [];
    }
    return response.data instanceof Array ? response.data : response.data[key];
  }

  /**
   * Builds the overview of each property for a day.
   * @param {Object[]} properties - Properties to summarize, with `id` and `name`.
   * @param {import('axios').AxiosResponse[]} responses - Responses for rooms, bookings, and status periods.
   * @param {string} today - ISO day of the overview.
   * @returns {PropertyOverview[]} One overview per property.
   */
  static toEntitiesFromResponses(properties, responses, today) {
    const [rooms, bookings, statusPeriods] = [
      this.#resources(responses[0], 'rooms'),
      this.#resources(responses[1], 'bookings'),
      this.#resources(responses[2], 'status-periods'),
    ];
    const coversToday = (period) =>
      period.startDate <= today && today <= period.endDate;
    return properties.map((property) => {
      const propertyRooms = rooms.filter(
        (room) => room.propertyId === property.id,
      );
      const roomIds = new Set(propertyRooms.map((room) => room.id));
      const todayPeriods = statusPeriods.filter(
        (period) => roomIds.has(period.roomId) && coversToday(period),
      );
      return new PropertyOverview({
        propertyId: property.id,
        name: property.name,
        roomsCount: propertyRooms.length,
        heldRooms: new Set(
          bookings
            .filter(
              (booking) =>
                roomIds.has(booking.roomId) &&
                this.roomHoldingStatuses.includes(booking.status) &&
                booking.checkInDate <= today &&
                today < booking.checkOutDate,
            )
            .map((booking) => booking.roomId),
        ).size,
        roomsNeedingCleaning: todayPeriods.filter(
          (period) => period.status === 'needs-cleaning',
        ).length,
        roomsOutOfOrder: todayPeriods.filter(
          (period) => period.status !== 'needs-cleaning',
        ).length,
      });
    });
  }
}
