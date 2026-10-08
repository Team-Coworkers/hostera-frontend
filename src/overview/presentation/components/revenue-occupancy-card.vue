<script setup>
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import useOverviewStore from '../../application/overview.store.js';
import useBookingsStore from '../../../bookings/application/bookings.store.js';
import useRoomsStore from '../../../rooms/application/rooms.store.js';
import {
  formatDay,
  formatMoney,
} from '../../../shared/presentation/calendar-format.js';
import { themeColor } from '../chart-colors.js';
import OverviewPanel from './overview-panel.vue';

const { t, n, locale } = useI18n();
const store = useOverviewStore();
const bookingsStore = useBookingsStore();
const roomsStore = useRoomsStore();
const { bookingsLoaded, errors } = toRefs(bookingsStore);
const { currentProperty } = toRefs(roomsStore);

const period = ref('last-30');
const periodOptions = computed(() =>
  ['last-7', 'last-30', 'next-30'].map((value) => ({
    value,
    label: t(`overview.revenue-occupancy-card.periods.${value}`),
  })),
);
const currency = computed(() => currentProperty.value?.currency ?? 'PEN');
const performance = computed(() => store.getPerformance(period.value));
const changeLabel = computed(() => {
  const { change } = performance.value;
  if (change === null) return t('overview.revenue-occupancy-card.no-previous');
  return t('overview.revenue-occupancy-card.change', {
    change: n(change, {
      style: 'percent',
      maximumFractionDigits: 1,
      signDisplay: 'always',
    }),
  });
});
const chartData = computed(() => ({
  labels: performance.value.days.map((day) =>
    formatDay(day.date, locale.value, { day: 'numeric', month: 'short' }),
  ),
  datasets: [
    {
      type: 'line',
      label: t('overview.revenue-occupancy-card.occupancy'),
      data: performance.value.days.map((day) =>
        Math.round(day.occupancyRate * 100),
      ),
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
      label: t('overview.revenue-occupancy-card.revenue'),
      data: performance.value.days.map((day) => day.revenue),
      yAxisID: 'revenue',
      backgroundColor: themeColor('--p-surface-300'),
      hoverBackgroundColor: themeColor('--p-surface-400'),
      borderRadius: 4,
    },
  ],
}));
const chartOptions = computed(() => {
  const textColor = themeColor('--p-text-muted-color');
  const gridColor = themeColor('--p-surface-200');
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
            context.dataset.yAxisID === 'revenue'
              ? `${context.dataset.label}: ${formatMoney(context.parsed.y, currency.value, locale.value)}`
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
          callback: (value) => formatMoney(value, currency.value, locale.value),
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
</script>

<template>
  <overview-panel
    :title="t('overview.revenue-occupancy-card.title')"
    :loading="!bookingsLoaded"
    :failed="!bookingsLoaded && errors.length > 0"
    @retry="bookingsStore.fetchBookings()"
  >
    <template #actions>
      <pv-select
        v-model="period"
        :options="periodOptions"
        option-label="label"
        option-value="value"
        :aria-label="t('overview.revenue-occupancy-card.period')"
        size="small"
        class="w-11rem"
      />
    </template>
    <div class="flex flex-wrap align-items-baseline gap-3">
      <span class="font-mono text-3xl font-semibold">{{
        formatMoney(Math.round(performance.revenue), currency, locale)
      }}</span>
      <span class="text-sm text-color-secondary">{{ changeLabel }}</span>
      <span class="text-sm text-color-secondary">{{
        t('overview.revenue-occupancy-card.average-occupancy', {
          rate: n(performance.occupancyRate, {
            style: 'percent',
            maximumFractionDigits: 0,
          }),
        })
      }}</span>
    </div>
    <pv-chart
      type="bar"
      :data="chartData"
      :options="chartOptions"
      class="flex-1"
      style="min-height: 16rem"
      :aria-label="t('overview.revenue-occupancy-card.chart-label')"
      role="img"
    />
  </overview-panel>
</template>
