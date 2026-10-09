import { HttpResponse } from '@angular/common/http';
import { resourcesFromResponse } from '../../shared/infrastructure/resources-from-response';
import {
  StaffMember,
  StaffMemberAttributes,
} from '../domain/model/staff-member.entity';

/** Resource payload of a staff member, as exchanged with the API. */
export type StaffMemberResource = Partial<StaffMemberAttributes>;

/**
 * Maps staff member resources into Access Control domain entities.
 */
export class StaffMemberAssembler {
  /**
   * @param resource - Staff member resource payload.
   * @returns Staff member entity.
   */
  static toEntityFromResource(resource: StaffMemberResource): StaffMember {
    return new StaffMember({ ...resource });
  }

  /**
   * Parses staff member resources from a response and maps them into entities.
   * @param response - HTTP response with staff member resources.
   * @returns Staff member entities.
   */
  static toEntitiesFromResponse(
    response: HttpResponse<unknown>,
  ): StaffMember[] {
    return resourcesFromResponse<StaffMemberResource>(
      response,
      'staff-members',
    ).map((resource) => this.toEntityFromResource(resource));
  }
}
