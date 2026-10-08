<script setup>
import { computed, onMounted, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import useInventoryStore from '../../application/inventory.store.js';
import SidebarToggle from '../../../shared/presentation/components/sidebar-toggle.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useInventoryStore();
const {
  properties,
  propertiesLoaded,
  currentPropertyId,
  inventoryItemsLoaded,
  storageLocationsLoaded,
  errors,
  saving,
} = toRefs(store);
const { fetchProperties, selectProperty } = store;

const tabs = [
  {
    value: 'inventory-items',
    label: 'inventory.inventory-layout.inventory-items',
    icon: 'pi pi-box',
  },
  {
    value: 'inventory-storage-locations',
    label: 'inventory.inventory-layout.storage-locations',
    icon: 'pi pi-building',
  },
];
const activeTab = computed(() =>
  route.name?.startsWith('inventory-storage-location')
    ? 'inventory-storage-locations'
    : 'inventory-items',
);
const noProperties = computed(
  () => propertiesLoaded.value && !properties.value.length,
);
const inventoryLoaded = computed(
  () => inventoryItemsLoaded.value && storageLocationsLoaded.value,
);

onMounted(() => {
  if (!store.propertiesLoaded) fetchProperties();
});

/**
 * Navigates to the active tab's list and loads the selected property's inventory.
 * @param {number} propertyId - The ID of the selected property.
 */
const changeProperty = async (propertyId) => {
  await router.push({ name: activeTab.value });
  selectProperty(propertyId);
};

/**
 * Retries loading the properties or the current property's inventory.
 */
const retry = () => {
  if (propertiesLoaded.value) selectProperty(currentPropertyId.value);
  else fetchProperties();
};
</script>

<template>
  <div class="flex flex-column">
    <header
      class="sticky top-0 z-2 flex flex-wrap align-items-center gap-2 px-3 md:px-5 py-2 md:h-4rem surface-card border-bottom-1 surface-border"
    >
      <sidebar-toggle />
      <pv-divider layout="vertical" class="h-1rem min-h-0 p-0 mx-1 my-0" />
      <h1
        class="m-0 mr-auto text-xl font-semibold tracking-tight white-space-nowrap"
      >
        {{ t('inventory.inventory-layout.title') }}
      </h1>
      <pv-select
        :model-value="currentPropertyId"
        :options="properties"
        option-label="name"
        option-value="id"
        :aria-label="t('inventory.inventory-layout.property')"
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
      <pv-tabs :value="activeTab">
        <pv-tab-list>
          <pv-tab
            v-for="tab in tabs"
            :key="tab.value"
            :value="tab.value"
            :as="RouterLink"
            :to="{ name: tab.value }"
            class="flex align-items-center gap-2"
          >
            <i :class="tab.icon" aria-hidden="true" />
            <span>{{ t(tab.label) }}</span>
          </pv-tab>
        </pv-tab-list>
      </pv-tabs>

      <pv-message v-if="noProperties" severity="warn" icon="pi pi-info-circle">
        {{ t('inventory.inventory-terms.errors.no-properties') }}
      </pv-message>
      <pv-message
        v-else-if="errors.length && !inventoryLoaded"
        severity="error"
        icon="pi pi-exclamation-circle"
      >
        <div
          class="flex flex-column sm:flex-row sm:align-items-center justify-content-between gap-3"
        >
          <span>{{ t('inventory.inventory-terms.errors.connection') }}</span>
          <pv-button
            :label="t('inventory.inventory-layout.retry')"
            icon="pi pi-refresh"
            severity="danger"
            size="small"
            @click="retry"
          />
        </div>
      </pv-message>
      <div
        v-else-if="!inventoryLoaded"
        class="flex flex-column align-items-center gap-3 py-8 text-color-secondary"
        role="status"
      >
        <pv-progress-spinner
          :stroke-width="4"
          class="w-3rem h-3rem"
          aria-hidden="true"
        />
        <span>{{ t('inventory.inventory-layout.loading') }}</span>
      </div>
      <slot v-else />
    </div>
  </div>
</template>
