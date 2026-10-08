<script setup>
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import useAccessControlStore from '../../application/access-control.store.js';
import { Credential } from '../../domain/model/credential.entity.js';
import { AccessControlError } from '../../domain/model/access-control.error.js';
import { RevokeCredentialCommand } from '../../domain/revoke-credential.command.js';

const props = defineProps({
  credential: { type: Object, required: true },
  access: { type: String, required: true },
});
const visible = defineModel('visible', { type: Boolean });
const emit = defineEmits(['saved']);

const { t } = useI18n();
const store = useAccessControlStore();
const { saving } = toRefs(store);
const { revokeCredential } = store;

const form = ref({
  reason: props.credential.isGuestKeyCard ? 'lost-card' : 'staff-left',
  note: '',
});
const errorCode = ref('');
// Replacement revokes cards through its own action.
const reasonOptions = computed(() =>
  Credential.revocationReasons
    .filter((value) => value !== 'replaced')
    .map((value) => ({
      value,
      label: t(
        `access-control.access-control-terms.revocation-reasons.${value}`,
      ),
    })),
);
const noteRequired = computed(() => form.value.reason === 'other');

/**
 * Revokes the credential with the chosen reason and closes the dialog.
 */
const revoke = async () => {
  errorCode.value = '';
  try {
    const revoked = await revokeCredential(
      new RevokeCredentialCommand({
        credentialId: props.credential.id,
        reason: form.value.reason,
        note: form.value.note,
      }),
    );
    emit('saved', revoked);
    visible.value = false;
  } catch (error) {
    errorCode.value =
      error instanceof AccessControlError ? error.code : 'connection';
  }
};
</script>

<template>
  <pv-dialog
    v-model:visible="visible"
    modal
    :header="
      t('access-control.revoke-credential-dialog.title', {
        card: credential.cardId,
      })
    "
    :draggable="false"
    :closable="!saving"
    class="w-full mx-3"
    style="max-width: 32rem"
  >
    <form
      id="revoke-credential-form"
      class="flex flex-column gap-3"
      @submit.prevent="revoke"
    >
      <p class="m-0 text-color-secondary line-height-3">
        {{
          t('access-control.revoke-credential-dialog.summary', {
            name: credential.holderName,
            access,
          })
        }}
      </p>
      <div class="flex flex-column gap-2">
        <label for="revoke-reason" class="text-sm font-medium">{{
          t('access-control.revoke-credential-dialog.reason')
        }}</label>
        <pv-select
          v-model="form.reason"
          input-id="revoke-reason"
          :options="reasonOptions"
          option-label="label"
          option-value="value"
          fluid
        />
      </div>
      <div v-if="noteRequired" class="flex flex-column gap-2">
        <label for="revoke-note" class="text-sm font-medium">{{
          t('access-control.revoke-credential-dialog.note')
        }}</label>
        <pv-textarea
          id="revoke-note"
          v-model="form.note"
          rows="2"
          maxlength="200"
          required
          auto-resize
          fluid
        />
      </div>
      <pv-message severity="warn" icon="pi pi-exclamation-triangle">
        {{ t('access-control.revoke-credential-dialog.immediate') }}
      </pv-message>
      <pv-message v-if="errorCode" severity="error" icon="pi pi-times-circle">
        {{ t(`access-control.access-control-terms.errors.${errorCode}`) }}
      </pv-message>
    </form>
    <template #footer>
      <pv-button
        :label="t('access-control.revoke-credential-dialog.cancel')"
        severity="secondary"
        outlined
        rounded
        :disabled="saving"
        @click="visible = false"
      />
      <pv-button
        type="submit"
        form="revoke-credential-form"
        :label="t('access-control.revoke-credential-dialog.submit')"
        severity="danger"
        icon="pi pi-ban"
        rounded
        :loading="saving"
      />
    </template>
  </pv-dialog>
</template>
