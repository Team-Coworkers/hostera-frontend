import { HttpResponse } from '@angular/common/http';
import { resourcesFromResponse } from '../../shared/infrastructure/resources-from-response';
import {
  DailyRate,
  DailyRateAttributes,
} from '../domain/model/daily-rate.entity';

/** Resource payload of a daily rate, as exchanged with the API. */
export type DailyRateResource = Partial<DailyRateAttributes>;

/**
 * Maps daily rate resources into Rooms domain entities.
 */
export class DailyRateAssembler {
  /**
   * @param resource - Daily rate resource payload.
   * @returns Daily rate entity.
   */
  static toEntityFromResource(resource: DailyRateResource): DailyRate {
    return new DailyRate({ ...resource });
  }

  /**
   * Parses daily rate resources from a response and maps them into entities.
   * @param response - HTTP response with daily rate resources.
   * @returns Daily rate entities.
   */
  static toEntitiesFromResponse(response: HttpResponse<unknown>): DailyRate[] {
    return resourcesFromResponse<DailyRateResource>(
      response,
      'daily-rates',
    ).map((resource) => this.toEntityFromResource(resource));
  }
}
