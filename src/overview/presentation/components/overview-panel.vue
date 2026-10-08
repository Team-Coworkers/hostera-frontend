<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  failed: { type: Boolean, default: false },
});
const emit = defineEmits(['retry']);

const { t } = useI18n();
</script>

<template>
  <section
    class="flex flex-column gap-3 h-full p-4 surface-card border-1 surface-border border-round-xl"
  >
    <header class="flex align-items-start justify-content-between gap-3">
      <div class="flex flex-column gap-1 min-w-0">
        <h2 class="m-0 text-base font-semibold">{{ title }}</h2>
        <span v-if="subtitle && !failed" class="text-sm text-color-secondary">{{
          subtitle
        }}</span>
      </div>
      <slot name="actions" />
    </header>
    <div
      v-if="failed"
      class="flex flex-column align-items-center justify-content-center gap-2 flex-1 py-5 text-center"
      role="alert"
    >
      <span
        class="flex align-items-center justify-content-center w-3rem h-3rem border-round-lg bg-orange-50 text-orange-700"
        aria-hidden="true"
        ><i class="pi pi-exclamation-triangle"
      /></span>
      <span class="font-semibold">{{
        t('overview.overview-panel.unavailable', { title })
      }}</span>
      <span class="text-sm text-color-secondary line-height-3">{{
        t('overview.overview-panel.unavailable-text')
      }}</span>
      <pv-button
        :label="t('overview.overview-panel.retry')"
        icon="pi pi-refresh"
        severity="secondary"
        outlined
        rounded
        size="small"
        @click="emit('retry')"
      />
    </div>
    <div
      v-else-if="loading"
      class="flex align-items-center justify-content-center flex-1 py-5"
      role="status"
    >
      <pv-progress-spinner
        :stroke-width="4"
        class="w-2rem h-2rem"
        :aria-label="t('overview.overview-panel.loading')"
      />
    </div>
    <slot v-else />
  </section>
</template>
