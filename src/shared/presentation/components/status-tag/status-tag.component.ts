import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Visual severities of a tag, as PrimeVue Tag. */
export type TagSeverity =
  'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger';

/**
 * Soft status chip: tinted background with a darker same-hue label (AA contrast),
 * replacing the themed PrimeVue Tag of the Vue version.
 */
@Component({
  selector: 'app-status-tag',
  imports: [MatIconModule],
  template: `<span
    class="status-tag"
    [style.background]="'var(--hostera-tag-' + severity() + '-bg)'"
    [style.color]="'var(--hostera-tag-' + severity() + '-fg)'"
  >
    @if (icon()) {
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
    }
    {{ value() }}</span
  >`,
  styles: `
    .status-tag {
      display: inline-flex;
      align-items: center;
      font-size: 0.875rem;
      font-weight: 600;
      line-height: 1.25rem;
      padding: 0.25rem 0.625rem;
      border-radius: 0.5rem;
      white-space: nowrap;
      gap: 0.375rem;
    }
    mat-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }
  `,
})
export class StatusTagComponent {
  /** Text of the tag. */
  readonly value = input.required<string>();
  /** Color of the tag. */
  readonly severity = input<TagSeverity>('primary');
  /** Material Symbols name shown before the text. */
  readonly icon = input<string | undefined>(undefined);
}
