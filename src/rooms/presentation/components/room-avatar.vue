<script setup>
defineProps({
  icon: { type: String, default: 'pi pi-key' },
  size: { type: String, default: null },
});
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
