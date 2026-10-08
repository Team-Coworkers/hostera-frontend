import { Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import {
  CalendarDate,
  formatDayRange,
  formatMoney,
} from '../../../../shared/presentation/calendar-format';
import { LayoutBodyDirective } from '../../../../shared/presentation/components/context-layout/layout-body.directive';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import {
  dialogConfig,
  drawerConfig,
} from '../../../../shared/presentation/services/drawer.config';
import { ToastService } from '../../../../shared/presentation/services/toast.service';
import { RoomsStore } from '../../../application/rooms.store';
import { DayStatus, Room } from '../../../domain/model/room.entity';
import {
  BookingControlledDialogComponent,
  BookingControlledDialogData,
} from '../../components/booking-controlled-dialog/booking-controlled-dialog.component';
import { DayStatusTagComponent } from '../../components/day-status-tag/day-status-tag.component';
import { RoomAvatarComponent } from '../../components/room-avatar/room-avatar.component';
import { RoomFormComponent } from '../../components/room-form/room-form.component';
import { RoomMonthCalendarComponent } from '../../components/room-month-calendar/room-month-calendar.component';
import {
  RoomStatusFormComponent,
  RoomStatusFormData,
} from '../../components/room-status-form/room-status-form.component';
import { RoomsLayoutComponent } from '../../components/rooms-layout/rooms-layout.component';

/** Booking, stay, or operational status of the room that has not ended. */
interface UpcomingEntry {
  key: string;
  status: DayStatus;
  startDate: string;
  endDate: string;
  detail: string;
}

/**
 * Room detail: its month calendar of day statuses, details, and upcoming bookings and statuses.
 */
@Component({
  selector: 'app-room-detail',
  imports: [
    RouterLink,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    RoomsLayoutComponent,
    LayoutBodyDirective,
    MessageComponent,
    DayStatusTagComponent,
    RoomAvatarComponent,
    RoomMonthCalendarComponent,
  ],
  templateUrl: './room-detail.component.html',
})
export class RoomDetailComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(RoomsStore);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  /** Room identifier from the route. */
  readonly id = input.required<string>();

  private readonly today = CalendarDate.today();
  protected readonly month = signal(CalendarDate.startOfMonth(this.today));
  protected readonly formatDayRange = formatDayRange;

  protected readonly room = computed(() => this.store.getRoomById(this.id()));
  protected readonly roomType = computed(() =>
    this.store.getRoomTypeById(this.room()?.roomTypeId ?? null),
  );
  protected readonly todayStatus = computed(() =>
    this.store.getDayStatus(this.room()?.id ?? null, this.today),
  );
  protected readonly roomFacts = computed(() => {
    const room = this.room();
    const roomType = this.roomType();
    const property = this.store.currentProperty();
    return [
      {
        label: this.i18n.t('rooms.room-detail.room-type'),
        value: roomType?.name,
      },
      {
        label: this.i18n.t('rooms.room-detail.capacity'),
        value: this.i18n.t('rooms.rooms-terms.guests', {
          count: roomType?.capacity ?? 0,
        }),
      },
      {
        label: this.i18n.t('rooms.room-detail.beds'),
        value: roomType?.bedConfiguration,
      },
      {
        label: this.i18n.t('rooms.room-detail.floor'),
        value: room?.floor ?? '—',
      },
      {
        label: this.i18n.t('rooms.room-detail.base-rate'),
        value: roomType
          ? formatMoney(
              roomType.baseNightlyRate,
              property?.currency ?? 'PEN',
              this.i18n.locale(),
            )
          : '—',
      },
      {
        label: this.i18n.t('rooms.room-detail.property'),
        value: property?.name,
      },
    ];
  });
  /** Bookings, stays, and operational statuses that have not ended yet. */
  protected readonly upcomingEntries = computed<UpcomingEntry[]>(() => {
    const roomId = this.room()?.id;
    return [
      ...this.store
        .roomAssignments()
        .filter(
          (roomAssignment) =>
            roomAssignment.roomId === roomId &&
            roomAssignment.endDate >= this.today,
        )
        .map((roomAssignment) => ({
          key: `assignment-${roomAssignment.id}`,
          status: roomAssignment.status,
          startDate: roomAssignment.startDate,
          endDate: roomAssignment.endDate,
          detail: roomAssignment.bookingCode,
        })),
      ...this.store
        .statusPeriods()
        .filter(
          (statusPeriod) =>
            statusPeriod.roomId === roomId &&
            statusPeriod.endDate >= this.today,
        )
        .map((statusPeriod) => ({
          key: `period-${statusPeriod.id}`,
          status: statusPeriod.status,
          startDate: statusPeriod.startDate,
          endDate: statusPeriod.endDate,
          detail: statusPeriod.reason,
        })),
    ].sort((a, b) => a.startDate.localeCompare(b.startDate));
  });

  /**
   * Opens the status form for a day, or explains why its booking controls it.
   * @param date - Selected ISO calendar day.
   */
  protected openDay(date: string): void {
    const room = this.room()!;
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

  /** Opens the form to edit the room. */
  protected editRoom(): void {
    this.dialog
      .open<RoomFormComponent, Room | null, Room>(
        RoomFormComponent,
        drawerConfig(this.room() ?? null),
      )
      .afterClosed()
      .subscribe((saved) => saved && this.notifySaved());
  }

  /** Confirms that changes were saved. */
  private notifySaved(): void {
    this.toast.add({
      severity: 'success',
      summary: this.i18n.t('rooms.room-detail.saved'),
    });
  }
}
