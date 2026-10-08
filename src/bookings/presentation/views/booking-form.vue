<script setup>
import { computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue';
import useBookingsStore from '../../application/bookings.store.js';
import useRoomsStore from '../../../rooms/application/rooms.store.js';
import { Booking } from '../../domain/model/booking.entity.js';
import { BookingsError } from '../../domain/model/bookings.error.js';
import {
  CalendarDate,
  formatDayRange,
  formatMoney,
} from '../../../shared/presentation/calendar-format.js';
import BookingsLayout from '../components/bookings-layout.vue';
import BookingStatusTag from '../components/booking-status-tag.vue';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const store = useBookingsStore();
const roomsStore = useRoomsStore();
const { saving } = toRefs(store);
const { roomTypes, ratePlans, currentProperty } = toRefs(roomsStore);
const {
  addBooking,
  updateBooking,
  getBookingById,
  quoteTotal,
  isRoomAvailable,
} = store;
const { getRoomsByRoomType, getRoomTypeById, getRatePlanById } = roomsStore;

const today = CalendarDate.today();
const currentBooking = computed(() =>
  route.params.id ? getBookingById(route.params.id) : null,
);
const isEdit = computed(() => !!route.params.id);
// A duplicated booking is the source of a new booking's guest, guests, room type, and rate plan.
const sourceBooking = computed(() =>
  !isEdit.value && route.query.from ? getBookingById(route.query.from) : null,
);

/**
 * Builds the form state from a booking, or empty values for a new booking.
 * @param {?Booking} booking - Booking to edit.
 * @returns {Object} Form state.
 */
const formFrom = (booking) => ({
  guestName: booking?.guestName ?? '',
  guestEmail: booking?.guestEmail ?? '',
  guestPhone: booking?.guestPhone ?? '',
  preferredLanguage: booking?.preferredLanguage ?? 'es',
  checkIn: booking ? CalendarDate.toDate(booking.checkInDate) : null,
  checkOut: booking ? CalendarDate.toDate(booking.checkOutDate) : null,
  guestRequest: booking?.guestRequest ?? '',
  guests: booking?.guests ?? 2,
  roomTypeId:
    booking?.roomTypeId ??
    roomTypes.value.find((roomType) => roomType.isActive)?.id ??
    null,
  roomId: booking?.roomId ?? null,
  ratePlanId: booking?.ratePlanId ?? null,
});

/**
 * Builds the form state of a new booking from a duplicated one, leaving its stay and room to be chosen again.
 * @param {Booking} booking - Duplicated booking.
 * @returns {Object} Form state.
 */
const formCopiedFrom = (booking) => ({
  ...formFrom(booking),
  checkIn: null,
  checkOut: null,
  roomId: null,
});

/**
 * Builds the form state for the edited, duplicated, or new booking.
 * @returns {Object} Form state.
 */
const initialForm = () =>
  sourceBooking.value
    ? formCopiedFrom(sourceBooking.value)
    : formFrom(currentBooking.value);

const form = ref(initialForm());
const errorCode = ref('');
// Direct visits load the bookings after the form opens; fill the form once the booking arrives.
let formSourceId = (currentBooking.value ?? sourceBooking.value)?.id ?? null;
watch([currentBooking, sourceBooking], ([booking, source]) => {
  const loaded = booking ?? source;
  if (!loaded || loaded.id === formSourceId) return;
  formSourceId = loaded.id;
  form.value = initialForm();
});

const datesSelected = computed(
  () =>
    !!form.value.checkIn &&
    !!form.value.checkOut &&
    form.value.checkOut > form.value.checkIn,
);
// The booking as currently entered, used to quote its price and check room availability.
const draft = computed(
  () =>
    new Booking({
      ...form.value,
      id: currentBooking.value?.id ?? null,
      checkInDate: form.value.checkIn
        ? CalendarDate.fromDate(form.value.checkIn)
        : '',
      checkOutDate: form.value.checkOut
        ? CalendarDate.fromDate(form.value.checkOut)
        : '',
    }),
);
const minCheckOut = computed(() =>
  form.value.checkIn
    ? CalendarDate.toDate(
        CalendarDate.addDays(CalendarDate.fromDate(form.value.checkIn), 1),
      )
    : CalendarDate.toDate(CalendarDate.addDays(today, 1)),
);
const languageOptions = computed(() =>
  Booking.preferredLanguages.map((value) => ({
    value,
    label: t(`bookings.bookings-terms.languages.${value}`),
  })),
);
// Inactive room types and rate plans stay selectable only for the booking that already uses them.
const roomTypeOptions = computed(() =>
  roomTypes.value
    .filter(
      (roomType) =>
        roomType.isActive || roomType.id === currentBooking.value?.roomTypeId,
    )
    .map((roomType) => ({
      roomType,
      id: roomType.id,
      name: roomType.name,
      tooSmall: roomType.capacity < form.value.guests,
    })),
);
const selectedRoomType = computed(() => getRoomTypeById(form.value.roomTypeId));
const roomOptions = computed(() =>
  [...getRoomsByRoomType(form.value.roomTypeId)]
    .sort((a, b) =>
      a.number.localeCompare(b.number, undefined, { numeric: true }),
    )
    .map((room) => ({
      id: room.id,
      number: room.number,
      unavailable:
        datesSelected.value && !isRoomAvailable(room.id, draft.value),
    })),
);
const ratePlanOptions = computed(() =>
  ratePlans.value.filter(
    (ratePlan) =>
      (ratePlan.isActive || ratePlan.id === currentBooking.value?.ratePlanId) &&
      ratePlan.appliesTo(form.value.roomTypeId),
  ),
);
const selectedRatePlan = computed(() => getRatePlanById(form.value.ratePlanId));
const selectedRoomOption = computed(() =>
  roomOptions.value.find((option) => option.id === form.value.roomId),
);
const selectedRoomUnavailable = computed(
  () => selectedRoomOption.value?.unavailable ?? false,
);
const estimatedTotal = computed(() => {
  if (
    !datesSelected.value ||
    !selectedRoomType.value ||
    !selectedRatePlan.value
  )
    return null;
  return currentBooking.value &&
    draft.value.hasSamePricingAs(currentBooking.value)
    ? currentBooking.value.totalAmount
    : quoteTotal(draft.value);
});
const currency = computed(() => currentProperty.value?.currency ?? 'PEN');

// Keep the room type, room, and rate plan consistent with each other and with the guests.
watch(
  roomTypeOptions,
  (options) => {
    if (!form.value.roomTypeId)
      form.value.roomTypeId =
        options.find((option) => !option.tooSmall)?.id ?? null;
  },
  { immediate: true },
);
watch(
  () => form.value.roomTypeId,
  () => {
    if (!roomOptions.value.some((option) => option.id === form.value.roomId))
      form.value.roomId = null;
  },
);
watch(
  ratePlanOptions,
  (options) => {
    if (!options.some((plan) => plan.id === form.value.ratePlanId))
      form.value.ratePlanId = options[0]?.id ?? null;
  },
  { immediate: true },
);
watch(
  () => form.value.checkIn,
  (checkIn) => {
    if (checkIn && form.value.checkOut && form.value.checkOut <= checkIn)
      form.value.checkOut = minCheckOut.value;
  },
);

/**
 * Saves the booking, either by creating a new one or updating the edited one.
 */
const saveBooking = async () => {
  errorCode.value = '';
  if (!datesSelected.value) {
    errorCode.value = 'invalid-stay-dates';
    return;
  }
  try {
    const savedBooking = isEdit.value
      ? await updateBooking(draft.value)
      : await addBooking(draft.value);
    toast.add({
      severity: 'success',
      summary: isEdit.value
        ? t('bookings.booking-form.saved')
        : t('bookings.booking-form.created', { code: savedBooking.code }),
      life: 3000,
    });
    router.push({
      name: 'bookings-booking-detail',
      params: { id: savedBooking.id },
    });
  } catch (error) {
    errorCode.value =
      error instanceof BookingsError ? error.code : 'connection';
  }
};

/**
 * Leaves the form without saving.
 */
const cancel = () => {
  router.push(
    isEdit.value
      ? { name: 'bookings-booking-detail', params: { id: route.params.id } }
      : { name: 'bookings-list' },
  );
};
</script>

<template>
  <bookings-layout>
    <pv-message
      v-if="isEdit && !currentBooking"
      severity="warn"
      icon="pi pi-search"
    >
      <div class="flex flex-column sm:flex-row sm:align-items-center gap-3">
        <span>{{ t('bookings.booking-detail.not-found') }}</span>
        <router-link :to="{ name: 'bookings-list' }" class="font-medium">{{
          t('bookings.booking-detail.back')
        }}</router-link>
      </div>
    </pv-message>

    <template v-else>
      <header
        class="flex flex-column md:flex-row md:align-items-center gap-3 pb-4 border-bottom-1 surface-border"
      >
        <div class="flex align-items-center gap-3 flex-1 min-w-0">
          <pv-avatar
            :icon="isEdit ? 'pi pi-pencil' : 'pi pi-calendar-plus'"
            size="large"
            shape="square"
            class="flex-shrink-0 bg-primary-50 text-primary border-round-lg"
            aria-hidden="true"
          />
          <div class="flex flex-column gap-1 min-w-0">
            <h2 class="m-0 text-2xl font-bold tracking-tight">
              {{
                isEdit
                  ? t('bookings.booking-form.edit-title')
                  : t('bookings.booking-form.new-title')
              }}
            </h2>
            <span
              v-if="currentBooking"
              class="flex flex-wrap align-items-center gap-2 text-sm text-color-secondary"
            >
              <span class="font-mono">{{ currentBooking.code }}</span>
              <span aria-hidden="true">·</span>
              <span>{{ currentBooking.guestName }}</span>
              <booking-status-tag :status="currentBooking.status" />
            </span>
            <span
              v-else-if="sourceBooking"
              class="text-sm text-color-secondary"
              >{{
                t('bookings.booking-form.copied-from', {
                  code: sourceBooking.code,
                })
              }}</span
            >
            <span v-else class="text-sm text-color-secondary">{{
              currentProperty?.name
            }}</span>
          </div>
        </div>
      </header>

      <pv-message
        v-if="currentBooking && !currentBooking.isEditable"
        severity="warn"
        icon="pi pi-lock"
      >
        {{ t('bookings.bookings-terms.errors.not-editable') }}
      </pv-message>

      <form v-else id="booking-form" class="grid" @submit.prevent="saveBooking">
        <div class="col-12 lg:col-8">
          <div
            class="flex flex-column gap-4 h-full p-4 surface-card border-1 surface-border border-round-xl"
          >
            <fieldset class="flex flex-column gap-3 m-0 p-0 border-none">
              <legend
                class="flex align-items-center gap-2 mb-3 p-0 text-base font-semibold"
              >
                <i
                  class="pi pi-id-card text-color-secondary"
                  aria-hidden="true"
                />
                {{ t('bookings.booking-form.guest-information') }}
              </legend>
              <div class="formgrid grid">
                <div class="field col-12 md:col-6 flex flex-column gap-2">
                  <label for="booking-guest-name" class="text-sm font-medium">{{
                    t('bookings.booking-form.full-name')
                  }}</label>
                  <pv-input-text
                    id="booking-guest-name"
                    v-model="form.guestName"
                    :placeholder="
                      t('bookings.booking-form.full-name-placeholder')
                    "
                    autocomplete="off"
                    maxlength="80"
                    required
                    fluid
                  />
                </div>
                <div class="field col-12 md:col-6 flex flex-column gap-2">
                  <label
                    for="booking-guest-email"
                    class="text-sm font-medium"
                    >{{ t('bookings.booking-form.email') }}</label
                  >
                  <pv-input-text
                    id="booking-guest-email"
                    v-model="form.guestEmail"
                    type="email"
                    :placeholder="t('bookings.booking-form.email-placeholder')"
                    autocomplete="off"
                    maxlength="120"
                    required
                    fluid
                  />
                </div>
                <div class="field col-12 md:col-6 flex flex-column gap-2 mb-0">
                  <label
                    for="booking-guest-phone"
                    class="text-sm font-medium"
                    >{{ t('bookings.booking-form.phone') }}</label
                  >
                  <pv-input-text
                    id="booking-guest-phone"
                    v-model="form.guestPhone"
                    type="tel"
                    :placeholder="t('bookings.booking-form.phone-placeholder')"
                    autocomplete="off"
                    maxlength="30"
                    fluid
                  />
                </div>
                <div class="field col-12 md:col-6 flex flex-column gap-2 mb-0">
                  <label for="booking-language" class="text-sm font-medium">{{
                    t('bookings.booking-form.language')
                  }}</label>
                  <pv-select
                    v-model="form.preferredLanguage"
                    input-id="booking-language"
                    :options="languageOptions"
                    option-label="label"
                    option-value="value"
                    fluid
                  />
                </div>
              </div>
            </fieldset>

            <fieldset class="flex flex-column gap-3 m-0 p-0 border-none">
              <legend
                class="flex align-items-center gap-2 mb-3 p-0 text-base font-semibold"
              >
                <i
                  class="pi pi-calendar text-color-secondary"
                  aria-hidden="true"
                />
                {{ t('bookings.booking-form.stay') }}
              </legend>
              <div class="formgrid grid">
                <div class="field col-12 md:col-6 flex flex-column gap-2 mb-0">
                  <label for="booking-check-in" class="text-sm font-medium">{{
                    t('bookings.booking-form.check-in')
                  }}</label>
                  <pv-date-picker
                    v-model="form.checkIn"
                    input-id="booking-check-in"
                    :min-date="isEdit ? null : CalendarDate.toDate(today)"
                    :manual-input="false"
                    :placeholder="t('bookings.booking-form.date-placeholder')"
                    show-icon
                    icon-display="input"
                    required
                    fluid
                  />
                </div>
                <div class="field col-12 md:col-6 flex flex-column gap-2 mb-0">
                  <label for="booking-check-out" class="text-sm font-medium">{{
                    t('bookings.booking-form.check-out')
                  }}</label>
                  <pv-date-picker
                    v-model="form.checkOut"
                    input-id="booking-check-out"
                    :min-date="minCheckOut"
                    :manual-input="false"
                    :placeholder="t('bookings.booking-form.date-placeholder')"
                    show-icon
                    icon-display="input"
                    required
                    fluid
                  />
                </div>
              </div>
              <small class="text-color-secondary">{{
                datesSelected
                  ? t('bookings.bookings-terms.nights', draft.nights.length)
                  : t('bookings.booking-form.dates-help')
              }}</small>
            </fieldset>

            <fieldset class="flex flex-column gap-3 m-0 p-0 border-none">
              <legend
                class="flex align-items-center gap-2 mb-3 p-0 text-base font-semibold"
              >
                <i
                  class="pi pi-comment text-color-secondary"
                  aria-hidden="true"
                />
                <label for="booking-request">{{
                  t('bookings.booking-form.guest-request')
                }}</label>
              </legend>
              <pv-textarea
                id="booking-request"
                v-model="form.guestRequest"
                :placeholder="t('bookings.booking-form.request-placeholder')"
                rows="3"
                maxlength="300"
                auto-resize
                fluid
              />
            </fieldset>
          </div>
        </div>

        <aside class="col-12 lg:col-4">
          <div
            class="flex flex-column gap-3 p-4 surface-50 border-1 surface-border border-round-xl"
          >
            <h3
              class="flex align-items-center gap-2 m-0 text-base font-semibold"
            >
              <i class="pi pi-key text-color-secondary" aria-hidden="true" />
              {{ t('bookings.booking-form.room-and-rate') }}
            </h3>
            <div class="flex flex-column gap-2">
              <label for="booking-guests" class="text-sm font-medium">{{
                t('bookings.booking-form.guests')
              }}</label>
              <pv-input-number
                v-model="form.guests"
                input-id="booking-guests"
                :min="1"
                :max="12"
                show-buttons
                button-layout="horizontal"
                :locale="locale"
                required
                fluid
              />
            </div>
            <div class="flex flex-column gap-2">
              <label for="booking-room-type" class="text-sm font-medium">{{
                t('bookings.booking-form.room-type')
              }}</label>
              <pv-select
                v-model="form.roomTypeId"
                input-id="booking-room-type"
                :options="roomTypeOptions"
                option-label="name"
                option-value="id"
                option-disabled="tooSmall"
                :placeholder="t('bookings.booking-form.room-type-placeholder')"
                fluid
              >
                <!-- Show the chosen room type even after the guests exceed its capacity. -->
                <template #value="{ value, placeholder }">
                  <span>{{ getRoomTypeById(value)?.name ?? placeholder }}</span>
                </template>
                <template #option="{ option }">
                  <span
                    class="flex align-items-center justify-content-between gap-3 w-full"
                  >
                    <span>{{ option.name }}</span>
                    <span class="text-sm text-color-secondary">{{
                      t(
                        'bookings.booking-form.capacity',
                        option.roomType.capacity,
                      )
                    }}</span>
                  </span>
                </template>
              </pv-select>
            </div>
            <div class="flex flex-column gap-2">
              <label for="booking-room" class="text-sm font-medium">{{
                t('bookings.booking-form.room')
              }}</label>
              <pv-select
                v-model="form.roomId"
                input-id="booking-room"
                :options="roomOptions"
                option-label="number"
                option-value="id"
                option-disabled="unavailable"
                :placeholder="t('bookings.booking-form.room-placeholder')"
                :empty-message="t('bookings.booking-form.no-rooms')"
                fluid
              >
                <!-- Show the chosen room even when the stay dates make it unavailable. -->
                <template #value="{ value, placeholder }">
                  <span
                    v-if="selectedRoomOption"
                    class="flex align-items-center gap-2"
                  >
                    <span class="font-mono">{{
                      selectedRoomOption.number
                    }}</span>
                    <span
                      v-if="selectedRoomOption.unavailable"
                      class="text-sm text-red-600"
                      >{{ t('bookings.booking-form.unavailable') }}</span
                    >
                  </span>
                  <span v-else>{{ value ? '—' : placeholder }}</span>
                </template>
                <template #option="{ option }">
                  <span
                    class="flex align-items-center justify-content-between gap-3 w-full"
                  >
                    <span class="font-mono">{{ option.number }}</span>
                    <span
                      v-if="option.unavailable"
                      class="text-sm text-color-secondary"
                      >{{ t('bookings.booking-form.unavailable') }}</span
                    >
                  </span>
                </template>
              </pv-select>
              <small v-if="!datesSelected" class="text-color-secondary">{{
                t('bookings.booking-form.room-help')
              }}</small>
            </div>
            <div class="flex flex-column gap-2">
              <label for="booking-rate-plan" class="text-sm font-medium">{{
                t('bookings.booking-form.rate-plan')
              }}</label>
              <pv-select
                v-model="form.ratePlanId"
                input-id="booking-rate-plan"
                :options="ratePlanOptions"
                option-label="name"
                option-value="id"
                :placeholder="t('bookings.booking-form.rate-plan-placeholder')"
                :empty-message="t('bookings.booking-form.no-rate-plans')"
                fluid
              />
            </div>

            <pv-message
              v-if="selectedRoomUnavailable"
              severity="error"
              icon="pi pi-calendar-times"
            >
              <div class="flex flex-column gap-1">
                <span class="font-semibold">{{
                  t('bookings.booking-form.room-unavailable-title')
                }}</span>
                <span>{{
                  t('bookings.bookings-terms.errors.room-unavailable')
                }}</span>
              </div>
            </pv-message>

            <pv-divider class="m-0" />
            <div
              class="flex align-items-end justify-content-between gap-3"
              aria-live="polite"
            >
              <span class="flex flex-column gap-1 text-sm text-color-secondary">
                <span v-if="datesSelected">
                  {{
                    formatDayRange(
                      draft.checkInDate,
                      draft.checkOutDate,
                      locale,
                    )
                  }}
                  ·
                  {{ t('bookings.bookings-terms.nights', draft.nights.length) }}
                </span>
                <span>{{ selectedRatePlan?.name }}</span>
              </span>
              <span class="flex flex-column align-items-end gap-1">
                <span class="text-sm text-color-secondary">{{
                  t('bookings.booking-form.estimated-total')
                }}</span>
                <span class="font-mono text-2xl font-semibold">{{
                  estimatedTotal === null
                    ? '—'
                    : formatMoney(estimatedTotal, currency, locale)
                }}</span>
              </span>
            </div>
          </div>
        </aside>

        <div class="col-12">
          <pv-message
            v-if="errorCode && errorCode !== 'room-unavailable'"
            severity="error"
            icon="pi pi-times-circle"
            class="mb-3"
          >
            {{ t(`bookings.bookings-terms.errors.${errorCode}`) }}
          </pv-message>
          <div
            class="flex justify-content-end gap-2 pt-3 border-top-1 surface-border"
          >
            <pv-button
              :label="t('bookings.booking-form.cancel')"
              severity="secondary"
              outlined
              rounded
              :disabled="saving"
              @click="cancel"
            />
            <pv-button
              type="submit"
              :label="
                isEdit
                  ? t('bookings.booking-form.save')
                  : t('bookings.booking-form.create')
              "
              :icon="isEdit ? 'pi pi-check' : 'pi pi-plus'"
              rounded
              :loading="saving"
              :disabled="selectedRoomUnavailable"
            />
          </div>
        </div>
      </form>
    </template>
  </bookings-layout>
</template>
