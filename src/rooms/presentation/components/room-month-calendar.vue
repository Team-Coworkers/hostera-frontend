<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import useRoomsStore from '../../application/rooms.store.js';
import {
  CalendarDate,
  formatDay,
} from '../../../shared/presentation/calendar-format.js';
import DayStatusTag from './day-status-tag.vue';

const props = defineProps({
  room: { type: Object, required: true },
});
const month = defineModel('month', { type: String, required: true });
const emit = defineEmits(['select-day']);

const { t, locale } = useI18n();
const store = useRoomsStore();
const { getDayStatus, getRoomAssignmentOn } = store;

const today = CalendarDate.today();
// Weeks start on Sunday; the first cell is the Sunday on or before the 1st.
const gridStart = computed(() =>
  CalendarDate.addDays(month.value, -CalendarDate.dayOfWeek(month.value)),
);
const weekdays = computed(() =>
  CalendarDate.sequence(gridStart.value, 7).map((date) => ({
    short: formatDay(date, locale.value, { weekday: 'short' }),
    long: formatDay(date, locale.value, { weekday: 'long' }),
  })),
);
const weeks = computed(() => {
  const nextMonth = CalendarDate.addMonths(month.value, 1);
  const days = [];
  for (
    let date = gridStart.value;
    date < nextMonth || days.length % 7;
    date = CalendarDate.addDays(date, 1)
  )
    days.push({
      date,
      inMonth: date.startsWith(month.value.slice(0, 7)),
      status: getDayStatus(props.room.id, date),
      bookingCode: getRoomAssignmentOn(props.room.id, date)?.bookingCode,
    });
  return Array.from({ length: days.length / 7 }, (_, index) =>
    days.slice(index * 7, index * 7 + 7),
  );
});
const monthLabel = computed(() =>
  formatDay(month.value, locale.value, { month: 'long', year: 'numeric' }),
);

/**
 * Describes a calendar day for assistive technologies.
 * @param {Object} day - Calendar cell.
 * @returns {string} Accessible description.
 */
const dayLabel = (day) =>
  [
    formatDay(day.date, locale.value, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
    t(`rooms.rooms-terms.day-statuses.${day.status}`),
    day.bookingCode,
  ]
    .filter(Boolean)
    .join(', ');
</script>

<template>
  <section class="flex flex-column gap-3">
    <div class="flex flex-wrap align-items-center gap-2">
      <h3
        class="flex align-items-center gap-2 m-0 mr-auto text-base font-semibold"
      >
        <i class="pi pi-calendar text-color-secondary" aria-hidden="true" />
        {{ t('rooms.room-month-calendar.title') }}
      </h3>
      <pv-button
        v-tooltip.top="t('rooms.room-month-calendar.previous')"
        icon="pi pi-chevron-left"
        severity="secondary"
        text
        rounded
        :aria-label="t('rooms.room-month-calendar.previous')"
        @click="month = CalendarDate.addMonths(month, -1)"
      />
      <span
        class="font-semibold text-center white-space-nowrap"
        style="min-width: 9rem"
        aria-live="polite"
        >{{ monthLabel }}</span
      >
      <pv-button
        v-tooltip.top="t('rooms.room-month-calendar.next')"
        icon="pi pi-chevron-right"
        severity="secondary"
        text
        rounded
        :aria-label="t('rooms.room-month-calendar.next')"
        @click="month = CalendarDate.addMonths(month, 1)"
      />
      <pv-button
        :label="t('rooms.room-month-calendar.today')"
        severity="secondary"
        text
        rounded
        :disabled="month === CalendarDate.startOfMonth(today)"
        @click="month = CalendarDate.startOfMonth(today)"
      />
    </div>

    <div
      class="surface-card border-1 surface-border border-round-xl overflow-hidden"
    >
      <table
        class="w-full"
        style="table-layout: fixed; border-collapse: collapse"
        :aria-label="
          t('rooms.room-month-calendar.caption', {
            number: room.number,
            month: monthLabel,
          })
        "
      >
        <thead>
          <tr class="surface-50">
            <th
              v-for="weekday in weekdays"
              :key="weekday.long"
              scope="col"
              :abbr="weekday.long"
              class="py-2 text-sm font-medium text-color-secondary border-bottom-1 surface-border"
            >
              {{ weekday.short }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="week in weeks" :key="week[0].date">
            <td
              v-for="(day, index) in week"
              :key="day.date"
              :class="[
                'p-1 vertical-align-top border-bottom-1 surface-border',
                { 'border-left-1': index > 0 },
                { 'surface-50': !day.inMonth },
              ]"
            >
              <pv-button
                v-if="day.inMonth"
                severity="secondary"
                text
                class="w-full h-4rem md:h-5rem flex-column align-items-stretch justify-content-between gap-1 p-1 md:p-2"
                :aria-label="dayLabel(day)"
                :aria-current="day.date === today ? 'date' : undefined"
                @click="emit('select-day', day.date)"
              >
                <span class="flex justify-content-end">
                  <span
                    :class="[
                      'flex align-items-center justify-content-center w-2rem h-2rem border-circle font-mono text-sm',
                      day.date === today
                        ? 'bg-primary font-semibold'
                        : 'text-color',
                    ]"
                    >{{ Number(day.date.slice(8)) }}</span
                  >
                </span>
                <day-status-tag
                  v-if="day.status !== 'available'"
                  :status="day.status"
                  compact
                  class="justify-content-center md:justify-content-start"
                />
              </pv-button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
