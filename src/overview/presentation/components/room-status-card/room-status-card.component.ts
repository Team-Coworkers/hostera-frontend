import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { ChartData, ChartOptions } from 'chart.js';
import { RoomsStore } from '../../../../rooms/application/rooms.store';
import { DayStatus, Room } from '../../../../rooms/domain/model/room.entity';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { OverviewStore } from '../../../application/overview.store';
import { themeColor } from '../../chart-colors';
import { ChartCanvasComponent } from '../chart-canvas/chart-canvas.component';
import { OverviewPanelComponent } from '../overview-panel/overview-panel.component';

// Each day status keeps a color close to its tag in Rooms.
const statusColors: Record<DayStatus, string> = {
  available: '--p-green-400',
  booked: '--p-blue-400',
  occupied: '--p-primary-color',
  'needs-cleaning': '--p-surface-400',
  blocked: '--p-orange-400',
  'out-of-service': '--p-red-400',
};

/** Card with today's rooms of the current property by day status, as a doughnut and a legend. */
@Component({
  selector: 'app-room-status-card',
  imports: [
    MatButtonModule,
    RouterLink,
    ChartCanvasComponent,
    OverviewPanelComponent,
  ],
  template: `
    <app-overview-panel
      [title]="i18n.t('overview.room-status-card.title')"
      [subtitle]="
        i18n.t('overview.room-status-card.subtitle', { count: notReady() })
      "
      [loading]="!loaded()"
      [failed]="!loaded() && roomsStore.errors().length > 0"
      (retry)="roomsStore.selectProperty(roomsStore.currentPropertyId())"
    >
      <div class="flex flex-wrap align-items-center gap-4">
        <div class="relative doughnut">
          <app-chart-canvas
            type="doughnut"
            class="w-full h-full"
            [data]="chartData()"
            [options]="chartOptions"
            [ariaLabel]="i18n.t('overview.room-status-card.chart-label')"
          />
          <span
            class="absolute top-0 left-0 w-full h-full flex flex-column align-items-center justify-content-center"
            aria-hidden="true"
          >
            <span class="text-3xl font-semibold">{{
              number(counts().available ?? 0)
            }}</span>
            <span class="text-sm text-color-secondary">{{
              i18n.t('overview.room-status-card.available')
            }}</span>
          </span>
        </div>
        <dl class="flex flex-column gap-2 flex-1 m-0 legend">
          @for (entry of entries(); track entry.status) {
            <div class="flex align-items-center justify-content-between gap-3">
              <dt class="flex align-items-center gap-2 text-color-secondary">
                <span
                  class="dot"
                  [style.background]="entry.color"
                  aria-hidden="true"
                ></span>
                {{ entry.label }}
              </dt>
              <dd class="m-0 font-semibold">{{ number(entry.count) }}</dd>
            </div>
          }
        </dl>
      </div>
      <a mat-stroked-button class="w-full" routerLink="/rooms/availability">{{
        i18n.t('overview.room-status-card.view')
      }}</a>
    </app-overview-panel>
  `,
  styles: `
    .doughnut {
      width: 10rem;
      height: 10rem;
    }
    .legend {
      min-width: 10rem;
    }
    .dot {
      display: inline-block;
      flex-shrink: 0;
      width: 0.6rem;
      height: 0.6rem;
      border-radius: 50%;
    }
  `,
})
export class RoomStatusCardComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly roomsStore = inject(RoomsStore);
  private readonly store = inject(OverviewStore);

  protected readonly counts = this.store.roomStatusCounts;
  protected readonly loaded = computed(
    () =>
      this.roomsStore.roomsLoaded() &&
      this.roomsStore.statusPeriodsLoaded() &&
      this.roomsStore.roomAssignmentsLoaded(),
  );
  protected readonly entries = computed(() =>
    Room.dayStatuses.map((status) => ({
      status,
      label: this.i18n.t(`overview.room-status-card.statuses.${status}`),
      count: this.counts()[status] ?? 0,
      color: themeColor(statusColors[status]),
    })),
  );
  protected readonly notReady = computed(() => {
    const counts = this.counts();
    return (
      (counts['needs-cleaning'] ?? 0) +
      (counts.blocked ?? 0) +
      (counts['out-of-service'] ?? 0)
    );
  });
  protected readonly chartData = computed<ChartData>(() => {
    const shown = this.entries().filter((entry) => entry.count > 0);
    return {
      labels: shown.map((entry) => entry.label),
      datasets: [
        {
          data: shown.map((entry) => entry.count),
          backgroundColor: shown.map((entry) => entry.color),
          borderWidth: 0,
        },
      ],
    };
  });
  protected readonly chartOptions = {
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: { legend: { display: false } },
  } as ChartOptions<'doughnut'> as ChartOptions;

  /** @returns Count formatted in the active locale. */
  protected number(value: number): string {
    return new Intl.NumberFormat(this.i18n.locale()).format(value);
  }
}
