import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { I18nService } from '../../../../shared/presentation/i18n.service';

/**
 * Card of the overview with a title, optional subtitle and actions, and a loading or
 * failed state that keeps the rest of the overview usable.
 */
@Component({
  selector: 'app-overview-panel',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <section
      class="flex flex-column gap-3 h-full p-4 surface-card border-1 surface-border border-round-xl"
    >
      <header class="flex align-items-start justify-content-between gap-3">
        <div class="flex flex-column gap-1 min-w-0">
          <h2 class="m-0 text-base font-semibold">{{ title() }}</h2>
          @if (subtitle() && !failed()) {
            <span class="text-sm text-color-secondary">{{ subtitle() }}</span>
          }
        </div>
        <ng-content select="[panelActions]" />
      </header>
      @if (failed()) {
        <div
          class="flex flex-column align-items-center justify-content-center gap-2 flex-1 py-5 text-center"
          role="alert"
        >
          <span class="warning-badge" aria-hidden="true"
            ><mat-icon>warning</mat-icon></span
          >
          <span class="font-semibold">{{
            i18n.t('overview.overview-panel.unavailable', { title: title() })
          }}</span>
          <span class="text-sm text-color-secondary line-height-3">{{
            i18n.t('overview.overview-panel.unavailable-text')
          }}</span>
          <button mat-stroked-button (click)="retry.emit()">
            <mat-icon>refresh</mat-icon>
            {{ i18n.t('overview.overview-panel.retry') }}
          </button>
        </div>
      } @else if (loading()) {
        <div
          class="flex align-items-center justify-content-center flex-1 py-5"
          role="status"
          [attr.aria-label]="i18n.t('overview.overview-panel.loading')"
        >
          <mat-spinner diameter="32" strokeWidth="4" />
        </div>
      } @else {
        <ng-content />
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .warning-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      border-radius: 0.75rem;
      background: var(--p-orange-50);
      color: var(--p-orange-700);
    }
  `,
})
export class OverviewPanelComponent {
  protected readonly i18n = inject(I18nService);

  /** Card title. */
  readonly title = input.required<string>();
  /** Summary under the title. */
  readonly subtitle = input('');
  /** Whether the card's data is loading. */
  readonly loading = input(false);
  /** Whether the card's data failed to load. */
  readonly failed = input(false);

  /** Emits when the operator asks to load again. */
  readonly retry = output<void>();
}
