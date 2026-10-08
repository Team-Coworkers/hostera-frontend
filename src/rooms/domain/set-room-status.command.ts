import { OperationalStatus, StatusPeriod } from './model/status-period.entity';

/** Statuses that can be requested for a room over a date range. */
export type RequestedRoomStatus = 'available' | OperationalStatus;

/**
 * Command used by the Rooms application layer to set a room's operational status over a date range.
 * The Available status releases the range from any operational status.
 */
export class SetRoomStatusCommand {
  /** Statuses that can be requested. */
  static readonly statuses: RequestedRoomStatus[] = [
    'available',
    ...StatusPeriod.statuses,
  ];

  /** Identifier of the room. */
  readonly roomId: number;
  /** Requested status. */
  readonly status: RequestedRoomStatus;
  /** First ISO day of the range. */
  readonly startDate: string;
  /** Last ISO day of the range. */
  readonly endDate: string;
  /** Why the status is set, required unless releasing. */
  readonly reason: string;

  /**
   * @param params - Command attributes.
   */
  constructor({
    roomId,
    status,
    startDate,
    endDate,
    reason = '',
  }: {
    roomId: number;
    status: RequestedRoomStatus;
    startDate: string;
    endDate: string;
    reason?: string;
  }) {
    this.roomId = roomId;
    this.status = status;
    this.startDate = startDate;
    this.endDate = endDate;
    this.reason = reason;
  }
}
