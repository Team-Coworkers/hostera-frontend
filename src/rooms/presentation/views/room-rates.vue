<script setup>
import { computed, onBeforeUnmount, onMounted, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue';
import useRoomsStore from '../../application/rooms.store.js';
import {
  CalendarDate,
  formatDay,
  formatDayRange,
  formatMoney,
} from '../../../shared/presentation/calendar-format.js';
import RoomsLayout from '../components/rooms-layout.vue';
import RatePlanForm from '../components/rate-plan-form.vue';
import DailyRateForm from '../components/daily-rate-form.vue';

const { t, locale } = useI18n();
const toast = useToast();
const store = useRoomsStore();
const { ratePlans, roomTypes, currentProperty, saving } = toRefs(store);
const { getRatePlanById, getDailyRate, getNightlyRate } = store;

// Below PrimeFlex's md breakpoint the week grid shows one day at a time.
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
const selectedRatePlanId = ref(null);
const ratePlanFormVisible = ref(false);
const editedRatePlan = ref(null);
const dailyRateFormVisible = ref(false);
const dailyRateSelection = ref(null);

const currency = computed(() => currentProperty.value?.currency ?? 'PEN');
// The selected plan falls back to the first active plan, for example after changing property.
const ratePlan = computed(
  () =>
    getRatePlanById(selectedRatePlanId.value) ??
    ratePlans.value.find((entry) => entry.isActive) ??
    ratePlans.value[0],
);
const ratePlanId = computed({
  get: () => ratePlan.value?.id ?? null,
  set: (value) => {
    selectedRatePlanId.value = value;
  },
});
const ratePlanConditions = computed(() => {
  if (!ratePlan.value) return [];
  return [
    t(`rooms.rooms-terms.included-services.${ratePlan.value.includedServices}`),
    ratePlan.value.refundable
      ? ratePlan.value.cancellationPolicy
      : t('rooms.room-rates.non-refundable'),
    ratePlan.value.appliesToAllRoomTypes
      ? t('rooms.room-rates.all-room-types')
      : t(
          'rooms.room-rates.room-types-count',
          ratePlan.value.roomTypeIds.length,
        ),
  ];
});
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
const roomTypeRows = computed(() =>
  roomTypes.value
    .filter(
      (roomType) => roomType.isActive && ratePlan.value?.appliesTo(roomType.id),
    )
    .map((roomType) => ({
      id: roomType.id,
      roomType,
      nights: Object.fromEntries(
        visibleDays.value.map((date) => [
          date,
          {
            amount: getNightlyRate(roomType.id, ratePlan.value.id, date),
            daily: !!getDailyRate(roomType.id, ratePlan.value.id, date),
          },
        ]),
      ),
    })),
);

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
 * Describes a room type's night for assistive technologies.
 * @param {Object} row - Room type row.
 * @param {string} date - ISO calendar day.
 * @returns {string} Accessible description.
 */
const nightLabel = (row, date) =>
  [
    row.roomType.name,
    formatDay(date, locale.value, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
    formatMoney(row.nights[date].amount, currency.value, locale.value),
    row.nights[date].daily
      ? t('rooms.room-rates.daily-rate')
      : t('rooms.room-rates.base-rate'),
  ].join(', ');

/**
 * Opens the rate plan form to add a plan or edit the selected one.
 * @param {Object|null} plan - The rate plan to edit, or null to add one.
 */
const openRatePlanForm = (plan = null) => {
  editedRatePlan.value = plan;
  ratePlanFormVisible.value = true;
};

/**
 * Opens the daily rate form for the visible dates or for one room type's night.
 * @param {?number} [roomTypeId=null] - Preselected room type.
 * @param {?string} [date=null] - Selected night; the visible dates when omitted.
 */
const openDailyRateForm = (roomTypeId = null, date = null) => {
  dailyRateSelection.value = {
    roomTypeId,
    startDate: date ?? startDate.value,
    endDate: date ?? visibleDays.value.at(-1),
  };
  dailyRateFormVisible.value = true;
};

/**
 * Shows the saved rate plan and confirms the change.
 * @param {Object} savedRatePlan - Persisted rate plan.
 */
const showRatePlan = (savedRatePlan) => {
  selectedRatePlanId.value = savedRatePlan.id;
  notifySaved();
};

/**
 * Shows the rate plan whose daily rates were saved and confirms the change.
 * @param {number} savedRatePlanId - Rate plan of the saved daily rates.
 */
const showDailyRates = (savedRatePlanId) => {
  selectedRatePlanId.value = savedRatePlanId;
  notifySaved();
};

/**
 * Confirms that changes were saved.
 */
const notifySaved = () => {
  toast.add({
    severity: 'success',
    summary: t('rooms.room-rates.saved'),
    life: 3000,
  });
};
</script>

<template>
  <rooms-layout>
    <template #actions>
      <pv-button
        :label="t('rooms.room-rates.new-rate-plan')"
        icon="pi pi-plus"
        rounded
        :disabled="saving"
        @click="openRatePlanForm()"
      />
    </template>

    <div
      v-if="!ratePlan"
      class="flex flex-column align-items-center gap-2 py-6 text-center border-1 surface-border border-round-xl"
    >
      <i class="pi pi-tag text-3xl text-color-secondary" aria-hidden="true" />
      <span class="font-medium">{{ t('rooms.room-rates.empty-title') }}</span>
      <span class="text-sm text-color-secondary">{{
        t('rooms.room-rates.empty-text')
      }}</span>
      <pv-button
        :label="t('rooms.room-rates.new-rate-plan')"
        icon="pi pi-plus"
        rounded
        outlined
        class="mt-2"
        :disabled="saving"
        @click="openRatePlanForm()"
      />
    </div>

    <section v-else class="flex flex-column gap-3">
      <div class="flex flex-wrap align-items-center gap-2">
        <div class="flex align-items-center gap-1">
          <pv-button
            v-tooltip.top="
              compact
                ? t('rooms.room-rates.previous-day')
                : t('rooms.room-rates.previous-week')
            "
            icon="pi pi-chevron-left"
            severity="secondary"
            text
            rounded
            :aria-label="
              compact
                ? t('rooms.room-rates.previous-day')
                : t('rooms.room-rates.previous-week')
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
            :aria-label="`${t('rooms.room-rates.choose-date')}: ${rangeLabel}`"
            @click="datePopover.toggle($event)"
          />
          <pv-button
            v-tooltip.top="
              compact
                ? t('rooms.room-rates.next-day')
                : t('rooms.room-rates.next-week')
            "
            icon="pi pi-chevron-right"
            severity="secondary"
            text
            rounded
            :aria-label="
              compact
                ? t('rooms.room-rates.next-day')
                : t('rooms.room-rates.next-week')
            "
            @click="moveDates(1)"
          />
        </div>
        <pv-button
          :label="t('rooms.room-rates.today')"
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

        <div class="flex align-items-center gap-1 w-full sm:w-auto">
          <pv-select
            v-model="ratePlanId"
            :options="ratePlans"
            option-label="name"
            option-value="id"
            :aria-label="t('rooms.room-rates.rate-plan')"
            class="flex-1 sm:flex-none sm:w-16rem"
          >
            <template #value="{ value }">
              <span class="flex align-items-center gap-2 min-w-0">
                <span class="text-color-secondary">{{
                  t('rooms.room-rates.plan')
                }}</span>
                <span
                  class="font-semibold white-space-nowrap overflow-hidden text-overflow-ellipsis"
                  >{{ getRatePlanById(value)?.name }}</span
                >
              </span>
            </template>
            <template #option="{ option }">
              <span
                class="flex align-items-center justify-content-between gap-3 w-full"
              >
                <span>{{ option.name }}</span>
                <pv-tag
                  v-if="!option.isActive"
                  severity="secondary"
                  :value="t('rooms.rooms-terms.rate-plan-statuses.inactive')"
                />
              </span>
            </template>
          </pv-select>
          <pv-button
            v-tooltip.top="t('rooms.room-rates.edit-rate-plan')"
            icon="pi pi-pencil"
            severity="secondary"
            text
            rounded
            :aria-label="`${t('rooms.room-rates.edit-rate-plan')}: ${ratePlan.name}`"
            :disabled="saving"
            @click="openRatePlanForm(ratePlan)"
          />
        </div>

        <pv-button
          :label="t('rooms.room-rates.set-rates')"
          icon="pi pi-calendar-plus"
          outlined
          rounded
          class="w-full sm:w-auto sm:ml-auto"
          :disabled="saving || !roomTypeRows.length"
          @click="openDailyRateForm()"
        />
      </div>

      <div
        class="flex flex-wrap align-items-center gap-2 text-sm text-color-secondary"
      >
        <pv-tag
          v-if="!ratePlan.isActive"
          severity="secondary"
          :value="t('rooms.rooms-terms.rate-plan-statuses.inactive')"
        />
        <template v-for="(condition, index) in ratePlanConditions" :key="index">
          <span v-if="index" aria-hidden="true">·</span>
          <span>{{ condition }}</span>
        </template>
      </div>

      <pv-data-table
        :value="roomTypeRows"
        data-key="id"
        size="small"
        scrollable
        :table-style="compact ? '' : 'min-width: 60rem'"
      >
        <template #empty>
          <div
            class="flex flex-column align-items-center gap-2 py-6 text-center"
          >
            <i
              class="pi pi-th-large text-3xl text-color-secondary"
              aria-hidden="true"
            />
            <span class="font-medium">{{
              t('rooms.room-rates.no-room-types-title')
            }}</span>
            <span class="text-sm text-color-secondary">{{
              t('rooms.room-rates.no-room-types-text')
            }}</span>
          </div>
        </template>
        <pv-column
          frozen
          :header="t('rooms.room-rates.room-type')"
          style="min-width: 10rem"
        >
          <template #body="{ data }">
            <span class="flex flex-column">
              <span class="font-semibold">{{ data.roomType.name }}</span>
              <span class="text-sm text-color-secondary white-space-nowrap">{{
                t('rooms.room-rates.base', {
                  amount: formatMoney(
                    data.roomType.baseNightlyRate,
                    currency,
                    locale,
                  ),
                })
              }}</span>
            </span>
          </template>
        </pv-column>
        <pv-column
          v-for="day in visibleDays"
          :key="day"
          :header-class="day === today ? 'surface-100' : ''"
          :body-class="day === today ? 'surface-100' : ''"
          class="p-1"
          style="min-width: 7rem"
        >
          <template #header>
            <span
              :class="[
                'flex flex-column w-full px-2 text-center',
                { 'text-primary': day === today },
              ]"
            >
              <span class="text-sm font-normal text-color-secondary">{{
                day === today
                  ? t('rooms.room-rates.today')
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
              class="w-full justify-content-center px-1 py-2"
              :aria-label="nightLabel(data, day)"
              :disabled="saving"
              @click="openDailyRateForm(data.roomType.id, day)"
            >
              <span
                :class="[
                  'font-mono white-space-nowrap',
                  data.nights[day].daily
                    ? 'text-color font-medium'
                    : 'text-color-secondary',
                ]"
                >{{
                  formatMoney(data.nights[day].amount, currency, locale)
                }}</span
              >
            </pv-button>
          </template>
        </pv-column>
      </pv-data-table>

      <span
        v-if="roomTypeRows.length"
        class="flex align-items-center gap-2 text-sm text-color-secondary"
      >
        <i class="pi pi-info-circle text-sm" aria-hidden="true" />
        {{ t('rooms.room-rates.legend') }}
      </span>
    </section>

    <rate-plan-form
      v-if="ratePlanFormVisible"
      v-model:visible="ratePlanFormVisible"
      :rate-plan="editedRatePlan"
      @saved="showRatePlan"
    />
    <daily-rate-form
      v-if="dailyRateFormVisible"
      v-model:visible="dailyRateFormVisible"
      :rate-plan-id="ratePlan.id"
      :room-type-id="dailyRateSelection.roomTypeId"
      :start-date="dailyRateSelection.startDate"
      :end-date="dailyRateSelection.endDate"
      @saved="showDailyRates"
    />
  </rooms-layout>
</template>
