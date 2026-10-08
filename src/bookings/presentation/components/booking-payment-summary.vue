<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue';
import useBookingsStore from '../../application/bookings.store.js';
import useRoomsStore from '../../../rooms/application/rooms.store.js';
import {
  formatDateTime,
  formatMoney,
} from '../../../shared/presentation/calendar-format.js';
import PaymentStatusTag from './payment-status-tag.vue';
import PaymentForm from './payment-form.vue';

const props = defineProps({
  booking: { type: Object, required: true },
});

const { t, locale } = useI18n();
const toast = useToast();
const store = useBookingsStore();
const roomsStore = useRoomsStore();
const { getPaymentsOf, getBalanceDue, getPaymentStatus } = store;

const paymentFormVisible = ref(false);
const currency = computed(() => roomsStore.currentProperty?.currency ?? 'PEN');
const bookingPayments = computed(() => getPaymentsOf(props.booking.id));
const balanceDue = computed(() => getBalanceDue(props.booking));
const paid = computed(() =>
  bookingPayments.value.reduce((sum, payment) => sum + payment.amount, 0),
);
const canRecordPayment = computed(
  () => props.booking.acceptsPayments && balanceDue.value > 0,
);

/**
 * Confirms that a payment was recorded.
 */
const notifyRecorded = () => {
  toast.add({
    severity: 'success',
    summary: t('bookings.booking-payment-summary.recorded'),
    life: 3000,
  });
};
</script>

<template>
  <section class="flex flex-column gap-3">
    <div class="flex align-items-center justify-content-between gap-2">
      <h3 class="flex align-items-center gap-2 m-0 text-base font-semibold">
        <i class="pi pi-wallet text-color-secondary" aria-hidden="true" />
        {{ t('bookings.booking-payment-summary.title') }}
      </h3>
      <payment-status-tag :status="getPaymentStatus(booking)" />
    </div>
    <dl class="flex flex-column gap-2 m-0">
      <div class="flex justify-content-between gap-3">
        <dt class="text-color-secondary">
          {{ t('bookings.booking-payment-summary.total') }}
        </dt>
        <dd class="m-0 font-mono">
          {{ formatMoney(booking.totalAmount, currency, locale) }}
        </dd>
      </div>
      <div class="flex justify-content-between gap-3">
        <dt class="text-color-secondary">
          {{ t('bookings.booking-payment-summary.paid') }}
        </dt>
        <dd class="m-0 font-mono">{{ formatMoney(paid, currency, locale) }}</dd>
      </div>
      <div
        class="flex align-items-end justify-content-between gap-3 pt-2 border-top-1 surface-border"
      >
        <dt class="font-semibold">
          {{ t('bookings.booking-payment-summary.balance') }}
        </dt>
        <dd
          :class="[
            'm-0 font-mono text-xl font-semibold',
            { 'text-orange-700': balanceDue > 0 },
          ]"
        >
          {{ formatMoney(balanceDue, currency, locale) }}
        </dd>
      </div>
    </dl>
    <ul
      v-if="bookingPayments.length"
      class="list-none m-0 p-0 flex flex-column gap-2"
      :aria-label="t('bookings.booking-payment-summary.payments')"
    >
      <li
        v-for="payment in bookingPayments"
        :key="payment.id"
        class="flex align-items-center justify-content-between gap-3 p-2 surface-50 border-round-lg text-sm"
      >
        <span class="flex flex-column">
          <span class="font-medium">{{
            t(`bookings.bookings-terms.payment-methods.${payment.method}`)
          }}</span>
          <span class="text-color-secondary"
            >{{ formatDateTime(payment.paidAt, locale)
            }}<template v-if="payment.reference">
              · <span class="font-mono">{{ payment.reference }}</span></template
            ></span
          >
        </span>
        <span class="font-mono font-medium">{{
          formatMoney(payment.amount, currency, locale)
        }}</span>
      </li>
    </ul>
    <p v-else class="m-0 text-sm text-color-secondary">
      {{ t('bookings.booking-payment-summary.no-payments') }}
    </p>
    <pv-button
      v-if="canRecordPayment"
      :label="t('bookings.booking-payment-summary.record')"
      icon="pi pi-plus"
      severity="secondary"
      outlined
      rounded
      fluid
      :disabled="store.saving"
      @click="paymentFormVisible = true"
    />
    <payment-form
      v-if="paymentFormVisible"
      v-model:visible="paymentFormVisible"
      :booking="booking"
      @saved="notifyRecorded"
    />
  </section>
</template>
