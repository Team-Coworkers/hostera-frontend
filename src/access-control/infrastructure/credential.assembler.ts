import { HttpResponse } from '@angular/common/http';
import { resourcesFromResponse } from '../../shared/infrastructure/resources-from-response';
import {
  Credential,
  CredentialAttributes,
} from '../domain/model/credential.entity';

/** Resource payload of a credential, as exchanged with the API. */
export type CredentialResource = Partial<CredentialAttributes>;

/**
 * Maps credential resources into Access Control domain entities.
 */
export class CredentialAssembler {
  /**
   * @param resource - Credential resource payload.
   * @returns Credential entity.
   */
  static toEntityFromResource(resource: CredentialResource): Credential {
    return new Credential({ ...resource });
  }

  /**
   * Parses credential resources from a response and maps them into entities.
   * @param response - HTTP response with credential resources.
   * @returns Credential entities.
   */
  static toEntitiesFromResponse(response: HttpResponse<unknown>): Credential[] {
    return resourcesFromResponse<CredentialResource>(
      response,
      'credentials',
    ).map((resource) => this.toEntityFromResource(resource));
  }
}
