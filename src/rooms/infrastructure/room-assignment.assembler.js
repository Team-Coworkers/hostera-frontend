import { RoomAssignment } from '../domain/model/room-assignment.entity.js';

/**
 * Maps booking resources into the room assignments that control Rooms day statuses.
 * Checked-in bookings make their room Occupied; other room-holding bookings make it Booked.
 *
 * @class RoomAssignmentAssembler
 */
export class RoomAssignmentAssembler {
  /**
   * Booking statuses whose booking keeps its room for its nights.
   * @type {string[]}
   */
  static roomHoldingStatuses = ['pending', 'confirmed', 'checked-in'];

  /**
   * Returns the ISO day before another ISO day.
   * @param {string} value - ISO calendar day.
   * @private
   * @returns {string} ISO calendar day.
   */
  static #previousDay(value) {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
  }

  /**
   * @param {Object} resource - Booking resource payload.
   * @returns {RoomAssignment} Room assignment covering the booking's nights.
   */
  static toEntityFromResource(resource) {
    return new RoomAssignment({
      id: resource.id,
      propertyId: resource.propertyId,
      roomId: resource.roomId,
      bookingId: resource.id,
      bookingCode: resource.code,
      status: resource.status === 'checked-in' ? 'occupied' : 'booked',
      startDate: resource.checkInDate,
      endDate: this.#previousDay(resource.checkOutDate),
    });
  }

  /**
   * Parses booking resources from a response and maps the room-holding ones into room assignments.
   *
   * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with booking resources.
   * @returns {RoomAssignment[]} Room assignment entities.
   */
  static toEntitiesFromResponse(response) {
    if (response.status !== 200) {
      console.error(`${response.status}, ${response.statusText}`);
      return [];
    }
    let resources =
      response.data instanceof Array
        ? response.data
        : response.data['bookings'];

    return resources
      .filter((resource) => this.roomHoldingStatuses.includes(resource.status))
      .map((resource) => this.toEntityFromResource(resource));
  }
}
