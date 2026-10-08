import { Credential } from '../domain/model/credential.entity.js';

/**
 * Maps credential resources into Access Control domain entities.
 *
 * @class CredentialAssembler
 */
export class CredentialAssembler {
  /**
   * @param {Object} resource - Credential resource payload.
   * @returns {Credential} Credential entity.
   */
  static toEntityFromResource(resource) {
    return new Credential({ ...resource });
  }

  /**
   * Parses credential resources from a response and maps them into entities.
   *
   * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with credential resources.
   * @returns {Credential[]} Credential entities.
   */
  static toEntitiesFromResponse(response) {
    if (response.status !== 200) {
      console.error(`${response.status}, ${response.statusText}`);
      return [];
    }
    let resources =
      response.data instanceof Array
        ? response.data
        : response.data['credentials'];

    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}
