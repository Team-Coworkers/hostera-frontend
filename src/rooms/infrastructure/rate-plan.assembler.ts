import { HttpResponse } from '@angular/common/http';
import { resourcesFromResponse } from '../../shared/infrastructure/resources-from-response';
import { RatePlan, RatePlanAttributes } from '../domain/model/rate-plan.entity';

/** Resource payload of a rate plan, as exchanged with the API. */
export type RatePlanResource = Partial<RatePlanAttributes>;

/**
 * Maps rate plan resources into Rooms domain entities.
 */
export class RatePlanAssembler {
  /**
   * @param resource - Rate plan resource payload.
   * @returns Rate plan entity.
   */
  static toEntityFromResource(resource: RatePlanResource): RatePlan {
    return new RatePlan({ ...resource });
  }

  /**
   * Parses rate plan resources from a response and maps them into entities.
   * @param response - HTTP response with rate plan resources.
   * @returns Rate plan entities.
   */
  static toEntitiesFromResponse(response: HttpResponse<unknown>): RatePlan[] {
    return resourcesFromResponse<RatePlanResource>(response, 'rate-plans').map(
      (resource) => this.toEntityFromResource(resource),
    );
  }
}
