import { HttpResponse } from '@angular/common/http';
import { resourcesFromResponse } from '../../shared/infrastructure/resources-from-response';
import { Property, PropertyAttributes } from '../domain/model/property.entity';

/** Resource payload of a property, as exchanged with the API. */
export type PropertyResource = Partial<PropertyAttributes>;

/**
 * Maps property resources into Rooms domain entities.
 */
export class PropertyAssembler {
  /**
   * @param resource - Property resource payload.
   * @returns Property entity.
   */
  static toEntityFromResource(resource: PropertyResource): Property {
    return new Property({ ...resource });
  }

  /**
   * Parses property resources from a response and maps them into entities.
   * @param response - HTTP response with property resources.
   * @returns Property entities.
   */
  static toEntitiesFromResponse(response: HttpResponse<unknown>): Property[] {
    return resourcesFromResponse<PropertyResource>(response, 'properties').map(
      (resource) => this.toEntityFromResource(resource),
    );
  }
}
