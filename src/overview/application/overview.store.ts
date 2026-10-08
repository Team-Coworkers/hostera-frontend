import {
  computed,
  effect,
  inject,
  Injectable,
  signal,
  untracked,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BookingsStore } from '../../bookings/application/bookings.store';
import { Booking } from '../../bookings/domain/model/booking.entity';
import { RoomsStore } from '../../rooms/application/rooms.store';
import { CalendarDay } from '../../rooms/domain/model/calendar-day';
import { DayStatus } from '../../rooms/domain/model/room.entity';
import { DailyPerformance } from '../domain/model/daily-performance.entity';
import { PropertyOverview } from '../domain/model/property-overview.entity';
import { OverviewApiService } from '../infrastructure/overview-api.service';
import { PropertyOverviewAssembler } from '../infrastructure/property-overview.assembler';

/** Periods whose performance the overview summarizes. */
export type PerformancePeriod = 'last-7' | 'last-30' | 'next-30';

/** Room revenue and occupancy of a period, with the change against the previous period. */
export interface Performance {
  days: DailyPerformance[];
  revenue: number;
  previousRevenue: number;
  change: number | null;
  occupancyRate: number;
}

/** Booking arriving today, with whether the guest has arrived and what they owe. */
export interface Arrival {
  booking: Booking;
  arrived: boolean;
  balanceDue: number;
}

/** Current local ISO calendar day. */
export function today(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Application service store for the Overview bounded context.
 * It reads bookings and rooms from their contexts and the portfolio of every property to summarize operations.
 */
@Injectable({ providedIn: 'root' })
export class OverviewStore {
  private readonly overviewApi = inject(OverviewApiService);
  private readonly roomsStore = inject(RoomsStore);
  private readonly bookingsStore = inject(BookingsStore);

  /** Overview of each property for today. */
  readonly propertyOverviews = signal<PropertyOverview[]>([]);
  /** Whether property overviews have been loaded from the API. */
  readonly propertyOverviewsLoaded = signal(false);
  /** Errors encountered while loading property overviews. */
  readonly propertyOverviewErrors = signal<unknown[]>([]);

  constructor() {
    // Overviews follow the loaded properties and refresh when bookings change.
    effect(() => {
      this.roomsStore.properties().length;
      this.bookingsStore.bookings();
      if (this.roomsStore.propertiesLoaded())
        untracked(() => this.fetchPropertyOverviews());
    });
  }

  /** Loads the overview of every property for today. */
  fetchPropertyOverviews(): Promise<void> {
    this.propertyOverviewErrors.set([]);
    this.propertyOverviewsLoaded.set(false);
    return firstValueFrom(this.overviewApi.getPortfolio())
      .then((responses) => {
        this.propertyOverviews.set(
          PropertyOverviewAssembler.toEntitiesFromResponses(
            this.roomsStore.properties(),
            responses,
            today(),
          ),
        );
        this.propertyOverviewsLoaded.set(true);
      })
      .catch((error) =>
        this.propertyOverviewErrors.update((errors) => [...errors, error]),
      );
  }

  /**
   * Room revenue and occupancy of the current property over a period, with the change against the previous period.
   * @param period - Period to summarize.
   */
  getPerformance(period: PerformancePeriod): Performance {
    const length = period === 'last-7' ? 7 : 30;
    const start =
      period === 'next-30'
        ? today()
        : CalendarDay.addDays(today(), -(length - 1));
    const dates = Array.from({ length }, (_, index) =>
      CalendarDay.addDays(start, index),
    );
    const previousDates = dates.map((date) =>
      CalendarDay.addDays(date, -length),
    );
    const inputs = {
      bookings: this.bookingsStore.bookings(),
      roomsCount: this.roomsStore.rooms().length,
    };
    const days = DailyPerformance.series({ ...inputs, dates });
    const previous = DailyPerformance.series({
      ...inputs,
      dates: previousDates,
    });
    const sum = (entries: DailyPerformance[]) =>
      entries.reduce((total, entry) => total + entry.revenue, 0);
    const revenue = sum(days);
    const previousRevenue = sum(previous);
    return {
      days,
      revenue,
      previousRevenue,
      change: previousRevenue
        ? (revenue - previousRevenue) / previousRevenue
        : null,
      occupancyRate:
        days.reduce((total, day) => total + day.occupancyRate, 0) / length,
    };
  }

  /** Today's arrivals of the current property: bookings due today and those already checked in today. */
  readonly todaysArrivals = computed<Arrival[]>(() => {
    const day = today();
    return this.bookingsStore
      .bookings()
      .filter(
        (booking) =>
          booking.checkInDate === day &&
          ['pending', 'confirmed', 'checked-in'].includes(booking.status),
      )
      .map((booking) => ({
        booking,
        arrived: booking.status === 'checked-in',
        balanceDue: this.bookingsStore.getBalanceDue(booking),
      }))
      .sort((a, b) => Number(a.arrived) - Number(b.arrived));
  });

  /** Number of rooms of the current property in each day status today. */
  readonly roomStatusCounts = computed(() => {
    const day = today();
    const counts: Partial<Record<DayStatus, number>> = {};
    for (const room of this.roomsStore.rooms()) {
      const status = this.roomsStore.getDayStatus(room.id, day);
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  });

  /**
   * Finds bookings of the current property by guest name or booking code.
   * @param query - Text to search.
   * @returns Up to eight matching bookings, latest stays first.
   */
  searchBookings(query: string): Booking[] {
    const text = query.trim().toLowerCase();
    if (!text) return [];
    return this.bookingsStore
      .bookings()
      .filter((booking) =>
        `${booking.guestName} ${booking.code}`.toLowerCase().includes(text),
      )
      .sort((a, b) => b.checkInDate.localeCompare(a.checkInDate))
      .slice(0, 8);
  }
}
