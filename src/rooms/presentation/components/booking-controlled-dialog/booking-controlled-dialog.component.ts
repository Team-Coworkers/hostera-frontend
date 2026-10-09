import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { formatDayRange } from '../../../../shared/presentation/calendar-format';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { RoomAssignment } from '../../../domain/model/room-assignment.entity';
import { Room } from '../../../domain/model/room.entity';

/** Data of the booking-controlled dialog. */
export interface BookingControlledDialogData {
  room: Room;
  roomAssignment: RoomAssignment;
}

/**
 * Explains that a booking controls a room day, so its status changes from the booking.
 */
@Component({
  selector: 'app-booking-controlled-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    RouterLink,
    MessageComponent,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ i18n.t('rooms.booking-controlled-dialog.title') }}
    </h2>
    <mat-dialog-content>
      <div class="flex flex-column gap-3">
        <app-message severity="warn" icon="lock">
          <div class="flex flex-column gap-1">
            <span class="font-semibold">{{
              i18n.t('rooms.booking-controlled-dialog.summary', {
                status: i18n.t(
                  'rooms.rooms-terms.day-statuses.' + data.roomAssignment.status
                ),
              })
            }}</span>
            <span>{{
              i18n.t('rooms.booking-controlled-dialog.detail', {
                number: data.room.number,
                code: data.roomAssignment.bookingCode,
                dates: formatDayRange(
                  data.roomAssignment.startDate,
                  data.roomAssignment.endDate,
                  i18n.locale()
                ),
              })
            }}</span>
          </div>
        </app-message>
        <p class="m-0 line-height-3 text-color-secondary">
          {{ i18n.t('rooms.booking-controlled-dialog.help') }}
        </p>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>
        {{ i18n.t('rooms.booking-controlled-dialog.close') }}
      </button>
      <a
        mat-flat-button
        cdkFocusInitial
        mat-dialog-close
        [routerLink]="['/bookings', data.roomAssignment.bookingId]"
      >
        {{ i18n.t('rooms.booking-controlled-dialog.open-booking') }}
        <mat-icon iconPositionEnd>arrow_forward</mat-icon>
      </a>
    </mat-dialog-actions>
  `,
})
export class BookingControlledDialogComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly data =
    inject<BookingControlledDialogData>(MAT_DIALOG_DATA);
  protected readonly formatDayRange = formatDayRange;
}
