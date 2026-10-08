import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmOptions,
} from '../components/confirm-dialog/confirm-dialog.component';

/**
 * Asks the operator to confirm an action, replacing PrimeVue's ConfirmDialog.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialog = inject(MatDialog);

  /**
   * Opens a confirmation dialog.
   * @param options - Header, message, and button labels.
   * @returns Whether the operator accepted.
   */
  async require(options: ConfirmOptions): Promise<boolean> {
    const result = await firstValueFrom(
      this.dialog
        .open<ConfirmDialogComponent, ConfirmOptions, boolean>(
          ConfirmDialogComponent,
          { data: options, width: '28rem', autoFocus: 'dialog' },
        )
        .afterClosed(),
    );
    return result === true;
  }
}
