<script setup>
import { computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useConfirm, useToast } from 'primevue';
import useInventoryStore from '../../application/inventory.store.js';
import { InventoryError } from '../../domain/model/inventory.error.js';
import { StorageLocation } from '../../domain/model/storage-location.entity.js';
import InventoryLayout from '../components/inventory-layout.vue';
import StorageLocationAvatar from '../components/storage-location-avatar.vue';
import StorageLocationForm from '../components/storage-location-form.vue';

const { t, n } = useI18n();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const store = useInventoryStore();
const {
  inventoryItems,
  storageLocations,
  storageLocationsCount,
  currentPropertyId,
  saving,
} = toRefs(store);
const { deleteStorageLocation } = store;

const search = ref('');
const typeFilter = ref('all');
const storageLocationFormVisible = ref(false);
const selectedStorageLocation = ref(null);

const typeOptions = computed(() => [
  {
    value: 'all',
    label: t('inventory.storage-location-list.all'),
    count: storageLocationsCount.value,
  },
  ...StorageLocation.types.map((value) => ({
    value,
    label: t(`inventory.inventory-terms.location-types.${value}`),
    count: storageLocations.value.filter(
      (storageLocation) => storageLocation.type === value,
    ).length,
  })),
]);
const filteredStorageLocations = computed(() => {
  const query = search.value.trim().toLowerCase();
  return storageLocations.value.filter(
    (storageLocation) =>
      `${storageLocation.name} ${storageLocation.code}`
        .toLowerCase()
        .includes(query) &&
      (typeFilter.value === 'all' || storageLocation.type === typeFilter.value),
  );
});

watch(currentPropertyId, () => resetFilters());

/**
 * Lists the inventory items assigned to a storage location.
 * @param {number} id - The ID of the storage location.
 * @returns {Array<Object>} - Assigned inventory items.
 */
const assignedItems = (id) =>
  inventoryItems.value.filter((item) =>
    item.stocks.some((stock) => stock.locationId === id),
  );

/**
 * Counts the assigned inventory items that need attention.
 * @param {number} id - The ID of the storage location.
 * @returns {number} - Number of low-stock or out-of-stock items.
 */
const stockAlertsCount = (id) =>
  assignedItems(id).filter((item) => item.stockCondition !== 'in-stock').length;

/**
 * Clears the search text and the type filter.
 */
const resetFilters = () => {
  search.value = '';
  typeFilter.value = 'all';
};

/**
 * Navigates to the storage location detail page.
 * @param {number} id - The ID of the storage location.
 */
const navigateToDetail = (id) => {
  router.push({ name: 'inventory-storage-location-detail', params: { id } });
};

/**
 * Opens the storage location form to add or edit a location.
 * @param {Object|null} storageLocation - The storage location to edit, or null to add one.
 */
const openStorageLocationForm = (storageLocation = null) => {
  selectedStorageLocation.value = storageLocation;
  storageLocationFormVisible.value = true;
};

/**
 * Confirms that changes were saved.
 */
const notifySaved = () => {
  toast.add({
    severity: 'success',
    summary: t('inventory.storage-location-list.saved'),
    life: 3000,
  });
};

/**
 * Confirm deletion of a storage location and execute deletion if confirmed.
 * @param {Object} storageLocation - The storage location to delete.
 */
const confirmDelete = (storageLocation) => {
  confirm.require({
    message: t('inventory.storage-location-list.confirm-delete', {
      name: storageLocation.name,
    }),
    header: t('inventory.storage-location-list.delete-header'),
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: t('inventory.storage-location-list.confirm'),
    rejectLabel: t('inventory.storage-location-list.cancel'),
    acceptProps: { severity: 'danger' },
    rejectProps: { severity: 'secondary', outlined: true },
    accept: async () => {
      try {
        await deleteStorageLocation(storageLocation);
        toast.add({
          severity: 'success',
          summary: t('inventory.storage-location-list.removed'),
          life: 3000,
        });
      } catch (error) {
        const errorCode =
          error instanceof InventoryError ? error.code : 'connection';
        toast.add({
          severity: 'error',
          summary: t(`inventory.inventory-terms.errors.${errorCode}`),
          life: 6000,
        });
      }
    },
  });
};
</script>

