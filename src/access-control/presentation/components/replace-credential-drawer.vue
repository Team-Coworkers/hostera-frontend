<script setup>
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import useAccessControlStore from '../../application/access-control.store.js';
import { AccessControlError } from '../../domain/model/access-control.error.js';
import RfidEncoderPanel from './rfid-encoder-panel.vue';

const props = defineProps({
  credential: { type: Object, required: true },
});
const visible = defineModel('visible', { type: Boolean });
const emit = defineEmits(['saved']);

const { t } = useI18n();
const store = useAccessControlStore();
const { saving, encoderState } = toRefs(store);
const { replaceCredential } = store;

const errorCode = ref('');
const encoding = computed(() =>
  ['encoding', 'verifying'].includes(encoderState.value),
);

/**
 * Revokes the current card, encodes its replacement, and closes the drawer.
 */
const replace = async () => {
  errorCode.value = '';
  try {
    const replacement = await replaceCredential(props.credential.id);
    emit('saved', replacement);
    visible.value = false;
  } catch (error) {
    errorCode.value =
      error instanceof AccessControlError ? error.code : 'connection';
  }
};
</script>

<template>
  <pv-drawer
    v-model:visible="visible"
    position="right"
    class="w-full md:w-30rem"
    :dismissable="!saving && !encoding"
    :close-on-escape="!saving && !encoding"
    :show-close-icon="!saving && !encoding"
    block-scroll
  >
    <template #header>
      <div class="flex flex-column">
        <span class="text-xl font-bold">{{
          t('access-control.replace-credential-drawer.title')
        }}</span>
        <span class="text-sm text-color-secondary"
          ><span class="font-mono">RFID {{ credential.cardId }}</span> ·
          {{ credential.holderName }}</span
        >
      </div>
    </template>

    <ol class="list-none m-0 p-0 flex flex-column gap-4">
      <li class="flex gap-3">
        <span
          class="flex align-items-center justify-content-center flex-shrink-0 w-2rem h-2rem border-circle bg-primary text-white font-semibold"
          aria-hidden="true"
          >1</span
        >
        <span class="flex flex-column gap-1">
          <span class="font-semibold">{{
            t('access-control.replace-credential-drawer.revoke-step')
          }}</span>
          <span class="text-sm text-color-secondary">{{
            t('access-control.replace-credential-drawer.revoke-help', {
              card: credential.cardId,
            })
          }}</span>
        </span>
      </li>
      <li class="flex gap-3">
        <span
          class="flex align-items-center justify-content-center flex-shrink-0 w-2rem h-2rem border-circle surface-200 font-semibold"
          aria-hidden="true"
          >2</span
        >
        <span class="flex flex-column gap-2 flex-1">
          <span class="font-semibold">{{
            t('access-control.replace-credential-drawer.encode-step')
          }}</span>
          <span class="text-sm text-color-secondary">{{
            t('access-control.replace-credential-drawer.encode-help')
          }}</span>
          <rfid-encoder-panel :show-action="false" />
        </span>
      </li>
    </ol>
    <pv-message
      size="small"
      severity="secondary"
      variant="simple"
      icon="pi pi-info-circle"
      class="mt-4"
    >
      {{ t('access-control.replace-credential-drawer.copied') }}
    </pv-message>
    <pv-message
      v-if="errorCode"
      severity="error"
      icon="pi pi-times-circle"
      class="mt-3"
    >
      {{ t(`access-control.access-control-terms.errors.${errorCode}`) }}
    </pv-message>

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <pv-button
          :label="t('access-control.replace-credential-drawer.cancel')"
          severity="secondary"
          outlined
          rounded
          :disabled="saving || encoding"
          @click="visible = false"
        />
        <pv-button
          :label="t('access-control.replace-credential-drawer.submit')"
          icon="pi pi-sync"
          rounded
          :loading="saving || encoding"
          @click="replace"
        />
      </div>
    </template>
  </pv-drawer>
</template>
