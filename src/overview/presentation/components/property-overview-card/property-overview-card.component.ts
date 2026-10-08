import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RoomsStore } from '../../../../rooms/application/rooms.store';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { OverviewStore } from '../../../application/overview.store';
import { formatPercent } from '../../chart-colors';
import { OverviewPanelComponent } from '../overview-panel/overview-panel.component';

/** Card with tonight's occupancy and alerts of every property; selecting one makes it active. */
@Component({
  selector: 'app-property-overview-card',
  imports: [MatIconModule, OverviewPanelComponent],
  template: `
    <app-overview-panel
      [title]="i18n.t('overview.property-overview-card.title')"
      [subtitle]="subtitle()"
      [loading]="!store.propertyOverviewsLoaded()"
      [failed]="
        !store.propertyOverviewsLoaded() &&
        store.propertyOverviewErrors().length > 0
      "
      (retry)="store.fetchPropertyOverviews()"
    >
      <ul class="list-none m-0 p-0 flex flex-column gap-2">
        @for (
          overview of store.propertyOverviews();
          track overview.propertyId
        ) {
          @let current = overview.propertyId === roomsStore.currentPropertyId();
          <li>
            <button
              type="button"
              class="property-button"
              [class.current]="current"
              [attr.aria-current]="current || null"
              (click)="roomsStore.selectProperty(overview.propertyId)"
            >
              <span class="property-avatar" aria-hidden="true"
                ><mat-icon>apartment</mat-icon></span
              >
              <span class="flex flex-column flex-1 min-w-0">
                <span class="font-medium">{{ overview.name }}</span>
                <span class="text-sm text-color-secondary">{{
                  i18n.t('overview.property-overview-card.available-tonight', {
                    count: overview.availableRooms,
                  })
                }}</span>
              </span>
              <span class="flex flex-column align-items-end gap-1 text-right">
                <span class="font-semibold">{{
                  percent(overview.occupancyRate)
                }}</span>
                <span
                  class="text-sm"
                  [class.text-orange-700]="overview.alertsCount"
                  [class.text-color-secondary]="!overview.alertsCount"
                  >{{
                    overview.alertsCount
                      ? i18n.t('overview.property-overview-card.alerts', {
                          count: overview.alertsCount,
                        })
                      : i18n.t('overview.property-overview-card.no-alerts')
                  }}</span
                >
              </span>
            </button>
          </li>
        }
      </ul>
      <small class="text-color-secondary">{{
        i18n.t('overview.property-overview-card.help')
      }}</small>
    </app-overview-panel>
  `,
  styles: `
    .property-button {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem 0.5rem;
      border: none;
      border-radius: 0.5rem;
      text-align: left;
      cursor: pointer;
      color: var(--p-text-color);
      background: transparent;
      font: inherit;
    }
    .property-button:hover {
      background: var(--p-surface-50);
    }
    .property-button.current {
      background: var(--p-surface-100);
    }
    .property-avatar {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border-radius: 0.5rem;
      background: var(--p-surface-100);
      color: var(--p-text-muted-color);
    }
    .current .property-avatar {
      background: var(--p-primary-50);
      color: var(--p-primary-color);
    }
    .property-avatar mat-icon {
      font-size: 1.125rem;
      width: 1.125rem;
      height: 1.125rem;
    }
  `,
})
export class PropertyOverviewCardComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(OverviewStore);
  protected readonly roomsStore = inject(RoomsStore);

  private readonly current = computed(() =>
    this.store
      .propertyOverviews()
      .find(
        (overview) =>
          overview.propertyId === this.roomsStore.currentPropertyId(),
      ),
  );
  protected readonly subtitle = computed(() => {
    const current = this.current();
    if (!current) return '';
    return this.i18n.t('overview.property-overview-card.subtitle', {
      rate: this.percent(current.occupancyRate),
      rooms: this.i18n.t('overview.property-overview-card.available-rooms', {
        count: current.availableRooms,
      }),
    });
  });

  /** @returns Share as a whole percentage. */
  protected percent(value: number): string {
    return formatPercent(value, this.i18n.locale());
  }
}
