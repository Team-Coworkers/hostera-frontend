<script setup>
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import useBookingsStore from '../../application/bookings.store.js';
import useRoomsStore from '../../../rooms/application/rooms.store.js';
import { Payment } from '../../domain/model/payment.entity.js';
import { BookingsError } from '../../domain/model/bookings.error.js';
import {
  formatMoney,
  moneyLocale,
} from '../../../shared/presentation/calendar-format.js';

const props = defineProps({
  booking: { type: Object, required: true },
});
const visible = defineModel('visible', { type: Boolean });
const emit = defineEmits(['saved']);

const { t, locale } = useI18n();
const store = useBookingsStore();
const roomsStore = useRoomsStore();
const { saving } = toRefs(store);
const { recordPayment, getBalanceDue } = store;

const currency = computed(() => roomsStore.currentProperty?.currency ?? 'PEN');
const balanceDue = computed(() => getBalanceDue(props.booking));
const form = ref({
  amount: balanceDue.value,
  method: 'card-terminal',
  paidAt: new Date(),
  reference: '',
});
const errorCode = ref('');
const methodOptions = computed(() =>
  Payment.methods.map((value) => ({
    value,
    label: t(`bookings.bookings-terms.payment-methods.${value}`),
  })),
);

/**
 * Records the payment and closes the drawer.
 */
const savePayment = async () => {
  errorCode.value = '';
  try {
    const payment = await recordPayment(
      new Payment({
        bookingId: props.booking.id,
        amount: form.value.amount ?? 0,
        method: form.value.method,
        paidAt: form.value.paidAt ? form.value.paidAt.toISOString() : '',
        reference: form.value.reference,
      }),
    );
    emit('saved', payment);
    visible.value = false;
  } catch (error) {
    errorCode.value =
      error instanceof BookingsError ? error.code : 'connection';
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
          t('bookings.payment-form.title')
        }}</span>
        <span class="text-sm text-color-secondary"
          ><span class="font-mono">{{ booking.code }}</span> ·
          {{ booking.guestName }}</span
        >
      </div>
    </template>

    <form
      id="payment-form"
      class="flex flex-column gap-3"
      @submit.prevent="savePayment"
    >
      <div
        class="flex align-items-end justify-content-between gap-3 pb-3 border-bottom-1 surface-border"
      >
        <span class="flex flex-column gap-1">
          <span class="text-sm">{{ t('bookings.payment-form.balance') }}</span>
          <span class="text-sm text-color-secondary">{{
            t('bookings.payment-form.total', {
              amount: formatMoney(booking.totalAmount, currency, locale),
            })
          }}</span>
        </span>
        <span class="font-mono text-2xl font-semibold">{{
          formatMoney(balanceDue, currency, locale)
        }}</span>
      </div>
      <div class="flex flex-column gap-2">
        <label for="payment-amount" class="text-sm font-medium">{{
          t('bookings.payment-form.amount')
        }}</label>
        <pv-input-number
          v-model="form.amount"
          input-id="payment-amount"
          mode="currency"
          :currency="currency"
          :locale="moneyLocale(currency, locale)"
          :min="0"
          input-class="font-mono"
          required
          fluid
        />
        <small class="text-color-secondary">{{
          t('bookings.payment-form.amount-help', {
            amount: formatMoney(balanceDue, currency, locale),
          })
        }}</small>
      </div>
      <div class="flex flex-column gap-2">
        <label for="payment-method" class="text-sm font-medium">{{
          t('bookings.payment-form.method')
        }}</label>
        <pv-select
          v-model="form.method"
          input-id="payment-method"
          :options="methodOptions"
          option-label="label"
          option-value="value"
          fluid
        />
      </div>
      <div class="flex flex-column gap-2">
        <label for="payment-paid-at" class="text-sm font-medium">{{
          t('bookings.payment-form.paid-at')
        }}</label>
        <pv-date-picker
          v-model="form.paidAt"
          input-id="payment-paid-at"
          show-time
          :hour-format="locale === 'en' ? '12' : '24'"
          :max-date="new Date()"
          :manual-input="false"
          show-icon
          icon-display="input"
          required
          fluid
        />
      </div>
      <div class="flex flex-column gap-2">
        <label for="payment-reference" class="text-sm font-medium">{{
          t('bookings.payment-form.reference')
        }}</label>
        <pv-input-text
          id="payment-reference"
          v-model="form.reference"
          :placeholder="t('bookings.payment-form.reference-placeholder')"
          maxlength="40"
          fluid
        />
      </div>
      <pv-message
        size="small"
        severity="secondary"
        variant="simple"
        icon="pi pi-info-circle"
      >
        {{ t('bookings.payment-form.external') }}
      </pv-message>
      <pv-message v-if="errorCode" severity="error" icon="pi pi-times-circle">
        {{
          t(`bookings.bookings-terms.errors.${errorCode}`, {
            amount: formatMoney(balanceDue, currency, locale),
          })
        }}
      </pv-message>
    </form>

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <pv-button
          :label="t('bookings.payment-form.cancel')"
          severity="secondary"
          outlined
          rounded
          :disabled="saving"
          @click="visible = false"
        />
        <pv-button
          type="submit"
          form="payment-form"
          :label="t('bookings.payment-form.save')"
          icon="pi pi-check"
          rounded
          :loading="saving"
        />
      </div>
    </template>
  </pv-drawer>
</template>
