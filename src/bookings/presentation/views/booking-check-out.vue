<script setup>
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue';
import useBookingsStore from '../../application/bookings.store.js';
import useRoomsStore from '../../../rooms/application/rooms.store.js';
import useAccessControlStore from '../../../access-control/application/access-control.store.js';
import { Booking } from '../../domain/model/booking.entity.js';
import { BookingsError } from '../../domain/model/bookings.error.js';
import { CheckOutBookingCommand } from '../../domain/check-out-booking.command.js';
import {
  CalendarDate,
  formatDateTime,
  formatDayRange,
  formatMoney,
} from '../../../shared/presentation/calendar-format.js';
import BookingsLayout from '../components/bookings-layout.vue';
import BookingStatusTag from '../components/booking-status-tag.vue';
import BookingPaymentSummary from '../components/booking-payment-summary.vue';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const store = useBookingsStore();
const roomsStore = useRoomsStore();
const accessControlStore = useAccessControlStore();
const { saving } = toRefs(store);
const { getBookingById, getBalanceDue, checkOutBooking } = store;

const today = CalendarDate.today();
const departure = new Date().toISOString();
const form = ref({ roomCondition: 'no-issues', note: '' });
const errorCode = ref('');
const usableKeyCards = computed(() =>
  booking.value
    ? accessControlStore
        .getKeyCardsOfBooking(booking.value.id)
        .filter((keyCard) => keyCard.isUsableAt(departure))
    : [],
);

const booking = computed(() => getBookingById(route.params.id));
const room = computed(() => roomsStore.getRoomById(booking.value?.roomId));
const roomType = computed(() =>
  roomsStore.getRoomTypeById(booking.value?.roomTypeId),
);
const currency = computed(() => roomsStore.currentProperty?.currency ?? 'PEN');
const balanceDue = computed(() =>
  booking.value ? getBalanceDue(booking.value) : 0,
);
// Leaving before the check-out day frees the remaining nights; the saved total does not change.
const earlyDeparture = computed(
  () => !!booking.value && today < booking.value.checkOutDate,
);
const roomConditionIcons = {
  'no-issues': 'pi pi-check-circle',
  'needs-attention': 'pi pi-exclamation-triangle',
};
const roomConditionOptions = computed(() =>
  Booking.roomConditions.map((value) => ({
    value,
    icon: roomConditionIcons[value],
    label: t(`bookings.bookings-terms.room-conditions.${value}`),
  })),
);
const detailRoute = computed(() => ({
  name: 'bookings-booking-detail',
  params: { id: route.params.id },
}));
const breadcrumbItems = computed(() => [
  {
    label: t('bookings.booking-detail.bookings'),
    route: { name: 'bookings-list' },
  },
  { label: booking.value?.code, route: detailRoute.value, mono: true },
  { label: t('bookings.booking-check-out.breadcrumb') },
]);

/**
 * Completes the check-out and returns to the booking.
 */
const completeCheckOut = async () => {
  errorCode.value = '';
  try {
    await checkOutBooking(
      new CheckOutBookingCommand({
        bookingId: booking.value.id,
        roomCondition: form.value.roomCondition,
        note: form.value.note,
      }),
    );
    toast.add({
      severity: 'success',
      summary: t('bookings.booking-check-out.completed', {
        name: booking.value.guestName,
      }),
      life: 4000,
    });
    router.push(detailRoute.value);
  } catch (error) {
    errorCode.value =
      error instanceof BookingsError ? error.code : 'connection';
  }
};
</script>

