import { StaffMember } from '../domain/model/staff-member.entity.js';

/**
 * Maps staff member resources into Access Control domain entities.
 *
 * @class StaffMemberAssembler
 */
export class StaffMemberAssembler {
  /**
   * @param {Object} resource - Staff member resource payload.
   * @returns {StaffMember} Staff member entity.
   */
  static toEntityFromResource(resource) {
    return new StaffMember({ ...resource });
  }

  /**
   * Parses staff member resources from a response and maps them into entities.
   *
   * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with staff member resources.
   * @returns {StaffMember[]} Staff member entities.
   */
  static toEntitiesFromResponse(response) {
    if (response.status !== 200) {
      console.error(`${response.status}, ${response.statusText}`);
      return [];
    }
    let resources =
      response.data instanceof Array
        ? response.data
        : response.data['staff-members'];

    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}
