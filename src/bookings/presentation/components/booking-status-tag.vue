<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  status: { type: String, required: true },
});

const { t } = useI18n();

const appearances = {
  pending: { icon: 'pi pi-clock', severity: 'warn' },
  confirmed: { icon: 'pi pi-calendar', severity: 'info' },
  'checked-in': { icon: 'pi pi-sign-in', severity: 'success' },
  'checked-out': { icon: 'pi pi-sign-out', severity: 'secondary' },
  cancelled: { icon: 'pi pi-times-circle', severity: 'danger' },
  'no-show': { icon: 'pi pi-user-minus', severity: 'secondary' },
};
const appearance = computed(
  () => appearances[props.status] ?? appearances.pending,
);
</script>

<template>
  <pv-tag
    :icon="appearance.icon"
    :severity="appearance.severity"
    :value="t(`bookings.bookings-terms.statuses.${status}`)"
    class="white-space-nowrap"
  />
</template>
