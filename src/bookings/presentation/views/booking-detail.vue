<script setup>
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue';
import useBookingsStore from '../../application/bookings.store.js';
import useRoomsStore from '../../../rooms/application/rooms.store.js';
import { BookingsError } from '../../domain/model/bookings.error.js';
import {
  CalendarDate,
  formatDateTime,
  formatDay,
} from '../../../shared/presentation/calendar-format.js';
import BookingsLayout from '../components/bookings-layout.vue';
import BookingStatusTag from '../components/booking-status-tag.vue';
import BookingStatusDialog from '../components/booking-status-dialog.vue';
import BookingCancelDialog from '../components/booking-cancel-dialog.vue';
import BookingPaymentSummary from '../components/booking-payment-summary.vue';
import CredentialStatusTag from '../../../access-control/presentation/components/credential-status-tag.vue';
import useAccessControlStore from '../../../access-control/application/access-control.store.js';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const store = useBookingsStore();
const roomsStore = useRoomsStore();
const accessControlStore = useAccessControlStore();
const { getCredentialStatus } = accessControlStore;
const { saving } = toRefs(store);
const { getBookingById, isRoomAvailable, restoreBooking } = store;
const { getRoomById, getRoomTypeById, getRatePlanById } = roomsStore;

const booking = computed(() => getBookingById(route.params.id));
const room = computed(() => getRoomById(booking.value?.roomId));
const roomType = computed(() => getRoomTypeById(booking.value?.roomTypeId));
const ratePlan = computed(() => getRatePlanById(booking.value?.ratePlanId));
const nightsCount = computed(() => booking.value?.nights.length ?? 0);
const keyCards = computed(() =>
  booking.value
    ? accessControlStore.getKeyCardsOfBooking(booking.value.id)
    : [],
);
const today = CalendarDate.today();
const actionsMenu = ref(null);
const statusAction = ref(null);
const cancelDialogVisible = ref(false);
const restoreErrorCode = ref('');
// Cancelling and marking a no-show apply to bookings that have not ended; others have no actions.
const hasActions = computed(() =>
  ['pending', 'confirmed', 'checked-in'].includes(booking.value?.status),
);
const actionItems = computed(() => {
  if (!booking.value) return [];
  const checkedIn = booking.value.status === 'checked-in';
  return [
    {
      label: t('bookings.booking-detail.cancel'),
      icon: 'pi pi-times-circle',
      disabled: !booking.value.canBeCancelled,
      caption: checkedIn ? t('bookings.booking-detail.checked-in-locked') : '',
      command: () => (cancelDialogVisible.value = true),
    },
    {
      label: t('bookings.booking-detail.no-show'),
      icon: 'pi pi-user-minus',
      disabled: !booking.value.canBeMarkedNoShow(today),
      caption: checkedIn
        ? t('bookings.booking-detail.checked-in-locked')
        : booking.value.status === 'pending'
          ? t('bookings.booking-detail.no-show-confirmed-only')
          : t('bookings.booking-detail.no-show-from-check-in'),
      command: () => (statusAction.value = 'no-show'),
    },
  ];
});
// Icons of the status panel; bookings in other statuses have none.
const statusPanels = {
  pending: 'pi pi-clock',
  confirmed: 'pi pi-calendar',
  cancelled: 'pi pi-times-circle',
  'no-show': 'pi pi-user-minus',
  'checked-in': 'pi pi-sign-in',
  'checked-out': 'pi pi-sign-out',
};
const canRestore = computed(
  () =>
    booking.value?.canBeRestored(today) &&
    isRoomAvailable(booking.value.roomId, booking.value),
);
const statusFacts = computed(() => {
  const { status } = booking.value;
  if (status === 'cancelled')
    return [
      {
        label: t('bookings.booking-detail.cancelled-at'),
        value: dateTime(booking.value.cancelledAt),
      },
      {
        label: t('bookings.booking-detail.by'),
        value: operatorName(booking.value.cancelledBy),
      },
      {
        label: t('bookings.booking-detail.reason'),
        value: booking.value.cancellationReason
          ? t(
              `bookings.bookings-terms.cancellation-reasons.${booking.value.cancellationReason}`,
            )
          : '—',
      },
    ];
  if (status === 'no-show')
    return [
      {
        label: t('bookings.booking-detail.recorded-at'),
        value: dateTime(booking.value.noShowAt),
      },
      {
        label: t('bookings.booking-detail.by'),
        value: operatorName(booking.value.noShowBy),
      },
      {
        label: t('bookings.booking-detail.arrival'),
        value: t('bookings.booking-detail.not-recorded'),
      },
    ];
  if (status === 'checked-in' || status === 'checked-out')
    return [
      {
        label: t('bookings.booking-detail.checked-in-at'),
        value: dateTime(booking.value.checkedInAt),
      },
      ...(status === 'checked-out'
        ? [
            {
              label: t('bookings.booking-detail.checked-out-at'),
              value: dateTime(booking.value.checkedOutAt),
            },
          ]
        : []),
      {
        label: t('bookings.booking-detail.by'),
        value: operatorName(
          status === 'checked-out'
            ? booking.value.checkedOutBy
            : booking.value.checkedInBy,
        ),
      },
      {
        label: t('bookings.booking-detail.document'),
        value: booking.value.guestDocumentType
          ? `${t(`bookings.bookings-terms.document-types.${booking.value.guestDocumentType}`)} ${booking.value.guestDocumentNumber}`
          : '—',
      },
      ...(status === 'checked-out'
        ? [
            {
              label: t('bookings.booking-detail.room-condition'),
              value: booking.value.roomCondition
                ? t(
                    `bookings.bookings-terms.room-conditions.${booking.value.roomCondition}`,
                  )
                : '—',
            },
          ]
        : []),
    ];
  if (status === 'confirmed' && booking.value.confirmedAt)
    return [
      {
        label: t('bookings.booking-detail.confirmed-at'),
        value: dateTime(booking.value.confirmedAt),
      },
      {
        label: t('bookings.booking-detail.by'),
        value: operatorName(booking.value.confirmedBy),
      },
    ];
  return [];
});
const breadcrumbItems = computed(() => [
  {
    label: t('bookings.booking-detail.bookings'),
    route: { name: 'bookings-list' },
  },
  { label: booking.value?.code },
]);
const guestFacts = computed(() => [
  {
    label: t('bookings.booking-detail.email'),
    value: booking.value.guestEmail,
  },
  {
    label: t('bookings.booking-detail.phone'),
    value: booking.value.guestPhone || '—',
  },
  {
    label: t('bookings.booking-detail.language'),
    value: t(
      `bookings.bookings-terms.languages.${booking.value.preferredLanguage}`,
    ),
  },
]);
const bookingFacts = computed(() => [
  {
    label: t('bookings.booking-detail.code'),
    value: booking.value.code,
    mono: true,
  },
  {
    label: t('bookings.booking-detail.rate-plan'),
    value: ratePlan.value?.name ?? '—',
  },
  {
    label: t('bookings.booking-detail.created'),
    value: booking.value.createdAt
      ? formatDay(booking.value.createdAt, locale.value, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '—',
  },
]);

/**
 * Formats the moment a status changed, when it was recorded.
 * @param {?string} value - ISO date-time.
 * @returns {string} Localized date and time.
 */
const dateTime = (value) => (value ? formatDateTime(value, locale.value) : '—');

/**
 * Returns the display name of the operator who changed the booking's status.
 * @param {?string} operator - Recorded operator.
 * @returns {string} Localized operator name.
 */
const operatorName = (operator) =>
  operator === 'Demo operator'
    ? t('bookings.bookings-terms.demo-operator')
    : (operator ?? '—');

/**
 * Confirms that the booking's status changed.
 */
const notifySaved = () => {
  toast.add({
    severity: 'success',
    summary: t('bookings.booking-detail.saved'),
    life: 3000,
  });
};

/**
 * Restores a cancelled booking as pending when its room is still available.
 */
const restore = async () => {
  restoreErrorCode.value = '';
  try {
    await restoreBooking(booking.value.id);
    notifySaved();
  } catch (error) {
    restoreErrorCode.value =
      error instanceof BookingsError ? error.code : 'connection';
  }
};

/**
 * Starts a new booking with this booking's guest, room type, guests, and rate plan.
 */
const duplicate = () => {
  router.push({
    name: 'bookings-booking-new',
    query: { from: booking.value.id },
  });
};

/**
 * Formats a stay day with its weekday.
 * @param {string} date - ISO calendar day.
 * @returns {string} Localized day, such as "Wed, Oct 7".
 */
const stayDay = (date) =>
  formatDay(date, locale.value, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
</script>

<template>
  <bookings-layout>
    <template v-if="booking">
      <pv-breadcrumb :model="breadcrumbItems" class="p-0 bg-transparent">
        <template #item="{ item }">
          <router-link
            v-if="item.route"
            :to="item.route"
            class="text-color-secondary hover:text-primary"
            >{{ item.label }}</router-link
          >
          <span v-else class="font-mono font-medium">{{ item.label }}</span>
        </template>
      </pv-breadcrumb>

      <header
        class="flex flex-column md:flex-row md:align-items-center gap-3 pb-4 border-bottom-1 surface-border"
      >
        <div class="flex align-items-center gap-3 flex-1 min-w-0">
          <pv-avatar
            icon="pi pi-user"
            size="large"
            shape="square"
            class="flex-shrink-0 bg-primary-50 text-primary border-round-lg"
            aria-hidden="true"
          />
          <div class="flex flex-column gap-1 min-w-0">
            <div class="flex flex-wrap align-items-center gap-2">
              <h2 class="m-0 text-2xl font-bold tracking-tight">
                {{ booking.guestName }}
              </h2>
              <booking-status-tag :status="booking.status" />
            </div>
            <span class="font-mono text-sm text-color-secondary">{{
              booking.code
            }}</span>
          </div>
        </div>
        <div class="flex flex-wrap align-items-center gap-2">
          <router-link
            v-if="room"
            v-slot="{ navigate }"
            :to="{ name: 'rooms-room-detail', params: { id: room.id } }"
            custom
          >
            <pv-button
              :label="t('bookings.booking-detail.view-room')"
              icon="pi pi-key"
              severity="secondary"
              text
              rounded
              @click="navigate"
            />
          </router-link>
          <router-link
            v-if="booking.isEditable"
            v-slot="{ navigate }"
            :to="{
              name: 'bookings-booking-edit',
              params: { id: booking.id },
            }"
            custom
          >
            <pv-button
              :label="t('bookings.booking-detail.edit')"
              icon="pi pi-pencil"
              rounded
              @click="navigate"
            />
          </router-link>
          <template v-if="hasActions">
            <pv-button
              :label="t('bookings.booking-detail.actions')"
              icon="pi pi-chevron-down"
              icon-pos="right"
              severity="secondary"
              outlined
              rounded
              aria-haspopup="true"
              aria-controls="booking-actions"
              :disabled="saving"
              @click="actionsMenu.toggle($event)"
            />
            <pv-menu
              id="booking-actions"
              ref="actionsMenu"
              :model="actionItems"
              popup
            >
              <template #item="{ item, props: itemProps }">
                <a
                  v-bind="itemProps.action"
                  class="flex align-items-start gap-2 px-3 py-2"
                >
                  <i :class="[item.icon, 'mt-1']" aria-hidden="true" />
                  <span class="flex flex-column">
                    <span>{{ item.label }}</span>
                    <small
                      v-if="item.disabled && item.caption"
                      class="text-color-secondary"
                      >{{ item.caption }}</small
                    >
                  </span>
                </a>
              </template>
            </pv-menu>
          </template>
        </div>
      </header>

      <pv-message
        v-if="!booking.isEditable"
        severity="secondary"
        variant="simple"
        size="small"
        icon="pi pi-lock"
      >
        {{ t('bookings.booking-detail.read-only') }}
      </pv-message>

      <section
        class="grid grid-nogutter align-items-center gap-3 md:gap-0 p-4 surface-card border-1 surface-border border-round-xl"
        :aria-label="t('bookings.booking-detail.stay')"
      >
        <div class="col-12 md:col-3 flex flex-column gap-1">
          <span class="text-sm text-color-secondary">{{
            t('bookings.booking-detail.check-in')
          }}</span>
          <span class="text-xl font-semibold">{{
            stayDay(booking.checkInDate)
          }}</span>
        </div>
        <div
          class="col-12 md:col-2 flex align-items-center gap-2 text-color-secondary"
        >
          <i class="pi pi-moon" aria-hidden="true" />
          <span class="text-sm">{{
            t('bookings.bookings-terms.nights', nightsCount)
          }}</span>
        </div>
        <div class="col-12 md:col-3 flex flex-column gap-1">
          <span class="text-sm text-color-secondary">{{
            t('bookings.booking-detail.check-out')
          }}</span>
          <span class="text-xl font-semibold">{{
            stayDay(booking.checkOutDate)
          }}</span>
        </div>
        <div class="col-6 md:col-2 flex flex-column gap-1">
          <span class="text-sm text-color-secondary">{{
            t('bookings.booking-detail.room')
          }}</span>
          <span class="font-semibold"
            ><span class="font-mono">{{ room?.number ?? '—' }}</span> ·
            {{ roomType?.name }}</span
          >
        </div>
        <div class="col-6 md:col-2 flex flex-column gap-1">
          <span class="text-sm text-color-secondary">{{
            t('bookings.booking-detail.guests')
          }}</span>
          <span class="font-semibold">{{
            t('bookings.bookings-terms.guests', booking.guests)
          }}</span>
        </div>
      </section>

      <div class="grid">
        <div class="col-12 xl:col-8">
          <div
            class="flex flex-column gap-4 h-full p-4 surface-card border-1 surface-border border-round-xl"
          >
            <section class="flex flex-column gap-3">
              <h3
                class="flex align-items-center gap-2 m-0 text-base font-semibold"
              >
                <i
                  class="pi pi-id-card text-color-secondary"
                  aria-hidden="true"
                />
                {{ t('bookings.booking-detail.guest-information') }}
              </h3>
              <dl class="grid m-0">
                <div
                  v-for="fact in guestFacts"
                  :key="fact.label"
                  class="col-12 md:col-4 flex flex-column gap-1"
                >
                  <dt class="text-sm text-color-secondary">{{ fact.label }}</dt>
                  <dd
                    class="m-0 font-medium overflow-hidden text-overflow-ellipsis"
                  >
                    {{ fact.value }}
                  </dd>
                </div>
              </dl>
            </section>
            <pv-divider class="m-0" />
            <section class="flex flex-column gap-3">
              <h3
                class="flex align-items-center gap-2 m-0 text-base font-semibold"
              >
                <i
                  class="pi pi-ticket text-color-secondary"
                  aria-hidden="true"
                />
                {{ t('bookings.booking-detail.booking-information') }}
              </h3>
              <dl class="grid m-0">
                <div
                  v-for="fact in bookingFacts"
                  :key="fact.label"
                  class="col-12 md:col-4 flex flex-column gap-1"
                >
                  <dt class="text-sm text-color-secondary">{{ fact.label }}</dt>
                  <dd :class="['m-0 font-medium', { 'font-mono': fact.mono }]">
                    {{ fact.value }}
                  </dd>
                </div>
              </dl>
            </section>
            <pv-divider class="m-0" />
            <section class="flex flex-column gap-3">
              <h3
                class="flex align-items-center gap-2 m-0 text-base font-semibold"
              >
                <i
                  class="pi pi-comment text-color-secondary"
                  aria-hidden="true"
                />
                {{ t('bookings.booking-detail.guest-request') }}
              </h3>
              <p
                :class="[
                  'm-0 p-3 surface-50 border-round-lg line-height-3',
                  { 'text-color-secondary': !booking.guestRequest },
                ]"
              >
                {{
                  booking.guestRequest ||
                  t('bookings.booking-detail.no-request')
                }}
              </p>
            </section>
          </div>
        </div>

        <aside class="col-12 xl:col-4 flex flex-column gap-3">
          <section
            v-if="booking.status in statusPanels"
            class="flex flex-column gap-3 p-4 surface-card border-1 surface-border border-round-xl"
            :aria-labelledby="'booking-status-title'"
          >
            <h3
              id="booking-status-title"
              class="flex align-items-center gap-2 m-0 text-base font-semibold"
            >
              <i
                :class="[statusPanels[booking.status], 'text-color-secondary']"
                aria-hidden="true"
              />
              {{ t(`bookings.booking-detail.panels.${booking.status}`) }}
            </h3>
            <p
              v-if="booking.status === 'pending'"
              class="m-0 text-sm text-color-secondary line-height-3"
            >
              {{ t('bookings.booking-detail.pending-help') }}
            </p>
            <dl v-if="statusFacts.length" class="flex flex-column gap-2 m-0">
              <div
                v-for="fact in statusFacts"
                :key="fact.label"
                class="flex justify-content-between gap-3"
              >
                <dt class="text-color-secondary">{{ fact.label }}</dt>
                <dd class="m-0 text-right font-medium">{{ fact.value }}</dd>
              </div>
            </dl>
            <p
              v-if="booking.cancellationNote"
              class="m-0 p-3 surface-50 border-round-lg text-sm line-height-3"
            >
              {{ booking.cancellationNote }}
            </p>
            <pv-message
              v-if="!booking.holdsRoom && booking.status !== 'checked-out'"
              severity="secondary"
              size="small"
              icon="pi pi-key"
            >
              {{
                t(`bookings.booking-detail.released.${booking.status}`, {
                  number: room?.number ?? '—',
                })
              }}
            </pv-message>
            <pv-button
              v-if="booking.canBeConfirmed"
              :label="t('bookings.booking-detail.confirm')"
              icon="pi pi-check"
              rounded
              fluid
              :disabled="saving"
              @click="statusAction = 'confirm'"
            />
            <p
              v-if="booking.departureNote"
              class="m-0 p-3 surface-50 border-round-lg text-sm line-height-3"
            >
              {{ booking.departureNote }}
            </p>
            <template v-if="booking.status === 'confirmed'">
              <router-link
                v-slot="{ navigate }"
                :to="{
                  name: 'bookings-booking-check-in',
                  params: { id: booking.id },
                }"
                custom
              >
                <pv-button
                  :label="t('bookings.booking-detail.start-check-in')"
                  icon="pi pi-sign-in"
                  rounded
                  fluid
                  :disabled="saving || !booking.canBeCheckedIn(today)"
                  @click="navigate"
                />
              </router-link>
              <small
                v-if="!booking.canBeCheckedIn(today)"
                class="text-center text-color-secondary line-height-3"
                >{{
                  today < booking.checkInDate
                    ? t('bookings.booking-detail.check-in-from')
                    : t('bookings.booking-detail.check-in-ended')
                }}</small
              >
            </template>
            <router-link
              v-if="booking.canBeCheckedOut"
              v-slot="{ navigate }"
              :to="{
                name: 'bookings-booking-check-out',
                params: { id: booking.id },
              }"
              custom
            >
              <pv-button
                :label="t('bookings.booking-detail.start-check-out')"
                icon="pi pi-sign-out"
                rounded
                fluid
                :disabled="saving"
                @click="navigate"
              />
            </router-link>
            <template v-if="['cancelled', 'no-show'].includes(booking.status)">
              <pv-button
                :label="t('bookings.booking-detail.duplicate')"
                icon="pi pi-copy"
                severity="secondary"
                outlined
                rounded
                fluid
                @click="duplicate"
              />
              <template v-if="booking.status === 'cancelled'">
                <pv-button
                  :label="t('bookings.booking-detail.restore')"
                  icon="pi pi-replay"
                  rounded
                  fluid
                  :disabled="saving || !canRestore"
                  :loading="saving"
                  @click="restore"
                />
                <small class="text-center text-color-secondary line-height-3">{{
                  t('bookings.booking-detail.restore-help')
                }}</small>
                <pv-message
                  v-if="restoreErrorCode"
                  severity="error"
                  size="small"
                  icon="pi pi-times-circle"
                >
                  {{ t(`bookings.bookings-terms.errors.${restoreErrorCode}`) }}
                </pv-message>
              </template>
            </template>
          </section>

          <section
            v-if="keyCards.length"
            class="flex flex-column gap-3 p-4 surface-card border-1 surface-border border-round-xl"
            aria-labelledby="booking-key-cards-title"
          >
            <h3
              id="booking-key-cards-title"
              class="flex align-items-center gap-2 m-0 text-base font-semibold"
            >
              <i class="pi pi-wifi text-color-secondary" aria-hidden="true" />
              {{ t('bookings.booking-detail.key-cards') }}
            </h3>
            <ul class="list-none m-0 p-0 flex flex-column gap-2">
              <li v-for="keyCard in keyCards" :key="keyCard.id">
                <router-link
                  :to="{
                    name: 'access-control-credential-detail',
                    params: { id: keyCard.id },
                  }"
                  class="flex align-items-center justify-content-between gap-2 p-2 surface-50 border-round-lg text-color hover:surface-100"
                >
                  <span class="flex flex-column">
                    <span class="font-mono font-semibold"
                      >RFID {{ keyCard.cardId }}</span
                    >
                    <span class="text-sm text-color-secondary">{{
                      t('bookings.booking-detail.key-card-until', {
                        date: dateTime(keyCard.validUntil),
                      })
                    }}</span>
                  </span>
                  <credential-status-tag
                    :status="getCredentialStatus(keyCard)"
                  />
                </router-link>
              </li>
            </ul>
          </section>

          <div
            class="flex flex-column gap-3 p-4 surface-50 border-1 surface-border border-round-xl"
          >
            <booking-payment-summary :booking="booking" />
            <span class="text-sm text-color-secondary">
              {{ t('bookings.bookings-terms.nights', nightsCount) }} ·
              {{ ratePlan?.name }}
            </span>
            <p class="m-0 text-sm text-color-secondary line-height-3">
              {{ t('bookings.booking-detail.total-help') }}
            </p>
          </div>
        </aside>
      </div>

      <booking-status-dialog
        v-if="statusAction"
        :visible="!!statusAction"
        :booking="booking"
        :action="statusAction"
        @update:visible="(value) => !value && (statusAction = null)"
        @saved="notifySaved"
      />
      <booking-cancel-dialog
        v-if="cancelDialogVisible"
        v-model:visible="cancelDialogVisible"
        :booking="booking"
        @saved="notifySaved"
      />
    </template>
    <pv-message v-else severity="warn" icon="pi pi-search">
      <div class="flex flex-column sm:flex-row sm:align-items-center gap-3">
        <span>{{ t('bookings.booking-detail.not-found') }}</span>
        <router-link :to="{ name: 'bookings-list' }" class="font-medium">{{
          t('bookings.booking-detail.back')
        }}</router-link>
      </div>
    </pv-message>
  </bookings-layout>
</template>
