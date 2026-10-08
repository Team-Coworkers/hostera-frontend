<script setup>
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue';
import useRoomsStore from '../../application/rooms.store.js';
import {
  CalendarDate,
  formatDayRange,
  formatMoney,
} from '../../../shared/presentation/calendar-format.js';
import RoomsLayout from '../components/rooms-layout.vue';
import RoomAvatar from '../components/room-avatar.vue';
import DayStatusTag from '../components/day-status-tag.vue';
import RoomForm from '../components/room-form.vue';
import RoomMonthCalendar from '../components/room-month-calendar.vue';
import RoomStatusForm from '../components/room-status-form.vue';
import BookingControlledDialog from '../components/booking-controlled-dialog.vue';

const { t, locale } = useI18n();
const route = useRoute();
const toast = useToast();
const store = useRoomsStore();
const { statusPeriods, roomAssignments, currentProperty, saving } =
  toRefs(store);
const { getRoomById, getRoomTypeById, getDayStatus, getRoomAssignmentOn } =
  store;

const today = CalendarDate.today();
const month = ref(CalendarDate.startOfMonth(today));
const roomFormVisible = ref(false);
const statusFormVisible = ref(false);
const bookingDialogVisible = ref(false);
const selectedDay = ref(null);

const room = computed(() => getRoomById(route.params.id));
const roomType = computed(() => getRoomTypeById(room.value?.roomTypeId));
const todayStatus = computed(() => getDayStatus(room.value.id, today));
const roomFacts = computed(() => [
  {
    label: t('rooms.room-detail.room-type'),
    value: roomType.value?.name,
  },
  {
    label: t('rooms.room-detail.capacity'),
    value: t('rooms.rooms-terms.guests', roomType.value?.capacity ?? 0),
  },
  {
    label: t('rooms.room-detail.beds'),
    value: roomType.value?.bedConfiguration,
  },
  {
    label: t('rooms.room-detail.floor'),
    value: room.value.floor ?? '—',
  },
  {
    label: t('rooms.room-detail.base-rate'),
    value: roomType.value
      ? formatMoney(
          roomType.value.baseNightlyRate,
          currentProperty.value?.currency ?? 'PEN',
          locale.value,
        )
      : '—',
  },
  {
    label: t('rooms.room-detail.property'),
    value: currentProperty.value?.name,
  },
]);
// Bookings, stays, and operational statuses that have not ended yet.
const upcomingEntries = computed(() =>
  [
    ...roomAssignments.value
      .filter(
        (roomAssignment) =>
          roomAssignment.roomId === room.value?.id &&
          roomAssignment.endDate >= today,
      )
      .map((roomAssignment) => ({
        key: `assignment-${roomAssignment.id}`,
        status: roomAssignment.status,
        startDate: roomAssignment.startDate,
        endDate: roomAssignment.endDate,
        detail: roomAssignment.bookingCode,
      })),
    ...statusPeriods.value
      .filter(
        (statusPeriod) =>
          statusPeriod.roomId === room.value?.id &&
          statusPeriod.endDate >= today,
      )
      .map((statusPeriod) => ({
        key: `period-${statusPeriod.id}`,
        status: statusPeriod.status,
        startDate: statusPeriod.startDate,
        endDate: statusPeriod.endDate,
        detail: statusPeriod.reason,
      })),
  ].sort((a, b) => a.startDate.localeCompare(b.startDate)),
);
const breadcrumbItems = computed(() => [
  {
    label: t('rooms.room-detail.rooms'),
    route: { name: 'rooms-availability' },
  },
  {
    label: t('rooms.rooms-terms.room-number', { number: room.value?.number }),
  },
]);

/**
 * Opens the status form for a day, or explains why its booking controls it.
 * @param {string} date - Selected ISO calendar day.
 */
const openDay = (date) => {
  const roomAssignment = getRoomAssignmentOn(room.value.id, date);
  selectedDay.value = { date, roomAssignment };
  if (roomAssignment) bookingDialogVisible.value = true;
  else statusFormVisible.value = true;
};

/**
 * Confirms that changes were saved.
 */
const notifySaved = () => {
  toast.add({
    severity: 'success',
    summary: t('rooms.room-detail.saved'),
    life: 3000,
  });
};
</script>

