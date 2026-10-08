/**
 * Calendar navigation helpers for views.
 * Days are ISO `YYYY-MM-DD` strings, as in the domain; these helpers convert them
 * to and from local dates and move between days and months.
 *
 */
export class CalendarDate {
  /**
   * Converts a local date into its calendar day.
   * @param date - Local date.
   * @returns ISO calendar day.
   */
  static fromDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  /**
   * Converts a calendar day into a local date at midnight.
   * @param value - ISO calendar day.
   * @returns Local date.
   */
  static toDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year!, month! - 1, day!);
  }

  /**
   * Returns the current local calendar day.
   * @returns ISO calendar day.
   */
  static today(): string {
    return CalendarDate.fromDate(new Date());
  }

  /**
   * Moves a calendar day by a number of days.
   * @param value - ISO calendar day.
   * @param days - Days to add; negative values move backwards.
   * @returns ISO calendar day.
   */
  static addDays(value: string, days: number): string {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  /**
   * Moves a calendar day to the first day of another month.
   * @param value - ISO calendar day.
   * @param months - Months to add; negative values move backwards.
   * @returns First day of the resulting month.
   */
  static addMonths(value: string, months: number): string {
    const date = new Date(`${value.slice(0, 7)}-01T00:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + months);
    return date.toISOString().slice(0, 10);
  }

  /**
   * Returns the first day of the month containing a calendar day.
   * @param value - ISO calendar day.
   * @returns ISO calendar day.
   */
  static startOfMonth(value: string): string {
    return `${value.slice(0, 7)}-01`;
  }

  /**
   * Returns the weekday of a calendar day, from 0 (Sunday) to 6 (Saturday).
   * @param value - ISO calendar day.
   */
  static dayOfWeek(value: string): number {
    return new Date(`${value}T00:00:00Z`).getUTCDay();
  }

  /**
   * Lists consecutive calendar days.
   * @param startDate - First ISO calendar day.
   * @param length - Number of days.
   * @returns ISO calendar days.
   */
  static sequence(startDate: string, length: number): string[] {
    return Array.from({ length }, (_, index) =>
      CalendarDate.addDays(startDate, index),
    );
  }
}

/**
 * Formats an ISO calendar day for the active locale.
 * @param date - ISO calendar day.
 * @param locale - Active locale.
 * @param options - Formatting options.
 * @returns Localized date.
 */
export function formatDay(
  date: string,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, options).format(
    CalendarDate.toDate(date),
  );
}

/**
 * Formats an inclusive range of ISO calendar days for the active locale.
 * @param startDate - First ISO calendar day.
 * @param endDate - Last ISO calendar day.
 * @param locale - Active locale.
 * @returns Localized range, such as "Oct 5 – 11, 2026".
 */
export function formatDayRange(
  startDate: string,
  endDate: string,
  locale: string,
): string {
  const format = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  if (startDate === endDate)
    return format.format(CalendarDate.toDate(startDate));
  return format.formatRange(
    CalendarDate.toDate(startDate),
    CalendarDate.toDate(endDate),
  );
}

/**
 * Formats an ISO date-time, such as the moment a status changed, for the active locale.
 * @param value - ISO date-time.
 * @param locale - Active locale.
 * @returns Localized date and time, such as "Oct 6, 3:42 PM".
 */
export function formatDateTime(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

/**
 * Regional formats that show a currency with its local symbol, such as S/ for the Peruvian sol.
 * Currencies without an entry keep the active locale, which may show their ISO code instead.
 */
const currencyLocales: Record<string, string> = { PEN: 'es-PE' };

/**
 * Chooses the locale that formats amounts of a currency.
 * @param currency - ISO 4217 currency code.
 * @param locale - Active locale.
 * @returns Locale for amounts in the currency.
 */
export function moneyLocale(currency: string, locale: string): string {
  return currencyLocales[currency] ?? locale;
}

/**
 * Formats an amount in the property's currency, without decimals for whole amounts.
 * @param amount - Amount to format.
 * @param currency - ISO 4217 currency code.
 * @param locale - Active locale.
 * @returns Localized amount, such as "S/ 180".
 */
export function formatMoney(
  amount: number,
  currency: string,
  locale: string,
): string {
  return new Intl.NumberFormat(moneyLocale(currency, locale), {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    trailingZeroDisplay: 'stripIfInteger',
  } as Intl.NumberFormatOptions).format(amount);
}

/**
 * Returns the narrow symbol of a currency, shown before amount inputs.
 * @param currency - ISO 4217 currency code.
 * @param locale - Active locale.
 * @returns Symbol, such as "S/" for the Peruvian sol.
 */
export function currencySymbol(currency: string, locale: string): string {
  return (
    new Intl.NumberFormat(moneyLocale(currency, locale), {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    })
      .formatToParts(0)
      .find((part) => part.type === 'currency')?.value ?? currency
  );
}
