<script setup>
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import useBookingsStore from '../../application/bookings.store.js';
import useRoomsStore from '../../../rooms/application/rooms.store.js';
import { BookingsError } from '../../domain/model/bookings.error.js';
import {
  formatDay,
  formatDayRange,
} from '../../../shared/presentation/calendar-format.js';

const props = defineProps({
  booking: { type: Object, required: true },
  action: {
    type: String,
    required: true,
    validator: (value) => ['confirm', 'no-show'].includes(value),
  },
});
const visible = defineModel('visible', { type: Boolean });
const emit = defineEmits(['saved']);

const { t, locale } = useI18n();
const store = useBookingsStore();
const roomsStore = useRoomsStore();
const { saving } = toRefs(store);
const { confirmBooking, markNoShow } = store;

const errorCode = ref('');
const room = computed(() => roomsStore.getRoomById(props.booking.roomId));
const roomType = computed(() =>
  roomsStore.getRoomTypeById(props.booking.roomTypeId),
);
const key = computed(() => `bookings.booking-status-dialog.${props.action}`);
const facts = computed(() => [
  {
    label: t('bookings.booking-status-dialog.guest'),
    value: props.booking.guestName,
  },
  props.action === 'confirm'
    ? {
        label: t('bookings.booking-status-dialog.stay'),
        value: `${formatDayRange(
          props.booking.checkInDate,
          props.booking.checkOutDate,
          locale.value,
        )} · ${t('bookings.bookings-terms.nights', props.booking.nights.length)}`,
      }
    : {
        label: t('bookings.booking-status-dialog.expected-arrival'),
        value: formatDay(props.booking.checkInDate, locale.value, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
      },
  {
    label: t('bookings.booking-status-dialog.room'),
    value: `${room.value?.number ?? '—'} · ${roomType.value?.name ?? ''}`,
  },
]);

/**
 * Applies the status change and closes the dialog.
 */
const apply = async () => {
  errorCode.value = '';
  try {
    const savedBooking =
      props.action === 'confirm'
        ? await confirmBooking(props.booking.id)
        : await markNoShow(props.booking.id);
    emit('saved', savedBooking);
    visible.value = false;
  } catch (error) {
    errorCode.value =
      error instanceof BookingsError ? error.code : 'connection';
  }
};
</script>

<template>
  <pv-dialog
    v-model:visible="visible"
    modal
    :header="t(`${key}.title`)"
    :draggable="false"
    :closable="!saving"
    class="w-full mx-3"
    style="max-width: 30rem"
  >
    <div class="flex flex-column gap-3">
      <p class="m-0 text-color-secondary line-height-3">
        {{ t(`${key}.subtitle`) }}
      </p>
      <dl
        class="flex flex-column gap-2 m-0 p-3 surface-50 border-1 surface-border border-round-lg"
      >
        <div
          v-for="fact in facts"
          :key="fact.label"
          class="flex justify-content-between gap-3"
        >
          <dt class="text-color-secondary">{{ fact.label }}</dt>
          <dd class="m-0 text-right font-medium">{{ fact.value }}</dd>
        </div>
      </dl>
      <pv-message
        :severity="action === 'confirm' ? 'info' : 'warn'"
        :icon="
          action === 'confirm'
            ? 'pi pi-info-circle'
            : 'pi pi-exclamation-triangle'
        "
      >
        {{ t(`${key}.note`, { number: room?.number ?? '—' }) }}
      </pv-message>
      <pv-message v-if="errorCode" severity="error" icon="pi pi-times-circle">
        {{ t(`bookings.bookings-terms.errors.${errorCode}`) }}
      </pv-message>
    </div>
    <template #footer>
      <pv-button
        :label="t('bookings.booking-status-dialog.back')"
        severity="secondary"
        outlined
        rounded
        :disabled="saving"
        @click="visible = false"
      />
      <pv-button
        :label="t(`${key}.submit`)"
        :severity="action === 'confirm' ? undefined : 'danger'"
        :icon="action === 'confirm' ? 'pi pi-check' : 'pi pi-user-minus'"
        rounded
        autofocus
        :loading="saving"
        @click="apply"
      />
    </template>
  </pv-dialog>
</template>
