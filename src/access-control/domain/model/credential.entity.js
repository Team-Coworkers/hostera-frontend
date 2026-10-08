import { AccessControlError } from './access-control.error.js';

/**
 * Credential entity within the Access Control bounded context.
 * It is an RFID card that opens a guest's room during a stay, or the areas of a staff member's access scope.
 *
 * @class Credential
 */
export class Credential {
  /**
   * Kinds of credential.
   * @type {string[]}
   */
  static types = ['guest-key-card', 'staff-credential'];

  /**
   * Areas a staff credential can open.
   * @type {string[]}
   */
  static staffScopes = ['service-areas', 'all-rooms', 'all-areas'];

  /**
   * Reasons staff can give when revoking a credential.
   * @type {string[]}
   */
  static revocationReasons = [
    'lost-card',
    'damaged-card',
    'security-risk',
    'staff-left',
    'replaced',
    'other',
  ];

  /**
   * Checks whether a value is a valid ISO date-time.
   * @param {*} value - Value to check.
   * @private
   * @returns {boolean}
   */
  static #isDateTime(value) {
    return (
      typeof value === 'string' &&
      value !== '' &&
      !Number.isNaN(new Date(value).getTime())
    );
  }

  /**
   * @param {Object} params - Entity attributes.
   * @param {?number} [params.id=null] - Credential identifier.
   * @param {?number} [params.propertyId=null] - Identifier of the property.
   * @param {string} [params.cardId=''] - Four-character hexadecimal ID written to the card.
   * @param {'guest-key-card'|'staff-credential'} [params.type='guest-key-card'] - Kind of credential.
   * @param {string} [params.holderName=''] - Person who holds the credential.
   * @param {?number} [params.staffMemberId=null] - Staff member holding a staff credential.
   * @param {?number} [params.bookingId=null] - Booking of a guest key card.
   * @param {string} [params.bookingCode=''] - Code of the booking of a guest key card.
   * @param {?number} [params.roomId=null] - Room a guest key card opens.
   * @param {?string} [params.scope=null] - Areas a staff credential opens.
   * @param {string} [params.validFrom=''] - ISO date-time the access starts.
   * @param {?string} [params.validUntil=null] - ISO date-time the access ends; none for permanent staff access.
   * @param {string} [params.issuedAt=''] - ISO date-time the credential was issued.
   * @param {?string} [params.issuedBy=null] - Operator who issued the credential.
   * @param {?string} [params.revokedAt=null] - ISO date-time the credential was revoked.
   * @param {?string} [params.revokedBy=null] - Operator who revoked the credential.
   * @param {?string} [params.revocationReason=null] - Why the credential was revoked.
   * @param {string} [params.revocationNote=''] - Internal note about the revocation.
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
  }) {
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

  /**
   * Whether the credential is a guest key card.
   * @returns {boolean}
   */
  get isGuestKeyCard() {
    return this.type === 'guest-key-card';
  }

  /**
   * Derives the credential status at a moment: Revoked, Scheduled before its access starts, Expired after it ends, otherwise Active.
   * @param {string} now - ISO date-time of the moment.
   * @returns {'active'|'scheduled'|'expired'|'revoked'}
   */
  statusAt(now) {
    if (this.revokedAt) return 'revoked';
    if (now < this.validFrom) return 'scheduled';
    if (this.validUntil && now >= this.validUntil) return 'expired';
    return 'active';
  }

  /**
   * Whether the credential can still open doors now or later.
   * @param {string} now - ISO date-time of the moment.
   * @returns {boolean}
   */
  isUsableAt(now) {
    const status = this.statusAt(now);
    return status === 'active' || status === 'scheduled';
  }

  /**
   * Revokes an active or scheduled credential immediately.
   * @param {Object} revocation - Revocation details.
   * @param {string} revocation.reason - Revocation reason.
   * @param {string} [revocation.note=''] - Internal note, required for the Other reason.
   * @param {string} revocation.at - ISO date-time of the revocation.
   * @param {string} revocation.by - Operator who revokes it.
   * @returns {Credential} Revoked copy of the credential.
   * @throws {AccessControlError} When the credential cannot be revoked or the reason is incomplete.
   */
  revoke({ reason, note = '', at, by }) {
    if (!this.isUsableAt(at))
      throw new AccessControlError('invalid-credential-change');
    if (!Credential.revocationReasons.includes(reason))
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
   * @param {string} at - ISO date-time the access ends.
   * @returns {Credential} Copy of the credential whose access ends at that moment.
   */
  endAt(at) {
    if (!this.isUsableAt(at)) return this;
    return new Credential({
      ...this,
      validUntil:
        this.validUntil && this.validUntil < at ? this.validUntil : at,
    });
  }

  /**
   * Validates the credential's attributes.
   * @throws {AccessControlError} When a business rule is violated.
   */
  validate() {
    if (!/^[0-9A-F]{4}$/.test(this.cardId))
      throw new AccessControlError('invalid-card-id');
    if (!Credential.types.includes(this.type))
      throw new AccessControlError('invalid-credential-type');
    if (!this.holderName) throw new AccessControlError('required-fields');
    if (this.isGuestKeyCard && (!this.bookingId || !this.roomId))
      throw new AccessControlError('required-fields');
    if (
      !this.isGuestKeyCard &&
      (!this.staffMemberId || !Credential.staffScopes.includes(this.scope))
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
