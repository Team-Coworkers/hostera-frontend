import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

/** Texts of a confirmation, as PrimeVue's `confirm.require()` options. */
export interface ConfirmOptions {
  header: string;
  message: string;
  acceptLabel: string;
  rejectLabel: string;
  /** Whether accepting destroys data, which paints the accept button as dangerous. */
  danger?: boolean;
  /** Material Symbols name shown next to the message. */
  icon?: string;
}

/**
 * Confirmation dialog opened by {@link ConfirmService}; it closes with `true` when accepted.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ data.header }}</h2>
    <mat-dialog-content>
      <div class="flex align-items-start gap-3">
        <mat-icon
          class="text-lg"
          [class.text-red-600]="data.danger"
          aria-hidden="true"
          >{{ data.icon ?? 'warning' }}</mat-icon
        >
        <span>{{ data.message }}</span>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button [mat-dialog-close]="false">
        {{ data.rejectLabel }}
      </button>
      <button
        mat-flat-button
        [class.danger-button]="data.danger"
        [mat-dialog-close]="true"
        cdkFocusInitial
      >
        {{ data.acceptLabel }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .danger-button {
      --mdc-filled-button-container-color: var(--hostera-tag-danger-fg);
    }
  `,
})
export class ConfirmDialogComponent {
  protected readonly data = inject<ConfirmOptions>(MAT_DIALOG_DATA);
}
