import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { Router, RouterLink } from '@angular/router';
import { AccessControlStore } from '../../../../access-control/application/access-control.store';
import { RfidEncoderPanelComponent } from '../../../../access-control/presentation/components/rfid-encoder-panel/rfid-encoder-panel.component';
import { RoomsStore } from '../../../../rooms/application/rooms.store';
import {
  CalendarDate,
  formatDateTime,
  formatDayRange,
} from '../../../../shared/presentation/calendar-format';
import { LayoutBodyDirective } from '../../../../shared/presentation/components/context-layout/layout-body.directive';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { ToastService } from '../../../../shared/presentation/services/toast.service';
import { BookingsStore } from '../../../application/bookings.store';
import { CheckInBookingCommand } from '../../../domain/check-in-booking.command';
import { Booking, DocumentType } from '../../../domain/model/booking.entity';
import { BookingsError } from '../../../domain/model/bookings.error';
import { BookingPaymentSummaryComponent } from '../../components/booking-payment-summary/booking-payment-summary.component';
import { BookingsLayoutComponent } from '../../components/bookings-layout/bookings-layout.component';
import { PaymentStatusTagComponent } from '../../components/payment-status-tag/payment-status-tag.component';

/**
 * Guided check-in: verify the guest's identity document, review the payment,
 * and encode the RFID key cards before completing it.
 */
@Component({
  selector: 'app-booking-check-in',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatStepperModule,
    BookingsLayoutComponent,
    LayoutBodyDirective,
    MessageComponent,
    BookingPaymentSummaryComponent,
    PaymentStatusTagComponent,
    RfidEncoderPanelComponent,
  ],
  templateUrl: './booking-check-in.component.html',
})
export class BookingCheckInComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(BookingsStore);
  private readonly roomsStore = inject(RoomsStore);
  private readonly accessControlStore = inject(AccessControlStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Booking identifier from the route. */
  readonly id = input.required<string>();

  protected readonly today = CalendarDate.today();
  protected readonly documentTypes = Booking.documentTypes;
  protected readonly step = signal(0);
  protected readonly documentType = signal<DocumentType>('dni');
  protected readonly documentNumber = signal('');
  protected readonly verified = signal(false);
  protected readonly errorCode = signal('');
  /** Cards are written on the encoder during the check-in and registered when it completes. */
  protected readonly keyCardIds = signal<string[]>([]);

  protected readonly booking = computed(() =>
    this.store.getBookingById(this.id()),
  );
  protected readonly room = computed(() =>
    this.roomsStore.getRoomById(this.booking()?.roomId ?? null),
  );
  protected readonly roomType = computed(() =>
    this.roomsStore.getRoomTypeById(this.booking()?.roomTypeId ?? null),
  );
  protected readonly accessEnd = computed(() => {
    const booking = this.booking();
    return booking
      ? formatDateTime(
          this.accessControlStore.guestAccessEnd(booking.checkOutDate),
          this.i18n.locale(),
        )
      : '';
  });
  protected readonly identityComplete = computed(
    () => !!this.documentNumber().trim() && this.verified(),
  );

  /** @param booking - Booking whose stay is formatted. */
  protected stay(booking: Booking): string {
    return formatDayRange(
      booking.checkInDate,
      booking.checkOutDate,
      this.i18n.locale(),
    );
  }

  /** @param cardId - Card just written on the encoder. */
  protected addKeyCard(cardId: string): void {
    this.keyCardIds.update((ids) => [...ids, cardId]);
  }

  /** Checks the guest in, registers the key cards, and opens the booking. */
  protected async completeCheckIn(): Promise<void> {
    this.errorCode.set('');
    const booking = this.booking()!;
    try {
      await this.store.checkInBooking(
        new CheckInBookingCommand({
          bookingId: booking.id!,
          documentType: this.documentType(),
          documentNumber: this.documentNumber(),
          documentVerified: this.verified(),
          keyCardIds: this.keyCardIds(),
        }),
      );
      this.toast.add({
        severity: 'success',
        summary: this.i18n.t('bookings.booking-check-in.completed', {
          name: booking.guestName,
          number: this.room()?.number ?? '—',
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
