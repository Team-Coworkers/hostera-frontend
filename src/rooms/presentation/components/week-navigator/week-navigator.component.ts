import {
  Component,
  computed,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CalendarDate,
  formatDay,
  formatDayRange,
} from '../../../../shared/presentation/calendar-format';
import { I18nService } from '../../../../shared/presentation/i18n.service';

/**
 * Moves a range of visible days: previous and next page, a calendar to jump to a day,
 * and a shortcut to today. Shared by the availability and rates grids.
 */
@Component({
  selector: 'app-week-navigator',
  imports: [
    MatButtonModule,
    MatDatepickerModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  template: `
    <div class="flex align-items-center gap-1">
      <button
        mat-icon-button
        [matTooltip]="previousLabel()"
        [attr.aria-label]="previousLabel()"
        (click)="move(-1)"
      >
        <mat-icon>chevron_left</mat-icon>
      </button>
      <button
        mat-stroked-button
        aria-haspopup="dialog"
        [attr.aria-label]="
          i18n.t(labels() + '.choose-date') + ': ' + rangeLabel()
        "
        [matMenuTriggerFor]="dateMenu"
      >
        <mat-icon>calendar_month</mat-icon>
        {{ rangeLabel() }}
      </button>
      <mat-menu #dateMenu="matMenu">
        <div
          class="p-2"
          style="width: 18rem"
          (click)="$event.stopPropagation()"
        >
          <mat-calendar
            [selected]="pickerDate()"
            [startAt]="pickerDate()"
            (selectedChange)="pick($event)"
          />
        </div>
      </mat-menu>
      <button
        mat-icon-button
        [matTooltip]="nextLabel()"
        [attr.aria-label]="nextLabel()"
        (click)="move(1)"
      >
        <mat-icon>chevron_right</mat-icon>
      </button>
    </div>
    <button
      mat-button
      [disabled]="startDate() === today"
      (click)="startDate.set(today)"
    >
      {{ i18n.t(labels() + '.today') }}
    </button>
  `,
  host: { class: 'flex align-items-center gap-2' },
})
export class WeekNavigatorComponent {
  protected readonly i18n = inject(I18nService);
  private readonly menuTrigger = viewChild(MatMenuTrigger);

  /** First visible ISO day. */
  readonly startDate = model.required<string>();
  /** Number of visible days: 1 shows a day, 7 a week. */
  readonly dayCount = input(7);
  /** Message prefix with the navigation labels, such as `rooms.room-rates`. */
  readonly labels = input.required<string>();

  protected readonly today = CalendarDate.today();
  protected readonly pickerDate = computed(() =>
    CalendarDate.toDate(this.startDate()),
  );
  protected readonly rangeLabel = computed(() =>
    this.dayCount() === 1
      ? formatDay(this.startDate(), this.i18n.locale(), {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : formatDayRange(
          this.startDate(),
          CalendarDate.addDays(this.startDate(), this.dayCount() - 1),
          this.i18n.locale(),
        ),
  );
  protected readonly previousLabel = computed(() =>
    this.i18n.t(
      `${this.labels()}.${this.dayCount() === 1 ? 'previous-day' : 'previous-week'}`,
    ),
  );
  protected readonly nextLabel = computed(() =>
    this.i18n.t(
      `${this.labels()}.${this.dayCount() === 1 ? 'next-day' : 'next-week'}`,
    ),
  );

  /** @param direction - -1 for earlier dates, 1 for later dates. */
  protected move(direction: number): void {
    this.startDate.update((start) =>
      CalendarDate.addDays(start, direction * this.dayCount()),
    );
  }

  /** @param value - Day chosen in the calendar. */
  protected pick(value: Date | null): void {
    if (value) this.startDate.set(CalendarDate.fromDate(value));
    this.menuTrigger()?.closeMenu();
  }
}
