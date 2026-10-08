import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/** Message shown by {@link ToastService}, as PrimeVue's `toast.add()` options. */
export interface ToastMessage {
  severity: 'success' | 'info' | 'warn' | 'error';
  summary: string;
  detail?: string;
  /** Milliseconds before the message closes. */
  life?: number;
}

/**
 * Bottom-right notifications built on Material's snack bar, replacing PrimeVue Toast.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Shows a notification.
   * @param message - Severity, texts, and duration.
   */
  add({ severity, summary, detail, life = 3000 }: ToastMessage): void {
    this.snackBar.open(detail ? `${summary} — ${detail}` : summary, '✕', {
      duration: life,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: `hostera-toast-${severity}`,
    });
  }
}
