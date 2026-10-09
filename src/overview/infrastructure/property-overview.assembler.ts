import { HttpResponse } from '@angular/common/http';
import { resourcesFromResponse } from '../../shared/infrastructure/resources-from-response';
import { PropertyOverview } from '../domain/model/property-overview.entity';

/** Room fields the overview reads. */
export interface PortfolioRoomResource {
  id: number;
  propertyId: number;
}

/** Booking fields the overview reads. */
export interface PortfolioBookingResource {
  roomId: number;
  status: string;
  checkInDate: string;
  checkOutDate: string;
}

/** Status period fields the overview reads. */
export interface PortfolioStatusPeriodResource {
  roomId: number;
  status: string;
  startDate: string;
  endDate: string;
}

/** Property whose overview is derived. */
export interface PortfolioProperty {
  id: number | null;
  name: string;
}

/**
 * Derives the overview of each property from the rooms, bookings, and status periods of all properties.
 */
export class PropertyOverviewAssembler {
  /** Booking statuses whose booking keeps its room for its nights. */
  static readonly roomHoldingStatuses = ['pending', 'confirmed', 'checked-in'];

  /**
   * @param properties - Properties to summarize.
   * @param responses - Responses with rooms, bookings, and status periods.
   * @param today - Current ISO calendar day.
   * @returns Overview of each property.
   */
  static toEntitiesFromResponses(
    properties: PortfolioProperty[],
    responses: [
      HttpResponse<unknown>,
      HttpResponse<unknown>,
      HttpResponse<unknown>,
    ],
    today: string,
  ): PropertyOverview[] {
    const rooms = resourcesFromResponse<PortfolioRoomResource>(
      responses[0],
      'rooms',
    );
    const bookings = resourcesFromResponse<PortfolioBookingResource>(
      responses[1],
      'bookings',
    );
    const statusPeriods = resourcesFromResponse<PortfolioStatusPeriodResource>(
      responses[2],
      'status-periods',
    );
    const coversToday = (period: PortfolioStatusPeriodResource) =>
      period.startDate <= today && today <= period.endDate;
    return properties.map((property) => {
      const propertyRooms = rooms.filter(
        (room) => room.propertyId === property.id,
      );
      const roomIds = new Set(propertyRooms.map((room) => room.id));
      const todayPeriods = statusPeriods.filter(
        (period) => roomIds.has(period.roomId) && coversToday(period),
      );
      return new PropertyOverview({
        propertyId: property.id,
        name: property.name,
        roomsCount: propertyRooms.length,
        heldRooms: new Set(
          bookings
            .filter(
              (booking) =>
                roomIds.has(booking.roomId) &&
                this.roomHoldingStatuses.includes(booking.status) &&
                booking.checkInDate <= today &&
                today < booking.checkOutDate,
            )
            .map((booking) => booking.roomId),
        ).size,
        roomsNeedingCleaning: todayPeriods.filter(
          (period) => period.status === 'needs-cleaning',
        ).length,
        roomsOutOfOrder: todayPeriods.filter(
          (period) => period.status !== 'needs-cleaning',
        ).length,
      });
    });
  }
}
