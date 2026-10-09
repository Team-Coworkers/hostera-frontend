import { StaffScope } from './model/credential.entity';

/**
 * Command used by the Access Control application layer to issue a staff credential.
 */
export class IssueStaffCredentialCommand {
  /** Identifier of the staff member. */
  readonly staffMemberId: number | null;
  /** Areas the credential opens. */
  readonly scope: StaffScope | null;
  /** ISO date-time a temporary access ends; none for permanent access. */
  readonly validUntil: string | null;

  /**
   * @param params - Command attributes.
   */
  constructor({
    staffMemberId,
    scope,
    validUntil = null,
  }: {
    staffMemberId: number | null;
    scope: StaffScope | null;
    validUntil?: string | null;
  }) {
    this.staffMemberId = staffMemberId;
    this.scope = scope;
    this.validUntil = validUntil;
  }
}
