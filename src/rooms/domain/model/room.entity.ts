import { RoomAssignment } from './room-assignment.entity';
import { RoomsError } from './rooms.error';
import { StatusPeriod } from './status-period.entity';

/** Day statuses a room can have, from sellable to unusable. */
export type DayStatus =
  | 'available'
  | 'booked'
  | 'occupied'
  | 'needs-cleaning'
  | 'blocked'
  | 'out-of-service';

/** Attributes of a {@link Room}, as exchanged with the API. */
export interface RoomAttributes {
  /** Room identifier. */
  id: number | null;
  /** Identifier of the owning property. */
  propertyId: number | null;
  /** Room number, unique within the property. */
  number: string;
  /** Identifier of the room type. */
  roomTypeId: number | null;
  /** Building level of the room. */
  floor: number | null;
}

/**
 * Room entity within the Rooms bounded context.
 * It takes its capacity and bed configuration from its room type.
 */
export class Room implements RoomAttributes {
  /** Day statuses a room can have, from sellable to unusable. */
  static readonly dayStatuses: DayStatus[] = [
    'available',
    'booked',
    'occupied',
    'needs-cleaning',
    'blocked',
    'out-of-service',
  ];

  id: number | null;
  propertyId: number | null;
  number: string;
  roomTypeId: number | null;
  floor: number | null;

  /**
   * @param params - Entity attributes; the API may send the room number as a number.
   */
  constructor({
    id = null,
    propertyId = null,
    number = '',
    roomTypeId = null,
    floor = null,
  }: Partial<
    Omit<RoomAttributes, 'number'> & { number: string | number }
  > = {}) {
    this.id = id;
    this.propertyId = propertyId;
    this.number = String(number).trim();
    this.roomTypeId = roomTypeId;
    this.floor = floor;
  }

  /**
   * Derives the room's day status: its room assignment first, then its operational status, otherwise Available.
   * @param date - ISO calendar day.
   * @param roomAssignments - Room assignments of the property.
   * @param statusPeriods - Status periods of the property.
   */
  dayStatusOn(
    date: string,
    roomAssignments: RoomAssignment[],
    statusPeriods: StatusPeriod[],
  ): DayStatus {
    const coversRoomDay = (entry: RoomAssignment | StatusPeriod) =>
      entry.roomId === this.id && entry.covers(date);
    return (
      roomAssignments.find(coversRoomDay)?.status ??
      statusPeriods.find(coversRoomDay)?.status ??
      'available'
    );
  }

  /**
   * Validates the room's required attributes.
   * @throws RoomsError When a business rule is violated.
   */
  validate(): void {
    if (!this.number || !this.roomTypeId)
      throw new RoomsError('required-fields');
    if (this.floor !== null && !Number.isInteger(this.floor))
      throw new RoomsError('invalid-floor');
  }
}
