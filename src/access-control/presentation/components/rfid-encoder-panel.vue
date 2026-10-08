<script setup>
import { computed, onMounted, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import useAccessControlStore from '../../application/access-control.store.js';

defineProps({
  // Hides the encode button when another action, such as Replace, starts the encoding.
  showAction: { type: Boolean, default: true },
  actionLabel: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(['encoded']);

const { t } = useI18n();
const store = useAccessControlStore();
const { encoderState } = toRefs(store);
const { encodeKeyCard, resetEncoder } = store;

const failed = computed(() => encoderState.value === 'failed');
const busy = computed(() =>
  ['encoding', 'verifying'].includes(encoderState.value),
);
const stateAppearance = computed(
  () =>
    ({
      ready: 'bg-green-500',
      encoding: 'bg-orange-500',
      verifying: 'bg-orange-500',
      encoded: 'bg-green-500',
      failed: 'bg-red-500',
    })[encoderState.value],
);

onMounted(resetEncoder);

/**
 * Writes a key card on the encoder and reports its card ID.
 */
const encode = async () => {
  try {
    emit('encoded', await encodeKeyCard());
  } catch {
    // The encoder state shows the failure and the button allows a retry.
  }
};
</script>

<template>
  <div class="flex flex-column gap-3">
    <div
      class="flex align-items-center gap-3 p-3 surface-card border-1 surface-border border-round-lg"
      aria-live="polite"
    >
      <pv-avatar
        icon="pi pi-wifi"
        shape="square"
        class="flex-shrink-0 bg-primary-50 text-primary border-round-lg"
        aria-hidden="true"
      />
      <span class="flex flex-column flex-1 min-w-0">
        <span class="font-semibold">{{
          t('access-control.rfid-encoder-panel.device')
        }}</span>
        <span class="text-sm text-color-secondary">{{
          t(`access-control.rfid-encoder-panel.states.${encoderState}`)
        }}</span>
      </span>
      <span class="flex align-items-center gap-2 text-sm font-medium">
        <span
          :class="['inline-block border-circle', stateAppearance]"
          style="width: 0.5rem; height: 0.5rem"
          aria-hidden="true"
        />
        {{ t(`access-control.rfid-encoder-panel.labels.${encoderState}`) }}
      </span>
    </div>
    <pv-message v-if="failed" severity="error" icon="pi pi-exclamation-circle">
      <div class="flex flex-column gap-1">
        <span class="font-semibold">{{
          t('access-control.rfid-encoder-panel.failed-title')
        }}</span>
        <span>{{ t('access-control.rfid-encoder-panel.failed-text') }}</span>
      </div>
    </pv-message>
    <pv-button
      v-if="showAction"
      :label="actionLabel || t('access-control.rfid-encoder-panel.encode')"
      icon="pi pi-wifi"
      rounded
      :loading="busy"
      :disabled="disabled || busy"
      @click="encode"
    />
  </div>
</template>
