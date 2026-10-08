<script setup>
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import useBookingsStore from '../../application/bookings.store.js';
import useRoomsStore from '../../../rooms/application/rooms.store.js';
import { Booking } from '../../domain/model/booking.entity.js';
import { BookingsError } from '../../domain/model/bookings.error.js';
import { CancelBookingCommand } from '../../domain/cancel-booking.command.js';
import { formatDayRange } from '../../../shared/presentation/calendar-format.js';

const props = defineProps({
  booking: { type: Object, required: true },
});
const visible = defineModel('visible', { type: Boolean });
const emit = defineEmits(['saved']);

const { t, locale } = useI18n();
const store = useBookingsStore();
const roomsStore = useRoomsStore();
const { saving } = toRefs(store);
const { cancelBooking } = store;

const form = ref({ reason: 'guest-request', note: '' });
const errorCode = ref('');
const room = computed(() => roomsStore.getRoomById(props.booking.roomId));
const reasonOptions = computed(() =>
  Booking.cancellationReasons.map((value) => ({
    value,
    label: t(`bookings.bookings-terms.cancellation-reasons.${value}`),
  })),
);
const noteRequired = computed(() => form.value.reason === 'other');

/**
 * Cancels the booking with the chosen reason and closes the dialog.
 */
const cancel = async () => {
  errorCode.value = '';
  try {
    const savedBooking = await cancelBooking(
      new CancelBookingCommand({
        bookingId: props.booking.id,
        reason: form.value.reason,
        note: form.value.note,
      }),
    );
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
    :header="t('bookings.booking-cancel-dialog.title')"
    :draggable="false"
    :closable="!saving"
    class="w-full mx-3"
    style="max-width: 32rem"
  >
    <form
      id="booking-cancel-form"
      class="flex flex-column gap-3"
      @submit.prevent="cancel"
    >
      <p class="m-0 text-color-secondary">
        {{ booking.guestName }} ·
        {{ formatDayRange(booking.checkInDate, booking.checkOutDate, locale) }}
        ·
        {{
          t('bookings.bookings-terms.room-number', {
            number: room?.number ?? '—',
          })
        }}
      </p>
      <div class="flex flex-column gap-2">
        <label for="booking-cancel-reason" class="text-sm font-medium">{{
          t('bookings.booking-cancel-dialog.reason')
        }}</label>
        <pv-select
          v-model="form.reason"
          input-id="booking-cancel-reason"
          :options="reasonOptions"
          option-label="label"
          option-value="value"
          fluid
        />
      </div>
      <div class="flex flex-column gap-2">
        <label for="booking-cancel-note" class="text-sm font-medium">{{
          noteRequired
            ? t('bookings.booking-cancel-dialog.note-required')
            : t('bookings.booking-cancel-dialog.note')
        }}</label>
        <pv-textarea
          id="booking-cancel-note"
          v-model="form.note"
          :placeholder="t('bookings.booking-cancel-dialog.note-placeholder')"
          :required="noteRequired"
          rows="2"
          maxlength="200"
          auto-resize
          fluid
        />
      </div>
      <pv-message severity="warn" icon="pi pi-exclamation-triangle">
        {{
          t('bookings.booking-cancel-dialog.release', {
            number: room?.number ?? '—',
          })
        }}
      </pv-message>
      <pv-message v-if="errorCode" severity="error" icon="pi pi-times-circle">
        {{ t(`bookings.bookings-terms.errors.${errorCode}`) }}
      </pv-message>
    </form>
    <template #footer>
      <pv-button
        :label="t('bookings.booking-cancel-dialog.keep')"
        severity="secondary"
        outlined
        rounded
        :disabled="saving"
        @click="visible = false"
      />
      <pv-button
        type="submit"
        form="booking-cancel-form"
        :label="t('bookings.booking-cancel-dialog.submit')"
        severity="danger"
        icon="pi pi-times"
        rounded
        :loading="saving"
      />
    </template>
  </pv-dialog>
</template>
