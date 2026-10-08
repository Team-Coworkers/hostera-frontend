import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { RoomsStore } from '../../../../rooms/application/rooms.store';
import {
  formatMoney,
  moneyLocale,
} from '../../../../shared/presentation/calendar-format';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { BookingsStore } from '../../../application/bookings.store';
import { Booking } from '../../../domain/model/booking.entity';
import { BookingsError } from '../../../domain/model/bookings.error';
import { Payment, PaymentMethod } from '../../../domain/model/payment.entity';

/**
 * Side sheet that records a payment for a booking, up to its balance due; it closes with the payment.
 */
@Component({
  selector: 'app-payment-form',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTimepickerModule,
    MessageComponent,
  ],
  templateUrl: './payment-form.component.html',
})
export class PaymentFormComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(BookingsStore);
  private readonly roomsStore = inject(RoomsStore);
  protected readonly booking = inject<Booking>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(
    MatDialogRef<PaymentFormComponent, Payment>,
  );
  protected readonly methods = Payment.methods;
  protected readonly maxDate = new Date();

  protected readonly currency = computed(
    () => this.roomsStore.currentProperty()?.currency ?? 'PEN',
  );
  protected readonly balanceDue = computed(() =>
    this.store.getBalanceDue(this.booking),
  );
  /** Narrow symbol of the currency, shown before the amount. */
  protected readonly currencySymbol = computed(
    () =>
      new Intl.NumberFormat(moneyLocale(this.currency(), this.i18n.locale()), {
        style: 'currency',
        currency: this.currency(),
        currencyDisplay: 'narrowSymbol',
      })
        .formatToParts(0)
        .find((part) => part.type === 'currency')?.value ?? this.currency(),
  );

  protected readonly amount = signal<number | null>(
    this.store.getBalanceDue(this.booking),
  );
  protected readonly method = signal<PaymentMethod>('card-terminal');
  protected readonly paidAt = signal<Date | null>(new Date());
  protected readonly reference = signal('');
  protected readonly errorCode = signal('');

  constructor() {
    effect(() => (this.dialogRef.disableClose = this.store.saving()));
  }

  /**
   * @param amount - Amount to format.
   * @returns Amount in the property's currency.
   */
  protected money(amount: number): string {
    return formatMoney(amount, this.currency(), this.i18n.locale());
  }

  /** Records the payment and closes the side sheet. */
  protected async savePayment(): Promise<void> {
    this.errorCode.set('');
    try {
      const paidAt = this.paidAt();
      const payment = await this.store.recordPayment(
        new Payment({
          bookingId: this.booking.id,
          amount: this.amount() ?? 0,
          method: this.method(),
          paidAt: paidAt ? paidAt.toISOString() : '',
          reference: this.reference(),
        }),
      );
      this.dialogRef.close(payment);
    } catch (error) {
      this.errorCode.set(
        error instanceof BookingsError ? error.code : 'connection',
      );
    }
  }
}