<template>
  <bookings-layout>
    <pv-message v-if="!booking" severity="warn" icon="pi pi-search">
      <div class="flex flex-column sm:flex-row sm:align-items-center gap-3">
        <span>{{ t('bookings.booking-detail.not-found') }}</span>
        <router-link :to="{ name: 'bookings-list' }" class="font-medium">{{
          t('bookings.booking-detail.back')
        }}</router-link>
      </div>
    </pv-message>

    <template v-else>
      <pv-breadcrumb :model="breadcrumbItems" class="p-0 bg-transparent">
        <template #item="{ item }">
          <router-link
            v-if="item.route"
            :to="item.route"
            :class="[
              'text-color-secondary hover:text-primary',
              { 'font-mono': item.mono },
            ]"
            >{{ item.label }}</router-link
          >
          <span v-else class="font-medium">{{ item.label }}</span>
        </template>
      </pv-breadcrumb>

      <header
        class="flex align-items-center gap-3 pb-4 border-bottom-1 surface-border"
      >
        <pv-avatar
          icon="pi pi-sign-out"
          size="large"
          shape="square"
          class="flex-shrink-0 bg-primary-50 text-primary border-round-lg"
          aria-hidden="true"
        />
        <div class="flex flex-column gap-1 min-w-0">
          <h2 class="m-0 text-2xl font-bold tracking-tight">
            {{
              t('bookings.booking-check-out.title', { name: booking.guestName })
            }}
          </h2>
          <span class="text-sm text-color-secondary">
            {{
              t('bookings.bookings-terms.room-number', {
                number: room?.number ?? '—',
              })
            }}
            ·
            {{
              formatDayRange(booking.checkInDate, booking.checkOutDate, locale)
            }}
          </span>
        </div>
      </header>

      <pv-message
        v-if="!booking.canBeCheckedOut"
        severity="warn"
        icon="pi pi-lock"
      >
        <div class="flex flex-column sm:flex-row sm:align-items-center gap-3">
          <span>{{ t('bookings.booking-check-out.checked-in-only') }}</span>
          <router-link :to="detailRoute" class="font-medium">{{
            t('bookings.booking-check-in.back-to-booking')
          }}</router-link>
        </div>
      </pv-message>

      <form
        v-else
        id="check-out-form"
        class="grid"
        @submit.prevent="completeCheckOut"
      >
        <div class="col-12 lg:col-8 flex flex-column gap-3">
          <div
            class="flex flex-column gap-4 p-4 surface-card border-1 surface-border border-round-xl"
          >
            <h3
              class="flex align-items-center gap-2 m-0 text-base font-semibold"
            >
              <i
                class="pi pi-list-check text-color-secondary"
                aria-hidden="true"
              />
              {{ t('bookings.booking-check-out.review') }}
            </h3>
            <dl
              class="grid grid-nogutter m-0 border-1 surface-border border-round-lg overflow-hidden"
            >
              <div class="col-12 md:col-4 flex flex-column gap-1 p-3">
                <dt class="text-sm text-color-secondary">
                  {{ t('bookings.booking-check-out.departure') }}
                </dt>
                <dd class="m-0 font-semibold">
                  {{ formatDateTime(departure, locale) }}
                </dd>
              </div>
              <div
                class="col-12 md:col-4 flex flex-column gap-1 p-3 border-top-1 md:border-top-none md:border-left-1 surface-border"
              >
                <dt class="text-sm text-color-secondary">
                  {{ t('bookings.booking-detail.room') }}
                </dt>
                <dd class="m-0 font-semibold">
                  <span class="font-mono">{{ room?.number ?? '—' }}</span> ·
                  {{ roomType?.name }}
                </dd>
              </div>
              <div
                class="col-12 md:col-4 flex flex-column gap-1 p-3 border-top-1 md:border-top-none md:border-left-1 surface-border"
              >
                <dt class="text-sm text-color-secondary">
                  {{ t('bookings.booking-payment-summary.balance') }}
                </dt>
                <dd
                  :class="[
                    'm-0 font-mono font-semibold',
                    { 'text-red-600': balanceDue > 0 },
                  ]"
                >
                  {{ formatMoney(balanceDue, currency, locale) }}
                </dd>
              </div>
            </dl>
            <pv-message
              v-if="earlyDeparture"
              severity="info"
              size="small"
              icon="pi pi-info-circle"
            >
              {{ t('bookings.booking-check-out.early') }}
            </pv-message>
            <div class="flex flex-column gap-2">
              <label for="check-out-condition" class="text-sm font-medium">{{
                t('bookings.booking-check-out.room-condition')
              }}</label>
              <pv-select
                v-model="form.roomCondition"
                input-id="check-out-condition"
                :options="roomConditionOptions"
                option-label="label"
                option-value="value"
                fluid
              >
                <template #value="{ value }">
                  <span class="flex align-items-center gap-2">
                    <i :class="roomConditionIcons[value]" aria-hidden="true" />
                    {{ t(`bookings.bookings-terms.room-conditions.${value}`) }}
                  </span>
                </template>
                <template #option="{ option }">
                  <span class="flex align-items-center gap-2">
                    <i :class="option.icon" aria-hidden="true" />
                    {{ option.label }}
                  </span>
                </template>
              </pv-select>
              <small
                v-if="form.roomCondition === 'needs-attention'"
                class="text-color-secondary line-height-3"
                >{{ t('bookings.booking-check-out.attention-help') }}
                <router-link
                  v-if="room"
                  :to="{ name: 'rooms-room-detail', params: { id: room.id } }"
                  class="font-medium"
                  >{{ t('bookings.booking-detail.view-room') }}</router-link
                ></small
              >
            </div>
            <div class="flex flex-column gap-2">
              <label for="check-out-note" class="text-sm font-medium">{{
                t('bookings.booking-check-out.note')
              }}</label>
              <pv-textarea
                id="check-out-note"
                v-model="form.note"
                :placeholder="t('bookings.booking-check-out.note-placeholder')"
                rows="2"
                maxlength="200"
                auto-resize
                fluid
              />
            </div>
            <pv-message
              v-if="balanceDue > 0"
              severity="warn"
              icon="pi pi-wallet"
            >
              <div class="flex flex-column gap-1">
                <span class="font-semibold">{{
                  t('bookings.booking-check-out.balance-title')
                }}</span>
                <span>{{ t('bookings.booking-check-out.balance-text') }}</span>
              </div>
            </pv-message>
          </div>
          <div
            v-if="balanceDue > 0"
            class="p-4 surface-card border-1 surface-border border-round-xl"
          >
            <booking-payment-summary :booking="booking" />
          </div>
        </div>

        <aside class="col-12 lg:col-4">
          <div
            class="flex flex-column gap-3 p-4 surface-50 border-1 surface-border border-round-xl"
          >
            <h3
              class="flex align-items-center gap-2 m-0 text-base font-semibold"
            >
              <i
                class="pi pi-arrow-right-arrow-left text-color-secondary"
                aria-hidden="true"
              />
              {{ t('bookings.booking-check-out.changes') }}
            </h3>
            <dl class="flex flex-column gap-3 m-0">
              <div
                class="flex align-items-center justify-content-between gap-2"
              >
                <dt class="text-color-secondary">
                  {{ t('bookings.booking-check-out.booking') }}
                </dt>
                <dd class="m-0 flex align-items-center gap-2">
                  <booking-status-tag status="checked-in" />
                  <i class="pi pi-arrow-right text-xs" aria-hidden="true" />
                  <booking-status-tag status="checked-out" />
                </dd>
              </div>
              <div
                class="flex align-items-center justify-content-between gap-2"
              >
                <dt class="text-color-secondary">
                  {{
                    t('bookings.bookings-terms.room-number', {
                      number: room?.number ?? '—',
                    })
                  }}
                </dt>
                <dd class="m-0 text-right font-medium">
                  {{ t('bookings.booking-check-out.room-released') }}
                </dd>
              </div>
              <div
                v-if="usableKeyCards.length"
                class="flex align-items-center justify-content-between gap-2"
              >
                <dt class="text-color-secondary">
                  {{ t('bookings.booking-check-out.key-cards') }}
                </dt>
                <dd class="m-0 text-right font-medium text-red-600">
                  {{
                    t(
                      'bookings.booking-check-out.key-cards-ended',
                      usableKeyCards.length,
                    )
                  }}
                </dd>
              </div>
              <div
                class="flex align-items-center justify-content-between gap-2"
              >
                <dt class="text-color-secondary">
                  {{ t('bookings.booking-payment-summary.title') }}
                </dt>
                <dd
                  :class="[
                    'm-0 font-medium',
                    balanceDue > 0 ? 'text-red-600' : 'text-green-700',
                  ]"
                >
                  {{
                    balanceDue > 0
                      ? t('bookings.booking-check-out.outstanding')
                      : t('bookings.bookings-terms.payment-statuses.paid')
                  }}
                </dd>
              </div>
            </dl>
          </div>
        </aside>

        <div class="col-12">
          <pv-message
            v-if="errorCode"
            severity="error"
            icon="pi pi-times-circle"
            class="mb-3"
          >
            {{ t(`bookings.bookings-terms.errors.${errorCode}`) }}
          </pv-message>
          <div class="flex justify-content-between gap-2">
            <router-link v-slot="{ navigate }" :to="detailRoute" custom>
              <pv-button
                :label="t('bookings.booking-check-in.back')"
                severity="secondary"
                outlined
                rounded
                :disabled="saving"
                @click="navigate"
              />
            </router-link>
            <pv-button
              type="submit"
              :label="t('bookings.booking-check-out.complete')"
              icon="pi pi-check"
              rounded
              :loading="saving"
              :disabled="balanceDue > 0"
            />
          </div>
        </div>
      </form>
    </template>
  </bookings-layout>
</template>
