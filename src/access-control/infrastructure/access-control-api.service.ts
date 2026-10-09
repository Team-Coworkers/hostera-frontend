import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BaseApiService } from '../../shared/infrastructure/base-api.service';
import { AccessEventResource } from './access-event.assembler';
import { CredentialResource } from './credential.assembler';
import { StaffMemberResource } from './staff-member.assembler';

/**
 * Infrastructure gateway for Access Control bounded-context endpoints.
 */
@Injectable({ providedIn: 'root' })
export class AccessControlApiService extends BaseApiService {
  private readonly credentialsEndpoint =
    this.createEndpoint<CredentialResource>(
      environment.credentialsEndpointPath,
    );
  private readonly staffMembersEndpoint =
    this.createEndpoint<StaffMemberResource>(
      environment.staffMembersEndpointPath,
    );
  private readonly accessEventsEndpoint =
    this.createEndpoint<AccessEventResource>(
      environment.accessEventsEndpointPath,
    );

  /** @param propertyId - The ID of the property whose credentials are fetched. */
  getCredentials(
    propertyId: number,
  ): Observable<HttpResponse<CredentialResource[]>> {
    return this.credentialsEndpoint.getAll({ propertyId });
  }

  /** @param resource - Credential resource payload. */
  createCredential(
    resource: object,
  ): Observable<HttpResponse<CredentialResource>> {
    return this.credentialsEndpoint.create(resource);
  }

  /** @param resource - Credential resource payload (must include id). */
  updateCredential(resource: {
    id: number | null;
  }): Observable<HttpResponse<CredentialResource>> {
    return this.credentialsEndpoint.update(resource.id!, resource);
  }

  /** @param propertyId - The ID of the property whose staff members are fetched. */
  getStaffMembers(
    propertyId: number,
  ): Observable<HttpResponse<StaffMemberResource[]>> {
    return this.staffMembersEndpoint.getAll({ propertyId });
  }

  /** @param propertyId - The ID of the property whose access events are fetched. */
  getAccessEvents(
    propertyId: number,
  ): Observable<HttpResponse<AccessEventResource[]>> {
    return this.accessEventsEndpoint.getAll({ propertyId });
  }
}
