import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BaseApiService } from '../../shared/infrastructure/base-api.service';
import {
  PortfolioBookingResource,
  PortfolioRoomResource,
  PortfolioStatusPeriodResource,
} from './property-overview.assembler';

/** Responses with every property's rooms, bookings, and status periods. */
export type PortfolioResponses = [
  HttpResponse<PortfolioRoomResource[]>,
  HttpResponse<PortfolioBookingResource[]>,
  HttpResponse<PortfolioStatusPeriodResource[]>,
];

/**
 * Infrastructure gateway for the Overview bounded context: it reads the rooms, bookings,
 * and status periods of every property, without writing any resource.
 */
@Injectable({ providedIn: 'root' })
export class OverviewApiService extends BaseApiService {
  private readonly roomsEndpoint = this.createEndpoint<PortfolioRoomResource>(
    environment.roomsEndpointPath,
  );
  private readonly bookingsEndpoint =
    this.createEndpoint<PortfolioBookingResource>(
      environment.bookingsEndpointPath,
    );
  private readonly statusPeriodsEndpoint =
    this.createEndpoint<PortfolioStatusPeriodResource>(
      environment.statusPeriodsEndpointPath,
    );

  /** Fetches the rooms, bookings, and status periods of every property. */
  getPortfolio(): Observable<PortfolioResponses> {
    return forkJoin([
      this.roomsEndpoint.getAll(),
      this.bookingsEndpoint.getAll(),
      this.statusPeriodsEndpoint.getAll(),
    ]);
  }
}
