import { HttpResponse } from '@angular/common/http';
import { resourcesFromResponse } from '../../shared/infrastructure/resources-from-response';
import { RoomType, RoomTypeAttributes } from '../domain/model/room-type.entity';

/** Resource payload of a room type, as exchanged with the API. */
export type RoomTypeResource = Partial<RoomTypeAttributes>;

/**
 * Maps room type resources into Rooms domain entities.
 */
export class RoomTypeAssembler {
  /**
   * @param resource - Room type resource payload.
   * @returns Room type entity.
   */
  static toEntityFromResource(resource: RoomTypeResource): RoomType {
    return new RoomType({ ...resource });
  }

  /**
   * Parses room type resources from a response and maps them into entities.
   * @param response - HTTP response with room type resources.
   * @returns Room type entities.
   */
  static toEntitiesFromResponse(response: HttpResponse<unknown>): RoomType[] {
    return resourcesFromResponse<RoomTypeResource>(response, 'room-types').map(
      (resource) => this.toEntityFromResource(resource),
    );
  }
}
