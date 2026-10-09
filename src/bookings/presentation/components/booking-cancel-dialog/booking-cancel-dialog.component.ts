import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
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
import { RoomsStore } from '../../../../rooms/application/rooms.store';
import { formatDayRange } from '../../../../shared/presentation/calendar-format';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { BookingsStore } from '../../../application/bookings.store';
import { CancelBookingCommand } from '../../../domain/cancel-booking.command';
import {
  Booking,
  CancellationReason,
} from '../../../domain/model/booking.entity';
import { BookingsError } from '../../../domain/model/bookings.error';

/**
 * Dialog that cancels a pending or confirmed booking with a reason; it closes with the saved booking.
 */
@Component({
  selector: 'app-booking-cancel-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MessageComponent,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ i18n.t('bookings.booking-cancel-dialog.title') }}
    </h2>
    <mat-dialog-content>
      <form
        id="booking-cancel-form"
        class="flex flex-column gap-3 pt-1"
        (ngSubmit)="cancel()"
      >
        <p class="m-0 text-color-secondary">
          {{ booking.guestName }} ·
          {{
            formatDayRange(
              booking.checkInDate,
              booking.checkOutDate,
              i18n.locale()
            )
          }}
          ·
          {{
            i18n.t('bookings.bookings-terms.room-number', {
              number: room()?.number ?? '—',
            })
          }}
        </p>
        <mat-form-field class="w-full">
          <mat-label>{{
            i18n.t('bookings.booking-cancel-dialog.reason')
          }}</mat-label>
          <mat-select [(ngModel)]="reason" name="reason">
            @for (value of reasons; track value) {
              <mat-option [value]="value">{{
                i18n.t('bookings.bookings-terms.cancellation-reasons.' + value)
              }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field class="w-full">
          <mat-label>{{
            noteRequired()
              ? i18n.t('bookings.booking-cancel-dialog.note-required')
              : i18n.t('bookings.booking-cancel-dialog.note')
          }}</mat-label>
          <textarea
            matInput
            name="note"
            [(ngModel)]="note"
            [placeholder]="
              i18n.t('bookings.booking-cancel-dialog.note-placeholder')
            "
            [required]="noteRequired()"
            rows="2"
            maxlength="200"
            cdkTextareaAutosize
          ></textarea>
        </mat-form-field>
        <app-message severity="warn" icon="warning">
          {{
            i18n.t('bookings.booking-cancel-dialog.release', {
              number: room()?.number ?? '—',
            })
          }}
        </app-message>
        @if (errorCode()) {
          <app-message severity="error" icon="cancel">
            {{ i18n.t('bookings.bookings-terms.errors.' + errorCode()) }}
          </app-message>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button
        mat-stroked-button
        type="button"
        [disabled]="store.saving()"
        (click)="dialogRef.close()"
      >
        {{ i18n.t('bookings.booking-cancel-dialog.keep') }}
      </button>
      <button
        mat-flat-button
        class="danger-button"
        type="submit"
        form="booking-cancel-form"
        [disabled]="store.saving()"
      >
        @if (store.saving()) {
          <mat-spinner diameter="18" />
        } @else {
          <mat-icon>close</mat-icon>
        }
        {{ i18n.t('bookings.booking-cancel-dialog.submit') }}
      </button>
    </mat-dialog-actions>
  `,
})
export class BookingCancelDialogComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(BookingsStore);
  private readonly roomsStore = inject(RoomsStore);
  protected readonly booking = inject<Booking>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(
    MatDialogRef<BookingCancelDialogComponent, Booking>,
  );
  protected readonly formatDayRange = formatDayRange;
  protected readonly reasons = Booking.cancellationReasons;

  protected readonly reason = signal<CancellationReason>('guest-request');
  protected readonly note = signal('');
  protected readonly errorCode = signal('');
  protected readonly room = computed(() =>
    this.roomsStore.getRoomById(this.booking.roomId),
  );
  protected readonly noteRequired = computed(() => this.reason() === 'other');

  constructor() {
    effect(() => (this.dialogRef.disableClose = this.store.saving()));
  }

  /** Cancels the booking with the chosen reason and closes the dialog. */
  protected async cancel(): Promise<void> {
    this.errorCode.set('');
    try {
      const savedBooking = await this.store.cancelBooking(
        new CancelBookingCommand({
          bookingId: this.booking.id!,
          reason: this.reason(),
          note: this.note(),
        }),
      );
      this.dialogRef.close(savedBooking);
    } catch (error) {
      this.errorCode.set(
        error instanceof BookingsError ? error.code : 'connection',
      );
    }
  }
}
