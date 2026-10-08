<script setup>
import { useI18n } from 'vue-i18n';

defineProps({ condition: { type: String, required: true } });

const { t } = useI18n();
const severities = {
  'in-stock': 'success',
  'low-stock': 'warn',
  'out-of-stock': 'danger',
};
</script>

<template>
  <pv-tag
    :value="t(`inventory.inventory-terms.conditions.${condition}`)"
    :severity="severities[condition]"
  />
</template>
