import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BaseApiService } from '../../shared/infrastructure/base-api.service';
import { DailyRateResource } from './daily-rate.assembler';
import { PropertyResource } from './property.assembler';
import { RatePlanResource } from './rate-plan.assembler';
import { RoomAssignmentBookingResource } from './room-assignment.assembler';
import { RoomTypeResource } from './room-type.assembler';
import { RoomResource } from './room.assembler';
import { StatusPeriodResource } from './status-period.assembler';

/** Resource with the identifier required to update it. */
type Identified = { id: number | null };

/**
 * Infrastructure gateway for Rooms bounded-context endpoints.
 */
@Injectable({ providedIn: 'root' })
export class RoomsApiService extends BaseApiService {
  private readonly propertiesEndpoint = this.createEndpoint<PropertyResource>(
    environment.propertiesEndpointPath,
  );
  private readonly roomTypesEndpoint = this.createEndpoint<RoomTypeResource>(
    environment.roomTypesEndpointPath,
  );
  private readonly roomsEndpoint = this.createEndpoint<RoomResource>(
    environment.roomsEndpointPath,
  );
  private readonly statusPeriodsEndpoint =
    this.createEndpoint<StatusPeriodResource>(
      environment.statusPeriodsEndpointPath,
    );
  private readonly roomAssignmentsEndpoint =
    this.createEndpoint<RoomAssignmentBookingResource>(
      environment.bookingsEndpointPath,
    );
  private readonly ratePlansEndpoint = this.createEndpoint<RatePlanResource>(
    environment.ratePlansEndpointPath,
  );
  private readonly dailyRatesEndpoint = this.createEndpoint<DailyRateResource>(
    environment.dailyRatesEndpointPath,
  );

  /** Fetches all properties. */
  getProperties(): Observable<HttpResponse<PropertyResource[]>> {
    return this.propertiesEndpoint.getAll();
  }

  /** @param propertyId - The ID of the property whose room types are fetched. */
  getRoomTypes(
    propertyId: number,
  ): Observable<HttpResponse<RoomTypeResource[]>> {
    return this.roomTypesEndpoint.getAll({ propertyId });
  }

  /** @param resource - Room type resource payload. */
  createRoomType(resource: object): Observable<HttpResponse<RoomTypeResource>> {
    return this.roomTypesEndpoint.create(resource);
  }

  /** @param resource - Room type resource payload (must include id). */
  updateRoomType(
    resource: Identified,
  ): Observable<HttpResponse<RoomTypeResource>> {
    return this.roomTypesEndpoint.update(resource.id!, resource);
  }

  /** @param id - The ID of the room type to delete. */
  deleteRoomType(id: number): Observable<HttpResponse<unknown>> {
    return this.roomTypesEndpoint.delete(id);
  }

  /** @param propertyId - The ID of the property whose rooms are fetched. */
  getRooms(propertyId: number): Observable<HttpResponse<RoomResource[]>> {
    return this.roomsEndpoint.getAll({ propertyId });
  }

  /** @param resource - Room resource payload. */
  createRoom(resource: object): Observable<HttpResponse<RoomResource>> {
    return this.roomsEndpoint.create(resource);
  }

  /** @param resource - Room resource payload (must include id). */
  updateRoom(resource: Identified): Observable<HttpResponse<RoomResource>> {
    return this.roomsEndpoint.update(resource.id!, resource);
  }

  /** @param propertyId - The ID of the property whose rooms' status periods are fetched. */
  getStatusPeriods(
    propertyId: number,
  ): Observable<HttpResponse<StatusPeriodResource[]>> {
    return this.statusPeriodsEndpoint.getAll({ propertyId });
  }

  /** @param resource - Status period resource payload. */
  createStatusPeriod(
    resource: object,
  ): Observable<HttpResponse<StatusPeriodResource>> {
    return this.statusPeriodsEndpoint.create(resource);
  }

  /** @param resource - Status period resource payload (must include id). */
  updateStatusPeriod(
    resource: Identified,
  ): Observable<HttpResponse<StatusPeriodResource>> {
    return this.statusPeriodsEndpoint.update(resource.id!, resource);
  }

  /** @param id - The ID of the status period to delete. */
  deleteStatusPeriod(id: number): Observable<HttpResponse<unknown>> {
    return this.statusPeriodsEndpoint.delete(id);
  }

  /**
   * Fetches the bookings of a property, from which its room assignments are derived.
   * @param propertyId - The ID of the property.
   */
  getRoomAssignments(
    propertyId: number,
  ): Observable<HttpResponse<RoomAssignmentBookingResource[]>> {
    return this.roomAssignmentsEndpoint.getAll({ propertyId });
  }

  /** @param propertyId - The ID of the property whose rate plans are fetched. */
  getRatePlans(
    propertyId: number,
  ): Observable<HttpResponse<RatePlanResource[]>> {
    return this.ratePlansEndpoint.getAll({ propertyId });
  }

  /** @param resource - Rate plan resource payload. */
  createRatePlan(resource: object): Observable<HttpResponse<RatePlanResource>> {
    return this.ratePlansEndpoint.create(resource);
  }

  /** @param resource - Rate plan resource payload (must include id). */
  updateRatePlan(
    resource: Identified,
  ): Observable<HttpResponse<RatePlanResource>> {
    return this.ratePlansEndpoint.update(resource.id!, resource);
  }

  /** @param propertyId - The ID of the property whose daily rates are fetched. */
  getDailyRates(
    propertyId: number,
  ): Observable<HttpResponse<DailyRateResource[]>> {
    return this.dailyRatesEndpoint.getAll({ propertyId });
  }

  /** @param resource - Daily rate resource payload. */
  createDailyRate(
    resource: object,
  ): Observable<HttpResponse<DailyRateResource>> {
    return this.dailyRatesEndpoint.create(resource);
  }

  /** @param resource - Daily rate resource payload (must include id). */
  updateDailyRate(
    resource: Identified,
  ): Observable<HttpResponse<DailyRateResource>> {
    return this.dailyRatesEndpoint.update(resource.id!, resource);
  }

  /** @param id - The ID of the daily rate to delete. */
  deleteDailyRate(id: number): Observable<HttpResponse<unknown>> {
    return this.dailyRatesEndpoint.delete(id);
  }
}
