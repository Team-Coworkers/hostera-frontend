import { Component, computed, inject, signal } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { ChartData, ChartOptions } from 'chart.js';
import { BookingsStore } from '../../../../bookings/application/bookings.store';
import { RoomsStore } from '../../../../rooms/application/rooms.store';
import {
  formatDay,
  formatMoney,
} from '../../../../shared/presentation/calendar-format';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import {
  OverviewStore,
  PerformancePeriod,
} from '../../../application/overview.store';
import { formatPercent, themeColor } from '../../chart-colors';
import { ChartCanvasComponent } from '../chart-canvas/chart-canvas.component';
import { OverviewPanelComponent } from '../overview-panel/overview-panel.component';

/** Card with the room revenue per night as bars and the occupancy as a line over a period. */
@Component({
  selector: 'app-revenue-occupancy-card',
  imports: [MatSelectModule, ChartCanvasComponent, OverviewPanelComponent],
  template: `
    <app-overview-panel
      [title]="i18n.t('overview.revenue-occupancy-card.title')"
      [loading]="!bookingsStore.bookingsLoaded()"
      [failed]="
        !bookingsStore.bookingsLoaded() && bookingsStore.errors().length > 0
      "
      (retry)="bookingsStore.fetchBookings()"
    >
      <mat-select
        panelActions
        class="period-select"
        [value]="period()"
        [attr.aria-label]="i18n.t('overview.revenue-occupancy-card.period')"
        (selectionChange)="period.set($event.value)"
      >
        @for (option of periods; track option) {
          <mat-option [value]="option">{{
            i18n.t('overview.revenue-occupancy-card.periods.' + option)
          }}</mat-option>
        }
      </mat-select>
      <div class="flex flex-wrap align-items-baseline gap-3">
        <span class="font-mono text-3xl font-semibold">{{
          money(performance().revenue)
        }}</span>
        <span class="text-sm text-color-secondary">{{ changeLabel() }}</span>
        <span class="text-sm text-color-secondary">{{
          i18n.t('overview.revenue-occupancy-card.average-occupancy', {
            rate: percent(performance().occupancyRate),
          })
        }}</span>
      </div>
      <app-chart-canvas
        type="bar"
        class="flex-1 chart"
        [data]="chartData()"
        [options]="chartOptions()"
        [ariaLabel]="i18n.t('overview.revenue-occupancy-card.chart-label')"
      />
    </app-overview-panel>
  `,
  styles: `
    .period-select {
      width: 11rem;
    }
    .chart {
      min-height: 16rem;
    }
  `,
})
export class RevenueOccupancyCardComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly bookingsStore = inject(BookingsStore);
  private readonly store = inject(OverviewStore);
  private readonly roomsStore = inject(RoomsStore);

  protected readonly periods: PerformancePeriod[] = [
    'last-7',
    'last-30',
    'next-30',
  ];
  protected readonly period = signal<PerformancePeriod>('last-30');

  private readonly currency = computed(
    () => this.roomsStore.currentProperty()?.currency ?? 'PEN',
  );
  protected readonly performance = computed(() =>
    this.store.getPerformance(this.period()),
  );
  protected readonly changeLabel = computed(() => {
    const { change } = this.performance();
    if (change === null)
      return this.i18n.t('overview.revenue-occupancy-card.no-previous');
    return this.i18n.t('overview.revenue-occupancy-card.change', {
      change: formatPercent(change, this.i18n.locale(), {
        maximumFractionDigits: 1,
        signDisplay: 'always',
      }),
    });
  });

  protected readonly chartData = computed<ChartData>(() => {
    const days = this.performance().days;
    const locale = this.i18n.locale();
    return {
      labels: days.map((day) =>
        formatDay(day.date, locale, { day: 'numeric', month: 'short' }),
      ),
      datasets: [
        {
          type: 'line',
          label: this.i18n.t('overview.revenue-occupancy-card.occupancy'),
          data: days.map((day) => Math.round(day.occupancyRate * 100)),
          yAxisID: 'occupancy',
          borderColor: themeColor('--p-primary-color'),
          backgroundColor: themeColor('--p-primary-color'),
          borderWidth: 2,
          tension: 0.4,
          cubicInterpolationMode: 'monotone',
          pointRadius: 0,
          pointHoverRadius: 4,
        },
        {
          type: 'bar',
          label: this.i18n.t('overview.revenue-occupancy-card.revenue'),
          data: days.map((day) => day.revenue),
          yAxisID: 'revenue',
          backgroundColor: themeColor('--p-surface-300'),
          hoverBackgroundColor: themeColor('--p-surface-400'),
          borderRadius: 4,
        },
      ],
    };
  });

  protected readonly chartOptions = computed<ChartOptions>(() => {
    const textColor = themeColor('--p-text-muted-color');
    const gridColor = themeColor('--p-surface-200');
    const currency = this.currency();
    const locale = this.i18n.locale();
    return {
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { color: textColor, usePointStyle: true, boxHeight: 8 },
        },
        tooltip: {
          callbacks: {
            label: (context) =>
              (context.dataset as { yAxisID?: string }).yAxisID === 'revenue'
                ? `${context.dataset.label}: ${formatMoney(context.parsed.y ?? 0, currency, locale)}`
                : `${context.dataset.label}: ${context.parsed.y}%`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: textColor, maxTicksLimit: 8, maxRotation: 0 },
          grid: { display: false },
        },
        revenue: {
          position: 'left',
          beginAtZero: true,
          ticks: {
            color: textColor,
            callback: (value) => formatMoney(Number(value), currency, locale),
          },
          grid: { color: gridColor },
        },
        occupancy: {
          position: 'right',
          min: 0,
          max: 100,
          ticks: { color: textColor, callback: (value) => `${value}%` },
          grid: { drawOnChartArea: false },
        },
      },
    };
  });

  /** @returns Amount rounded to whole units in the property's currency. */
  protected money(amount: number): string {
    return formatMoney(Math.round(amount), this.currency(), this.i18n.locale());
  }

  /** @returns Share as a whole percentage. */
  protected percent(value: number): string {
    return formatPercent(value, this.i18n.locale());
  }
}
