import { HttpResponse } from '@angular/common/http';
import { resourcesFromResponse } from '../../shared/infrastructure/resources-from-response';
import { Room, RoomAttributes } from '../domain/model/room.entity';

/** Resource payload of a room, as exchanged with the API. */
export type RoomResource = Partial<RoomAttributes>;

/**
 * Maps room resources into Rooms domain entities.
 */
export class RoomAssembler {
  /**
   * @param resource - Room resource payload.
   * @returns Room entity.
   */
  static toEntityFromResource(resource: RoomResource): Room {
    return new Room({ ...resource });
  }

  /**
   * Parses room resources from a response and maps them into entities.
   * @param response - HTTP response with room resources.
   * @returns Room entities.
   */
  static toEntitiesFromResponse(response: HttpResponse<unknown>): Room[] {
    return resourcesFromResponse<RoomResource>(response, 'rooms').map(
      (resource) => this.toEntityFromResource(resource),
    );
  }
}
