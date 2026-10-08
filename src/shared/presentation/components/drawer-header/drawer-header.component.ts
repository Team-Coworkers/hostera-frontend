import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { inject } from '@angular/core';

/**
 * Header of a side sheet or dialog: a title, an optional subtitle, and a close button
 * that hides while a request is in progress, as PrimeVue Drawer's header.
 */
@Component({
  selector: 'app-drawer-header',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <div
      mat-dialog-title
      class="flex align-items-start justify-content-between gap-2"
    >
      <div class="flex flex-column text-left min-w-0">
        <span class="text-xl font-bold">{{ title() }}</span>
        @if (subtitle()) {
          <span class="text-sm text-color-secondary font-normal">{{
            subtitle()
          }}</span>
        }
        <ng-content />
      </div>
      @if (!busy()) {
        <button
          mat-icon-button
          type="button"
          [attr.aria-label]="closeLabel()"
          (click)="dialogRef.close()"
        >
          <mat-icon>close</mat-icon>
        </button>
      }
    </div>
  `,
})
export class DrawerHeaderComponent {
  protected readonly dialogRef = inject(MatDialogRef);
  /** Main title. */
  readonly title = input.required<string>();
  /** Secondary line under the title. */
  readonly subtitle = input('');
  /** Whether a request is in progress, which hides the close button. */
  readonly busy = input(false);
  /** Accessible name of the close button. */
  readonly closeLabel = input('Close');
}
