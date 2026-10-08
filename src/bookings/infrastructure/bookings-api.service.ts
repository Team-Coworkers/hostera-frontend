import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BaseApiService } from '../../shared/infrastructure/base-api.service';
import { BookingResource } from './booking.assembler';
import { PaymentResource } from './payment.assembler';

/**
 * Infrastructure gateway for Bookings bounded-context endpoints.
 */
@Injectable({ providedIn: 'root' })
export class BookingsApiService extends BaseApiService {
  private readonly bookingsEndpoint = this.createEndpoint<BookingResource>(
    environment.bookingsEndpointPath,
  );
  private readonly paymentsEndpoint = this.createEndpoint<PaymentResource>(
    environment.paymentsEndpointPath,
  );

  /**
   * Fetches the bookings of a property.
   * @param propertyId - The ID of the property.
   */
  getBookings(propertyId: number): Observable<HttpResponse<BookingResource[]>> {
    return this.bookingsEndpoint.getAll({ propertyId });
  }

  /**
   * Fetches the booking with the highest code of a property.
   * @param propertyId - The ID of the property.
   * @returns Response with at most one booking.
   */
  getLatestBooking(
    propertyId: number,
  ): Observable<HttpResponse<BookingResource[]>> {
    return this.bookingsEndpoint.getAll({
      propertyId,
      _sort: 'code',
      _order: 'desc',
      _limit: 1,
    });
  }

  /** @param resource - Booking resource payload. */
  createBooking(resource: object): Observable<HttpResponse<BookingResource>> {
    return this.bookingsEndpoint.create(resource);
  }

  /** @param resource - Booking resource payload (must include id). */
  updateBooking(resource: {
    id: number | null;
  }): Observable<HttpResponse<BookingResource>> {
    return this.bookingsEndpoint.update(resource.id!, resource);
  }

  /**
   * Fetches the payments of a property's bookings.
   * @param propertyId - The ID of the property.
   */
  getPayments(propertyId: number): Observable<HttpResponse<PaymentResource[]>> {
    return this.paymentsEndpoint.getAll({ propertyId });
  }

  /** @param resource - Payment resource payload. */
  createPayment(resource: object): Observable<HttpResponse<PaymentResource>> {
    return this.paymentsEndpoint.create(resource);
  }
}
