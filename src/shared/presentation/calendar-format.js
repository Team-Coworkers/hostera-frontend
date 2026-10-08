/**
 * Calendar navigation helpers for views.
 * Days are ISO `YYYY-MM-DD` strings, as in the domain; these helpers convert them
 * to and from local dates and move between days and months.
 *
 * @class CalendarDate
 */
export class CalendarDate {
  /**
   * Converts a local date into its calendar day.
   * @param {Date} date - Local date.
   * @returns {string} ISO calendar day.
   */
  static fromDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  /**
   * Converts a calendar day into a local date at midnight.
   * @param {string} value - ISO calendar day.
   * @returns {Date} Local date.
   */
  static toDate(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Returns the current local calendar day.
   * @returns {string} ISO calendar day.
   */
  static today() {
    return CalendarDate.fromDate(new Date());
  }

  /**
   * Moves a calendar day by a number of days.
   * @param {string} value - ISO calendar day.
   * @param {number} days - Days to add; negative values move backwards.
   * @returns {string} ISO calendar day.
   */
  static addDays(value, days) {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  /**
   * Moves a calendar day to the first day of another month.
   * @param {string} value - ISO calendar day.
   * @param {number} months - Months to add; negative values move backwards.
   * @returns {string} First day of the resulting month.
   */
  static addMonths(value, months) {
    const date = new Date(`${value.slice(0, 7)}-01T00:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + months);
    return date.toISOString().slice(0, 10);
  }

  /**
   * Returns the first day of the month containing a calendar day.
   * @param {string} value - ISO calendar day.
   * @returns {string} ISO calendar day.
   */
  static startOfMonth(value) {
    return `${value.slice(0, 7)}-01`;
  }

  /**
   * Returns the weekday of a calendar day, from 0 (Sunday) to 6 (Saturday).
   * @param {string} value - ISO calendar day.
   * @returns {number}
   */
  static dayOfWeek(value) {
    return new Date(`${value}T00:00:00Z`).getUTCDay();
  }

  /**
   * Lists consecutive calendar days.
   * @param {string} startDate - First ISO calendar day.
   * @param {number} length - Number of days.
   * @returns {string[]} ISO calendar days.
   */
  static sequence(startDate, length) {
    return Array.from({ length }, (_, index) =>
      CalendarDate.addDays(startDate, index),
    );
  }
}

/**
 * Formats an ISO calendar day for the active locale.
 * @param {string} date - ISO calendar day.
 * @param {string} locale - Active locale.
 * @param {Intl.DateTimeFormatOptions} options - Formatting options.
 * @returns {string} Localized date.
 */
export function formatDay(date, locale, options) {
  return new Intl.DateTimeFormat(locale, options).format(
    CalendarDate.toDate(date),
  );
}

/**
 * Formats an inclusive range of ISO calendar days for the active locale.
 * @param {string} startDate - First ISO calendar day.
 * @param {string} endDate - Last ISO calendar day.
 * @param {string} locale - Active locale.
 * @returns {string} Localized range, such as "Oct 5 – 11, 2026".
 */
export function formatDayRange(startDate, endDate, locale) {
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
 * @param {string} value - ISO date-time.
 * @param {string} locale - Active locale.
 * @returns {string} Localized date and time, such as "Oct 6, 3:42 PM".
 */
export function formatDateTime(value, locale) {
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
 * @type {Object<string, string>}
 */
const currencyLocales = { PEN: 'es-PE' };

/**
 * Chooses the locale that formats amounts of a currency.
 * @param {string} currency - ISO 4217 currency code.
 * @param {string} locale - Active locale.
 * @returns {string} Locale for amounts in the currency.
 */
export function moneyLocale(currency, locale) {
  return currencyLocales[currency] ?? locale;
}

/**
 * Formats an amount in the property's currency, without decimals for whole amounts.
 * @param {number} amount - Amount to format.
 * @param {string} currency - ISO 4217 currency code.
 * @param {string} locale - Active locale.
 * @returns {string} Localized amount, such as "S/ 180".
 */
export function formatMoney(amount, currency, locale) {
  return new Intl.NumberFormat(moneyLocale(currency, locale), {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    trailingZeroDisplay: 'stripIfInteger',
  }).format(amount);
}
