import { RevocationReason } from './model/credential.entity';

/**
 * Command used by the Access Control application layer to revoke a credential.
 */
export class RevokeCredentialCommand {
  /** Identifier of the credential. */
  readonly credentialId: number;
  /** Revocation reason. */
  readonly reason: RevocationReason | null;
  /** Internal note, required for the Other reason. */
  readonly note: string;

  /**
   * @param params - Command attributes.
   */
  constructor({
    credentialId,
    reason,
    note = '',
  }: {
    credentialId: number;
    reason: RevocationReason | null;
    note?: string;
  }) {
    this.credentialId = credentialId;
    this.reason = reason;
    this.note = note;
  }
}
