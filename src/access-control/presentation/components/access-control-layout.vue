<script setup>
import { computed, onMounted, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import useAccessControlStore from '../../application/access-control.store.js';
import useRoomsStore from '../../../rooms/application/rooms.store.js';
import SidebarToggle from '../../../shared/presentation/components/sidebar-toggle.vue';

const props = defineProps({
  title: { type: String, default: '' },
  backRoute: { type: Object, default: null },
});

const { t } = useI18n();
const router = useRouter();
const store = useAccessControlStore();
const roomsStore = useRoomsStore();
const {
  credentialsLoaded,
  staffMembersLoaded,
  accessEventsLoaded,
  errors,
  saving,
} = toRefs(store);
const { properties, propertiesLoaded, currentPropertyId, roomsLoaded } =
  toRefs(roomsStore);
const { fetchAccessControl } = store;
const { fetchProperties, selectProperty } = roomsStore;

const noProperties = computed(
  () => propertiesLoaded.value && !properties.value.length,
);
// Credentials show room numbers, so the property's rooms must be loaded too.
const accessDataLoaded = computed(
  () =>
    credentialsLoaded.value &&
    staffMembersLoaded.value &&
    accessEventsLoaded.value &&
    roomsLoaded.value,
);
const loadErrors = computed(
  () => errors.value.length || roomsStore.errors.length,
);

onMounted(() => {
  if (!roomsStore.propertiesLoaded) fetchProperties();
});

/**
 * Returns to the credential list and loads the selected property's access.
 * @param {number} propertyId - The ID of the selected property.
 */
const changeProperty = async (propertyId) => {
  await router.push({ name: 'access-control-credentials' });
  selectProperty(propertyId);
};

/**
 * Retries loading the properties or the current property's access.
 */
const retry = () => {
  if (!propertiesLoaded.value) {
    fetchProperties();
    return;
  }
  selectProperty(currentPropertyId.value);
  fetchAccessControl();
};
</script>

<template>
  <div class="flex flex-column">
    <header
      class="sticky top-0 z-2 flex flex-wrap align-items-center gap-2 px-3 md:px-5 py-2 md:h-4rem surface-card border-bottom-1 surface-border"
    >
      <sidebar-toggle />
      <pv-divider layout="vertical" class="h-1rem min-h-0 p-0 mx-1 my-0" />
      <router-link
        v-if="props.backRoute"
        v-slot="{ navigate }"
        :to="props.backRoute"
        custom
      >
        <pv-button
          v-tooltip.bottom="t('access-control.access-control-layout.back')"
          icon="pi pi-arrow-left"
          severity="secondary"
          text
          rounded
          :aria-label="t('access-control.access-control-layout.back')"
          @click="navigate"
        />
      </router-link>
      <h1
        class="m-0 mr-auto text-xl font-semibold tracking-tight white-space-nowrap overflow-hidden text-overflow-ellipsis"
      >
        {{ props.title || t('access-control.access-control-layout.title') }}
      </h1>
      <pv-select
        :model-value="currentPropertyId"
        :options="properties"
        option-label="name"
        option-value="id"
        :aria-label="t('access-control.access-control-layout.property')"
        :disabled="saving"
        size="small"
        class="flex-order-1 md:flex-order-0 w-full md:w-14rem"
        @update:model-value="changeProperty"
      >
        <template #value="{ value }">
          <span class="flex align-items-center gap-2">
            <i class="pi pi-building text-color-secondary" aria-hidden="true" />
            <span
              class="font-medium white-space-nowrap overflow-hidden text-overflow-ellipsis"
              >{{
                properties.find((property) => property.id === value)?.name ??
                '—'
              }}</span
            >
          </span>
        </template>
      </pv-select>
      <slot name="actions" />
    </header>

    <div class="flex flex-column gap-4 p-3 md:px-5 md:pt-4 md:pb-5">
      <pv-message v-if="noProperties" severity="warn" icon="pi pi-info-circle">
        {{ t('access-control.access-control-terms.errors.no-properties') }}
      </pv-message>
      <pv-message
        v-else-if="loadErrors && !accessDataLoaded"
        severity="error"
        icon="pi pi-exclamation-circle"
      >
        <div
          class="flex flex-column sm:flex-row sm:align-items-center justify-content-between gap-3"
        >
          <span>{{
            t('access-control.access-control-terms.errors.connection')
          }}</span>
          <pv-button
            :label="t('access-control.access-control-layout.retry')"
            icon="pi pi-refresh"
            severity="danger"
            size="small"
            @click="retry"
          />
        </div>
      </pv-message>
      <div
        v-else-if="!accessDataLoaded"
        class="flex flex-column align-items-center gap-3 py-8 text-color-secondary"
        role="status"
      >
        <pv-progress-spinner
          :stroke-width="4"
          class="w-3rem h-3rem"
          aria-hidden="true"
        />
        <span>{{ t('access-control.access-control-layout.loading') }}</span>
      </div>
      <slot v-else />
    </div>
  </div>
</template>
