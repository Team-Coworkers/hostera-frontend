import { Component, computed, inject, signal } from '@angular/core';
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
import {
  CalendarDate,
  formatDayRange,
} from '../../../../shared/presentation/calendar-format';
import { DrawerHeaderComponent } from '../../../../shared/presentation/components/drawer-header/drawer-header.component';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { preventCloseWhile } from '../../../../shared/presentation/services/dialog-close-guard';
import { RoomsStore } from '../../../application/rooms.store';
import { Room } from '../../../domain/model/room.entity';
import { RoomsError } from '../../../domain/model/rooms.error';
import {
  RequestedRoomStatus,
  SetRoomStatusCommand,
} from '../../../domain/set-room-status.command';
import { DayStatusTagComponent } from '../day-status-tag/day-status-tag.component';

/** Data of the room status form: the room and the day the operator chose. */
export interface RoomStatusFormData {
  room: Room;
  date: string;
}

/** Icons of the statuses that can be requested. */
export const requestedStatusIcons: Record<RequestedRoomStatus, string> = {
  available: 'check',
  blocked: 'block',
  'out-of-service': 'build',
  'needs-cleaning': 'cleaning_services',
};

/**
 * Side sheet that sets or releases a room's operational status over a date range;
 * it closes with `true` once saved.
 */
@Component({
  selector: 'app-room-status-form',
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
    DrawerHeaderComponent,
    MessageComponent,
    DayStatusTagComponent,
  ],
  templateUrl: './room-status-form.component.html',
})
export class RoomStatusFormComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(RoomsStore);
  protected readonly data = inject<RoomStatusFormData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<RoomStatusFormComponent, boolean>,
  );
  protected readonly statuses = SetRoomStatusCommand.statuses;
  protected readonly statusIcons = requestedStatusIcons;
  protected readonly formatDayRange = formatDayRange;

  protected readonly currentStatusPeriod = this.store.getStatusPeriodOn(
    this.data.room.id,
    this.data.date,
  );
  protected readonly status = signal<RequestedRoomStatus>(
    this.currentStatusPeriod ? 'available' : 'blocked',
  );
  protected readonly startDate = signal<Date | null>(
    CalendarDate.toDate(this.data.date),
  );
  protected readonly endDate = signal<Date | null>(
    CalendarDate.toDate(this.data.date),
  );
  protected readonly reason = signal('');
  protected readonly errorCode = signal('');
  protected readonly releasing = computed(() => this.status() === 'available');

  constructor() {
    preventCloseWhile(this.store.saving);
  }

  /** Saves the status and closes the side sheet. */
  protected async saveStatus(): Promise<void> {
    this.errorCode.set('');
    const start = this.startDate();
    if (!start) {
      this.errorCode.set('invalid-date-range');
      return;
    }
    try {
      await this.store.setRoomStatus(
        new SetRoomStatusCommand({
          roomId: this.data.room.id!,
          status: this.status(),
          startDate: CalendarDate.fromDate(start),
          endDate: CalendarDate.fromDate(this.endDate() ?? start),
          reason: this.releasing() ? '' : this.reason(),
        }),
      );
      this.dialogRef.close(true);
    } catch (error) {
      this.errorCode.set(
        error instanceof RoomsError ? error.code : 'connection',
      );
    }
  }
}
