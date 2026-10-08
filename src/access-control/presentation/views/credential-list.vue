<script setup>
import { computed, onBeforeUnmount, onMounted, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue';
import useAccessControlStore from '../../application/access-control.store.js';
import useRoomsStore from '../../../rooms/application/rooms.store.js';
import { formatDateTime } from '../../../shared/presentation/calendar-format.js';
import AccessControlLayout from '../components/access-control-layout.vue';
import CredentialStatusTag from '../components/credential-status-tag.vue';
import StaffCredentialForm from '../components/staff-credential-form.vue';

const { t, n, locale } = useI18n();
const router = useRouter();
const toast = useToast();
const store = useAccessControlStore();
const roomsStore = useRoomsStore();
const { credentials, currentPropertyId, saving } = toRefs(store);
const { getCredentialStatus } = store;

// Below PrimeFlex's md breakpoint the table becomes a list of credentials.
const compactQuery = window.matchMedia('(max-width: 767px)');
const compact = ref(compactQuery.matches);
const updateCompact = (event) => {
  compact.value = event.matches;
};
onMounted(() => compactQuery.addEventListener('change', updateCompact));
onBeforeUnmount(() =>
  compactQuery.removeEventListener('change', updateCompact),
);

const search = ref('');
const statusFilter = ref(null);
const holderFilter = ref(null);
const staffFormVisible = ref(false);

const credentialRows = computed(() =>
  credentials.value
    .map((credential) => ({
      id: credential.id,
      credential,
      status: getCredentialStatus(credential),
      access: credential.isGuestKeyCard
        ? (roomsStore.getRoomById(credential.roomId)?.number ?? '—')
        : t(`access-control.access-control-terms.scopes.${credential.scope}`),
    }))
    .toSorted((a, b) =>
      b.credential.issuedAt.localeCompare(a.credential.issuedAt),
    ),
);
const counts = computed(() => ({
  total: credentialRows.value.length,
  active: credentialRows.value.filter((row) => row.status === 'active').length,
  scheduled: credentialRows.value.filter((row) => row.status === 'scheduled')
    .length,
  revoked: credentialRows.value.filter((row) => row.status === 'revoked')
    .length,
}));
const filteredRows = computed(() => {
  const query = search.value.trim().toLowerCase();
  return credentialRows.value.filter(
    (row) =>
      (!statusFilter.value || row.status === statusFilter.value) &&
      (!holderFilter.value || row.credential.type === holderFilter.value) &&
      `${row.credential.cardId} ${row.credential.holderName} ${row.access}`
        .toLowerCase()
        .includes(query),
  );
});
// Avatar colors follow the credential status.
const avatarClasses = {
  active: 'bg-primary-50 text-primary',
  scheduled: 'bg-orange-50 text-orange-600',
  expired: 'surface-200 text-color-secondary',
  revoked: 'bg-red-50 text-red-600',
};
const statusOptions = computed(() =>
  ['active', 'scheduled', 'expired', 'revoked'].map((value) => ({
    value,
    label: t(`access-control.access-control-terms.statuses.${value}`),
  })),
);
const holderOptions = computed(() =>
  ['guest-key-card', 'staff-credential'].map((value) => ({
    value,
    label: t(`access-control.access-control-terms.holders.${value}`),
  })),
);
const filtersActive = computed(
  () => search.value || statusFilter.value || holderFilter.value,
);

watch(currentPropertyId, () => resetFilters());

/**
 * Clears the search text, status, and holder filters.
 */
const resetFilters = () => {
  search.value = '';
  statusFilter.value = null;
  holderFilter.value = null;
};

/**
 * Describes the access period of a credential.
 * @param {Object} credential - Credential to describe.
 * @returns {{start: string, end: string}} Localized start and end.
 */
const period = (credential) => ({
  start: formatDateTime(credential.validFrom, locale.value),
  end: credential.validUntil
    ? formatDateTime(credential.validUntil, locale.value)
    : t('access-control.credential-list.no-end-date'),
});

/**
 * Opens a credential's detail.
 * @param {Object} credential - Credential to open.
 */
const openCredential = (credential) => {
  router.push({
    name: 'access-control-credential-detail',
    params: { id: credential.id },
  });
};

/**
 * Shows the issued credential and confirms it.
 * @param {Object} credential - Issued credential.
 */
const showIssued = (credential) => {
  toast.add({
    severity: 'success',
    summary: t('access-control.credential-list.issued', {
      card: credential.cardId,
    }),
    life: 3000,
  });
  openCredential(credential);
};
</script>

<template>
  <access-control-layout>
    <template #actions>
      <router-link
        v-slot="{ navigate }"
        :to="{ name: 'access-control-events' }"
        custom
      >
        <pv-button
          :label="t('access-control.credential-list.events')"
          icon="pi pi-history"
          severity="secondary"
          outlined
          rounded
          @click="navigate"
        />
      </router-link>
      <pv-button
        :label="t('access-control.credential-list.issue')"
        icon="pi pi-plus"
        rounded
        :disabled="saving"
        @click="staffFormVisible = true"
      />
    </template>

    <section class="flex flex-column gap-3">
      <dl
        class="flex flex-wrap align-items-baseline gap-4 m-0 pb-3 border-bottom-1 surface-border"
      >
        <div class="flex align-items-baseline gap-2">
          <dd class="m-0 text-2xl font-semibold">{{ n(counts.total) }}</dd>
          <dt class="text-color-secondary">
            {{ t('access-control.credential-list.credentials', counts.total) }}
          </dt>
        </div>
        <div
          v-for="status in ['active', 'scheduled', 'revoked']"
          :key="status"
          class="flex align-items-baseline gap-2"
        >
          <dd class="m-0 text-xl font-semibold">{{ n(counts[status]) }}</dd>
          <dt class="text-color-secondary">
            {{
              t(
                `access-control.credential-list.counts.${status}`,
                counts[status],
              )
            }}
          </dt>
        </div>
      </dl>

      <div class="flex flex-wrap align-items-center gap-2">
        <pv-icon-field class="w-full md:w-20rem">
          <pv-input-icon class="pi pi-search" />
          <pv-input-text
            v-model="search"
            :placeholder="t('access-control.credential-list.search')"
            :aria-label="t('access-control.credential-list.search')"
            fluid
          />
        </pv-icon-field>
        <pv-select
          v-model="statusFilter"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          :placeholder="t('access-control.credential-list.all-statuses')"
          :aria-label="t('access-control.credential-list.status')"
          show-clear
          class="w-full sm:w-12rem"
        />
        <pv-select
          v-model="holderFilter"
          :options="holderOptions"
          option-label="label"
          option-value="value"
          :placeholder="t('access-control.credential-list.all-holders')"
          :aria-label="t('access-control.credential-list.holder')"
          show-clear
          class="w-full sm:w-12rem"
        />
        <pv-button
          v-if="filtersActive"
          :label="t('access-control.credential-list.clear')"
          icon="pi pi-filter-slash"
          severity="secondary"
          text
          @click="resetFilters"
        />
        <span class="ml-auto text-sm text-color-secondary" aria-live="polite">{{
          t('access-control.credential-list.results', filteredRows.length)
        }}</span>
      </div>

      <div
        v-if="!filteredRows.length"
        class="flex flex-column align-items-center gap-2 py-6 text-center border-1 surface-border border-round-xl"
      >
        <i
          class="pi pi-wifi text-3xl text-color-secondary"
          aria-hidden="true"
        />
        <span class="font-medium">{{
          t('access-control.credential-list.empty-title')
        }}</span>
        <span class="text-sm text-color-secondary">{{
          credentials.length
            ? t('access-control.credential-list.empty-filtered')
            : t('access-control.credential-list.empty-text')
        }}</span>
      </div>

      <ul
        v-else-if="compact"
        class="list-none m-0 p-0 surface-card border-1 surface-border border-round-xl overflow-hidden"
      >
        <li
          v-for="(row, index) in filteredRows"
          :key="row.id"
          :class="{ 'border-top-1 surface-border': index > 0 }"
        >
          <router-link
            :to="{
              name: 'access-control-credential-detail',
              params: { id: row.id },
            }"
            class="flex flex-column gap-2 px-3 py-3 text-color"
          >
            <span class="flex align-items-start justify-content-between gap-2">
              <span class="flex flex-column min-w-0">
                <span class="font-mono font-semibold">{{
                  row.credential.cardId
                }}</span>
                <span
                  class="text-sm text-color-secondary white-space-nowrap overflow-hidden text-overflow-ellipsis"
                  >{{ row.credential.holderName }}</span
                >
              </span>
              <credential-status-tag :status="row.status" />
            </span>
            <span class="text-sm text-color-secondary">{{ row.access }}</span>
          </router-link>
        </li>
      </ul>

      <pv-data-table
        v-else
        :value="filteredRows"
        data-key="id"
        row-hover
        scrollable
        paginator
        :rows="10"
        :always-show-paginator="false"
        table-style="min-width: 56rem"
        :pt="{ bodyRow: { class: 'cursor-pointer' } }"
        @row-click="openCredential($event.data.credential)"
      >
        <pv-column
          field="credential.cardId"
          :header="t('access-control.credential-list.credential')"
          sortable
        >
          <template #body="{ data }">
            <span class="flex align-items-center gap-3">
              <pv-avatar
                icon="pi pi-wifi"
                shape="square"
                :class="[
                  'flex-shrink-0 border-round-lg',
                  avatarClasses[data.status],
                ]"
                aria-hidden="true"
              />
              <span class="flex flex-column">
                <router-link
                  :to="{
                    name: 'access-control-credential-detail',
                    params: { id: data.id },
                  }"
                  class="font-mono font-semibold text-color hover:text-primary"
                  @click.stop
                  >{{ data.credential.cardId }}</router-link
                >
                <span class="text-sm text-color-secondary">{{
                  t(
                    `access-control.access-control-terms.types.${data.credential.type}`,
                  )
                }}</span>
              </span>
            </span>
          </template>
        </pv-column>
        <pv-column
          field="credential.holderName"
          :header="t('access-control.credential-list.assigned-to')"
          sortable
        >
          <template #body="{ data }">
            <span class="flex flex-column">
              <span class="font-medium">{{ data.credential.holderName }}</span>
              <span class="text-sm text-color-secondary">{{
                t(
                  `access-control.access-control-terms.holders.${data.credential.type}`,
                )
              }}</span>
            </span>
          </template>
        </pv-column>
        <pv-column
          field="access"
          :header="t('access-control.credential-list.access')"
          sortable
        >
          <template #body="{ data }">
            <span
              :class="{
                'font-mono font-semibold': data.credential.isGuestKeyCard,
              }"
              >{{ data.access }}</span
            >
          </template>
        </pv-column>
        <pv-column
          field="credential.validFrom"
          :header="t('access-control.credential-list.valid-access')"
          sortable
        >
          <template #body="{ data }">
            <span class="flex flex-column white-space-nowrap">
              <span>{{ period(data.credential).start }}</span>
              <span class="text-sm text-color-secondary">{{
                period(data.credential).end
              }}</span>
            </span>
          </template>
        </pv-column>
        <pv-column
          field="status"
          :header="t('access-control.credential-list.status')"
          sortable
        >
          <template #body="{ data }">
            <credential-status-tag :status="data.status" />
          </template>
        </pv-column>
        <pv-column style="width: 1%">
          <template #body>
            <i
              class="pi pi-chevron-right text-color-secondary"
              aria-hidden="true"
            />
          </template>
        </pv-column>
      </pv-data-table>
    </section>

    <staff-credential-form
      v-if="staffFormVisible"
      v-model:visible="staffFormVisible"
      @saved="showIssued"
    />
  </access-control-layout>
</template>
