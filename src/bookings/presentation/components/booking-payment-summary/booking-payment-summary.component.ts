import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RoomsStore } from '../../../../rooms/application/rooms.store';
import {
  formatDateTime,
  formatMoney,
} from '../../../../shared/presentation/calendar-format';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { drawerConfig } from '../../../../shared/presentation/services/drawer.config';
import { ToastService } from '../../../../shared/presentation/services/toast.service';
import { BookingsStore } from '../../../application/bookings.store';
import { Booking } from '../../../domain/model/booking.entity';
import { Payment } from '../../../domain/model/payment.entity';
import { PaymentFormComponent } from '../payment-form/payment-form.component';
import { PaymentStatusTagComponent } from '../payment-status-tag/payment-status-tag.component';

/**
 * Booking total, payments received, and balance due, with the action to record a payment.
 */
@Component({
  selector: 'app-booking-payment-summary',
  imports: [MatButtonModule, MatIconModule, PaymentStatusTagComponent],
  templateUrl: './booking-payment-summary.component.html',
})
export class BookingPaymentSummaryComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(BookingsStore);
  private readonly roomsStore = inject(RoomsStore);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  readonly booking = input.required<Booking>();

  protected readonly currency = computed(
    () => this.roomsStore.currentProperty()?.currency ?? 'PEN',
  );
  protected readonly bookingPayments = computed(() =>
    this.store.getPaymentsOf(this.booking().id),
  );
  protected readonly balanceDue = computed(() =>
    this.store.getBalanceDue(this.booking()),
  );
  protected readonly paid = computed(() =>
    this.bookingPayments().reduce((sum, payment) => sum + payment.amount, 0),
  );
  protected readonly paymentStatus = computed(() =>
    this.store.getPaymentStatus(this.booking()),
  );
  protected readonly canRecordPayment = computed(
    () => this.booking().acceptsPayments && this.balanceDue() > 0,
  );

  /** @param amount - Amount to format. */
  protected money(amount: number): string {
    return formatMoney(amount, this.currency(), this.i18n.locale());
  }

  /** @param value - ISO date-time to format. */
  protected dateTime(value: string): string {
    return formatDateTime(value, this.i18n.locale());
  }

  /** Opens the payment form and confirms that a payment was recorded. */
  protected recordPayment(): void {
    this.dialog
      .open<PaymentFormComponent, Booking, Payment>(
        PaymentFormComponent,
        drawerConfig(this.booking()),
      )
      .afterClosed()
      .subscribe((payment) => {
        if (payment)
          this.toast.add({
            severity: 'success',
            summary: this.i18n.t('bookings.booking-payment-summary.recorded'),
          });
      });
  }
}
