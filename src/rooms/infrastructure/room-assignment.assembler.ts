import { HttpResponse } from '@angular/common/http';
import { resourcesFromResponse } from '../../shared/infrastructure/resources-from-response';
import { RoomAssignment } from '../domain/model/room-assignment.entity';

/** Booking fields from which a room assignment is derived. */
export interface RoomAssignmentBookingResource {
  id: number;
  propertyId: number;
  roomId: number;
  code: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
}

/**
 * Maps booking resources into the room assignments that control Rooms day statuses.
 * Checked-in bookings make their room Occupied; other room-holding bookings make it Booked.
 */
export class RoomAssignmentAssembler {
  /** Booking statuses whose booking keeps its room for its nights. */
  static readonly roomHoldingStatuses = ['pending', 'confirmed', 'checked-in'];

  /**
   * Returns the ISO day before another ISO day.
   * @param value - ISO calendar day.
   */
  static #previousDay(value: string): string {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
  }

  /**
   * @param resource - Booking resource payload.
   * @returns Room assignment covering the booking's nights.
   */
  static toEntityFromResource(
    resource: RoomAssignmentBookingResource,
  ): RoomAssignment {
    return new RoomAssignment({
      id: resource.id,
      propertyId: resource.propertyId,
      roomId: resource.roomId,
      bookingId: resource.id,
      bookingCode: resource.code,
      status: resource.status === 'checked-in' ? 'occupied' : 'booked',
      startDate: resource.checkInDate,
      endDate: RoomAssignmentAssembler.#previousDay(resource.checkOutDate),
    });
  }

  /**
   * Parses booking resources from a response and maps the room-holding ones into room assignments.
   * @param response - HTTP response with booking resources.
   * @returns Room assignment entities.
   */
  static toEntitiesFromResponse(
    response: HttpResponse<unknown>,
  ): RoomAssignment[] {
    return resourcesFromResponse<RoomAssignmentBookingResource>(
      response,
      'bookings',
    )
      .filter((resource) => this.roomHoldingStatuses.includes(resource.status))
      .map((resource) => this.toEntityFromResource(resource));
  }
}
