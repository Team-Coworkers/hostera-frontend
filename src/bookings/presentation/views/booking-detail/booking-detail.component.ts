import { Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AccessControlStore } from '../../../../access-control/application/access-control.store';
import { CredentialStatusTagComponent } from '../../../../access-control/presentation/components/credential-status-tag/credential-status-tag.component';
import { RoomsStore } from '../../../../rooms/application/rooms.store';
import {
  CalendarDate,
  formatDateTime,
  formatDay,
} from '../../../../shared/presentation/calendar-format';
import { LayoutBodyDirective } from '../../../../shared/presentation/components/context-layout/layout-body.directive';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { dialogConfig } from '../../../../shared/presentation/services/drawer.config';
import { ToastService } from '../../../../shared/presentation/services/toast.service';
import {
  BookingsStore,
  demoOperator,
} from '../../../application/bookings.store';
import { Booking, BookingStatus } from '../../../domain/model/booking.entity';
import { BookingsError } from '../../../domain/model/bookings.error';
import { BookingCancelDialogComponent } from '../../components/booking-cancel-dialog/booking-cancel-dialog.component';
import { BookingPaymentSummaryComponent } from '../../components/booking-payment-summary/booking-payment-summary.component';
import {
  BookingStatusDialogComponent,
  BookingStatusDialogData,
} from '../../components/booking-status-dialog/booking-status-dialog.component';
import { BookingStatusTagComponent } from '../../components/booking-status-tag/booking-status-tag.component';
import { BookingsLayoutComponent } from '../../components/bookings-layout/bookings-layout.component';

/** Labeled value shown in a description list. */
interface Fact {
  label: string;
  value: string;
  mono?: boolean;
}

/** Icons of the status panel; bookings in other statuses have none. */
const statusPanels: Partial<Record<BookingStatus, string>> = {
  pending: 'schedule',
  confirmed: 'event',
  cancelled: 'cancel',
  'no-show': 'person_remove',
  'checked-in': 'login',
  'checked-out': 'logout',
};

/**
 * Booking detail: stay, guest and booking information, the status panel with its actions,
 * key cards, and payments.
 */