<template>
  <rooms-layout>
    <template v-if="room">
      <pv-breadcrumb :model="breadcrumbItems" class="p-0 bg-transparent">
        <template #item="{ item }">
          <router-link
            v-if="item.route"
            :to="item.route"
            class="text-color-secondary hover:text-primary"
            >{{ item.label }}</router-link
          >
          <span v-else class="font-medium">{{ item.label }}</span>
        </template>
      </pv-breadcrumb>

      <header
        class="flex flex-column md:flex-row md:align-items-center gap-3 pb-4 border-bottom-1 surface-border"
      >
        <div class="flex align-items-center gap-3 flex-1 min-w-0">
          <room-avatar size="large" />
          <div class="flex flex-column gap-1 min-w-0">
            <div class="flex flex-wrap align-items-center gap-2">
              <h2 class="m-0 text-2xl font-bold tracking-tight">
                {{
                  t('rooms.rooms-terms.room-number', { number: room.number })
                }}
              </h2>
              <day-status-tag :status="todayStatus" />
            </div>
            <span class="text-sm text-color-secondary">
              {{ roomType?.name }} ·
              {{
                t('rooms.room-detail.floor-value', { floor: room.floor ?? '—' })
              }}
            </span>
          </div>
        </div>
        <div class="flex align-items-center gap-4">
          <div class="flex flex-column md:align-items-end">
            <span class="text-sm text-color-secondary">{{
              t('rooms.room-detail.capacity')
            }}</span>
            <span class="text-xl">{{
              t('rooms.rooms-terms.guests', roomType?.capacity ?? 0)
            }}</span>
          </div>
          <pv-button
            :label="t('rooms.room-detail.edit')"
            icon="pi pi-pencil"
            severity="secondary"
            outlined
            rounded
            class="ml-auto md:ml-0"
            :disabled="saving"
            @click="roomFormVisible = true"
          />
        </div>
      </header>

      <div class="grid">
        <div class="col-12 xl:col-8">
          <room-month-calendar
            v-model:month="month"
            :room="room"
            @select-day="openDay"
          />
        </div>

        <aside class="col-12 xl:col-4">
          <div
            class="flex flex-column gap-4 p-4 surface-50 border-1 surface-border border-round-xl"
          >
            <section class="flex flex-column gap-3">
              <h3
                class="flex align-items-center gap-2 m-0 text-base font-semibold"
              >
                <i
                  class="pi pi-info-circle text-color-secondary"
                  aria-hidden="true"
                />
                {{ t('rooms.room-detail.details') }}
              </h3>
              <dl class="flex flex-column gap-2 m-0">
                <div
                  v-for="fact in roomFacts"
                  :key="fact.label"
                  class="flex justify-content-between gap-3"
                >
                  <dt class="text-color-secondary">{{ fact.label }}</dt>
                  <dd class="m-0 text-right font-medium">{{ fact.value }}</dd>
                </div>
              </dl>
            </section>

            <pv-divider class="m-0" />

            <section class="flex flex-column gap-3">
              <h3
                class="flex align-items-center gap-2 m-0 text-base font-semibold"
              >
                <i
                  class="pi pi-clock text-color-secondary"
                  aria-hidden="true"
                />
                {{ t('rooms.room-detail.upcoming') }}
              </h3>
              <ul
                v-if="upcomingEntries.length"
                class="list-none m-0 p-0 flex flex-column gap-3"
              >
                <li
                  v-for="entry in upcomingEntries"
                  :key="entry.key"
                  class="flex flex-column gap-1"
                >
                  <div
                    class="flex align-items-center justify-content-between gap-2"
                  >
                    <day-status-tag :status="entry.status" />
                    <span class="text-sm white-space-nowrap">{{
                      formatDayRange(entry.startDate, entry.endDate, locale)
                    }}</span>
                  </div>
                  <span
                    :class="[
                      'text-sm text-color-secondary line-height-3',
                      { 'font-mono': entry.key.startsWith('assignment') },
                    ]"
                    >{{ entry.detail }}</span
                  >
                </li>
              </ul>
              <p v-else class="m-0 text-sm text-color-secondary">
                {{ t('rooms.room-detail.no-upcoming') }}
              </p>
            </section>

            <p class="m-0 text-sm text-color-secondary line-height-3">
              {{ t('rooms.room-detail.calendar-help') }}
            </p>
          </div>
        </aside>
      </div>

      <room-form
        v-if="roomFormVisible"
        v-model:visible="roomFormVisible"
        :room="room"
        @saved="notifySaved"
      />
      <room-status-form
        v-if="statusFormVisible"
        v-model:visible="statusFormVisible"
        :room="room"
        :date="selectedDay.date"
        @saved="notifySaved"
      />
      <booking-controlled-dialog
        v-if="bookingDialogVisible"
        v-model:visible="bookingDialogVisible"
        :room="room"
        :room-assignment="selectedDay.roomAssignment"
      />
    </template>
    <pv-message v-else severity="warn" icon="pi pi-search">
      <div class="flex flex-column sm:flex-row sm:align-items-center gap-3">
        <span>{{ t('rooms.room-detail.not-found') }}</span>
        <router-link :to="{ name: 'rooms-availability' }" class="font-medium">{{
          t('rooms.room-detail.back')
        }}</router-link>
      </div>
    </pv-message>
  </rooms-layout>
</template>
