<script setup>
import { computed, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import useOverviewStore from '../../application/overview.store.js';
import useRoomsStore from '../../../rooms/application/rooms.store.js';
import { Room } from '../../../rooms/domain/model/room.entity.js';
import { themeColor } from '../chart-colors.js';
import OverviewPanel from './overview-panel.vue';

const { t, n } = useI18n();
const store = useOverviewStore();
const roomsStore = useRoomsStore();
const { roomStatusCounts } = toRefs(store);
const { roomsLoaded, statusPeriodsLoaded, roomAssignmentsLoaded, errors } =
  toRefs(roomsStore);

// Each day status keeps a color close to its tag in Rooms.
const statusColors = {
  available: '--p-green-400',
  booked: '--p-blue-400',
  occupied: '--p-primary-color',
  'needs-cleaning': '--p-surface-400',
  blocked: '--p-orange-400',
  'out-of-service': '--p-red-400',
};
const loaded = computed(
  () =>
    roomsLoaded.value &&
    statusPeriodsLoaded.value &&
    roomAssignmentsLoaded.value,
);
const entries = computed(() =>
  Room.dayStatuses.map((status) => ({
    status,
    label: t(`overview.room-status-card.statuses.${status}`),
    count: roomStatusCounts.value[status] ?? 0,
    color: themeColor(statusColors[status]),
  })),
);
const notReady = computed(
  () =>
    (roomStatusCounts.value['needs-cleaning'] ?? 0) +
    (roomStatusCounts.value.blocked ?? 0) +
    (roomStatusCounts.value['out-of-service'] ?? 0),
);
const chartData = computed(() => {
  const shown = entries.value.filter((entry) => entry.count > 0);
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
const chartOptions = {
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: { legend: { display: false } },
};
</script>

<template>
  <overview-panel
    :title="t('overview.room-status-card.title')"
    :subtitle="t('overview.room-status-card.subtitle', notReady)"
    :loading="!loaded"
    :failed="!loaded && errors.length > 0"
    @retry="roomsStore.selectProperty(roomsStore.currentPropertyId)"
  >
    <div class="flex flex-wrap align-items-center gap-4">
      <div class="relative" style="width: 10rem; height: 10rem">
        <pv-chart
          type="doughnut"
          :data="chartData"
          :options="chartOptions"
          class="w-full h-full"
          :aria-label="t('overview.room-status-card.chart-label')"
          role="img"
        />
        <span
          class="absolute top-0 left-0 w-full h-full flex flex-column align-items-center justify-content-center"
          aria-hidden="true"
        >
          <span class="text-3xl font-semibold">{{
            n(roomStatusCounts.available ?? 0)
          }}</span>
          <span class="text-sm text-color-secondary">{{
            t('overview.room-status-card.available')
          }}</span>
        </span>
      </div>
      <dl class="flex flex-column gap-2 flex-1 m-0" style="min-width: 10rem">
        <div
          v-for="entry in entries"
          :key="entry.status"
          class="flex align-items-center justify-content-between gap-3"
        >
          <dt class="flex align-items-center gap-2 text-color-secondary">
            <span
              class="inline-block border-circle flex-shrink-0"
              :style="{
                width: '0.6rem',
                height: '0.6rem',
                background: entry.color,
              }"
              aria-hidden="true"
            />
            {{ entry.label }}
          </dt>
          <dd class="m-0 font-semibold">{{ n(entry.count) }}</dd>
        </div>
      </dl>
    </div>
    <router-link
      v-slot="{ navigate }"
      :to="{ name: 'rooms-availability' }"
      custom
    >
      <pv-button
        :label="t('overview.room-status-card.view')"
        severity="secondary"
        outlined
        rounded
        fluid
        @click="navigate"
      />
    </router-link>
  </overview-panel>
</template>