@Component({
  selector: 'app-booking-detail',
  imports: [
    RouterLink,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    BookingsLayoutComponent,
    LayoutBodyDirective,
    MessageComponent,
    BookingStatusTagComponent,
    BookingPaymentSummaryComponent,
    CredentialStatusTagComponent,
  ],
  templateUrl: './booking-detail.component.html',
})
export class BookingDetailComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(BookingsStore);
  private readonly roomsStore = inject(RoomsStore);
  protected readonly accessControlStore = inject(AccessControlStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  /** Booking identifier from the route. */
  readonly id = input.required<string>();

  protected readonly today = CalendarDate.today();
  protected readonly statusPanels = statusPanels;
  protected readonly restoreErrorCode = signal('');

  protected readonly booking = computed(() =>
    this.store.getBookingById(this.id()),
  );
  protected readonly room = computed(() =>
    this.roomsStore.getRoomById(this.booking()?.roomId ?? null),
  );
  protected readonly roomType = computed(() =>
    this.roomsStore.getRoomTypeById(this.booking()?.roomTypeId ?? null),
  );
  protected readonly ratePlan = computed(() =>
    this.roomsStore.getRatePlanById(this.booking()?.ratePlanId ?? null),
  );
  protected readonly nightsCount = computed(
    () => this.booking()?.nights.length ?? 0,
  );
  protected readonly keyCards = computed(() => {
    const booking = this.booking();
    return booking
      ? this.accessControlStore.getKeyCardsOfBooking(booking.id)
      : [];
  });
  /** Cancelling and marking a no-show apply to bookings that have not ended; others have no actions. */
  protected readonly hasActions = computed(() =>
    ['pending', 'confirmed', 'checked-in'].includes(
      this.booking()?.status ?? '',
    ),
  );
  protected readonly checkedIn = computed(
    () => this.booking()?.status === 'checked-in',
  );
  protected readonly noShowCaption = computed(() => {
    const booking = this.booking();
    if (!booking) return '';
    if (booking.status === 'checked-in')
      return this.i18n.t('bookings.booking-detail.checked-in-locked');
    return booking.status === 'pending'
      ? this.i18n.t('bookings.booking-detail.no-show-confirmed-only')
      : this.i18n.t('bookings.booking-detail.no-show-from-check-in');
  });
  protected readonly canRestore = computed(() => {
    const booking = this.booking();
    return (
      !!booking?.canBeRestored(this.today) &&
      this.store.isRoomAvailable(booking.roomId, booking)
    );
  });
  protected readonly statusFacts = computed<Fact[]>(() => {
    const booking = this.booking();
    if (!booking) return [];
    const t = (key: string) => this.i18n.t(key);
    const { status } = booking;
    if (status === 'cancelled')
      return [
        {
          label: t('bookings.booking-detail.cancelled-at'),
          value: this.dateTime(booking.cancelledAt),
        },
        {
          label: t('bookings.booking-detail.by'),
          value: this.operatorName(booking.cancelledBy),
        },
        {
          label: t('bookings.booking-detail.reason'),
          value: booking.cancellationReason
            ? t(
                `bookings.bookings-terms.cancellation-reasons.${booking.cancellationReason}`,
              )
            : '—',
        },
      ];
    if (status === 'no-show')
      return [
        {
          label: t('bookings.booking-detail.recorded-at'),
          value: this.dateTime(booking.noShowAt),
        },
        {
          label: t('bookings.booking-detail.by'),
          value: this.operatorName(booking.noShowBy),
        },
        {
          label: t('bookings.booking-detail.arrival'),
          value: t('bookings.booking-detail.not-recorded'),
        },
      ];
    if (status === 'checked-in' || status === 'checked-out')
      return [
        {
          label: t('bookings.booking-detail.checked-in-at'),
          value: this.dateTime(booking.checkedInAt),
        },
        ...(status === 'checked-out'
          ? [
              {
                label: t('bookings.booking-detail.checked-out-at'),
                value: this.dateTime(booking.checkedOutAt),
              },
            ]
          : []),
        {
          label: t('bookings.booking-detail.by'),
          value: this.operatorName(
            status === 'checked-out'
              ? booking.checkedOutBy
              : booking.checkedInBy,
          ),
        },
        {
          label: t('bookings.booking-detail.document'),
          value: booking.guestDocumentType
            ? `${t(`bookings.bookings-terms.document-types.${booking.guestDocumentType}`)} ${booking.guestDocumentNumber}`
            : '—',
        },
        ...(status === 'checked-out'
          ? [
              {
                label: t('bookings.booking-detail.room-condition'),
                value: booking.roomCondition
                  ? t(
                      `bookings.bookings-terms.room-conditions.${booking.roomCondition}`,
                    )
                  : '—',
              },
            ]
          : []),
      ];
    if (status === 'confirmed' && booking.confirmedAt)
      return [
        {
          label: t('bookings.booking-detail.confirmed-at'),
          value: this.dateTime(booking.confirmedAt),
        },
        {
          label: t('bookings.booking-detail.by'),
          value: this.operatorName(booking.confirmedBy),
        },
      ];
    return [];
  });
  protected readonly guestFacts = computed<Fact[]>(() => {
    const booking = this.booking();
    if (!booking) return [];
    return [
      {
        label: this.i18n.t('bookings.booking-detail.email'),
        value: booking.guestEmail,
      },
      {
        label: this.i18n.t('bookings.booking-detail.phone'),
        value: booking.guestPhone || '—',
      },
      {
        label: this.i18n.t('bookings.booking-detail.language'),
        value: this.i18n.t(
          `bookings.bookings-terms.languages.${booking.preferredLanguage}`,
        ),
      },
    ];
  });
  protected readonly bookingFacts = computed<Fact[]>(() => {
    const booking = this.booking();
    if (!booking) return [];
    return [
      {
        label: this.i18n.t('bookings.booking-detail.code'),
        value: booking.code,
        mono: true,
      },
      {
        label: this.i18n.t('bookings.booking-detail.rate-plan'),
        value: this.ratePlan()?.name ?? '—',
      },
      {
        label: this.i18n.t('bookings.booking-detail.created'),
        value: booking.createdAt
          ? formatDay(booking.createdAt, this.i18n.locale(), {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : '—',
      },
    ];
  });

  /**
   * Formats the moment a status changed, when it was recorded.
   * @param value - ISO date-time.
   */
  protected dateTime(value: string | null): string {
    return value ? formatDateTime(value, this.i18n.locale()) : '—';
  }

  /**
   * Returns the display name of the operator who changed the booking's status.
   * @param operator - Recorded operator.
   */
  private operatorName(operator: string | null): string {
    return operator === demoOperator
      ? this.i18n.t('bookings.bookings-terms.demo-operator')
      : (operator ?? '—');
  }

  /**
   * Formats a stay day with its weekday, such as "Wed, Oct 7".
   * @param date - ISO calendar day.
   */
  protected stayDay(date: string): string {
    return formatDay(date, this.i18n.locale(), {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  /** Confirms that the booking's status changed. */
  private notifySaved(): void {
    this.toast.add({
      severity: 'success',
      summary: this.i18n.t('bookings.booking-detail.saved'),
    });
  }

  /** @param action - Status change to apply after confirmation. */
  protected openStatusDialog(action: 'confirm' | 'no-show'): void {
    this.dialog
      .open<BookingStatusDialogComponent, BookingStatusDialogData, Booking>(
        BookingStatusDialogComponent,
        dialogConfig({ booking: this.booking()!, action }),
      )
      .afterClosed()
      .subscribe((saved) => saved && this.notifySaved());
  }

  /** Opens the cancellation dialog. */
  protected openCancelDialog(): void {
    this.dialog
      .open<BookingCancelDialogComponent, Booking, Booking>(
        BookingCancelDialogComponent,
        dialogConfig(this.booking()!, '32rem'),
      )
      .afterClosed()
      .subscribe((saved) => saved && this.notifySaved());
  }

  /** Restores a cancelled booking as pending when its room is still available. */
  protected async restore(): Promise<void> {
    this.restoreErrorCode.set('');
    try {
      await this.store.restoreBooking(this.booking()!.id!);
      this.notifySaved();
    } catch (error) {
      this.restoreErrorCode.set(
        error instanceof BookingsError ? error.code : 'connection',
      );
    }
  }

  /** Starts a new booking with this booking's guest, room type, guests, and rate plan. */
  protected duplicate(): void {
    this.router.navigate(['/bookings/new'], {
      queryParams: { from: this.booking()!.id },
    });
  }
}
