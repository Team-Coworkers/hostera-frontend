/**
 * ISO `YYYY-MM-DD` calendar-day rules shared by the Rooms entities.
 * ISO days compare chronologically as text, so entities keep them as strings.
 */
export class CalendarDay {
  /**
   * Checks whether a value is an existing calendar day in ISO `YYYY-MM-DD` format.
   * @param value - Value to check.
   */
  static isCalendarDay(value: unknown): value is string {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
      return false;
    const date = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }

  /**
   * Moves an ISO calendar day by a number of days.
   * @param value - ISO calendar day.
   * @param days - Days to add; negative values move backwards.
   * @returns ISO calendar day.
   */
  static addDays(value: string, days: number): string {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }
}
