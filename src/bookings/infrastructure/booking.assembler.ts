import { HttpResponse } from '@angular/common/http';
import { resourcesFromResponse } from '../../shared/infrastructure/resources-from-response';
import { Booking, BookingAttributes } from '../domain/model/booking.entity';

/** Resource payload of a booking, as exchanged with the API. */
export type BookingResource = Partial<BookingAttributes>;

/**
 * Maps booking resources into Bookings domain entities.
 */
export class BookingAssembler {
  /**
   * @param resource - Booking resource payload.
   * @returns Booking entity.
   */
  static toEntityFromResource(resource: BookingResource): Booking {
    return new Booking({ ...resource });
  }

  /**
   * Parses booking resources from a response and maps them into entities.
   * @param response - HTTP response with booking resources.
   * @returns Booking entities.
   */
  static toEntitiesFromResponse(response: HttpResponse<unknown>): Booking[] {
    return resourcesFromResponse<BookingResource>(response, 'bookings').map(
      (resource) => this.toEntityFromResource(resource),
    );
  }
}
