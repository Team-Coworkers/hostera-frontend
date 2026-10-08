<script setup>
import { computed, onMounted, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import useRoomsStore from '../../../rooms/application/rooms.store.js';
import useBookingsStore from '../../../bookings/application/bookings.store.js';
import useOverviewStore from '../../application/overview.store.js';
import SidebarToggle from '../../../shared/presentation/components/sidebar-toggle.vue';
import BookingSearch from '../components/booking-search.vue';
import RevenueOccupancyCard from '../components/revenue-occupancy-card.vue';
import PropertyOverviewCard from '../components/property-overview-card.vue';
import TodaysArrivalsCard from '../components/todays-arrivals-card.vue';
import RoomStatusCard from '../components/room-status-card.vue';

const { t } = useI18n();
const roomsStore = useRoomsStore();
// Loading the Bookings and Overview stores starts their data requests for the current property.
useBookingsStore();
useOverviewStore();
const { properties, propertiesLoaded, currentPropertyId } = toRefs(roomsStore);
const { fetchProperties, selectProperty } = roomsStore;

const noProperties = computed(
  () => propertiesLoaded.value && !properties.value.length,
);
const propertiesFailed = computed(
  () => !propertiesLoaded.value && roomsStore.errors.length > 0,
);

onMounted(() => {
  if (!roomsStore.propertiesLoaded) fetchProperties();
});
</script>

<template>
  <div class="flex flex-column">
    <header
      class="sticky top-0 z-2 flex flex-wrap align-items-center gap-2 px-3 md:px-5 py-2 md:h-4rem surface-card border-bottom-1 surface-border"
    >
      <sidebar-toggle />
      <pv-divider layout="vertical" class="h-1rem min-h-0 p-0 mx-1 my-0" />
      <h1
        class="m-0 mr-auto text-xl font-semibold tracking-tight white-space-nowrap"
      >
        {{ t('overview.overview-view.title') }}
      </h1>
      <booking-search
        v-if="propertiesLoaded"
        class="flex-order-2 md:flex-order-0"
      />
      <pv-select
        :model-value="currentPropertyId"
        :options="properties"
        option-label="name"
        option-value="id"
        :aria-label="t('overview.overview-view.property')"
        size="small"
        class="flex-order-1 md:flex-order-0 w-full md:w-14rem"
        @update:model-value="selectProperty"
      >
        <template #value="{ value }">
          <span class="flex align-items-center gap-2">
            <i class="pi pi-building text-color-secondary" aria-hidden="true" />
            <span
              class="font-medium white-space-nowrap overflow-hidden text-overflow-ellipsis"
              >{{
                properties.find((property) => property.id === value)?.name ??
                '—'
              }}</span
            >
          </span>
        </template>
      </pv-select>
      <router-link
        v-slot="{ navigate }"
        :to="{ name: 'bookings-booking-new' }"
        custom
      >
        <pv-button
          :label="t('overview.overview-view.new-booking')"
          icon="pi pi-plus"
          rounded
          :disabled="!currentPropertyId"
          @click="navigate"
        />
      </router-link>
    </header>

    <div class="p-3 md:px-5 md:pt-4 md:pb-5">
      <pv-message v-if="noProperties" severity="warn" icon="pi pi-info-circle">
        {{ t('overview.overview-view.no-properties') }}
      </pv-message>
      <pv-message
        v-else-if="propertiesFailed"
        severity="error"
        icon="pi pi-exclamation-circle"
      >
        <div
          class="flex flex-column sm:flex-row sm:align-items-center justify-content-between gap-3"
        >
          <span>{{ t('overview.overview-view.connection') }}</span>
          <pv-button
            :label="t('overview.overview-panel.retry')"
            icon="pi pi-refresh"
            severity="danger"
            size="small"
            @click="fetchProperties"
          />
        </div>
      </pv-message>
      <div v-else class="grid">
        <div class="col-12 xl:col-8">
          <revenue-occupancy-card />
        </div>
        <div class="col-12 xl:col-4">
          <property-overview-card />
        </div>
        <div class="col-12 xl:col-8">
          <todays-arrivals-card />
        </div>
        <div class="col-12 xl:col-4">
          <room-status-card />
        </div>
      </div>
    </div>
  </div>
</template>
