<script setup>
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue';
import useAccessControlStore from '../../application/access-control.store.js';
import useRoomsStore from '../../../rooms/application/rooms.store.js';
import { formatDateTime } from '../../../shared/presentation/calendar-format.js';
import AccessControlLayout from '../components/access-control-layout.vue';
import CredentialStatusTag from '../components/credential-status-tag.vue';
import RevokeCredentialDialog from '../components/revoke-credential-dialog.vue';
import ReplaceCredentialDrawer from '../components/replace-credential-drawer.vue';
import AccessEventDrawer from '../components/access-event-drawer.vue';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const store = useAccessControlStore();
const roomsStore = useRoomsStore();
const { saving } = toRefs(store);
const { currentProperty } = toRefs(roomsStore);
const {
  getCredentialById,
  getCredentialStatus,
  getEventsOfCredential,
  getStaffMemberById,
} = store;

const revokeDialogVisible = ref(false);
const replaceDrawerVisible = ref(false);
const selectedEvent = ref(null);

const credential = computed(() => getCredentialById(route.params.id));
const status = computed(() => getCredentialStatus(credential.value));
const usable = computed(() => ['active', 'scheduled'].includes(status.value));
const room = computed(() => roomsStore.getRoomById(credential.value?.roomId));
const staffMember = computed(() =>
  getStaffMemberById(credential.value?.staffMemberId),
);
const access = computed(() =>
  credential.value.isGuestKeyCard
    ? t('access-control.access-control-terms.room-number', {
        number: room.value?.number ?? '—',
      })
    : t(`access-control.access-control-terms.scopes.${credential.value.scope}`),
);
const recentEvents = computed(() =>
  getEventsOfCredential(credential.value.id).slice(0, 6),
);
const breadcrumbItems = computed(() => [
  {
    label: t('access-control.access-control-layout.title'),
    route: { name: 'access-control-credentials' },
  },
  { label: credential.value?.cardId },
]);
const details = computed(() => [
  {
    label: t('access-control.credential-detail.type'),
    value: t(
      `access-control.access-control-terms.types.${credential.value.type}`,
    ),
  },
  {
    label: t('access-control.credential-detail.issued'),
    value: dateTime(credential.value.issuedAt),
  },
  {
    label: t('access-control.credential-detail.by'),
    value: operatorName(credential.value.issuedBy),
  },
]);
const revocationFacts = computed(() => [
  {
    label: t('access-control.credential-detail.revoked-at'),
    value: dateTime(credential.value.revokedAt),
  },
  {
    label: t('access-control.credential-detail.by'),
    value: operatorName(credential.value.revokedBy),
  },
  {
    label: t('access-control.credential-detail.reason'),
    value: t(
      `access-control.access-control-terms.revocation-reasons.${credential.value.revocationReason}`,
    ),
  },
]);

/**
 * Formats a moment of the credential.
 * @param {?string} value - ISO date-time.
 * @returns {string} Localized date and time.
 */
const dateTime = (value) => (value ? formatDateTime(value, locale.value) : '—');

/**
 * Returns the display name of the operator who changed the credential.
 * @param {?string} operator - Recorded operator.
 * @returns {string} Localized operator name.
 */
const operatorName = (operator) =>
  operator === 'Demo operator'
    ? t('access-control.access-control-terms.demo-operator')
    : (operator ?? '—');

/**
 * Confirms that the credential was revoked.
 */
const notifyRevoked = () => {
  toast.add({
    severity: 'success',
    summary: t('access-control.credential-detail.revoked'),
    life: 3000,
  });
};

/**
 * Opens the replacement card and confirms it.
 * @param {Object} replacement - Replacement credential.
 */
const showReplacement = (replacement) => {
  toast.add({
    severity: 'success',
    summary: t('access-control.credential-detail.replaced', {
      card: replacement.cardId,
    }),
    life: 3000,
  });
  router.push({
    name: 'access-control-credential-detail',
    params: { id: replacement.id },
  });
};
</script>

