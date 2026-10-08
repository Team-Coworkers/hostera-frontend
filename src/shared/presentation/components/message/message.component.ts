import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Severities of an inline message, as PrimeVue Message. */
export type MessageSeverity =
  'info' | 'success' | 'warn' | 'error' | 'secondary';

const defaultIcons: Record<MessageSeverity, string> = {
  info: 'info',
  success: 'check_circle',
  warn: 'info',
  error: 'error',
  secondary: 'info',
};

/** Inline message with an icon and projected content, replacing PrimeVue Message. */
@Component({
  selector: 'app-message',
  imports: [MatIconModule],
  template: `
    <div
      class="message"
      [class]="severity()"
      [attr.role]="severity() === 'error' ? 'alert' : 'status'"
    >
      <mat-icon aria-hidden="true">{{ resolvedIcon() }}</mat-icon>
      <div class="flex-1 min-w-0"><ng-content /></div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .message {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
    }
    .info {
      background: var(--hostera-tag-info-bg);
      color: var(--hostera-tag-info-fg);
    }
    .success {
      background: var(--hostera-tag-success-bg);
      color: var(--hostera-tag-success-fg);
    }
    .warn {
      background: var(--hostera-tag-warn-bg);
      color: var(--hostera-tag-warn-fg);
    }
    .error {
      background: var(--hostera-tag-danger-bg);
      color: var(--hostera-tag-danger-fg);
    }
    .secondary {
      background: var(--p-surface-100);
      color: var(--p-surface-700);
    }
    mat-icon {
      margin-top: 0.1rem;
    }
  `,
})
export class MessageComponent {
  readonly severity = input<MessageSeverity>('info');
  /** Material Symbols name; defaults to the severity's icon. */
  readonly icon = input<string | undefined>(undefined);
  protected readonly resolvedIcon = computed(
    () => this.icon() ?? defaultIcons[this.severity()],
  );
}
