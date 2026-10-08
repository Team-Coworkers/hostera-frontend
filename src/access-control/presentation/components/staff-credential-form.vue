<script setup>
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import useAccessControlStore from '../../application/access-control.store.js';
import { Credential } from '../../domain/model/credential.entity.js';
import { AccessControlError } from '../../domain/model/access-control.error.js';
import { IssueStaffCredentialCommand } from '../../domain/issue-staff-credential.command.js';
import RfidEncoderPanel from './rfid-encoder-panel.vue';

const visible = defineModel('visible', { type: Boolean });
const emit = defineEmits(['saved']);

const { t, locale } = useI18n();
const store = useAccessControlStore();
const { staffMembers, credentials, saving, encoderState } = toRefs(store);
const { issueStaffCredential } = store;

const form = ref({
  duration: 'permanent',
  staffMemberId: null,
  scope: 'service-areas',
  validUntil: null,
});
const errorCode = ref('');
const encoding = computed(() =>
  ['encoding', 'verifying'].includes(encoderState.value),
);
const durationOptions = computed(() =>
  ['permanent', 'temporary'].map((value) => ({
    value,
    label: t(`access-control.staff-credential-form.durations.${value}`),
  })),
);
// Staff members who already hold a usable credential must have it revoked first.
const staffOptions = computed(() => {
  const now = new Date().toISOString();
  return staffMembers.value.map((member) => ({
    member,
    id: member.id,
    name: member.name,
    holdsCredential: credentials.value.some(
      (credential) =>
        credential.staffMemberId === member.id && credential.isUsableAt(now),
    ),
  }));
});
const scopeOptions = computed(() =>
  Credential.staffScopes.map((value) => ({
    value,
    label: t(`access-control.access-control-terms.scopes.${value}`),
    help: t(`access-control.access-control-terms.scope-help.${value}`),
  })),
);
const selectedScope = computed(() =>
  scopeOptions.value.find((option) => option.value === form.value.scope),
);

/**
 * Encodes the staff credential and closes the drawer.
 */
const issue = async () => {
  errorCode.value = '';
  if (form.value.duration === 'temporary' && !form.value.validUntil) {
    errorCode.value = 'invalid-access-period';
    return;
  }
  try {
    const credential = await issueStaffCredential(
      new IssueStaffCredentialCommand({
        staffMemberId: form.value.staffMemberId,
        scope: form.value.scope,
        validUntil:
          form.value.duration === 'temporary'
            ? (form.value.validUntil?.toISOString() ?? '')
            : null,
      }),
    );
    emit('saved', credential);
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
          t('access-control.staff-credential-form.title')
        }}</span>
        <span class="text-sm text-color-secondary">{{
          t('access-control.staff-credential-form.subtitle')
        }}</span>
      </div>
    </template>

    <form
      id="staff-credential-form"
      class="flex flex-column gap-3"
      @submit.prevent="issue"
    >
      <div class="flex flex-column gap-2">
        <span id="staff-credential-duration" class="text-sm font-medium">{{
          t('access-control.staff-credential-form.duration')
        }}</span>
        <pv-select-button
          v-model="form.duration"
          :options="durationOptions"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          aria-labelledby="staff-credential-duration"
          fluid
        />
      </div>
      <div class="flex flex-column gap-2">
        <label for="staff-credential-member" class="text-sm font-medium">{{
          t('access-control.staff-credential-form.assigned-to')
        }}</label>
        <pv-select
          v-model="form.staffMemberId"
          input-id="staff-credential-member"
          :options="staffOptions"
          option-label="name"
          option-value="id"
          option-disabled="holdsCredential"
          :placeholder="
            t('access-control.staff-credential-form.assigned-to-placeholder')
          "
          fluid
        >
          <template #option="{ option }">
            <span class="flex flex-column">
              <span>{{ option.name }}</span>
              <small class="text-color-secondary">{{
                option.holdsCredential
                  ? t('access-control.staff-credential-form.holds-credential')
                  : option.member.role
              }}</small>
            </span>
          </template>
        </pv-select>
      </div>
      <div class="flex flex-column gap-2">
        <label for="staff-credential-scope" class="text-sm font-medium">{{
          t('access-control.staff-credential-form.scope')
        }}</label>
        <pv-select
          v-model="form.scope"
          input-id="staff-credential-scope"
          :options="scopeOptions"
          option-label="label"
          option-value="value"
          fluid
        >
          <template #option="{ option }">
            <span class="flex flex-column">
              <span>{{ option.label }}</span>
              <small class="text-color-secondary">{{ option.help }}</small>
            </span>
          </template>
        </pv-select>
        <small class="text-color-secondary">{{ selectedScope?.help }}</small>
      </div>
      <div v-if="form.duration === 'temporary'" class="flex flex-column gap-2">
        <label for="staff-credential-until" class="text-sm font-medium">{{
          t('access-control.staff-credential-form.valid-until')
        }}</label>
        <pv-date-picker
          v-model="form.validUntil"
          input-id="staff-credential-until"
          show-time
          :hour-format="locale === 'en' ? '12' : '24'"
          :min-date="new Date()"
          :manual-input="false"
          show-icon
          icon-display="input"
          required
          fluid
        />
      </div>
      <div class="flex flex-column gap-2">
        <span class="text-sm font-medium">{{
          t('access-control.staff-credential-form.encoder')
        }}</span>
        <rfid-encoder-panel :show-action="false" />
      </div>
      <pv-message
        size="small"
        severity="secondary"
        variant="simple"
        icon="pi pi-shield"
      >
        {{ t('access-control.staff-credential-form.one-credential') }}
      </pv-message>
      <pv-message v-if="errorCode" severity="error" icon="pi pi-times-circle">
        {{ t(`access-control.access-control-terms.errors.${errorCode}`) }}
      </pv-message>
    </form>

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <pv-button
          :label="t('access-control.staff-credential-form.cancel')"
          severity="secondary"
          outlined
          rounded
          :disabled="saving || encoding"
          @click="visible = false"
        />
        <pv-button
          type="submit"
          form="staff-credential-form"
          :label="t('access-control.staff-credential-form.submit')"
          icon="pi pi-wifi"
          rounded
          :loading="saving || encoding"
          :disabled="!form.staffMemberId"
        />
      </div>
    </template>
  </pv-drawer>
</template>
