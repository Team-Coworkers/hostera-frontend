/**
 * Command used by the Access Control application layer to issue a staff credential.
 *
 * @class IssueStaffCredentialCommand
 */
export class IssueStaffCredentialCommand {
  /**
   * @param {Object} params - Command attributes.
   * @param {number} params.staffMemberId - Identifier of the staff member.
   * @param {string} params.scope - Areas the credential opens.
   * @param {?string} [params.validUntil=null] - ISO date-time a temporary access ends; none for permanent access.
   */
  constructor({ staffMemberId, scope, validUntil = null }) {
    this.staffMemberId = staffMemberId;
    this.scope = scope;
    this.validUntil = validUntil;
  }
}
