/**
 * Reads a theme color from the CSS variables that PrimeVue defines, since Chart.js draws on a canvas.
 * @param {string} name - CSS variable name, such as `--p-primary-color`.
 * @returns {string} Color value.
 */
export function themeColor(name) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}
