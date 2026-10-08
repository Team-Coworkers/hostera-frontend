<script setup>
import { computed, onBeforeUnmount, onMounted, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue';
import useRoomsStore from '../../application/rooms.store.js';
import { Room } from '../../domain/model/room.entity.js';
import {
  CalendarDate,
  formatDay,
  formatDayRange,
} from '../../../shared/presentation/calendar-format.js';
import RoomsLayout from '../components/rooms-layout.vue';
import RoomAvatar from '../components/room-avatar.vue';
import DayStatusTag from '../components/day-status-tag.vue';
import RoomForm from '../components/room-form.vue';
import RoomStatusForm from '../components/room-status-form.vue';
import BookingControlledDialog from '../components/booking-controlled-dialog.vue';

const { t, n, locale } = useI18n();
const toast = useToast();
const store = useRoomsStore();
const { rooms, roomTypes, currentPropertyId, saving } = toRefs(store);
const { getRoomTypeById, getDayStatus, getRoomAssignmentOn } = store;

// Below PrimeFlex's md breakpoint the week grid becomes a one-day room list.
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
const startDate = ref(today);
const datePopover = ref(null);
const search = ref('');
const roomTypeFilter = ref(null);
const statusFilter = ref('all');
const roomFormVisible = ref(false);
const statusFormVisible = ref(false);
const bookingDialogVisible = ref(false);
const selectedDay = ref(null);

const visibleDays = computed(() =>
  CalendarDate.sequence(startDate.value, compact.value ? 1 : 7),
);
const rangeLabel = computed(() =>
  compact.value
    ? formatDay(startDate.value, locale.value, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : formatDayRange(startDate.value, visibleDays.value.at(-1), locale.value),
);
const pickerDate = computed({
  get: () => CalendarDate.toDate(startDate.value),
  set: (value) => {
    if (value) startDate.value = CalendarDate.fromDate(value);
  },
});
const roomRows = computed(() =>
  [...rooms.value]
    .sort((a, b) =>
      a.number.localeCompare(b.number, undefined, { numeric: true }),
    )
    .map((room) => ({
      id: room.id,
      room,
      roomType: getRoomTypeById(room.roomTypeId),
      days: Object.fromEntries(
        visibleDays.value.map((date) => [date, getDayStatus(room.id, date)]),
      ),
    })),
);
const searchedRows = computed(() => {
  const query = search.value.trim().toLowerCase();
  return roomRows.value.filter(
    (row) =>
      row.room.number.toLowerCase().includes(query) &&
      (!roomTypeFilter.value || row.room.roomTypeId === roomTypeFilter.value),
  );
});
const filteredRows = computed(() =>
  searchedRows.value.filter(
    (row) =>
      statusFilter.value === 'all' ||
      row.days[startDate.value] === statusFilter.value,
  ),
);
const statusOptions = computed(() => [
  {
    value: 'all',
    label: t('rooms.room-availability.all'),
    count: searchedRows.value.length,
  },
  ...Room.dayStatuses.map((value) => ({
    value,
    label: t(`rooms.rooms-terms.day-statuses.${value}`),
    count: searchedRows.value.filter(
      (row) => row.days[startDate.value] === value,
    ).length,
  })),
]);
const filtersActive = computed(
  () => search.value || roomTypeFilter.value || statusFilter.value !== 'all',
);

watch(currentPropertyId, () => resetFilters());

/**
 * Moves the visible dates backwards or forwards by one page.
 * @param {number} direction - -1 for earlier dates, 1 for later dates.
 */
const moveDates = (direction) => {
  startDate.value = CalendarDate.addDays(
    startDate.value,
    direction * visibleDays.value.length,
  );
};

/**
 * Clears the search text, room type, and status filters.
 */
const resetFilters = () => {
  search.value = '';
  roomTypeFilter.value = null;
  statusFilter.value = 'all';
};

/**
 * Describes a room day for assistive technologies.
 * @param {Object} row - Room row.
 * @param {string} date - ISO calendar day.
 * @returns {string} Accessible description.
 */
const dayLabel = (row, date) => {
  const bookingCode = getRoomAssignmentOn(row.room.id, date)?.bookingCode;
  return [
    t('rooms.rooms-terms.room-number', { number: row.room.number }),
    formatDay(date, locale.value, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
    t(`rooms.rooms-terms.day-statuses.${row.days[date]}`),
    bookingCode,
  ]
    .filter(Boolean)
    .join(', ');
};

/**
 * Opens the status form for a room day, or explains why its booking controls it.
 * @param {Object} room - Selected room.
 * @param {string} date - Selected ISO calendar day.
 */
const openDay = (room, date) => {
  const roomAssignment = getRoomAssignmentOn(room.id, date);
  selectedDay.value = { room, date, roomAssignment };
  if (roomAssignment) bookingDialogVisible.value = true;
  else statusFormVisible.value = true;
};

/**
 * Confirms that changes were saved.
 */
const notifySaved = () => {
  toast.add({
    severity: 'success',
    summary: t('rooms.room-availability.saved'),
    life: 3000,
  });
};
</script>

<template>
  <rooms-layout>
    <template #actions>
      <pv-button
        :label="t('rooms.room-availability.new-room')"
        icon="pi pi-plus"
        rounded
        :disabled="saving || !roomTypes.length"
        @click="roomFormVisible = true"
      />
    </template>

    <section class="flex flex-column gap-3">
      <div class="flex flex-wrap align-items-center gap-2">
        <div class="flex align-items-center gap-1">
          <pv-button
            v-tooltip.top="
              compact
                ? t('rooms.room-availability.previous-day')
                : t('rooms.room-availability.previous-week')
            "
            icon="pi pi-chevron-left"
            severity="secondary"
            text
            rounded
            :aria-label="
              compact
                ? t('rooms.room-availability.previous-day')
                : t('rooms.room-availability.previous-week')
            "
            @click="moveDates(-1)"
          />
          <pv-button
            :label="rangeLabel"
            icon="pi pi-calendar"
            severity="secondary"
            outlined
            rounded
            aria-haspopup="dialog"
            :aria-label="`${t('rooms.room-availability.choose-date')}: ${rangeLabel}`"
            @click="datePopover.toggle($event)"
          />
          <pv-button
            v-tooltip.top="
              compact
                ? t('rooms.room-availability.next-day')
                : t('rooms.room-availability.next-week')
            "
            icon="pi pi-chevron-right"
            severity="secondary"
            text
            rounded
            :aria-label="
              compact
                ? t('rooms.room-availability.next-day')
                : t('rooms.room-availability.next-week')
            "
            @click="moveDates(1)"
          />
        </div>
        <pv-button
          :label="t('rooms.room-availability.today')"
          severity="secondary"
          text
          rounded
          :disabled="startDate === today"
          @click="startDate = today"
        />
        <pv-popover ref="datePopover">
          <pv-date-picker
            v-model="pickerDate"
            inline
            @date-select="datePopover.hide()"
          />
        </pv-popover>
      </div>

      <div class="flex flex-column gap-2">
        <span id="status-filter-label" class="text-sm text-color-secondary">{{
          t('rooms.room-availability.status-on', {
            date: formatDay(startDate, locale, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            }),
          })
        }}</span>
        <div class="flex align-items-center gap-2 overflow-x-auto">
          <pv-select-button
            v-model="statusFilter"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            :allow-empty="false"
            aria-labelledby="status-filter-label"
            class="flex-shrink-0"
          >
            <template #option="{ option }">
              <span class="flex align-items-center gap-2 white-space-nowrap">
                <span>{{ option.label }}</span>
                <span class="font-mono text-sm opacity-70">{{
                  n(option.count)
                }}</span>
              </span>
            </template>
          </pv-select-button>
        </div>
      </div>

      <div class="flex flex-wrap align-items-center gap-2">
        <pv-icon-field class="w-full sm:w-14rem">
          <pv-input-icon class="pi pi-search" />
          <pv-input-text
            v-model="search"
            :placeholder="t('rooms.room-availability.search')"
            :aria-label="t('rooms.room-availability.search')"
            fluid
          />
        </pv-icon-field>
        <pv-select
          v-model="roomTypeFilter"
          :options="roomTypes"
          option-label="name"
          option-value="id"
          :placeholder="t('rooms.room-availability.all-room-types')"
          :aria-label="t('rooms.room-availability.room-type')"
          show-clear
          class="w-full sm:w-14rem"
        />
        <pv-button
          v-if="filtersActive"
          :label="t('rooms.room-availability.clear')"
          icon="pi pi-filter-slash"
          severity="secondary"
          text
          @click="resetFilters"
        />
        <span class="ml-auto text-sm text-color-secondary" aria-live="polite">{{
          t('rooms.room-availability.results', filteredRows.length)
        }}</span>
      </div>

      <div
        v-if="!filteredRows.length"
        class="flex flex-column align-items-center gap-2 py-6 text-center border-1 surface-border border-round-xl"
      >
        <i class="pi pi-key text-3xl text-color-secondary" aria-hidden="true" />
        <span class="font-medium">{{
          t('rooms.room-availability.empty-title')
        }}</span>
        <span class="text-sm text-color-secondary">{{
          rooms.length
            ? t('rooms.room-availability.empty-filtered')
            : t('rooms.room-availability.empty-text')
        }}</span>
      </div>

      <ul
        v-else-if="compact"
        class="list-none m-0 p-0 surface-card border-1 surface-border border-round-xl overflow-hidden"
      >
        <li
          v-for="(row, index) in filteredRows"
          :key="row.id"
          :class="[
            'flex align-items-center gap-3 px-3 py-2',
            { 'border-top-1 surface-border': index > 0 },
          ]"
        >
          <router-link
            :to="{ name: 'rooms-room-detail', params: { id: row.room.id } }"
            class="flex align-items-center gap-3 flex-1 min-w-0 text-color"
          >
            <room-avatar />
            <span class="flex flex-column min-w-0">
              <span class="font-mono font-semibold">{{ row.room.number }}</span>
              <span
                class="text-sm text-color-secondary white-space-nowrap overflow-hidden text-overflow-ellipsis"
                >{{ row.roomType?.name }}</span
              >
            </span>
          </router-link>
          <pv-button
            severity="secondary"
            text
            class="flex-shrink-0 px-2 py-1"
            :aria-label="dayLabel(row, startDate)"
            @click="openDay(row.room, startDate)"
          >
            <day-status-tag
              v-if="row.days[startDate] !== 'available'"
              :status="row.days[startDate]"
            />
            <span
              v-else
              class="flex align-items-center gap-2 text-sm text-color-secondary"
            >
              <i class="pi pi-check text-sm" aria-hidden="true" />
              {{ t('rooms.rooms-terms.day-statuses.available') }}
            </span>
          </pv-button>
        </li>
      </ul>

      <pv-data-table
        v-else
        :value="filteredRows"
        data-key="id"
        size="small"
        scrollable
        paginator
        :rows="20"
        :always-show-paginator="false"
        table-style="min-width: 68rem"
      >
        <pv-column
          frozen
          :header="t('rooms.room-availability.room')"
          style="min-width: 10rem"
        >
          <template #body="{ data }">
            <router-link
              :to="{ name: 'rooms-room-detail', params: { id: data.room.id } }"
              class="flex flex-column text-color hover:text-primary"
            >
              <span class="font-mono font-semibold">{{
                data.room.number
              }}</span>
              <span
                class="text-sm text-color-secondary white-space-nowrap overflow-hidden text-overflow-ellipsis"
                >{{ data.roomType?.name }}</span
              >
            </router-link>
          </template>
        </pv-column>
        <pv-column
          v-for="day in visibleDays"
          :key="day"
          :header-class="day === today ? 'surface-100' : ''"
          :body-class="day === today ? 'surface-100' : ''"
          class="p-1"
          style="min-width: 8.25rem"
        >
          <template #header>
            <span
              :class="[
                'flex flex-column w-full px-2',
                { 'text-primary': day === today },
              ]"
            >
              <span class="text-sm font-normal text-color-secondary">{{
                day === today
                  ? t('rooms.room-availability.today')
                  : formatDay(day, locale, { weekday: 'short' })
              }}</span>
              <span class="font-semibold">{{
                formatDay(day, locale, { day: 'numeric', month: 'short' })
              }}</span>
            </span>
          </template>
          <template #body="{ data }">
            <pv-button
              severity="secondary"
              text
              class="w-full justify-content-start px-1 py-1"
              :aria-label="dayLabel(data, day)"
              @click="openDay(data.room, day)"
            >
              <day-status-tag
                v-if="data.days[day] !== 'available'"
                :status="data.days[day]"
                class="w-full justify-content-start"
              />
              <i
                v-else
                class="pi pi-check text-sm text-color-secondary opacity-60 px-2 py-1"
                aria-hidden="true"
              />
            </pv-button>
          </template>
        </pv-column>
      </pv-data-table>
    </section>

    <room-form
      v-if="roomFormVisible"
      v-model:visible="roomFormVisible"
      @saved="notifySaved"
    />
    <room-status-form
      v-if="statusFormVisible"
      v-model:visible="statusFormVisible"
      :room="selectedDay.room"
      :date="selectedDay.date"
      @saved="notifySaved"
    />
    <booking-controlled-dialog
      v-if="bookingDialogVisible"
      v-model:visible="bookingDialogVisible"
      :room="selectedDay.room"
      :room-assignment="selectedDay.roomAssignment"
    />
  </rooms-layout>
</template>
