import { RoomType } from '../domain/model/room-type.entity.js';

/**
 * Maps room type resources into Rooms domain entities.
 *
 * @class RoomTypeAssembler
 */
export class RoomTypeAssembler {
  /**
   * @param {Object} resource - Room type resource payload.
   * @returns {RoomType} Room type entity.
   */
  static toEntityFromResource(resource) {
    return new RoomType({ ...resource });
  }

  /**
   * Parses room type resources from a response and maps them into entities.
   *
   * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with room type resources.
   * @returns {RoomType[]} Room type entities.
   */
  static toEntitiesFromResponse(response) {
    if (response.status !== 200) {
      console.error(`${response.status}, ${response.statusText}`);
      return [];
    }
    let resources =
      response.data instanceof Array
        ? response.data
        : response.data['room-types'];

    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}
