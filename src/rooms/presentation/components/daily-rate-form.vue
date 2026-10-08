<script setup>
import { computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import useRoomsStore from '../../application/rooms.store.js';
import { RoomsError } from '../../domain/model/rooms.error.js';
import { SetDailyRatesCommand } from '../../domain/set-daily-rates.command.js';
import {
  CalendarDate,
  formatMoney,
  moneyLocale,
} from '../../../shared/presentation/calendar-format.js';

const props = defineProps({
  ratePlanId: { type: Number, required: true },
  roomTypeId: { type: Number, default: null },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
});
const visible = defineModel('visible', { type: Boolean });
const emit = defineEmits(['saved']);

const { t, locale } = useI18n();
const store = useRoomsStore();
const { ratePlans, roomTypes, currentProperty, saving } = toRefs(store);
const { setDailyRates, getRatePlanById, getRoomTypeById, getNightlyRate } =
  store;

const currency = computed(() => currentProperty.value?.currency ?? 'PEN');

/**
 * Lists the active room types sold under a rate plan.
 * @param {number} ratePlanId - Rate plan identifier.
 * @returns {Object[]} Room types that can be priced.
 */
const roomTypesOf = (ratePlanId) =>
  roomTypes.value.filter(
    (roomType) =>
      roomType.isActive && getRatePlanById(ratePlanId)?.appliesTo(roomType.id),
  );

const initialRoomTypeId =
  props.roomTypeId ?? roomTypesOf(props.ratePlanId)[0]?.id ?? null;
const form = ref({
  ratePlanId: props.ratePlanId,
  roomTypeId: initialRoomTypeId,
  dates: [
    CalendarDate.toDate(props.startDate),
    CalendarDate.toDate(props.endDate),
  ],
  useBaseRate: false,
  amount:
    getNightlyRate(initialRoomTypeId, props.ratePlanId, props.startDate) ??
    null,
});
const errorCode = ref('');
const roomTypeOptions = computed(() => roomTypesOf(form.value.ratePlanId));
const selectedRatePlan = computed(() => getRatePlanById(form.value.ratePlanId));
const selectedRoomType = computed(() => getRoomTypeById(form.value.roomTypeId));
const nightsCount = computed(() => {
  const [start, end] = form.value.dates ?? [];
  if (!start) return 0;
  // Rounding absorbs daylight saving changes between local midnights.
  return Math.round(((end ?? start) - start) / 86_400_000) + 1;
});

watch(
  () => form.value.ratePlanId,
  (ratePlanId) => {
    if (!getRatePlanById(ratePlanId)?.appliesTo(form.value.roomTypeId))
      form.value.roomTypeId = roomTypesOf(ratePlanId)[0]?.id ?? null;
  },
);
// A new plan or room type starts from its current price on the first night.
watch(
  () => [form.value.ratePlanId, form.value.roomTypeId],
  ([ratePlanId, roomTypeId]) => {
    const [start] = form.value.dates ?? [];
    form.value.amount =
      getNightlyRate(
        roomTypeId,
        ratePlanId,
        start ? CalendarDate.fromDate(start) : props.startDate,
      ) ?? null;
  },
);

/**
 * Applies the nightly rate, or the base nightly rate, to the selected nights.
 */
const saveDailyRates = async () => {
  errorCode.value = '';
  const [start, end] = form.value.dates ?? [];
  if (!start) {
    errorCode.value = 'invalid-date-range';
    return;
  }
  if (!form.value.roomTypeId) {
    errorCode.value = 'required-fields';
    return;
  }
  try {
    await setDailyRates(
      new SetDailyRatesCommand({
        ratePlanId: form.value.ratePlanId,
        roomTypeId: form.value.roomTypeId,
        startDate: CalendarDate.fromDate(start),
        endDate: CalendarDate.fromDate(end ?? start),
        useBaseRate: form.value.useBaseRate,
        amount: form.value.useBaseRate ? null : form.value.amount,
      }),
    );
    emit('saved', form.value.ratePlanId);
    visible.value = false;
  } catch (error) {
    errorCode.value = error instanceof RoomsError ? error.code : 'connection';
  }
};
</script>

<template>
  <pv-drawer
    v-model:visible="visible"
    position="right"
    class="w-full md:w-30rem"
    :dismissable="!saving"
    :close-on-escape="!saving"
    :show-close-icon="!saving"
    block-scroll
  >
    <template #header>
      <div class="flex flex-column">
        <span class="text-xl font-bold">{{
          t('rooms.daily-rate-form.title')
        }}</span>
        <span class="text-sm text-color-secondary">{{
          currentProperty?.name
        }}</span>
      </div>
    </template>

    <form
      id="daily-rate-form"
      class="flex flex-column gap-3"
      @submit.prevent="saveDailyRates"
    >
      <div class="flex flex-column gap-2">
        <label for="daily-rate-plan" class="text-sm font-medium">{{
          t('rooms.daily-rate-form.rate-plan')
        }}</label>
        <pv-select
          v-model="form.ratePlanId"
          input-id="daily-rate-plan"
          :options="ratePlans"
          option-label="name"
          option-value="id"
          fluid
        />
      </div>
      <div class="flex flex-column gap-2">
        <label for="daily-rate-room-type" class="text-sm font-medium">{{
          t('rooms.daily-rate-form.room-type')
        }}</label>
        <pv-select
          v-model="form.roomTypeId"
          input-id="daily-rate-room-type"
          :options="roomTypeOptions"
          option-label="name"
          option-value="id"
          :placeholder="t('rooms.daily-rate-form.room-type-placeholder')"
          fluid
        />
      </div>
      <div class="flex flex-column gap-2">
        <label for="daily-rate-dates" class="text-sm font-medium">{{
          t('rooms.daily-rate-form.dates')
        }}</label>
        <pv-date-picker
          v-model="form.dates"
          input-id="daily-rate-dates"
          selection-mode="range"
          :manual-input="false"
          show-icon
          icon-display="input"
          fluid
        />
      </div>
      <div
        class="flex align-items-center justify-content-between gap-3 p-3 border-1 surface-border border-round-lg"
      >
        <label for="daily-rate-base" class="flex flex-column gap-1">
          <span class="font-medium">{{
            t('rooms.daily-rate-form.use-base-rate')
          }}</span>
          <span class="text-sm text-color-secondary line-height-3">{{
            t('rooms.daily-rate-form.use-base-rate-help')
          }}</span>
        </label>
        <pv-toggle-switch
          v-model="form.useBaseRate"
          input-id="daily-rate-base"
        />
      </div>
      <div v-if="!form.useBaseRate" class="flex flex-column gap-2">
        <label for="daily-rate-amount" class="text-sm font-medium">{{
          t('rooms.daily-rate-form.nightly-rate')
        }}</label>
        <pv-input-number
          v-model="form.amount"
          input-id="daily-rate-amount"
          mode="currency"
          :currency="currency"
          :locale="moneyLocale(currency, locale)"
          :min="0"
          input-class="font-mono"
          required
          fluid
        />
        <small v-if="selectedRoomType" class="text-color-secondary">{{
          t('rooms.daily-rate-form.base-rate', {
            amount: formatMoney(
              selectedRoomType.baseNightlyRate,
              currency,
              locale,
            ),
          })
        }}</small>
      </div>
      <div
        v-if="nightsCount && selectedRoomType"
        class="flex flex-wrap align-items-center justify-content-between gap-2 p-3 surface-50 border-round-lg text-sm"
        aria-live="polite"
      >
        <span>{{
          form.useBaseRate
            ? t('rooms.daily-rate-form.nights-reset', nightsCount)
            : t('rooms.daily-rate-form.nights-updated', nightsCount)
        }}</span>
        <span class="font-semibold"
          >{{ selectedRoomType.name }} · {{ selectedRatePlan?.name }}</span
        >
      </div>
      <pv-message v-if="errorCode" severity="error" icon="pi pi-times-circle">
        {{ t(`rooms.rooms-terms.errors.${errorCode}`) }}
      </pv-message>
    </form>

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <pv-button
          :label="t('rooms.daily-rate-form.cancel')"
          severity="secondary"
          outlined
          rounded
          :disabled="saving"
          @click="visible = false"
        />
        <pv-button
          type="submit"
          form="daily-rate-form"
          :label="t('rooms.daily-rate-form.save')"
          icon="pi pi-check"
          rounded
          :loading="saving"
        />
      </div>
    </template>
  </pv-drawer>
</template>
