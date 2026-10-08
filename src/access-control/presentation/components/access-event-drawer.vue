<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import useAccessControlStore from '../../application/access-control.store.js';
import useRoomsStore from '../../../rooms/application/rooms.store.js';
import { formatDateTime } from '../../../shared/presentation/calendar-format.js';

const props = defineProps({
  accessEvent: { type: Object, required: true },
});
const visible = defineModel('visible', { type: Boolean });

const { t, locale } = useI18n();
const store = useAccessControlStore();
const roomsStore = useRoomsStore();

const credential = computed(() =>
  store.getCredentialById(props.accessEvent.credentialId),
);
const facts = computed(() => [
  {
    label: t('access-control.access-event-drawer.time'),
    value: formatDateTime(props.accessEvent.occurredAt, locale.value),
  },
  {
    label: t('access-control.access-event-drawer.person'),
    value: `${props.accessEvent.holderName} · ${t(
      `access-control.access-control-terms.holder-types.${props.accessEvent.holderType}`,
    )}`,
  },
  {
    label: t('access-control.access-event-drawer.access-point'),
    value: t(
      `access-control.access-control-terms.access-points.${props.accessEvent.accessPoint}`,
    ),
  },
  {
    label: t('access-control.access-event-drawer.access'),
    value: props.accessEvent.roomId
      ? t('access-control.access-control-terms.room-number', {
          number:
            roomsStore.getRoomById(props.accessEvent.roomId)?.number ?? '—',
        })
      : credential.value?.scope
        ? t(
            `access-control.access-control-terms.scopes.${credential.value.scope}`,
          )
        : '—',
  },
]);
</script>

<template>
  <pv-drawer
    v-model:visible="visible"
    position="right"
    class="w-full md:w-30rem"
    block-scroll
  >
    <template #header>
      <div class="flex flex-column">
        <span class="text-xl font-bold">{{
          accessEvent.isDenied
            ? t('access-control.access-event-drawer.denied-title')
            : t('access-control.access-event-drawer.granted-title')
        }}</span>
        <span class="font-mono text-sm text-color-secondary"
          >EVT-{{ String(accessEvent.id).padStart(5, '0') }}</span
        >
      </div>
    </template>

    <div class="flex flex-column gap-4">
      <pv-message
        :severity="accessEvent.isDenied ? 'error' : 'success'"
        :icon="accessEvent.isDenied ? 'pi pi-ban' : 'pi pi-sign-in'"
      >
        <div class="flex flex-column gap-1">
          <span class="font-semibold">{{
            accessEvent.isDenied
              ? t(
                  `access-control.access-control-terms.denial-reasons.${accessEvent.denialReason}`,
                )
              : t('access-control.access-control-terms.results.granted')
          }}</span>
          <span>{{
            accessEvent.isDenied
              ? t('access-control.access-event-drawer.denied-text')
              : t('access-control.access-event-drawer.granted-text')
          }}</span>
        </div>
      </pv-message>
      <dl class="flex flex-column m-0">
        <div
          class="flex justify-content-between gap-3 py-2 border-bottom-1 surface-border"
        >
          <dt class="text-color-secondary">
            {{ t('access-control.access-event-drawer.credential') }}
          </dt>
          <dd class="m-0 text-right">
            <router-link
              v-if="credential"
              :to="{
                name: 'access-control-credential-detail',
                params: { id: credential.id },
              }"
              class="font-mono font-semibold"
              @click="visible = false"
              >RFID {{ accessEvent.cardId }}</router-link
            >
            <span v-else class="font-mono font-semibold"
              >RFID {{ accessEvent.cardId }}</span
            >
          </dd>
        </div>
        <div
          v-for="fact in facts"
          :key="fact.label"
          class="flex justify-content-between gap-3 py-2 border-bottom-1 surface-border"
        >
          <dt class="text-color-secondary">{{ fact.label }}</dt>
          <dd class="m-0 text-right font-medium">{{ fact.value }}</dd>
        </div>
      </dl>
      <pv-message
        v-if="accessEvent.isDenied"
        severity="warn"
        size="small"
        icon="pi pi-info-circle"
      >
        {{
          t(
            `access-control.access-event-drawer.denial-help.${accessEvent.denialReason}`,
          )
        }}
      </pv-message>
    </div>

    <template #footer>
      <div class="flex justify-content-end">
        <pv-button
          :label="t('access-control.access-event-drawer.close')"
          rounded
          @click="visible = false"
        />
      </div>
    </template>
  </pv-drawer>
</template>
