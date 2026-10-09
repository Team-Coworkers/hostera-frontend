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
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import {
  CalendarDate,
  formatDay,
} from '../../../../shared/presentation/calendar-format';
import { LayoutBodyDirective } from '../../../../shared/presentation/components/context-layout/layout-body.directive';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { mediaQuerySignal } from '../../../../shared/presentation/media-query';
import {
  dialogConfig,
  drawerConfig,
} from '../../../../shared/presentation/services/drawer.config';
import { ToastService } from '../../../../shared/presentation/services/toast.service';
import { signalTableDataSource } from '../../../../shared/presentation/table-data-source';
import { PublicHolidaysStore } from '../../../application/public-holidays.store';
import { RoomsStore } from '../../../application/rooms.store';
import { RoomType } from '../../../domain/model/room-type.entity';
import { DayStatus, Room } from '../../../domain/model/room.entity';
import {
  BookingControlledDialogComponent,
  BookingControlledDialogData,
} from '../../components/booking-controlled-dialog/booking-controlled-dialog.component';
import { DayStatusTagComponent } from '../../components/day-status-tag/day-status-tag.component';
import { RoomAvatarComponent } from '../../components/room-avatar/room-avatar.component';
import { RoomFormComponent } from '../../components/room-form/room-form.component';
import {
  RoomStatusFormComponent,
  RoomStatusFormData,
} from '../../components/room-status-form/room-status-form.component';
import { RoomsLayoutComponent } from '../../components/rooms-layout/rooms-layout.component';
import { WeekNavigatorComponent } from '../../components/week-navigator/week-navigator.component';

/** Row of the availability grid: a room and its status on each visible day. */
interface RoomRow {
  id: number | null;
  room: Room;
  roomType: RoomType | undefined;
  days: Record<string, DayStatus>;
}

/**
 * Weekly availability of the property's rooms, filterable by room number, room type,
 * and status on the first visible day. Below 768px it shows one day as a list.
 * Public holidays of the visible days, read from the Nager.Date API, are flagged
 * because they change hotel demand.
 */
