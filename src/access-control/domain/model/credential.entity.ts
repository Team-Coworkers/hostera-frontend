import { AccessControlError } from './access-control.error';

/** Kinds of credential. */
export type CredentialType = 'guest-key-card' | 'staff-credential';

/** Areas a staff credential can open. */
export type StaffScope = 'service-areas' | 'all-rooms' | 'all-areas';

/** Reasons staff can give when revoking a credential. */
export type RevocationReason =
  | 'lost-card'
  | 'damaged-card'
  | 'security-risk'
  | 'staff-left'
  | 'replaced'
  | 'other';

/** Status of a credential at a moment. */
export type CredentialStatus = 'active' | 'scheduled' | 'expired' | 'revoked';

/** Attributes of a {@link Credential}, as exchanged with the API. */
export interface CredentialAttributes {
  /** Credential identifier. */
  id: number | null;
  /** Identifier of the property. */
  propertyId: number | null;
  /** Four-character hexadecimal ID written to the card. */
  cardId: string;
  /** Kind of credential. */
  type: CredentialType;
  /** Person who holds the credential. */
  holderName: string;
  /** Staff member holding a staff credential. */
  staffMemberId: number | null;
  /** Booking of a guest key card. */
  bookingId: number | null;
  /** Code of the booking of a guest key card. */
  bookingCode: string;
  /** Room a guest key card opens. */
  roomId: number | null;
  /** Areas a staff credential opens. */
  scope: StaffScope | null;
  /** ISO date-time the access starts. */
  validFrom: string;
  /** ISO date-time the access ends; none for permanent staff access. */
  validUntil: string | null;
  /** ISO date-time the credential was issued. */
  issuedAt: string;
  /** Operator who issued the credential. */
  issuedBy: string | null;
  /** ISO date-time the credential was revoked. */
  revokedAt: string | null;
  /** Operator who revoked the credential. */
  revokedBy: string | null;
  /** Why the credential was revoked. */
  revocationReason: RevocationReason | null;
  /** Internal note about the revocation. */
  revocationNote: string;
}

/**
 * Credential entity within the Access Control bounded context.
 * It is an RFID card that opens a guest's room during a stay, or the areas of a staff member's access scope.
 */
export class Credential implements CredentialAttributes {
  /** Kinds of credential. */
  static readonly types: CredentialType[] = [
    'guest-key-card',
    'staff-credential',
  ];

  /** Areas a staff credential can open. */
  static readonly staffScopes: StaffScope[] = [
    'service-areas',
    'all-rooms',
    'all-areas',
  ];

  /** Reasons staff can give when revoking a credential. */
  static readonly revocationReasons: RevocationReason[] = [
    'lost-card',
    'damaged-card',
    'security-risk',
    'staff-left',
    'replaced',
    'other',
  ];

