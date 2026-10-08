<script setup>
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import useOverviewStore from '../../application/overview.store.js';
import useBookingsStore from '../../../bookings/application/bookings.store.js';
import useRoomsStore from '../../../rooms/application/rooms.store.js';
import { formatDayRange } from '../../../shared/presentation/calendar-format.js';
import OverviewPanel from './overview-panel.vue';

const { t, locale } = useI18n();
const router = useRouter();
const store = useOverviewStore();
const bookingsStore = useBookingsStore();
const roomsStore = useRoomsStore();
const { todaysArrivals } = toRefs(store);
const { bookingsLoaded, paymentsLoaded, errors } = toRefs(bookingsStore);

const actionsMenu = ref(null);
const selectedArrival = ref(null);
const arrivedCount = computed(
  () => todaysArrivals.value.filter((arrival) => arrival.arrived).length,
);
const actionItems = computed(() => {
  const booking = selectedArrival.value?.booking;
  if (!booking) return [];
  return [
    {
      label: t('overview.todays-arrivals-card.open'),
      icon: 'pi pi-arrow-right',
      command: () =>
        router.push({
          name: 'bookings-booking-detail',
          params: { id: booking.id },
        }),
    },
    {
      label: t('overview.todays-arrivals-card.check-in'),
      icon: 'pi pi-sign-in',
      disabled: booking.status !== 'confirmed',
      command: () =>
        router.push({
          name: 'bookings-booking-check-in',
          params: { id: booking.id },
        }),
    },
  ];
});

/**
 * Describes where an arrival stands before or after check-in.
 * @param {Object} arrival - Arrival of today.
 * @returns {{label: string, severity: string}} Tag of the arrival.
 */
const arrivalTag = (arrival) => {
  if (arrival.arrived)
    return {
      label: t('overview.todays-arrivals-card.statuses.arrived'),
      severity: 'success',
    };
  if (arrival.booking.status === 'pending')
    return {
      label: t('overview.todays-arrivals-card.statuses.pending'),
      severity: 'warn',
    };
  if (arrival.balanceDue > 0)
    return {
      label: t('overview.todays-arrivals-card.statuses.payment-due'),
      severity: 'danger',
    };
  return {
    label: t('overview.todays-arrivals-card.statuses.ready'),
    severity: 'info',
  };
};

/**
 * Opens the action menu of an arrival.
 * @param {Event} event - Click event.
 * @param {Object} arrival - Arrival of today.
 */
const openActions = (event, arrival) => {
  selectedArrival.value = arrival;
  actionsMenu.value.toggle(event);
};
</script>

<template>
  <overview-panel
    :title="t('overview.todays-arrivals-card.title')"
    :subtitle="
      todaysArrivals.length
        ? t('overview.todays-arrivals-card.subtitle', {
            arrived: arrivedCount,
            total: todaysArrivals.length,
          })
        : ''
    "
    :loading="!bookingsLoaded || !paymentsLoaded"
    :failed="!bookingsLoaded && errors.length > 0"
    @retry="bookingsStore.fetchBookings()"
  >
    <template v-if="todaysArrivals.length" #actions>
      <router-link
        :to="{ name: 'bookings-list' }"
        class="text-sm font-medium white-space-nowrap"
        >{{ t('overview.todays-arrivals-card.view-all') }}</router-link
      >
    </template>
    <div
      v-if="!todaysArrivals.length"
      class="flex flex-column sm:flex-row align-items-center justify-content-center gap-3 flex-1 py-4"
    >
      <span
        class="flex align-items-center justify-content-center flex-shrink-0 w-3rem h-3rem border-round-lg surface-100 text-primary"
        aria-hidden="true"
        ><i class="pi pi-calendar text-xl"
      /></span>
      <span class="flex flex-column gap-1 text-center sm:text-left">
        <span class="font-semibold">{{
          t('overview.todays-arrivals-card.empty-title')
        }}</span>
        <span class="text-sm text-color-secondary">{{
          t('overview.todays-arrivals-card.empty-text')
        }}</span>
      </span>
      <router-link v-slot="{ navigate }" :to="{ name: 'bookings-list' }" custom>
        <pv-button
          :label="t('overview.todays-arrivals-card.view-all')"
          severity="secondary"
          outlined
          rounded
          class="sm:ml-4"
          @click="navigate"
        />
      </router-link>
    </div>
    <ul v-else class="list-none m-0 p-0 flex flex-column">
      <li
        v-for="(arrival, index) in todaysArrivals"
        :key="arrival.booking.id"
        :class="[
          'flex flex-wrap align-items-center gap-3 py-2',
          { 'border-top-1 surface-border': index > 0 },
        ]"
      >
        <router-link
          :to="{
            name: 'bookings-booking-detail',
            params: { id: arrival.booking.id },
          }"
          class="flex flex-column text-color"
          style="flex: 1 1 12rem"
        >
          <span class="font-semibold">{{ arrival.booking.guestName }}</span>
          <span class="font-mono text-sm text-color-secondary">{{
            arrival.booking.code
          }}</span>
        </router-link>
        <span class="flex flex-column" style="min-width: 5rem">
          <span class="text-sm text-color-secondary">{{
            t('overview.todays-arrivals-card.room')
          }}</span>
          <span class="font-mono font-semibold">{{
            roomsStore.getRoomById(arrival.booking.roomId)?.number ?? '—'
          }}</span>
        </span>
        <span class="flex flex-column" style="min-width: 9rem">
          <span class="text-sm text-color-secondary">{{
            t('overview.todays-arrivals-card.stay')
          }}</span>
          <span class="white-space-nowrap">{{
            formatDayRange(
              arrival.booking.checkInDate,
              arrival.booking.checkOutDate,
              locale,
            )
          }}</span>
        </span>
        <pv-tag
          :value="arrivalTag(arrival).label"
          :severity="arrivalTag(arrival).severity"
        />
        <pv-button
          icon="pi pi-ellipsis-h"
          severity="secondary"
          text
          rounded
          aria-haspopup="true"
          aria-controls="arrival-actions"
          :aria-label="
            t('overview.todays-arrivals-card.actions', {
              name: arrival.booking.guestName,
            })
          "
          @click="openActions($event, arrival)"
        />
      </li>
    </ul>
    <pv-menu
      id="arrival-actions"
      ref="actionsMenu"
      :model="actionItems"
      popup
    />
  </overview-panel>
</template>
