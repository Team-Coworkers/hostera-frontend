<script setup>
import { watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePrimeVue } from 'primevue/config';
import AppLayout from './shared/presentation/components/app-layout.vue';

const { locale, getLocaleMessage } = useI18n();
const primevue = usePrimeVue();

// PrimeVue components, such as DatePicker, read their texts from PrimeVue's own locale.
watch(
  locale,
  (value) => {
    const { aria, ...texts } =
      getLocaleMessage(value).shared['primevue-locale'];
    Object.assign(primevue.config.locale, texts);
    Object.assign(primevue.config.locale.aria, aria);
  },
  { immediate: true },
);
</script>

<template>
  <app-layout />
</template>
