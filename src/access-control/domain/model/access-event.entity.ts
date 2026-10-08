/** Places where credentials are presented. */
export type AccessPoint =
  | 'main-entrance'
  | 'room-door'
  | 'elevator'
  | 'service-corridor'
  | 'storage-room';

/** Reasons a door can deny a credential. */
export type DenialReason =
  'outside-scope' | 'not-active-yet' | 'expired' | 'revoked';

/** Attributes of an {@link AccessEvent}, as exchanged with the API. */
export interface AccessEventAttributes {
  /** Access event identifier. */
  id: number | null;
  /** Identifier of the property. */
  propertyId: number | null;
  /** ISO date-time of the event. */
  occurredAt: string;
  /** Identifier of the presented credential. */
  credentialId: number | null;
  /** Card ID of the presented credential. */
  cardId: string;
  /** Person who holds the credential. */
  holderName: string;
  /** Whether the holder is a guest or staff. */
  holderType: 'guest' | 'staff';
  /** Where the credential was presented. */
  accessPoint: AccessPoint;
  /** Room of the credential or of the door, when any. */
  roomId: number | null;
  /** Whether the door granted access. */
  result: 'granted' | 'denied';
  /** Why the door denied access. */
  denialReason: DenialReason | null;
}

/**
 * Access event entity within the Access Control bounded context.
 * It is a read-only record of a credential presented at an access point and whether the door granted it.
 */
export class AccessEvent implements AccessEventAttributes {
  /** Places where credentials are presented. */
  static readonly accessPoints: AccessPoint[] = [
    'main-entrance',
    'room-door',
    'elevator',
    'service-corridor',
    'storage-room',
  ];

  /** Reasons a door can deny a credential. */
  static readonly denialReasons: DenialReason[] = [
    'outside-scope',
    'not-active-yet',
    'expired',
    'revoked',
  ];

  id: number | null;
  propertyId: number | null;
  occurredAt: string;
  credentialId: number | null;
  cardId: string;
  holderName: string;
  holderType: 'guest' | 'staff';
  accessPoint: AccessPoint;
  roomId: number | null;
  result: 'granted' | 'denied';
  denialReason: DenialReason | null;

  /**
   * @param params - Entity attributes.
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
  }: Partial<AccessEventAttributes> = {}) {
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

  /** Whether the door denied access. */
  get isDenied(): boolean {
    return this.result === 'denied';
  }
}
