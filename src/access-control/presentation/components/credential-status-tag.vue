<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  status: { type: String, required: true },
});

const { t } = useI18n();

const appearances = {
  active: { icon: 'pi pi-check-circle', severity: 'success' },
  scheduled: { icon: 'pi pi-clock', severity: 'warn' },
  expired: { icon: 'pi pi-history', severity: 'secondary' },
  revoked: { icon: 'pi pi-ban', severity: 'danger' },
};
const appearance = computed(
  () => appearances[props.status] ?? appearances.active,
);
</script>

<template>
  <pv-tag
    :icon="appearance.icon"
    :severity="appearance.severity"
    :value="t(`access-control.access-control-terms.statuses.${status}`)"
    class="white-space-nowrap"
  />
</template>
