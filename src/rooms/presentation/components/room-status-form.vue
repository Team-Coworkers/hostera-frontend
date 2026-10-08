<script setup>
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import useRoomsStore from '../../application/rooms.store.js';
import { RoomsError } from '../../domain/model/rooms.error.js';
import { SetRoomStatusCommand } from '../../domain/set-room-status.command.js';
import {
  CalendarDate,
  formatDayRange,
} from '../../../shared/presentation/calendar-format.js';
import DayStatusTag from './day-status-tag.vue';

const props = defineProps({
  room: { type: Object, required: true },
  date: { type: String, required: true },
});
const visible = defineModel('visible', { type: Boolean });
const emit = defineEmits(['saved']);

const { t, locale } = useI18n();
const store = useRoomsStore();
const { saving } = toRefs(store);
const { setRoomStatus, getStatusPeriodOn } = store;

const currentStatusPeriod = computed(() =>
  getStatusPeriodOn(props.room.id, props.date),
);
const form = ref({
  status: currentStatusPeriod.value ? 'available' : 'blocked',
  dates: [CalendarDate.toDate(props.date), CalendarDate.toDate(props.date)],
  reason: '',
});
const errorCode = ref('');
const statusIcons = {
  available: 'pi pi-check',
  blocked: 'pi pi-ban',
  'out-of-service': 'pi pi-wrench',
  'needs-cleaning': 'pi pi-sparkles',
};
const statusOptions = computed(() =>
  SetRoomStatusCommand.statuses.map((value) => ({
    value,
    icon: statusIcons[value],
    label: t(`rooms.rooms-terms.day-statuses.${value}`),
  })),
);
const releasing = computed(() => form.value.status === 'available');

/**
 * Applies the requested status to the selected date range.
 */
const saveStatus = async () => {
  errorCode.value = '';
  const [start, end] = form.value.dates ?? [];
  if (!start) {
    errorCode.value = 'invalid-date-range';
    return;
  }
  try {
    await setRoomStatus(
      new SetRoomStatusCommand({
        roomId: props.room.id,
        status: form.value.status,
        startDate: CalendarDate.fromDate(start),
        endDate: CalendarDate.fromDate(end ?? start),
        reason: releasing.value ? '' : form.value.reason,
      }),
    );
    emit('saved');
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
          t('rooms.room-status-form.title')
        }}</span>
        <span class="text-sm text-color-secondary">{{
          t('rooms.rooms-terms.room-number', { number: room.number })
        }}</span>
      </div>
    </template>

    <form
      id="room-status-form"
      class="flex flex-column gap-3"
      @submit.prevent="saveStatus"
    >
      <div
        v-if="currentStatusPeriod"
        class="flex flex-column gap-2 p-3 surface-50 border-1 surface-border border-round-lg"
      >
        <span class="text-sm text-color-secondary">{{
          t('rooms.room-status-form.current')
        }}</span>
        <div class="flex flex-wrap align-items-center gap-2">
          <day-status-tag :status="currentStatusPeriod.status" />
          <span class="text-sm">{{
            formatDayRange(
              currentStatusPeriod.startDate,
              currentStatusPeriod.endDate,
              locale,
            )
          }}</span>
        </div>
        <span class="line-height-3">{{ currentStatusPeriod.reason }}</span>
      </div>

      <div class="flex flex-column gap-2">
        <label for="room-status" class="text-sm font-medium">{{
          t('rooms.room-status-form.status')
        }}</label>
        <pv-select
          v-model="form.status"
          input-id="room-status"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          fluid
        >
          <template #value="{ value }">
            <span class="flex align-items-center gap-2">
              <i :class="statusIcons[value]" aria-hidden="true" />
              <span>{{ t(`rooms.rooms-terms.day-statuses.${value}`) }}</span>
            </span>
          </template>
          <template #option="{ option }">
            <span class="flex align-items-center gap-2">
              <i :class="option.icon" aria-hidden="true" />
              <span>{{ option.label }}</span>
            </span>
          </template>
        </pv-select>
        <small class="text-color-secondary line-height-3">{{
          t(`rooms.room-status-form.help.${form.status}`)
        }}</small>
      </div>
      <div class="flex flex-column gap-2">
        <label for="room-status-dates" class="text-sm font-medium">{{
          t('rooms.room-status-form.dates')
        }}</label>
        <pv-date-picker
          v-model="form.dates"
          input-id="room-status-dates"
          selection-mode="range"
          :manual-input="false"
          show-icon
          icon-display="input"
          fluid
        />
        <small class="text-color-secondary">{{
          t('rooms.room-status-form.dates-help')
        }}</small>
      </div>
      <div v-if="!releasing" class="flex flex-column gap-2">
        <label for="room-status-reason" class="text-sm font-medium">{{
          t('rooms.room-status-form.reason')
        }}</label>
        <pv-textarea
          id="room-status-reason"
          v-model="form.reason"
          :placeholder="t('rooms.room-status-form.reason-placeholder')"
          rows="3"
          maxlength="200"
          required
          auto-resize
          fluid
        />
      </div>
      <pv-message
        size="small"
        severity="secondary"
        variant="simple"
        icon="pi pi-lock"
      >
        {{ t('rooms.room-status-form.booking-note') }}
      </pv-message>
      <pv-message v-if="errorCode" severity="error" icon="pi pi-times-circle">
        {{ t(`rooms.rooms-terms.errors.${errorCode}`) }}
      </pv-message>
    </form>

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <pv-button
          :label="t('rooms.room-status-form.cancel')"
          severity="secondary"
          outlined
          rounded
          :disabled="saving"
          @click="visible = false"
        />
        <pv-button
          type="submit"
          form="room-status-form"
          :label="t('rooms.room-status-form.save')"
          icon="pi pi-check"
          rounded
          :loading="saving"
        />
      </div>
    </template>
  </pv-drawer>
</template>
