<script setup>
import { computed } from 'vue';

const props = defineProps({
  category: { type: String, default: '' },
  size: { type: String, default: null },
});

const categoryIcons = {
  linen: 'pi pi-th-large',
  'guest-amenities': 'pi pi-gift',
  'cleaning-supplies': 'pi pi-sparkles',
  'access-supplies': 'pi pi-key',
};
const icon = computed(() => categoryIcons[props.category] ?? 'pi pi-box');
</script>

<template>
  <pv-avatar
    :icon="icon"
    :size="size"
    shape="square"
    class="flex-shrink-0 bg-primary-50 text-primary border-round-lg"
    aria-hidden="true"
  />
</template>
