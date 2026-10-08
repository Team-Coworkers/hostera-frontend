<script setup>
import { useI18n } from 'vue-i18n';

const { t, locale, availableLocales } = useI18n();
</script>

<template>
  <pv-select-button
    v-model="locale"
    :options="availableLocales"
    :allow-empty="false"
    :aria-label="t('shared.language-switcher.label')"
    size="small"
    fluid
  >
    <template #option="slotProps">
      <span>{{ slotProps.option.toUpperCase() }}</span>
    </template>
  </pv-select-button>
</template>
