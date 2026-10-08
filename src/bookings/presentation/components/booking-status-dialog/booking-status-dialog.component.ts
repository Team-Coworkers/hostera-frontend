import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RoomsStore } from '../../../../rooms/application/rooms.store';
import {
  formatDay,
  formatDayRange,
} from '../../../../shared/presentation/calendar-format';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { BookingsStore } from '../../../application/bookings.store';
import { Booking } from '../../../domain/model/booking.entity';
import { BookingsError } from '../../../domain/model/bookings.error';

/** Data of the status dialog. */
export interface BookingStatusDialogData {
  booking: Booking;
  action: 'confirm' | 'no-show';
}

/**
 * Dialog that confirms a pending booking or records a no-show; it closes with the saved booking.
 */
@Component({
  selector: 'app-booking-status-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MessageComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ i18n.t(key() + '.title') }}</h2>
    <mat-dialog-content>
      <div class="flex flex-column gap-3">
        <p class="m-0 text-color-secondary line-height-3">
          {{ i18n.t(key() + '.subtitle') }}
        </p>
        <dl
          class="facts flex flex-column gap-2 m-0 p-3 surface-50 border-1 surface-border border-round-lg"
        >
          @for (fact of facts(); track fact.label) {
            <div class="flex justify-content-between gap-3">
              <dt>{{ fact.label }}</dt>
              <dd class="text-right font-medium">{{ fact.value }}</dd>
            </div>
          }
        </dl>
        <app-message
          [severity]="data.action === 'confirm' ? 'info' : 'warn'"
          [icon]="data.action === 'confirm' ? 'info' : 'warning'"
        >
          {{ i18n.t(key() + '.note', { number: room()?.number ?? '—' }) }}
        </app-message>
        @if (errorCode()) {
          <app-message severity="error" icon="cancel">
            {{ i18n.t('bookings.bookings-terms.errors.' + errorCode()) }}
          </app-message>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button
        mat-stroked-button
        [disabled]="store.saving()"
        (click)="dialogRef.close()"
      >
        {{ i18n.t('bookings.booking-status-dialog.back') }}
      </button>
      <button
        mat-flat-button
        cdkFocusInitial
        [class.danger-button]="data.action !== 'confirm'"
        [disabled]="store.saving()"
        (click)="apply()"
      >
        @if (store.saving()) {
          <mat-spinner diameter="18" />
        } @else {
          <mat-icon>{{
            data.action === 'confirm' ? 'check' : 'person_remove'
          }}</mat-icon>
        }
        {{ i18n.t(key() + '.submit') }}
      </button>
    </mat-dialog-actions>
  `,
})
export class BookingStatusDialogComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(BookingsStore);
  private readonly roomsStore = inject(RoomsStore);
  protected readonly data = inject<BookingStatusDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(
    MatDialogRef<BookingStatusDialogComponent, Booking>,
  );

  protected readonly errorCode = signal('');
  protected readonly room = computed(() =>
    this.roomsStore.getRoomById(this.data.booking.roomId),
  );
  private readonly roomType = computed(() =>
    this.roomsStore.getRoomTypeById(this.data.booking.roomTypeId),
  );
  protected readonly key = computed(
    () => `bookings.booking-status-dialog.${this.data.action}`,
  );
  protected readonly facts = computed(() => {
    const { booking, action } = this.data;
    const locale = this.i18n.locale();
    return [
      {
        label: this.i18n.t('bookings.booking-status-dialog.guest'),
        value: booking.guestName,
      },
      action === 'confirm'
        ? {
            label: this.i18n.t('bookings.booking-status-dialog.stay'),
            value: `${formatDayRange(booking.checkInDate, booking.checkOutDate, locale)} · ${this.i18n.t(
              'bookings.bookings-terms.nights',
              { count: booking.nights.length },
            )}`,
          }
        : {
            label: this.i18n.t(
              'bookings.booking-status-dialog.expected-arrival',
            ),
            value: formatDay(booking.checkInDate, locale, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            }),
          },
      {
        label: this.i18n.t('bookings.booking-status-dialog.room'),
        value: `${this.room()?.number ?? '—'} · ${this.roomType()?.name ?? ''}`,
      },
    ];
  });

  constructor() {
    effect(() => (this.dialogRef.disableClose = this.store.saving()));
  }

  /** Applies the status change and closes the dialog. */
  protected async apply(): Promise<void> {
    this.errorCode.set('');
    try {
      const bookingId = this.data.booking.id!;
      const savedBooking =
        this.data.action === 'confirm'
          ? await this.store.confirmBooking(bookingId)
          : await this.store.markNoShow(bookingId);
      this.dialogRef.close(savedBooking);
    } catch (error) {
      this.errorCode.set(
        error instanceof BookingsError ? error.code : 'connection',
      );
    }
  }
}
