/**
 * Access event entity within the Access Control bounded context.
 * It is a read-only record of a credential presented at an access point and whether the door granted it.
 *
 * @class AccessEvent
 */
export class AccessEvent {
  /**
   * Places where credentials are presented.
   * @type {string[]}
   */
  static accessPoints = [
    'main-entrance',
    'room-door',
    'elevator',
    'service-corridor',
    'storage-room',
  ];

  /**
   * Reasons a door can deny a credential.
   * @type {string[]}
   */
  static denialReasons = [
    'outside-scope',
    'not-active-yet',
    'expired',
    'revoked',
  ];

  /**
   * @param {Object} params - Entity attributes.
   * @param {?number} [params.id=null] - Access event identifier.
   * @param {?number} [params.propertyId=null] - Identifier of the property.
   * @param {string} [params.occurredAt=''] - ISO date-time of the event.
   * @param {?number} [params.credentialId=null] - Identifier of the presented credential.
   * @param {string} [params.cardId=''] - Card ID of the presented credential.
   * @param {string} [params.holderName=''] - Person who holds the credential.
   * @param {'guest'|'staff'} [params.holderType='guest'] - Whether the holder is a guest or staff.
   * @param {string} [params.accessPoint='main-entrance'] - Where the credential was presented.
   * @param {?number} [params.roomId=null] - Room of the credential or of the door, when any.
   * @param {'granted'|'denied'} [params.result='granted'] - Whether the door granted access.
   * @param {?string} [params.denialReason=null] - Why the door denied access.
   */
  constructor({
    id = null,
    propertyId = null,
    occurredAt = '',
    credentialId = null,
    cardId = '',
    holderName = '',
    holderType = 'guest',
    accessPoint = 'main-entrance',
    roomId = null,
    result = 'granted',
    denialReason = null,
  }) {
    this.id = id;
    this.propertyId = propertyId;
    this.occurredAt = occurredAt;
    this.credentialId = credentialId;
    this.cardId = cardId;
    this.holderName = holderName;
    this.holderType = holderType;
    this.accessPoint = accessPoint;
    this.roomId = roomId;
    this.result = result;
    this.denialReason = denialReason;
  }

  /**
   * Whether the door denied access.
   * @returns {boolean}
   */
  get isDenied() {
    return this.result === 'denied';
  }
}
