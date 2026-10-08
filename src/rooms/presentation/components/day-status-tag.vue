<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  status: { type: String, required: true },
  // Hides the label below the md breakpoint, keeping the icon.
  compact: { type: Boolean, default: false },
});

const { t } = useI18n();

const statusStyles = {
  available: { icon: 'pi pi-check', severity: 'success' },
  booked: { icon: 'pi pi-calendar', severity: 'info' },
  occupied: { icon: 'pi pi-user', severity: undefined },
  blocked: { icon: 'pi pi-ban', severity: 'warn' },
  'out-of-service': { icon: 'pi pi-wrench', severity: 'danger' },
  'needs-cleaning': { icon: 'pi pi-sparkles', severity: 'secondary' },
};
const style = computed(
  () => statusStyles[props.status] ?? statusStyles.available,
);
const label = computed(() =>
  t(`rooms.rooms-terms.day-statuses.${props.status}`),
);
</script>

<template>
  <pv-tag
    :severity="style.severity"
    class="max-w-full white-space-nowrap overflow-hidden"
  >
    <span class="flex align-items-center gap-2 min-w-0">
      <i :class="[style.icon, 'text-sm flex-shrink-0']" aria-hidden="true" />
      <span
        :class="[
          'overflow-hidden text-overflow-ellipsis',
          { 'hidden md:inline': compact },
        ]"
        >{{ label }}</span
      >
    </span>
  </pv-tag>
</template>
