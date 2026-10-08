import { HttpResponse } from '@angular/common/http';
import { resourcesFromResponse } from '../../shared/infrastructure/resources-from-response';
import {
  StatusPeriod,
  StatusPeriodAttributes,
} from '../domain/model/status-period.entity';

/** Resource payload of a status period, as exchanged with the API. */
export type StatusPeriodResource = Partial<StatusPeriodAttributes>;

/**
 * Maps status period resources into Rooms domain entities.
 */
export class StatusPeriodAssembler {
  /**
   * @param resource - Status period resource payload.
   * @returns Status period entity.
   */
  static toEntityFromResource(resource: StatusPeriodResource): StatusPeriod {
    return new StatusPeriod({ ...resource });
  }

  /**
   * Parses status period resources from a response and maps them into entities.
   * @param response - HTTP response with status period resources.
   * @returns Status period entities.
   */
  static toEntitiesFromResponse(
    response: HttpResponse<unknown>,
  ): StatusPeriod[] {
    return resourcesFromResponse<StatusPeriodResource>(
      response,
      'status-periods',
    ).map((resource) => this.toEntityFromResource(resource));
  }
}
