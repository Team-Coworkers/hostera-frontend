/**
 * Reads a theme color from a CSS custom property, so charts follow the Hostera tokens.
 * @param name - CSS custom property name, such as `--p-primary-color`.
 * @returns Resolved color value.
 */
export function themeColor(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

/**
 * Formats a share as a percentage in a locale.
 * @param value - Share between 0 and 1.
 * @param locale - Active locale.
 * @param options - Extra number format options.
 */
export function formatPercent(
  value: number,
  locale: string,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}