<template>
  <inventory-layout>
    <template #actions>
      <pv-button
        :label="t('inventory.storage-location-list.new')"
        icon="pi pi-plus"
        rounded
        :disabled="saving"
        @click="openStorageLocationForm()"
      />
    </template>

    <section class="flex flex-column gap-3">
      <div class="flex align-items-center gap-2 overflow-x-auto">
        <pv-select-button
          v-model="typeFilter"
          :options="typeOptions"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          :aria-label="t('inventory.storage-location-list.type')"
          class="flex-shrink-0"
        >
          <template #option="{ option }">
            <span class="flex align-items-center gap-2 white-space-nowrap">
              <span>{{ option.label }}</span>
              <span class="font-mono text-sm opacity-70">{{
                n(option.count)
              }}</span>
            </span>
          </template>
        </pv-select-button>
      </div>
      <div class="flex flex-wrap align-items-center gap-2">
        <pv-icon-field class="w-full md:w-20rem">
          <pv-input-icon class="pi pi-search" />
          <pv-input-text
            v-model="search"
            :placeholder="t('inventory.storage-location-list.search')"
            :aria-label="t('inventory.storage-location-list.search')"
            fluid
          />
        </pv-icon-field>
        <pv-button
          v-if="search || typeFilter !== 'all'"
          :label="t('inventory.storage-location-list.clear')"
          icon="pi pi-filter-slash"
          severity="secondary"
          text
          @click="resetFilters"
        />
        <span class="ml-auto text-sm text-color-secondary" aria-live="polite">{{
          t(
            'inventory.storage-location-list.results',
            filteredStorageLocations.length,
          )
        }}</span>
      </div>

      <pv-data-table
        :value="filteredStorageLocations"
        data-key="id"
        paginator
        :rows="10"
        :always-show-paginator="false"
        row-hover
        scrollable
        table-style="min-width: 56rem"
        class="cursor-pointer"
        @row-click="navigateToDetail($event.data.id)"
      >
        <template #empty>
          <div
            class="flex flex-column align-items-center gap-2 py-6 text-center"
          >
            <i class="pi pi-building text-3xl text-color-secondary" />
            <span class="font-medium">{{
              t('inventory.storage-location-list.empty-title')
            }}</span>
            <span class="text-sm text-color-secondary">{{
              t('inventory.storage-location-list.empty-text')
            }}</span>
          </div>
        </template>
        <pv-column
          field="name"
          :header="t('inventory.storage-location-list.name')"
          sortable
        >
          <template #body="{ data }">
            <router-link
              :to="{
                name: 'inventory-storage-location-detail',
                params: { id: data.id },
              }"
              class="flex align-items-center gap-3 text-color"
              @click.stop
            >
              <storage-location-avatar :type="data.type" />
              <span class="flex flex-column">
                <span class="font-semibold white-space-nowrap">{{
                  data.name
                }}</span>
                <span class="font-mono text-sm text-color-secondary">{{
                  data.code
                }}</span>
              </span>
            </router-link>
          </template>
        </pv-column>
        <pv-column :header="t('inventory.storage-location-list.type')">
          <template #body="{ data }">{{
            t(`inventory.inventory-terms.location-types.${data.type}`)
          }}</template>
        </pv-column>
        <pv-column
          :header="t('inventory.storage-location-list.assigned-items')"
        >
          <template #body="{ data }">
            <span class="font-mono">{{
              n(assignedItems(data.id).length)
            }}</span>
          </template>
        </pv-column>
        <pv-column :header="t('inventory.storage-location-list.alerts')">
          <template #body="{ data }">
            <pv-tag
              v-if="stockAlertsCount(data.id)"
              severity="warn"
              :value="
                t(
                  'inventory.storage-location-list.alerts-count',
                  stockAlertsCount(data.id),
                )
              "
            />
            <pv-tag
              v-else
              severity="success"
              :value="t('inventory.storage-location-list.no-alerts')"
            />
          </template>
        </pv-column>
        <pv-column
          field="area"
          :header="t('inventory.storage-location-list.area')"
        />
        <pv-column
          field="responsibleTeam"
          :header="t('inventory.storage-location-list.team')"
        />
        <pv-column
          :header="t('inventory.storage-location-list.actions')"
          class="text-right white-space-nowrap"
          style="width: 1%"
          :pt="{ columnHeaderContent: { class: 'justify-content-end' } }"
        >
          <template #body="{ data }">
            <div class="flex justify-content-end gap-1">
              <pv-button
                v-tooltip.top="t('inventory.storage-location-list.edit')"
                icon="pi pi-pencil"
                severity="secondary"
                text
                rounded
                :aria-label="`${t('inventory.storage-location-list.edit')}: ${data.name}`"
                :disabled="saving"
                @click.stop="openStorageLocationForm(data)"
              />
              <pv-button
                v-tooltip.top="t('inventory.storage-location-list.delete')"
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                :aria-label="`${t('inventory.storage-location-list.delete')}: ${data.name}`"
                :disabled="saving"
                @click.stop="confirmDelete(data)"
              />
            </div>
          </template>
        </pv-column>
      </pv-data-table>
    </section>

    <storage-location-form
      v-if="storageLocationFormVisible"
      v-model:visible="storageLocationFormVisible"
      :storage-location="selectedStorageLocation"
      @saved="notifySaved"
    />
  </inventory-layout>
</template>