@Component({
  selector: 'app-room-availability',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    RoomsLayoutComponent,
    LayoutBodyDirective,
    MessageComponent,
    DayStatusTagComponent,
    RoomAvatarComponent,
    WeekNavigatorComponent,
  ],
  templateUrl: './room-availability.component.html',
  styleUrl: './room-availability.component.css',
})
export class RoomAvailabilityComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(RoomsStore);
  protected readonly holidays = inject(PublicHolidaysStore);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  /** Below PrimeFlex's md breakpoint the week grid becomes a one-day room list. */
  protected readonly compact = mediaQuerySignal('(max-width: 767px)');
  protected readonly today = CalendarDate.today();
  protected readonly startDate = signal(this.today);
  protected readonly search = signal('');
  protected readonly roomTypeFilter = signal<number | null>(null);
  protected readonly statusFilter = signal<'all' | DayStatus>('all');

  protected readonly visibleDays = computed(() =>
    CalendarDate.sequence(this.startDate(), this.compact() ? 1 : 7),
  );
  /** Public holidays among the visible days. */
  protected readonly visibleHolidays = computed(() =>
    this.visibleDays()
      .map((date) => this.holidays.getHoliday(date))
      .filter((holiday) => holiday !== undefined),
  );
  protected readonly displayedColumns = computed(() => [
    'room',
    ...this.visibleDays(),
  ]);
  private readonly roomRows = computed<RoomRow[]>(() =>
    [...this.store.rooms()]
      .sort((a, b) =>
        a.number.localeCompare(b.number, undefined, { numeric: true }),
      )
      .map((room) => ({
        id: room.id,
        room,
        roomType: this.store.getRoomTypeById(room.roomTypeId),
        days: Object.fromEntries(
          this.visibleDays().map((date) => [
            date,
            this.store.getDayStatus(room.id, date),
          ]),
        ),
      })),
  );
  private readonly searchedRows = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.roomRows().filter(
      (row) =>
        row.room.number.toLowerCase().includes(query) &&
        (!this.roomTypeFilter() ||
          row.room.roomTypeId === this.roomTypeFilter()),
    );
  });
  protected readonly filteredRows = computed(() =>
    this.searchedRows().filter(
      (row) =>
        this.statusFilter() === 'all' ||
        row.days[this.startDate()] === this.statusFilter(),
    ),
  );
  protected readonly statusOptions = computed(() => {
    const start = this.startDate();
    return [
      {
        value: 'all' as const,
        label: this.i18n.t('rooms.room-availability.all'),
        count: this.searchedRows().length,
      },
      ...Room.dayStatuses.map((value) => ({
        value,
        label: this.i18n.t(`rooms.rooms-terms.day-statuses.${value}`),
        count: this.searchedRows().filter((row) => row.days[start] === value)
          .length,
      })),
    ];
  });
  protected readonly filtersActive = computed(
    () =>
      !!this.search() ||
      !!this.roomTypeFilter() ||
      this.statusFilter() !== 'all',
  );

  private readonly paginator = viewChild(MatPaginator);
  protected readonly dataSource = signalTableDataSource(
    this.filteredRows,
    signal(undefined),
    this.paginator,
    {},
  );

  constructor() {
    effect(() => {
      this.store.currentPropertyId();
      untracked(() => this.resetFilters());
    });
    effect(() => this.holidays.ensureLoaded(this.visibleDays()));
  }

  /** @param value - Count to format for the active locale. */
  protected count(value: number): string {
    return new Intl.NumberFormat(this.i18n.locale()).format(value);
  }

  /** @param date - ISO day formatted with the given options. */
  protected day(date: string, options: Intl.DateTimeFormatOptions): string {
    return formatDay(date, this.i18n.locale(), options);
  }

  /**
   * @param date - ISO calendar day.
   * @returns Name of the public holiday on that day in the active language, if any.
   */
  protected holidayName(date: string): string | undefined {
    return this.holidays.getHoliday(date)?.displayName(this.i18n.locale());
  }

  /** Clears the search text, room type, and status filters. */
  protected resetFilters(): void {
    this.search.set('');
    this.roomTypeFilter.set(null);
    this.statusFilter.set('all');
  }

  /**
   * Describes a room day for assistive technologies.
   * @param row - Room row.
   * @param date - ISO calendar day.
   */
  protected dayLabel(row: RoomRow, date: string): string {
    const bookingCode = this.store.getRoomAssignmentOn(
      row.room.id,
      date,
    )?.bookingCode;
    return [
      this.i18n.t('rooms.rooms-terms.room-number', { number: row.room.number }),
      formatDay(date, this.i18n.locale(), {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
      this.i18n.t(`rooms.rooms-terms.day-statuses.${row.days[date]}`),
      bookingCode,
      this.holidayName(date),
    ]
      .filter(Boolean)
      .join(', ');
  }

  /**
   * Opens the status form for a room day, or explains why its booking controls it.
   * @param room - Selected room.
   * @param date - Selected ISO calendar day.
   */
  protected openDay(room: Room, date: string): void {
    const roomAssignment = this.store.getRoomAssignmentOn(room.id, date);
    if (roomAssignment) {
      this.dialog.open<
        BookingControlledDialogComponent,
        BookingControlledDialogData
      >(
        BookingControlledDialogComponent,
        dialogConfig({ room, roomAssignment }, '32rem'),
      );
      return;
    }
    this.dialog
      .open<RoomStatusFormComponent, RoomStatusFormData, boolean>(
        RoomStatusFormComponent,
        drawerConfig({ room, date }),
      )
      .afterClosed()
      .subscribe((saved) => saved && this.notifySaved());
  }

  /** Opens the form to add a room. */
  protected newRoom(): void {
    this.dialog
      .open<RoomFormComponent, Room | null, Room>(
        RoomFormComponent,
        drawerConfig(null),
      )
      .afterClosed()
      .subscribe((saved) => saved && this.notifySaved());
  }

  /** Confirms that changes were saved. */
  private notifySaved(): void {
    this.toast.add({
      severity: 'success',
      summary: this.i18n.t('rooms.room-availability.saved'),
    });
  }
}
