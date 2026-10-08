import { Room } from '../domain/model/room.entity.js';

/**
 * Maps room resources into Rooms domain entities.
 *
 * @class RoomAssembler
 */
export class RoomAssembler {
  /**
   * @param {Object} resource - Room resource payload.
   * @returns {Room} Room entity.
   */
  static toEntityFromResource(resource) {
    return new Room({ ...resource });
  }

  /**
   * Parses room resources from a response and maps them into entities.
   *
   * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with room resources.
   * @returns {Room[]} Room entities.
   */
  static toEntitiesFromResponse(response) {
    if (response.status !== 200) {
      console.error(`${response.status}, ${response.statusText}`);
      return [];
    }
    let resources =
      response.data instanceof Array ? response.data : response.data['rooms'];

    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}
