<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  status: { type: String, required: true },
});

const { t } = useI18n();

const severities = {
  unpaid: 'danger',
  'partially-paid': 'warn',
  paid: 'success',
};
const severity = computed(() => severities[props.status] ?? 'secondary');
</script>

<template>
  <pv-tag
    icon="pi pi-wallet"
    :severity="severity"
    :value="t(`bookings.bookings-terms.payment-statuses.${status}`)"
    class="white-space-nowrap"
  />
</template>
