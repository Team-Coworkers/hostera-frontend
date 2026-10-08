<script setup>
import { computed, onMounted, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import useBookingsStore from '../../application/bookings.store.js';
import useRoomsStore from '../../../rooms/application/rooms.store.js';
import useAccessControlStore from '../../../access-control/application/access-control.store.js';
import SidebarToggle from '../../../shared/presentation/components/sidebar-toggle.vue';

const props = defineProps({
  title: { type: String, default: '' },
});

const { t } = useI18n();
const router = useRouter();
const store = useBookingsStore();
const roomsStore = useRoomsStore();
const accessControlStore = useAccessControlStore();
const { bookingsLoaded, paymentsLoaded, errors, saving } = toRefs(store);
const {
  properties,
  propertiesLoaded,
  currentPropertyId,
  roomTypesLoaded,
  roomsLoaded,
  statusPeriodsLoaded,
  ratePlansLoaded,
  dailyRatesLoaded,
} = toRefs(roomsStore);
const { fetchBookings } = store;
const { fetchProperties, selectProperty } = roomsStore;

const noProperties = computed(
  () => propertiesLoaded.value && !properties.value.length,
);
// Bookings need the property's rooms, rates, and operational statuses to price and place stays.
const bookingsDataLoaded = computed(
  () =>
    bookingsLoaded.value &&
    paymentsLoaded.value &&
    accessControlStore.credentialsLoaded &&
    roomTypesLoaded.value &&
    roomsLoaded.value &&
    statusPeriodsLoaded.value &&
    ratePlansLoaded.value &&
    dailyRatesLoaded.value,
);
const loadErrors = computed(
  () => errors.value.length || roomsStore.errors.length,
);

onMounted(() => {
  if (!roomsStore.propertiesLoaded) fetchProperties();
});

/**
 * Returns to the booking list and loads the selected property's bookings.
 * @param {number} propertyId - The ID of the selected property.
 */
const changeProperty = async (propertyId) => {
  await router.push({ name: 'bookings-list' });
  selectProperty(propertyId);
};

/**
 * Retries loading the properties or the current property's bookings and rooms.
 */
const retry = () => {
  if (!propertiesLoaded.value) {
    fetchProperties();
    return;
  }
  selectProperty(currentPropertyId.value);
  fetchBookings();
};
</script>

<template>
  <div class="flex flex-column">
    <header
      class="sticky top-0 z-2 flex flex-wrap align-items-center gap-2 px-3 md:px-5 py-2 md:h-4rem surface-card border-bottom-1 surface-border"
    >
      <sidebar-toggle />
      <pv-divider layout="vertical" class="h-1rem min-h-0 p-0 mx-1 my-0" />
      <h1
        class="m-0 mr-auto text-xl font-semibold tracking-tight white-space-nowrap overflow-hidden text-overflow-ellipsis"
      >
        {{ props.title || t('bookings.bookings-layout.title') }}
      </h1>
      <pv-select
        :model-value="currentPropertyId"
        :options="properties"
        option-label="name"
        option-value="id"
        :aria-label="t('bookings.bookings-layout.property')"
        :disabled="saving"
        size="small"
        class="flex-order-1 md:flex-order-0 w-full md:w-14rem"
        @update:model-value="changeProperty"
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
      <slot name="actions" />
    </header>

    <div class="flex flex-column gap-4 p-3 md:px-5 md:pt-4 md:pb-5">
      <pv-message v-if="noProperties" severity="warn" icon="pi pi-info-circle">
        {{ t('bookings.bookings-terms.errors.no-properties') }}
      </pv-message>
      <pv-message
        v-else-if="loadErrors && !bookingsDataLoaded"
        severity="error"
        icon="pi pi-exclamation-circle"
      >
        <div
          class="flex flex-column sm:flex-row sm:align-items-center justify-content-between gap-3"
        >
          <span>{{ t('bookings.bookings-terms.errors.connection') }}</span>
          <pv-button
            :label="t('bookings.bookings-layout.retry')"
            icon="pi pi-refresh"
            severity="danger"
            size="small"
            @click="retry"
          />
        </div>
      </pv-message>
      <div
        v-else-if="!bookingsDataLoaded"
        class="flex flex-column align-items-center gap-3 py-8 text-color-secondary"
        role="status"
      >
        <pv-progress-spinner
          :stroke-width="4"
          class="w-3rem h-3rem"
          aria-hidden="true"
        />
        <span>{{ t('bookings.bookings-layout.loading') }}</span>
      </div>
      <slot v-else />
    </div>
  </div>
</template>
