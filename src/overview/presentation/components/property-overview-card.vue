<script setup>
import { computed, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import useOverviewStore from '../../application/overview.store.js';
import useRoomsStore from '../../../rooms/application/rooms.store.js';
import OverviewPanel from './overview-panel.vue';

const { t, n } = useI18n();
const store = useOverviewStore();
const roomsStore = useRoomsStore();
const { propertyOverviews, propertyOverviewsLoaded, propertyOverviewErrors } =
  toRefs(store);
const { currentPropertyId } = toRefs(roomsStore);

const current = computed(() =>
  propertyOverviews.value.find(
    (overview) => overview.propertyId === currentPropertyId.value,
  ),
);
</script>

<template>
  <overview-panel
    :title="t('overview.property-overview-card.title')"
    :subtitle="
      current
        ? t('overview.property-overview-card.subtitle', {
            rate: n(current.occupancyRate, {
              style: 'percent',
              maximumFractionDigits: 0,
            }),
            rooms: t(
              'overview.property-overview-card.available-rooms',
              current.availableRooms,
            ),
          })
        : ''
    "
    :loading="!propertyOverviewsLoaded"
    :failed="!propertyOverviewsLoaded && propertyOverviewErrors.length > 0"
    @retry="store.fetchPropertyOverviews()"
  >
    <ul class="list-none m-0 p-0 flex flex-column gap-2">
      <li v-for="overview in propertyOverviews" :key="overview.propertyId">
        <button
          type="button"
          :class="[
            'flex align-items-center gap-3 w-full px-2 py-3 border-none border-round-lg text-left cursor-pointer text-color',
            overview.propertyId === currentPropertyId
              ? 'surface-100'
              : 'bg-transparent hover:surface-50',
          ]"
          :aria-current="overview.propertyId === currentPropertyId || undefined"
          @click="roomsStore.selectProperty(overview.propertyId)"
        >
          <pv-avatar
            icon="pi pi-building"
            shape="square"
            :class="[
              'flex-shrink-0 border-round-lg',
              overview.propertyId === currentPropertyId
                ? 'bg-primary-50 text-primary'
                : 'surface-100 text-color-secondary',
            ]"
            aria-hidden="true"
          />
          <span class="flex flex-column flex-1 min-w-0">
            <span class="font-medium">{{ overview.name }}</span>
            <span class="text-sm text-color-secondary">{{
              t(
                'overview.property-overview-card.available-tonight',
                overview.availableRooms,
              )
            }}</span>
          </span>
          <span class="flex flex-column align-items-end gap-1 text-right">
            <span class="font-semibold">{{
              n(overview.occupancyRate, {
                style: 'percent',
                maximumFractionDigits: 0,
              })
            }}</span>
            <span
              :class="[
                'text-sm',
                overview.alertsCount
                  ? 'text-orange-700'
                  : 'text-color-secondary',
              ]"
              >{{
                overview.alertsCount
                  ? t(
                      'overview.property-overview-card.alerts',
                      overview.alertsCount,
                    )
                  : t('overview.property-overview-card.no-alerts')
              }}</span
            >
          </span>
        </button>
      </li>
    </ul>
    <small class="text-color-secondary">{{
      t('overview.property-overview-card.help')
    }}</small>
  </overview-panel>
</template>
