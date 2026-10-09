import { effect, inject, Signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

/**
 * Keeps a dialog or side sheet open while a request is in progress, as the
 * `dismissable`/`closable` bindings of PrimeVue did. Call it in an injection context.
 * @param busy - Whether a request is in progress.
 */
export function preventCloseWhile(busy: Signal<boolean>): void {
  const dialogRef = inject(MatDialogRef);
  effect(() => (dialogRef.disableClose = busy()));
}
