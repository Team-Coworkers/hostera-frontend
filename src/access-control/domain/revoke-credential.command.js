/**
 * Command used by the Access Control application layer to revoke a credential.
 *
 * @class RevokeCredentialCommand
 */
export class RevokeCredentialCommand {
  /**
   * @param {Object} params - Command attributes.
   * @param {number} params.credentialId - Identifier of the credential.
   * @param {string} params.reason - Revocation reason.
   * @param {string} [params.note=''] - Internal note, required for the Other reason.
   */
  constructor({ credentialId, reason, note = '' }) {
    this.credentialId = credentialId;
    this.reason = reason;
    this.note = note;
  }
}
