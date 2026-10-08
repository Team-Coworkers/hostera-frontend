import { HttpResponse } from '@angular/common/http';
import { resourcesFromResponse } from '../../shared/infrastructure/resources-from-response';
import {
  AccessEvent,
  AccessEventAttributes,
} from '../domain/model/access-event.entity';

/** Resource payload of a access event, as exchanged with the API. */
export type AccessEventResource = Partial<AccessEventAttributes>;

/**
 * Maps access event resources into Access Control domain entities.
 */
export class AccessEventAssembler {
  /**
   * @param resource - Access event resource payload.
   * @returns Access event entity.
   */
  static toEntityFromResource(resource: AccessEventResource): AccessEvent {
    return new AccessEvent({ ...resource });
  }

  /**
   * Parses access event resources from a response and maps them into entities.
   * @param response - HTTP response with access event resources.
   * @returns Access event entities.
   */
  static toEntitiesFromResponse(
    response: HttpResponse<unknown>,
  ): AccessEvent[] {
    return resourcesFromResponse<AccessEventResource>(
      response,
      'access-events',
    ).map((resource) => this.toEntityFromResource(resource));
  }
}
