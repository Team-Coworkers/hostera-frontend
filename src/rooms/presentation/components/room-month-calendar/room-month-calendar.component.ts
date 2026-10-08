import {
  Component,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CalendarDate,
  formatDay,
} from '../../../../shared/presentation/calendar-format';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { RoomsStore } from '../../../application/rooms.store';
import { DayStatus, Room } from '../../../domain/model/room.entity';
import { DayStatusTagComponent } from '../day-status-tag/day-status-tag.component';

/** Cell of the month grid. */
interface CalendarDay {
  date: string;
  inMonth: boolean;
  status: DayStatus;
  bookingCode: string | undefined;
}

/**
 * Month calendar of a room's day statuses; selecting a day emits it.
 */
@Component({
  selector: 'app-room-month-calendar',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    DayStatusTagComponent,
  ],
  templateUrl: './room-month-calendar.component.html',
  styleUrl: './room-month-calendar.component.css',
})
export class RoomMonthCalendarComponent {
  protected readonly i18n = inject(I18nService);
  private readonly store = inject(RoomsStore);

  readonly room = input.required<Room>();
  /** First ISO day of the shown month. */
  readonly month = model.required<string>();
  /** Emits the ISO day the operator selects. */
  readonly selectDay = output<string>();

  protected readonly today = CalendarDate.today();
  protected readonly currentMonth = CalendarDate.startOfMonth(this.today);
  /** Weeks start on Sunday; the first cell is the Sunday on or before the 1st. */
  private readonly gridStart = computed(() =>
    CalendarDate.addDays(this.month(), -CalendarDate.dayOfWeek(this.month())),
  );
  protected readonly weekdays = computed(() =>
    CalendarDate.sequence(this.gridStart(), 7).map((date) => ({
      short: formatDay(date, this.i18n.locale(), { weekday: 'short' }),
      long: formatDay(date, this.i18n.locale(), { weekday: 'long' }),
    })),
  );
  protected readonly weeks = computed<CalendarDay[][]>(() => {
    const month = this.month();
    const nextMonth = CalendarDate.addMonths(month, 1);
    const roomId = this.room().id;
    const days: CalendarDay[] = [];
    for (
      let date = this.gridStart();
      date < nextMonth || days.length % 7;
      date = CalendarDate.addDays(date, 1)
    )
      days.push({
        date,
        inMonth: date.startsWith(month.slice(0, 7)),
        status: this.store.getDayStatus(roomId, date),
        bookingCode: this.store.getRoomAssignmentOn(roomId, date)?.bookingCode,
      });
    return Array.from({ length: days.length / 7 }, (_, index) =>
      days.slice(index * 7, index * 7 + 7),
    );
  });
  protected readonly monthLabel = computed(() =>
    formatDay(this.month(), this.i18n.locale(), {
      month: 'long',
      year: 'numeric',
    }),
  );

  /** @param months - Months to move; negative values move backwards. */
  protected moveMonth(months: number): void {
    this.month.update((month) => CalendarDate.addMonths(month, months));
  }

  /** @param day - Day described for assistive technologies. */
  protected dayLabel(day: CalendarDay): string {
    return [
      formatDay(day.date, this.i18n.locale(), {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
      this.i18n.t(`rooms.rooms-terms.day-statuses.${day.status}`),
      day.bookingCode,
    ]
      .filter(Boolean)
      .join(', ');
  }

  /** @param date - ISO day whose day of the month is shown. */
  protected dayNumber(date: string): number {
    return Number(date.slice(8));
  }
}