<template>
  <access-control-layout>
    <template v-if="credential">
      <pv-breadcrumb :model="breadcrumbItems" class="p-0 bg-transparent">
        <template #item="{ item }">
          <router-link
            v-if="item.route"
            :to="item.route"
            class="text-color-secondary hover:text-primary"
            >{{ item.label }}</router-link
          >
          <span v-else class="font-mono font-medium">{{ item.label }}</span>
        </template>
      </pv-breadcrumb>

      <header
        class="flex flex-column md:flex-row md:align-items-center gap-3 pb-4 border-bottom-1 surface-border"
      >
        <div class="flex align-items-center gap-3 flex-1 min-w-0">
          <pv-avatar
            icon="pi pi-wifi"
            size="large"
            shape="square"
            class="flex-shrink-0 bg-primary-50 text-primary border-round-lg"
            aria-hidden="true"
          />
          <div class="flex flex-column gap-1 min-w-0">
            <div class="flex flex-wrap align-items-center gap-2">
              <h2 class="m-0 text-2xl font-bold font-mono tracking-tight">
                RFID {{ credential.cardId }}
              </h2>
              <credential-status-tag :status="status" />
            </div>
            <span class="text-sm text-color-secondary">{{
              t('access-control.credential-detail.assigned-to', {
                name: credential.holderName,
              })
            }}</span>
          </div>
        </div>
        <div v-if="usable" class="flex flex-wrap align-items-center gap-2">
          <pv-button
            :label="t('access-control.credential-detail.revoke')"
            icon="pi pi-ban"
            severity="danger"
            outlined
            rounded
            :disabled="saving"
            @click="revokeDialogVisible = true"
          />
          <pv-button
            :label="t('access-control.credential-detail.replace')"
            icon="pi pi-sync"
            rounded
            :disabled="saving"
            @click="replaceDrawerVisible = true"
          />
        </div>
      </header>

      <section
        class="grid grid-nogutter gap-3 md:gap-0 p-4 surface-card border-1 surface-border border-round-xl"
      >
        <div class="col-12 md:col-3 flex flex-column gap-1">
          <span class="text-sm text-color-secondary">{{
            t('access-control.credential-detail.status')
          }}</span>
          <span><credential-status-tag :status="status" /></span>
        </div>
        <div class="col-12 md:col-3 flex flex-column gap-1">
          <span class="text-sm text-color-secondary">{{
            t('access-control.credential-detail.holder')
          }}</span>
          <span class="font-semibold">{{ credential.holderName }}</span>
          <span class="text-sm text-color-secondary">{{
            credential.isGuestKeyCard
              ? t('access-control.access-control-terms.holders.guest-key-card')
              : (staffMember?.role ?? '')
          }}</span>
        </div>
        <div class="col-12 md:col-2 flex flex-column gap-1">
          <span class="text-sm text-color-secondary">{{
            t('access-control.credential-detail.access')
          }}</span>
          <span
            :class="[
              'font-semibold',
              { 'font-mono text-xl': credential.isGuestKeyCard },
            ]"
            >{{
              credential.isGuestKeyCard ? (room?.number ?? '—') : access
            }}</span
          >
        </div>
        <div class="col-12 md:col-4 flex flex-column gap-1">
          <span class="text-sm text-color-secondary">{{
            t('access-control.credential-detail.valid-access')
          }}</span>
          <span class="font-medium"
            >{{ dateTime(credential.validFrom) }} —
            {{
              credential.validUntil
                ? dateTime(credential.validUntil)
                : t('access-control.credential-list.no-end-date')
            }}</span
          >
        </div>
      </section>

      <div class="grid">
        <div class="col-12 xl:col-8">
          <div
            class="flex flex-column gap-4 h-full p-4 surface-card border-1 surface-border border-round-xl"
          >
            <section class="flex flex-column gap-3">
              <h3
                class="flex align-items-center gap-2 m-0 text-base font-semibold"
              >
                <i
                  class="pi pi-calendar text-color-secondary"
                  aria-hidden="true"
                />
                {{ t('access-control.credential-detail.period') }}
              </h3>
              <div
                class="flex align-items-center justify-content-between gap-3 p-3 surface-50 border-round-lg"
              >
                <span class="flex flex-column gap-1">
                  <span class="text-sm text-color-secondary">{{
                    t('access-control.credential-detail.starts')
                  }}</span>
                  <span class="font-semibold">{{
                    dateTime(credential.validFrom)
                  }}</span>
                  <span
                    v-if="credential.isGuestKeyCard"
                    class="text-sm text-color-secondary"
                    >{{ t('access-control.credential-detail.check-in') }}</span
                  >
                </span>
                <i
                  class="pi pi-arrow-right text-color-secondary"
                  aria-hidden="true"
                />
                <span class="flex flex-column align-items-end gap-1">
                  <span class="text-sm text-color-secondary">{{
                    t('access-control.credential-detail.ends')
                  }}</span>
                  <span class="font-semibold">{{
                    credential.validUntil
                      ? dateTime(credential.validUntil)
                      : t('access-control.credential-list.no-end-date')
                  }}</span>
                  <span
                    v-if="credential.isGuestKeyCard"
                    class="text-sm text-color-secondary"
                    >{{ t('access-control.credential-detail.check-out') }}</span
                  >
                </span>
              </div>
            </section>

            <section class="flex flex-column gap-3">
              <div
                class="flex align-items-center justify-content-between gap-2"
              >
                <h3
                  class="flex align-items-center gap-2 m-0 text-base font-semibold"
                >
                  <i
                    class="pi pi-history text-color-secondary"
                    aria-hidden="true"
                  />
                  {{ t('access-control.credential-detail.recent-events') }}
                </h3>
                <router-link
                  :to="{
                    name: 'access-control-events',
                    query: { search: credential.cardId },
                  }"
                  class="text-sm font-medium"
                  >{{
                    t('access-control.credential-detail.all-events')
                  }}</router-link
                >
              </div>
              <ul
                v-if="recentEvents.length"
                class="list-none m-0 p-0 flex flex-column"
              >
                <li
                  v-for="(accessEvent, index) in recentEvents"
                  :key="accessEvent.id"
                  :class="{ 'border-top-1 surface-border': index > 0 }"
                >
                  <button
                    type="button"
                    class="flex align-items-center gap-3 w-full py-2 px-0 border-none bg-transparent text-left cursor-pointer text-color"
                    @click="selectedEvent = accessEvent"
                  >
                    <pv-avatar
                      :icon="
                        accessEvent.isDenied ? 'pi pi-ban' : 'pi pi-sign-in'
                      "
                      shape="square"
                      :class="[
                        'flex-shrink-0 border-round-lg',
                        accessEvent.isDenied
                          ? 'bg-red-50 text-red-600'
                          : 'bg-green-50 text-green-700',
                      ]"
                      aria-hidden="true"
                    />
                    <span class="flex flex-column flex-1 min-w-0">
                      <span class="font-medium">{{
                        t(
                          `access-control.access-control-terms.results.${accessEvent.result}`,
                        )
                      }}</span>
                      <span class="text-sm text-color-secondary">{{
                        accessEvent.isDenied
                          ? t(
                              `access-control.access-control-terms.denial-reasons.${accessEvent.denialReason}`,
                            )
                          : t(
                              `access-control.access-control-terms.access-points.${accessEvent.accessPoint}`,
                            )
                      }}</span>
                    </span>
                    <span
                      class="text-sm text-color-secondary white-space-nowrap"
                      >{{ dateTime(accessEvent.occurredAt) }}</span
                    >
                  </button>
                </li>
              </ul>
              <p v-else class="m-0 text-sm text-color-secondary">
                {{ t('access-control.credential-detail.no-events') }}
              </p>
            </section>
          </div>
        </div>

        <aside class="col-12 xl:col-4 flex flex-column gap-3">
          <section
            v-if="status === 'revoked'"
            class="flex flex-column gap-3 p-4 surface-card border-1 surface-border border-round-xl"
          >
            <h3
              class="flex align-items-center gap-2 m-0 text-base font-semibold"
            >
              <i class="pi pi-ban text-red-600" aria-hidden="true" />
              {{ t('access-control.credential-detail.revocation') }}
            </h3>
            <dl class="flex flex-column gap-2 m-0">
              <div
                v-for="fact in revocationFacts"
                :key="fact.label"
                class="flex justify-content-between gap-3"
              >
                <dt class="text-color-secondary">{{ fact.label }}</dt>
                <dd class="m-0 text-right font-medium">{{ fact.value }}</dd>
              </div>
            </dl>
            <p
              v-if="credential.revocationNote"
              class="m-0 p-3 surface-50 border-round-lg text-sm line-height-3"
            >
              {{ credential.revocationNote }}
            </p>
          </section>

          <section
            class="flex flex-column gap-3 p-4 surface-50 border-1 surface-border border-round-xl"
          >
            <h3
              class="flex align-items-center gap-2 m-0 text-base font-semibold"
            >
              <i
                class="pi pi-info-circle text-color-secondary"
                aria-hidden="true"
              />
              {{ t('access-control.credential-detail.details') }}
            </h3>
            <dl class="flex flex-column gap-2 m-0">
              <div
                v-for="fact in details"
                :key="fact.label"
                class="flex justify-content-between gap-3"
              >
                <dt class="text-color-secondary">{{ fact.label }}</dt>
                <dd class="m-0 text-right font-medium">{{ fact.value }}</dd>
              </div>
            </dl>
            <pv-divider class="m-0" />
            <h3
              class="flex align-items-center gap-2 m-0 text-base font-semibold"
            >
              <i class="pi pi-link text-color-secondary" aria-hidden="true" />
              {{ t('access-control.credential-detail.scope') }}
            </h3>
            <dl class="flex flex-column gap-2 m-0">
              <div class="flex justify-content-between gap-3">
                <dt class="text-color-secondary">
                  {{ t('access-control.credential-detail.property') }}
                </dt>
                <dd class="m-0 text-right font-medium">
                  {{ currentProperty?.name }}
                </dd>
              </div>
              <div class="flex justify-content-between gap-3">
                <dt class="text-color-secondary">
                  {{ t('access-control.credential-detail.access') }}
                </dt>
                <dd class="m-0 text-right font-medium">{{ access }}</dd>
              </div>
              <div
                v-if="credential.isGuestKeyCard"
                class="flex justify-content-between gap-3"
              >
                <dt class="text-color-secondary">
                  {{ t('access-control.credential-detail.booking') }}
                </dt>
                <dd class="m-0 text-right">
                  <router-link
                    :to="{
                      name: 'bookings-booking-detail',
                      params: { id: credential.bookingId },
                    }"
                    class="font-mono font-medium"
                    >{{ credential.bookingCode }}
                    <i class="pi pi-external-link text-xs" aria-hidden="true"
                  /></router-link>
                </dd>
              </div>
            </dl>
            <span
              v-if="credential.isGuestKeyCard"
              class="flex align-items-center gap-2 text-sm text-color-secondary"
            >
              <i class="pi pi-lock text-sm" aria-hidden="true" />
              {{ t('access-control.credential-detail.ends-at-check-out') }}
            </span>
          </section>
        </aside>
      </div>

      <revoke-credential-dialog
        v-if="revokeDialogVisible"
        v-model:visible="revokeDialogVisible"
        :credential="credential"
        :access="access"
        @saved="notifyRevoked"
      />
      <replace-credential-drawer
        v-if="replaceDrawerVisible"
        v-model:visible="replaceDrawerVisible"
        :credential="credential"
        @saved="showReplacement"
      />
      <access-event-drawer
        v-if="selectedEvent"
        :visible="!!selectedEvent"
        :access-event="selectedEvent"
        @update:visible="(value) => !value && (selectedEvent = null)"
      />
    </template>
    <pv-message v-else severity="warn" icon="pi pi-search">
      <div class="flex flex-column sm:flex-row sm:align-items-center gap-3">
        <span>{{ t('access-control.credential-detail.not-found') }}</span>
        <router-link
          :to="{ name: 'access-control-credentials' }"
          class="font-medium"
          >{{ t('access-control.credential-detail.back') }}</router-link
        >
      </div>
    </pv-message>
  </access-control-layout>
</template>
