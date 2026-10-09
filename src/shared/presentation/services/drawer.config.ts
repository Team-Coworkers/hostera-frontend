import { MatDialogConfig } from '@angular/material/dialog';

/**
 * Dialog configuration that opens a Material dialog as a right-side sheet,
 * replacing PrimeVue Drawer.
 * @param data - Data passed to the drawer component.
 * @param width - Width on wide viewports.
 */
export function drawerConfig<D>(data: D, width = '30rem'): MatDialogConfig<D> {
  return {
    data,
    position: { right: '0', top: '0' },
    height: '100dvh',
    width,
    maxWidth: '100vw',
    panelClass: 'hostera-drawer',
    autoFocus: 'first-tabbable',
  };
}

/**
 * Dialog configuration for a centered modal of a maximum width, replacing PrimeVue Dialog.
 * @param data - Data passed to the dialog component.
 * @param maxWidth - Maximum width of the dialog.
 */
export function dialogConfig<D>(
  data: D,
  maxWidth = '30rem',
): MatDialogConfig<D> {
  return {
    data,
    width: `calc(100vw - 2rem)`,
    maxWidth,
    autoFocus: 'first-tabbable',
  };
}
