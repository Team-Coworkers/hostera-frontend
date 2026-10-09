import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { AccessControlStore } from '../../../../access-control/application/access-control.store';
import { RoomsStore } from '../../../../rooms/application/rooms.store';
import {
  CalendarDate,
  formatDateTime,
  formatDayRange,
  formatMoney,
} from '../../../../shared/presentation/calendar-format';
import { LayoutBodyDirective } from '../../../../shared/presentation/components/context-layout/layout-body.directive';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { ToastService } from '../../../../shared/presentation/services/toast.service';
import { BookingsStore } from '../../../application/bookings.store';
import { CheckOutBookingCommand } from '../../../domain/check-out-booking.command';
import { Booking, RoomCondition } from '../../../domain/model/booking.entity';
import { BookingsError } from '../../../domain/model/bookings.error';
import { BookingPaymentSummaryComponent } from '../../components/booking-payment-summary/booking-payment-summary.component';
import { BookingStatusTagComponent } from '../../components/booking-status-tag/booking-status-tag.component';
import { BookingsLayoutComponent } from '../../components/bookings-layout/bookings-layout.component';

const roomConditionIcons: Record<RoomCondition, string> = {
  'no-issues': 'check_circle',
  'needs-attention': 'warning',
};

/**
 * Check-out review: departure, room condition, balance, and the changes it makes to the
 * booking, the room, and the guest's key cards.
 */
@Component({
  selector: 'app-booking-check-out',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    BookingsLayoutComponent,
    LayoutBodyDirective,
    MessageComponent,
    BookingPaymentSummaryComponent,
    BookingStatusTagComponent,
  ],
  templateUrl: './booking-check-out.component.html',
})
export class BookingCheckOutComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(BookingsStore);
  private readonly roomsStore = inject(RoomsStore);
  private readonly accessControlStore = inject(AccessControlStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Booking identifier from the route. */
  readonly id = input.required<string>();

  private readonly today = CalendarDate.today();
  private readonly departure = new Date().toISOString();
  protected readonly roomConditions = Booking.roomConditions;
  protected readonly roomConditionIcons = roomConditionIcons;
  protected readonly roomCondition = signal<RoomCondition>('no-issues');
  protected readonly note = signal('');
  protected readonly errorCode = signal('');

  protected readonly booking = computed(() =>
    this.store.getBookingById(this.id()),
  );
  protected readonly room = computed(() =>
    this.roomsStore.getRoomById(this.booking()?.roomId ?? null),
  );
  protected readonly roomType = computed(() =>
    this.roomsStore.getRoomTypeById(this.booking()?.roomTypeId ?? null),
  );
  protected readonly usableKeyCards = computed(() => {
    const booking = this.booking();
    return booking
      ? this.accessControlStore
          .getKeyCardsOfBooking(booking.id)
          .filter((keyCard) => keyCard.isUsableAt(this.departure))
      : [];
  });
  private readonly currency = computed(
    () => this.roomsStore.currentProperty()?.currency ?? 'PEN',
  );
  protected readonly balanceDue = computed(() => {
    const booking = this.booking();
    return booking ? this.store.getBalanceDue(booking) : 0;
  });
  /** Leaving before the check-out day frees the remaining nights; the saved total does not change. */
  protected readonly earlyDeparture = computed(() => {
    const booking = this.booking();
    return !!booking && this.today < booking.checkOutDate;
  });

  /** Moment of the departure, formatted. */
  protected departureLabel(): string {
    return formatDateTime(this.departure, this.i18n.locale());
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

  /** Checks the guest out, ends the key cards, and opens the booking. */
  protected async completeCheckOut(): Promise<void> {
    this.errorCode.set('');
    const booking = this.booking()!;
    try {
      await this.store.checkOutBooking(
        new CheckOutBookingCommand({
          bookingId: booking.id!,
          roomCondition: this.roomCondition(),
          note: this.note(),
        }),
      );
      this.toast.add({
        severity: 'success',
        summary: this.i18n.t('bookings.booking-check-out.completed', {
          name: booking.guestName,
        }),
        life: 4000,
      });
      this.router.navigate(['/bookings', this.id()]);
    } catch (error) {
      this.errorCode.set(
        error instanceof BookingsError ? error.code : 'connection',
      );
    }
  }
}
