<script setup>
import { computed, onBeforeUnmount, onMounted, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import useBookingsStore from '../../application/bookings.store.js';
import useRoomsStore from '../../../rooms/application/rooms.store.js';
import { Booking } from '../../domain/model/booking.entity.js';
import {
  CalendarDate,
  formatDayRange,
  formatMoney,
} from '../../../shared/presentation/calendar-format.js';
import BookingsLayout from '../components/bookings-layout.vue';
import BookingStatusTag from '../components/booking-status-tag.vue';
import PaymentStatusTag from '../components/payment-status-tag.vue';

const { t, locale } = useI18n();
const router = useRouter();
const store = useBookingsStore();
const roomsStore = useRoomsStore();
const { bookings, currentPropertyId } = toRefs(store);
const { currentProperty } = toRefs(roomsStore);
const { getRoomById, getRoomTypeById } = roomsStore;
const { getPaymentStatus } = store;

// Below PrimeFlex's md breakpoint the table becomes a list of bookings.
const compactQuery = window.matchMedia('(max-width: 767px)');
const compact = ref(compactQuery.matches);
const updateCompact = (event) => {
  compact.value = event.matches;
};
onMounted(() => compactQuery.addEventListener('change', updateCompact));
onBeforeUnmount(() =>
  compactQuery.removeEventListener('change', updateCompact),
);

const today = CalendarDate.today();
const search = ref('');
const period = ref('all');
const statusFilter = ref(null);

const currency = computed(() => currentProperty.value?.currency ?? 'PEN');
const periodOptions = computed(() =>
  ['all', 'current', 'upcoming', 'past'].map((value) => ({
    value,
    label: t(`bookings.booking-list.periods.${value}`),
  })),
);
const statusOptions = computed(() =>
  Booking.statuses.map((value) => ({
    value,
    label: t(`bookings.bookings-terms.statuses.${value}`),
  })),
);
const bookingRows = computed(() =>
  bookings.value.map((booking) => {
    const room = getRoomById(booking.roomId);
    return {
      id: booking.id,
      booking,
      room,
      roomType: getRoomTypeById(booking.roomTypeId),
      nightsCount: booking.nights.length,
      paymentStatus: getPaymentStatus(booking),
    };
  }),
);
// Latest stays first, as the table sorts them.
const filteredRows = computed(() => {
  const query = search.value.trim().toLowerCase();
  return bookingRows.value
    .toSorted((a, b) =>
      b.booking.checkInDate.localeCompare(a.booking.checkInDate),
    )
    .filter(({ booking }) => {
      const periodMatches = {
        all: true,
        current: booking.checkInDate <= today && today < booking.checkOutDate,
        upcoming: booking.checkInDate > today,
        past: booking.checkOutDate <= today,
      }[period.value];
      return (
        periodMatches &&
        (!statusFilter.value || booking.status === statusFilter.value) &&
        `${booking.guestName} ${booking.code}`.toLowerCase().includes(query)
      );
    });
});
const filtersActive = computed(
  () => search.value || period.value !== 'all' || statusFilter.value,
);

watch(currentPropertyId, () => resetFilters());

/**
 * Clears the search text, period, and status filters.
 */
const resetFilters = () => {
  search.value = '';
  period.value = 'all';
  statusFilter.value = null;
};

/**
 * Opens a booking's detail.
 * @param {Object} booking - Booking to open.
 */
const openBooking = (booking) => {
  router.push({ name: 'bookings-booking-detail', params: { id: booking.id } });
};
</script>

<template>
  <bookings-layout>
    <template #actions>
      <pv-button
        :label="t('bookings.booking-list.new')"
        icon="pi pi-plus"
        rounded
        @click="router.push({ name: 'bookings-booking-new' })"
      />
    </template>

    <section class="flex flex-column gap-3">
      <div class="flex flex-wrap align-items-center gap-2">
        <pv-icon-field class="w-full md:w-20rem">
          <pv-input-icon class="pi pi-search" />
          <pv-input-text
            v-model="search"
            :placeholder="t('bookings.booking-list.search')"
            :aria-label="t('bookings.booking-list.search')"
            fluid
          />
        </pv-icon-field>
        <pv-select
          v-model="period"
          :options="periodOptions"
          option-label="label"
          option-value="value"
          :aria-label="t('bookings.booking-list.period')"
          class="w-full sm:w-12rem"
        />
        <pv-select
          v-model="statusFilter"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          :placeholder="t('bookings.booking-list.all-statuses')"
          :aria-label="t('bookings.booking-list.status')"
          show-clear
          class="w-full sm:w-12rem"
        />
        <pv-button
          v-if="filtersActive"
          :label="t('bookings.booking-list.clear')"
          icon="pi pi-filter-slash"
          severity="secondary"
          text
          @click="resetFilters"
        />
        <span class="ml-auto text-sm text-color-secondary" aria-live="polite">{{
          t('bookings.booking-list.results', filteredRows.length)
        }}</span>
      </div>

      <div
        v-if="!filteredRows.length"
        class="flex flex-column align-items-center gap-2 py-6 text-center border-1 surface-border border-round-xl"
      >
        <i
          class="pi pi-calendar text-3xl text-color-secondary"
          aria-hidden="true"
        />
        <span class="font-medium">{{
          t('bookings.booking-list.empty-title')
        }}</span>
        <span class="text-sm text-color-secondary">{{
          bookings.length
            ? t('bookings.booking-list.empty-filtered')
            : t('bookings.booking-list.empty-text')
        }}</span>
      </div>

      <ul
        v-else-if="compact"
        class="list-none m-0 p-0 surface-card border-1 surface-border border-round-xl overflow-hidden"
      >
        <li
          v-for="(row, index) in filteredRows"
          :key="row.id"
          :class="{ 'border-top-1 surface-border': index > 0 }"
        >
          <router-link
            :to="{
              name: 'bookings-booking-detail',
              params: { id: row.booking.id },
            }"
            class="flex flex-column gap-2 px-3 py-3 text-color"
          >
            <span class="flex align-items-start justify-content-between gap-2">
              <span class="flex flex-column min-w-0">
                <span
                  class="font-semibold white-space-nowrap overflow-hidden text-overflow-ellipsis"
                  >{{ row.booking.guestName }}</span
                >
                <span class="font-mono text-sm text-color-secondary">{{
                  row.booking.code
                }}</span>
              </span>
              <booking-status-tag :status="row.booking.status" />
            </span>
            <span
              class="flex flex-wrap justify-content-between gap-2 text-sm text-color-secondary"
            >
              <span>{{
                formatDayRange(
                  row.booking.checkInDate,
                  row.booking.checkOutDate,
                  locale,
                )
              }}</span>
              <span>{{
                t('bookings.bookings-terms.room-number', {
                  number: row.room?.number ?? '—',
                })
              }}</span>
            </span>
          </router-link>
        </li>
      </ul>

      <pv-data-table
        v-else
        :value="filteredRows"
        data-key="id"
        row-hover
        scrollable
        paginator
        :rows="10"
        :always-show-paginator="false"
        sort-field="booking.checkInDate"
        :sort-order="-1"
        table-style="min-width: 56rem"
        :pt="{ bodyRow: { class: 'cursor-pointer' } }"
        @row-click="openBooking($event.data.booking)"
      >
        <pv-column
          field="booking.guestName"
          :header="t('bookings.booking-list.guest')"
          sortable
        >
          <template #body="{ data }">
            <span class="flex flex-column">
              <router-link
                :to="{
                  name: 'bookings-booking-detail',
                  params: { id: data.booking.id },
                }"
                class="font-semibold text-color hover:text-primary"
                @click.stop
                >{{ data.booking.guestName }}</router-link
              >
              <span class="font-mono text-sm text-color-secondary">{{
                data.booking.code
              }}</span>
            </span>
          </template>
        </pv-column>
        <pv-column
          field="booking.checkInDate"
          :header="t('bookings.booking-list.stay')"
          sortable
        >
          <template #body="{ data }">
            <span class="flex flex-column">
              <span class="white-space-nowrap">{{
                formatDayRange(
                  data.booking.checkInDate,
                  data.booking.checkOutDate,
                  locale,
                )
              }}</span>
              <span class="text-sm text-color-secondary">{{
                t('bookings.bookings-terms.nights', data.nightsCount)
              }}</span>
            </span>
          </template>
        </pv-column>
        <pv-column
          field="room.number"
          :header="t('bookings.booking-list.room')"
          sortable
        >
          <template #body="{ data }">
            <span class="flex flex-column">
              <span class="font-mono font-semibold">{{
                data.room?.number ?? '—'
              }}</span>
              <span class="text-sm text-color-secondary">{{
                data.roomType?.name
              }}</span>
            </span>
          </template>
        </pv-column>
        <pv-column
          field="booking.status"
          :header="t('bookings.booking-list.status')"
        >
          <template #body="{ data }">
            <booking-status-tag :status="data.booking.status" />
          </template>
        </pv-column>
        <pv-column
          field="paymentStatus"
          :header="t('bookings.booking-list.payment')"
        >
          <template #body="{ data }">
            <payment-status-tag :status="data.paymentStatus" />
          </template>
        </pv-column>
        <pv-column
          field="booking.totalAmount"
          :header="t('bookings.booking-list.total')"
          sortable
          class="text-right"
          :pt="{ columnHeaderContent: { class: 'justify-content-end' } }"
        >
          <template #body="{ data }">
            <span class="font-mono white-space-nowrap">{{
              formatMoney(data.booking.totalAmount, currency, locale)
            }}</span>
          </template>
        </pv-column>
        <pv-column style="width: 1%">
          <template #body>
            <i
              class="pi pi-chevron-right text-color-secondary"
              aria-hidden="true"
            />
          </template>
        </pv-column>
      </pv-data-table>
    </section>
  </bookings-layout>
</template>