  /**
   * Checks whether a value is a valid ISO date-time.
   * @param value - Value to check.
   */
  static #isDateTime(value: unknown): boolean {
    return (
      typeof value === 'string' &&
      value !== '' &&
      !Number.isNaN(new Date(value).getTime())
    );
  }

  id: number | null;
  propertyId: number | null;
  cardId: string;
  type: CredentialType;
  holderName: string;
  staffMemberId: number | null;
  bookingId: number | null;
  bookingCode: string;
  roomId: number | null;
  scope: StaffScope | null;
  validFrom: string;
  validUntil: string | null;
  issuedAt: string;
  issuedBy: string | null;
  revokedAt: string | null;
  revokedBy: string | null;
  revocationReason: RevocationReason | null;
  revocationNote: string;

  /**
   * @param params - Entity attributes.
   */
  constructor({
    id = null,
    propertyId = null,
    cardId = '',
    type = 'guest-key-card',
    holderName = '',
    staffMemberId = null,
    bookingId = null,
    bookingCode = '',
    roomId = null,
    scope = null,
    validFrom = '',
    validUntil = null,
    issuedAt = '',
    issuedBy = null,
    revokedAt = null,
    revokedBy = null,
    revocationReason = null,
    revocationNote = '',
  }: Partial<CredentialAttributes> = {}) {
    this.id = id;
    this.propertyId = propertyId;
    this.cardId = cardId;
    this.type = type;
    this.holderName = holderName;
    this.staffMemberId = staffMemberId;
    this.bookingId = bookingId;
    this.bookingCode = bookingCode;
    this.roomId = roomId;
    this.scope = scope;
    this.validFrom = validFrom;
    this.validUntil = validUntil;
    this.issuedAt = issuedAt;
    this.issuedBy = issuedBy;
    this.revokedAt = revokedAt;
    this.revokedBy = revokedBy;
    this.revocationReason = revocationReason;
    this.revocationNote = revocationNote.trim();
  }

  /** Whether the credential is a guest key card. */
  get isGuestKeyCard(): boolean {
    return this.type === 'guest-key-card';
  }

  /**
   * Derives the credential status at a moment: Revoked, Scheduled before its access starts, Expired after it ends, otherwise Active.
   * @param now - ISO date-time of the moment.
   */
  statusAt(now: string): CredentialStatus {
    if (this.revokedAt) return 'revoked';
    if (now < this.validFrom) return 'scheduled';
    if (this.validUntil && now >= this.validUntil) return 'expired';
    return 'active';
  }

  /**
   * Whether the credential can still open doors now or later.
   * @param now - ISO date-time of the moment.
   */
  isUsableAt(now: string): boolean {
    const status = this.statusAt(now);
    return status === 'active' || status === 'scheduled';
  }

  /**
   * Revokes an active or scheduled credential immediately.
   * @param revocation - Revocation details; the note is required for the Other reason.
   * @returns Revoked copy of the credential.
   * @throws AccessControlError When the credential cannot be revoked or the reason is incomplete.
   */
  revoke({
    reason,
    note = '',
    at,
    by,
  }: {
    reason: RevocationReason | null;
    note?: string;
    at: string;
    by: string;
  }): Credential {
    if (!this.isUsableAt(at))
      throw new AccessControlError('invalid-credential-change');
    if (!reason || !Credential.revocationReasons.includes(reason))
      throw new AccessControlError('invalid-revocation-reason');
    if (reason === 'other' && !note.trim())
      throw new AccessControlError('revocation-note-required');
    return new Credential({
      ...this,
      revokedAt: at,
      revokedBy: by,
      revocationReason: reason,
      revocationNote: note,
    });
  }

  /**
   * Ends the access of a usable credential at a moment, such as a guest's check-out.
   * @param at - ISO date-time the access ends.
   * @returns Copy of the credential whose access ends at that moment.
   */
  endAt(at: string): Credential {
    if (!this.isUsableAt(at)) return this;
    return new Credential({
      ...this,
      validUntil:
        this.validUntil && this.validUntil < at ? this.validUntil : at,
    });
  }

  /**
   * Validates the credential's attributes.
   * @throws AccessControlError When a business rule is violated.
   */
  validate(): void {
    if (!/^[0-9A-F]{4}$/.test(this.cardId))
      throw new AccessControlError('invalid-card-id');
    if (!Credential.types.includes(this.type))
      throw new AccessControlError('invalid-credential-type');
    if (!this.holderName) throw new AccessControlError('required-fields');
    if (this.isGuestKeyCard && (!this.bookingId || !this.roomId))
      throw new AccessControlError('required-fields');
    if (
      !this.isGuestKeyCard &&
      (!this.staffMemberId ||
        !this.scope ||
        !Credential.staffScopes.includes(this.scope))
    )
      throw new AccessControlError('invalid-access-scope');
    if (!Credential.#isDateTime(this.validFrom))
      throw new AccessControlError('invalid-access-period');
    if (this.isGuestKeyCard && !this.validUntil)
      throw new AccessControlError('invalid-access-period');
    if (
      this.validUntil &&
      (!Credential.#isDateTime(this.validUntil) ||
        this.validUntil <= this.validFrom)
    )
      throw new AccessControlError('invalid-access-period');
  }
}
