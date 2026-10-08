import {
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { RoomsStore } from '../../../../rooms/application/rooms.store';
import { RoomType } from '../../../../rooms/domain/model/room-type.entity';
import { Room } from '../../../../rooms/domain/model/room.entity';
import {
  CalendarDate,
  formatDayRange,
  formatMoney,
} from '../../../../shared/presentation/calendar-format';
import { LayoutBodyDirective } from '../../../../shared/presentation/components/context-layout/layout-body.directive';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { mediaQuerySignal } from '../../../../shared/presentation/media-query';
import { signalTableDataSource } from '../../../../shared/presentation/table-data-source';
import { BookingsStore } from '../../../application/bookings.store';
import {
  Booking,
  BookingStatus,
  PaymentStatus,
} from '../../../domain/model/booking.entity';
import { BookingStatusTagComponent } from '../../components/booking-status-tag/booking-status-tag.component';
import { BookingsLayoutComponent } from '../../components/bookings-layout/bookings-layout.component';
import { PaymentStatusTagComponent } from '../../components/payment-status-tag/payment-status-tag.component';

/** Stay periods the list can show. */
type Period = 'all' | 'current' | 'upcoming' | 'past';

/** Row of the bookings table. */
interface BookingRow {
  id: number | null;
  booking: Booking;
  room: Room | undefined;
  roomType: RoomType | undefined;
  nightsCount: number;
  paymentStatus: PaymentStatus;
}

/**
 * Bookings of the selected property, searchable by guest or code and filterable by
 * stay period and status. Below 768px the table becomes a list.
 */
@Component({
  selector: 'app-booking-list',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    BookingsLayoutComponent,
    LayoutBodyDirective,
    BookingStatusTagComponent,
    PaymentStatusTagComponent,
  ],
  templateUrl: './booking-list.component.html',
})
export class BookingListComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(BookingsStore);
  private readonly roomsStore = inject(RoomsStore);
  private readonly router = inject(Router);

  /** Below PrimeFlex's md breakpoint the table becomes a list of bookings. */
  protected readonly compact = mediaQuerySignal('(max-width: 767px)');
  protected readonly displayedColumns = [
    'guest',
    'stay',
    'room',
    'status',
    'payment',
    'total',
    'open',
  ];
  private readonly today = CalendarDate.today();
  protected readonly periods: Period[] = ['all', 'current', 'upcoming', 'past'];
  protected readonly statuses = Booking.statuses;

  protected readonly search = signal('');
  protected readonly period = signal<Period>('all');
  protected readonly statusFilter = signal<BookingStatus | null>(null);

  protected readonly currency = computed(
    () => this.roomsStore.currentProperty()?.currency ?? 'PEN',
  );
  private readonly bookingRows = computed<BookingRow[]>(() =>
    this.store.bookings().map((booking) => ({
      id: booking.id,
      booking,
      room: this.roomsStore.getRoomById(booking.roomId),
      roomType: this.roomsStore.getRoomTypeById(booking.roomTypeId),
      nightsCount: booking.nights.length,
      paymentStatus: this.store.getPaymentStatus(booking),
    })),
  );
  /** Latest stays first, as the table sorts them. */
  protected readonly filteredRows = computed(() => {
    const query = this.search().trim().toLowerCase();
    const today = this.today;
    return this.bookingRows()
      .toSorted((a, b) =>
        b.booking.checkInDate.localeCompare(a.booking.checkInDate),
      )
      .filter(({ booking }) => {
        const periodMatches = {
          all: true,
          current: booking.checkInDate <= today && today < booking.checkOutDate,
          upcoming: booking.checkInDate > today,
          past: booking.checkOutDate <= today,
        }[this.period()];
        return (
          periodMatches &&
          (!this.statusFilter() || booking.status === this.statusFilter()) &&
          `${booking.guestName} ${booking.code}`.toLowerCase().includes(query)
        );
      });
  });
  protected readonly filtersActive = computed(
    () => !!this.search() || this.period() !== 'all' || !!this.statusFilter(),
  );

  private readonly sort = viewChild(MatSort);
  private readonly paginator = viewChild(MatPaginator);
  protected readonly dataSource = signalTableDataSource(
    this.filteredRows,
    this.sort,
    this.paginator,
    {
      guest: (row) => row.booking.guestName,
      stay: (row) => row.booking.checkInDate,
      room: (row) => row.room?.number,
      total: (row) => row.booking.totalAmount,
    },
  );

  constructor() {
    effect(() => {
      this.store.currentPropertyId();
      untracked(() => this.resetFilters());
    });
  }

  /** Clears the search text, period, and status filters. */
  protected resetFilters(): void {
    this.search.set('');
    this.period.set('all');
    this.statusFilter.set(null);
  }

  /** @param booking - Booking whose stay is formatted. */
  protected stay(booking: Booking): string {
    return formatDayRange(
      booking.checkInDate,
      booking.checkOutDate,
      this.i18n.locale(),
    );
  }

  /** @param amount - Amount in the property's currency. */
  protected money(amount: number): string {
    return formatMoney(amount, this.currency(), this.i18n.locale());
  }

  /** @param booking - Booking to open. */
  protected openBooking(booking: Booking): void {
    this.router.navigate(['/bookings', booking.id]);
  }
}
