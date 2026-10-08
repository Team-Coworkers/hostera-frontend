import { StatusPeriod } from './model/status-period.entity.js';

/**
 * Command used by the Rooms application layer to set a room's operational status over a date range.
 * The Available status releases the range from any operational status.
 *
 * @class SetRoomStatusCommand
 */
export class SetRoomStatusCommand {
  /**
   * Statuses that can be requested.
   * @type {string[]}
   */
  static statuses = ['available', ...StatusPeriod.statuses];

  /**
   * @param {Object} params - Command attributes.
   * @param {number} params.roomId - Identifier of the room.
   * @param {'available'|'blocked'|'out-of-service'|'needs-cleaning'} params.status - Requested status.
   * @param {string} params.startDate - First ISO day of the range.
   * @param {string} params.endDate - Last ISO day of the range.
   * @param {string} [params.reason=''] - Why the status is set, required unless releasing.
   */
  constructor({ roomId, status, startDate, endDate, reason = '' }) {
    this.roomId = roomId;
    this.status = status;
    this.startDate = startDate;
    this.endDate = endDate;
    this.reason = reason;
  }
}
