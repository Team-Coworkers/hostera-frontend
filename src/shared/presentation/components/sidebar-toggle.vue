<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <pv-sidebar-trigger
    v-tooltip.bottom="t('shared.sidebar-toggle.label')"
    target="app-sidebar"
    icon="pi pi-sidebar"
    severity="secondary"
    text
    class="flex-shrink-0"
    :aria-label="t('shared.sidebar-toggle.label')"
  >
    <i class="pi pi-sidebar text-lg" aria-hidden="true" />
  </pv-sidebar-trigger>
</template>
