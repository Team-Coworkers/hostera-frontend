import { computed, inject, Injectable, signal } from '@angular/core';
import { PublicHoliday } from '../domain/model/public-holiday.entity';
import { PublicHolidaysApiService } from '../infrastructure/public-holidays-api.service';

/**
 * Application service store for the public holidays shown in the availability view.
 * Each year is requested once per session; when the external API cannot be reached,
 * the view simply shows no holidays.
 */
@Injectable({ providedIn: 'root' })
export class PublicHolidaysStore {
  private readonly holidaysApi = inject(PublicHolidaysApiService);
  private readonly requestedYears = new Set<number>();

  /** Public holidays of the requested years. */
  readonly holidays = signal<PublicHoliday[]>([]);

  /** Public holidays by ISO calendar day. */
  private readonly holidaysByDate = computed(
    () => new Map(this.holidays().map((holiday) => [holiday.date, holiday])),
  );

  /**
   * Loads the holidays of the years that cover the given days.
   * @param dates - ISO calendar days, such as the visible week.
   */
  ensureLoaded(dates: readonly string[]): void {
    for (const year of new Set(dates.map((date) => Number(date.slice(0, 4))))) {
      if (this.requestedYears.has(year)) continue;
      this.requestedYears.add(year);
      this.holidaysApi.getPublicHolidays(year).subscribe({
        next: (holidays) =>
          this.holidays.update((current) => [...current, ...holidays]),
        error: () => this.requestedYears.delete(year),
      });
    }
  }

  /**
   * @param date - ISO calendar day.
   * @returns The public holiday on that day, if any.
   */
  getHoliday(date: string): PublicHoliday | undefined {
    return this.holidaysByDate().get(date);
  }
}
