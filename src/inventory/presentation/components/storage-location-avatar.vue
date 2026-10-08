<script setup>
import { computed } from 'vue';

const props = defineProps({
  type: { type: String, default: '' },
  size: { type: String, default: null },
});

const typeIcons = {
  warehouse: 'pi pi-warehouse',
  closet: 'pi pi-inbox',
  'front-desk': 'pi pi-desktop',
  'service-area': 'pi pi-wrench',
};
const icon = computed(() => typeIcons[props.type] ?? 'pi pi-building');
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
