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
import { CheckInBookingCommand } from '../../domain/check-in-booking.command.js';
import {
  CalendarDate,
  formatDateTime,
  formatDayRange,
} from '../../../shared/presentation/calendar-format.js';
import BookingsLayout from '../components/bookings-layout.vue';
import BookingPaymentSummary from '../components/booking-payment-summary.vue';
import PaymentStatusTag from '../components/payment-status-tag.vue';
import RfidEncoderPanel from '../../../access-control/presentation/components/rfid-encoder-panel.vue';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const store = useBookingsStore();
const roomsStore = useRoomsStore();
const accessControlStore = useAccessControlStore();
const { saving } = toRefs(store);
const { getBookingById, getBalanceDue, getPaymentStatus, checkInBooking } =
  store;

const today = CalendarDate.today();
const step = ref('1');
const form = ref({ documentType: 'dni', documentNumber: '', verified: false });
const errorCode = ref('');
// Cards are written on the encoder during the check-in and registered when it completes.
const keyCardIds = ref([]);

const booking = computed(() => getBookingById(route.params.id));
const room = computed(() => roomsStore.getRoomById(booking.value?.roomId));
const roomType = computed(() =>
  roomsStore.getRoomTypeById(booking.value?.roomTypeId),
);
const accessEnd = computed(() =>
  booking.value
    ? formatDateTime(
        accessControlStore.guestAccessEnd(booking.value.checkOutDate),
        locale.value,
      )
    : '',
);
const identityComplete = computed(
  () => !!form.value.documentNumber.trim() && form.value.verified,
);
const documentTypeOptions = computed(() =>
  Booking.documentTypes.map((value) => ({
    value,
    label: t(`bookings.bookings-terms.document-types.${value}`),
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
  { label: t('bookings.booking-check-in.breadcrumb') },
]);

/**
 * Completes the check-in and returns to the booking.
 */
const completeCheckIn = async () => {
  errorCode.value = '';
  try {
    await checkInBooking(
      new CheckInBookingCommand({
        bookingId: booking.value.id,
        documentType: form.value.documentType,
        documentNumber: form.value.documentNumber,
        documentVerified: form.value.verified,
        keyCardIds: keyCardIds.value,
      }),
    );
    toast.add({
      severity: 'success',
      summary: t('bookings.booking-check-in.completed', {
        name: booking.value.guestName,
        number: room.value?.number ?? '—',
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
          icon="pi pi-sign-in"
          size="large"
          shape="square"
          class="flex-shrink-0 bg-primary-50 text-primary border-round-lg"
          aria-hidden="true"
        />
        <div class="flex flex-column gap-1 min-w-0">
          <h2 class="m-0 text-2xl font-bold tracking-tight">
            {{
              t('bookings.booking-check-in.title', { name: booking.guestName })
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
        v-if="!booking.canBeCheckedIn(today)"
        severity="warn"
        icon="pi pi-lock"
      >
        <div class="flex flex-column sm:flex-row sm:align-items-center gap-3">
          <span>{{
            booking.status === 'confirmed'
              ? t('bookings.booking-check-in.not-today')
              : t('bookings.booking-check-in.confirmed-only')
          }}</span>
          <router-link :to="detailRoute" class="font-medium">{{
            t('bookings.booking-check-in.back-to-booking')
          }}</router-link>
        </div>
      </pv-message>

      <div v-else class="grid">
        <div class="col-12 lg:col-8">
          <pv-stepper v-model:value="step" linear>
            <pv-step-list>
              <pv-step value="1">{{
                t('bookings.booking-check-in.steps.verify')
              }}</pv-step>
              <pv-step value="2">{{
                t('bookings.booking-check-in.steps.payment')
              }}</pv-step>
              <pv-step value="3">{{
                t('bookings.booking-check-in.steps.access')
              }}</pv-step>
            </pv-step-list>
            <pv-step-panels class="p-0 mt-3 bg-transparent">
              <pv-step-panel value="1">
                <form
                  id="check-in-identity"
                  class="flex flex-column gap-4 p-4 surface-card border-1 surface-border border-round-xl"
                  @submit.prevent="step = '2'"
                >
                  <h3
                    class="flex align-items-center gap-2 m-0 text-base font-semibold"
                  >
                    <i
                      class="pi pi-id-card text-color-secondary"
                      aria-hidden="true"
                    />
                    {{ t('bookings.booking-check-in.verify-title') }}
                  </h3>
                  <div class="flex align-items-center gap-3">
                    <pv-avatar
                      icon="pi pi-user"
                      shape="circle"
                      class="bg-primary-50 text-primary"
                      aria-hidden="true"
                    />
                    <span class="flex flex-column">
                      <span class="font-semibold">{{ booking.guestName }}</span>
                      <span class="text-sm text-color-secondary">
                        {{ booking.guestEmail
                        }}<template v-if="booking.guestPhone">
                          · {{ booking.guestPhone }}</template
                        >
                      </span>
                    </span>
                  </div>
                  <div class="formgrid grid">
                    <div class="field col-12 md:col-5 flex flex-column gap-2">
                      <label
                        for="check-in-document-type"
                        class="text-sm font-medium"
                        >{{
                          t('bookings.booking-check-in.document-type')
                        }}</label
                      >
                      <pv-select
                        v-model="form.documentType"
                        input-id="check-in-document-type"
                        :options="documentTypeOptions"
                        option-label="label"
                        option-value="value"
                        fluid
                      />
                    </div>
                    <div class="field col-12 md:col-7 flex flex-column gap-2">
                      <label
                        for="check-in-document-number"
                        class="text-sm font-medium"
                        >{{
                          t('bookings.booking-check-in.document-number')
                        }}</label
                      >
                      <pv-input-text
                        id="check-in-document-number"
                        v-model="form.documentNumber"
                        :placeholder="
                          t(
                            'bookings.booking-check-in.document-number-placeholder',
                          )
                        "
                        autocomplete="off"
                        maxlength="20"
                        required
                        fluid
                      />
                    </div>
                  </div>
                  <label
                    for="check-in-verified"
                    class="flex align-items-start gap-3 p-3 surface-50 border-1 surface-border border-round-lg cursor-pointer"
                  >
                    <pv-checkbox
                      v-model="form.verified"
                      input-id="check-in-verified"
                      binary
                    />
                    <span class="flex flex-column gap-1">
                      <span class="font-medium">{{
                        t('bookings.booking-check-in.verified')
                      }}</span>
                      <span class="text-sm text-color-secondary">{{
                        t('bookings.booking-check-in.verified-help')
                      }}</span>
                    </span>
                  </label>
                  <pv-message
                    v-if="!form.verified"
                    severity="warn"
                    icon="pi pi-id-card"
                  >
                    {{ t('bookings.booking-check-in.verify-first') }}
                  </pv-message>
                </form>
                <div class="flex justify-content-between gap-2 mt-3">
                  <router-link v-slot="{ navigate }" :to="detailRoute" custom>
                    <pv-button
                      :label="t('bookings.booking-check-in.cancel')"
                      severity="secondary"
                      outlined
                      rounded
                      @click="navigate"
                    />
                  </router-link>
                  <pv-button
                    type="submit"
                    form="check-in-identity"
                    :label="t('bookings.booking-check-in.continue')"
                    icon="pi pi-arrow-right"
                    icon-pos="right"
                    rounded
                    :disabled="!identityComplete"
                  />
                </div>
              </pv-step-panel>

              <pv-step-panel value="2">
                <div
                  class="flex flex-column gap-3 p-4 surface-card border-1 surface-border border-round-xl"
                >
                  <booking-payment-summary :booking="booking" />
                  <pv-message
                    v-if="getBalanceDue(booking) > 0"
                    severity="info"
                    icon="pi pi-info-circle"
                  >
                    <div class="flex flex-column gap-1">
                      <span class="font-semibold">{{
                        t('bookings.booking-check-in.balance-title')
                      }}</span>
                      <span>{{
                        t('bookings.booking-check-in.balance-text')
                      }}</span>
                    </div>
                  </pv-message>
                </div>
                <div class="flex justify-content-between gap-2 mt-3">
                  <pv-button
                    :label="t('bookings.booking-check-in.back')"
                    severity="secondary"
                    outlined
                    rounded
                    @click="step = '1'"
                  />
                  <pv-button
                    :label="t('bookings.booking-check-in.continue-access')"
                    icon="pi pi-arrow-right"
                    icon-pos="right"
                    rounded
                    @click="step = '3'"
                  />
                </div>
              </pv-step-panel>

              <pv-step-panel value="3">
                <div
                  class="flex flex-column gap-3 p-4 surface-card border-1 surface-border border-round-xl"
                >
                  <h3
                    class="flex align-items-center gap-2 m-0 text-base font-semibold"
                  >
                    <i
                      class="pi pi-wifi text-color-secondary"
                      aria-hidden="true"
                    />
                    {{ t('bookings.booking-check-in.encode-title') }}
                  </h3>
                  <div class="grid">
                    <div class="col-12 md:col-5">
                      <div
                        class="flex flex-column gap-2 h-full p-3 surface-50 border-1 surface-border border-round-xl border-left-3"
                        style="border-left-color: var(--p-primary-color)"
                      >
                        <span
                          class="text-xs font-semibold text-color-secondary uppercase"
                          >{{
                            t('bookings.booking-check-in.guest-access')
                          }}</span
                        >
                        <span class="text-2xl font-bold">{{
                          t('bookings.bookings-terms.room-number', {
                            number: room?.number ?? '—',
                          })
                        }}</span>
                        <span class="text-sm text-color-secondary">{{
                          roomType?.name
                        }}</span>
                        <pv-divider class="my-1" />
                        <span class="text-sm text-color-secondary">{{
                          t('bookings.booking-check-in.valid-until')
                        }}</span>
                        <span class="font-semibold">{{ accessEnd }}</span>
                      </div>
                    </div>
                    <div class="col-12 md:col-7 flex flex-column gap-3">
                      <p class="m-0 text-color-secondary line-height-3">
                        {{ t('bookings.booking-check-in.encode-help') }}
                      </p>
                      <rfid-encoder-panel
                        :action-label="
                          keyCardIds.length
                            ? t('bookings.booking-check-in.encode-another')
                            : ''
                        "
                        :disabled="saving"
                        @encoded="(cardId) => keyCardIds.push(cardId)"
                      />
                      <ul
                        v-if="keyCardIds.length"
                        class="list-none m-0 p-0 flex flex-column gap-2"
                        :aria-label="
                          t('bookings.booking-check-in.encoded-cards')
                        "
                      >
                        <li
                          v-for="cardId in keyCardIds"
                          :key="cardId"
                          class="flex align-items-center justify-content-between gap-2 p-2 surface-50 border-round-lg"
                        >
                          <span class="flex align-items-center gap-2">
                            <i
                              class="pi pi-check-circle text-green-700"
                              aria-hidden="true"
                            />
                            <span class="font-mono font-semibold"
                              >RFID {{ cardId }}</span
                            >
                          </span>
                          <span class="text-sm text-color-secondary">{{
                            t('bookings.booking-check-in.ready-to-activate')
                          }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <pv-message
                    size="small"
                    severity="secondary"
                    variant="simple"
                    icon="pi pi-info-circle"
                  >
                    {{ t('bookings.booking-check-in.activation') }}
                  </pv-message>
                  <pv-message
                    v-if="errorCode"
                    severity="error"
                    icon="pi pi-times-circle"
                  >
                    {{ t(`bookings.bookings-terms.errors.${errorCode}`) }}
                  </pv-message>
                </div>
                <div class="flex justify-content-between gap-2 mt-3">
                  <pv-button
                    :label="t('bookings.booking-check-in.back')"
                    severity="secondary"
                    outlined
                    rounded
                    :disabled="saving"
                    @click="step = '2'"
                  />
                  <pv-button
                    :label="t('bookings.booking-check-in.complete')"
                    icon="pi pi-check"
                    rounded
                    :loading="saving"
                    :disabled="!keyCardIds.length"
                    @click="completeCheckIn"
                  />
                </div>
              </pv-step-panel>
            </pv-step-panels>
          </pv-stepper>
        </div>

        <aside class="col-12 lg:col-4">
          <div
            class="flex flex-column gap-3 p-4 surface-50 border-1 surface-border border-round-xl"
          >
            <h3
              class="flex align-items-center gap-2 m-0 text-base font-semibold"
            >
              <i
                class="pi pi-list-check text-color-secondary"
                aria-hidden="true"
              />
              {{ t('bookings.booking-check-in.summary') }}
            </h3>
            <dl class="flex flex-column gap-3 m-0">
              <div class="flex flex-column gap-1">
                <dt class="text-sm text-color-secondary">
                  {{ t('bookings.booking-detail.stay') }}
                </dt>
                <dd class="m-0 font-medium">
                  {{
                    formatDayRange(
                      booking.checkInDate,
                      booking.checkOutDate,
                      locale,
                    )
                  }}
                  ·
                  {{
                    t('bookings.bookings-terms.nights', booking.nights.length)
                  }}
                </dd>
              </div>
              <div class="flex justify-content-between gap-3">
                <span class="flex flex-column gap-1">
                  <dt class="text-sm text-color-secondary">
                    {{ t('bookings.booking-detail.room') }}
                  </dt>
                  <dd class="m-0 font-medium">
                    <span class="font-mono">{{ room?.number ?? '—' }}</span> ·
                    {{ roomType?.name }}
                  </dd>
                </span>
                <span class="flex flex-column gap-1 text-right">
                  <dt class="text-sm text-color-secondary">
                    {{ t('bookings.booking-detail.guests') }}
                  </dt>
                  <dd class="m-0 font-medium">
                    {{ t('bookings.bookings-terms.guests', booking.guests) }}
                  </dd>
                </span>
              </div>
              <div
                class="flex align-items-center justify-content-between gap-3"
              >
                <dt class="text-sm text-color-secondary">
                  {{ t('bookings.booking-check-in.identity') }}
                </dt>
                <dd
                  :class="[
                    'm-0 flex align-items-center gap-2 font-medium',
                    identityComplete
                      ? 'text-green-700'
                      : 'text-color-secondary',
                  ]"
                >
                  <i
                    :class="
                      identityComplete ? 'pi pi-check-circle' : 'pi pi-clock'
                    "
                    aria-hidden="true"
                  />
                  {{
                    identityComplete
                      ? t('bookings.booking-check-in.identity-verified')
                      : t('bookings.booking-check-in.identity-pending')
                  }}
                </dd>
              </div>
              <div
                class="flex align-items-center justify-content-between gap-3"
              >
                <dt class="text-sm text-color-secondary">
                  {{ t('bookings.booking-check-in.access') }}
                </dt>
                <dd
                  :class="[
                    'm-0 font-medium',
                    keyCardIds.length
                      ? 'text-green-700'
                      : 'text-color-secondary',
                  ]"
                >
                  {{
                    keyCardIds.length
                      ? t(
                          'bookings.booking-check-in.key-cards',
                          keyCardIds.length,
                        )
                      : t('bookings.booking-check-in.key-card-required')
                  }}
                </dd>
              </div>
              <div
                class="flex align-items-center justify-content-between gap-3"
              >
                <dt class="text-sm text-color-secondary">
                  {{ t('bookings.booking-payment-summary.title') }}
                </dt>
                <dd class="m-0">
                  <payment-status-tag :status="getPaymentStatus(booking)" />
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </template>
  </bookings-layout>
</template>
