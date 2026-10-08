<script setup>
import { computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue';
import useInventoryStore from '../../application/inventory.store.js';
import InventoryLayout from '../components/inventory-layout.vue';
import InventoryItemAvatar from '../components/inventory-item-avatar.vue';
import InventoryItemForm from '../components/inventory-item-form.vue';
import StockAdjustmentForm from '../components/stock-adjustment-form.vue';
import StockConditionTag from '../components/stock-condition-tag.vue';

const { t, n } = useI18n();
const router = useRouter();
const toast = useToast();
const store = useInventoryStore();
const {
  inventoryItems,
  inventoryItemsCount,
  storageLocations,
  currentPropertyId,
  saving,
} = toRefs(store);
const { getStorageLocationById } = store;

const search = ref('');
const locationFilter = ref(null);
const categoryFilter = ref(null);
const conditionFilter = ref('all');
const inventoryItemFormVisible = ref(false);
const stockAdjustmentFormVisible = ref(false);
const selectedInventoryItem = ref(null);

const categoryOptions = computed(() =>
  [...new Set(inventoryItems.value.map((item) => item.category))].map(
    (value) => ({
      value,
      label: t(`inventory.inventory-terms.categories.${value}`),
    }),
  ),
);
const conditionDots = {
  'in-stock': 'text-green-600',
  'low-stock': 'text-orange-500',
  'out-of-stock': 'text-red-500',
};
const conditionOptions = computed(() => [
  {
    value: 'all',
    label: t('inventory.inventory-item-list.all'),
    count: inventoryItemsCount.value,
  },
  ...['in-stock', 'low-stock', 'out-of-stock'].map((value) => ({
    value,
    label: t(`inventory.inventory-terms.conditions.${value}`),
    count: inventoryItems.value.filter((item) => item.stockCondition === value)
      .length,
    dot: conditionDots[value],
  })),
]);
const filteredInventoryItems = computed(() => {
  const query = search.value.trim().toLowerCase();
  return inventoryItems.value.filter(
    (item) =>
      (!query || `${item.name} ${item.code}`.toLowerCase().includes(query)) &&
      (!categoryFilter.value || item.category === categoryFilter.value) &&
      (conditionFilter.value === 'all' ||
        item.stockCondition === conditionFilter.value) &&
      (!locationFilter.value ||
        item.stocks.some((stock) => stock.locationId === locationFilter.value)),
  );
});
const filtersApplied = computed(
  () =>
    !!(
      search.value ||
      locationFilter.value ||
      categoryFilter.value ||
      conditionFilter.value !== 'all'
    ),
);

watch(currentPropertyId, () => resetFilters());

/**
 * Returns the display name of a storage location.
 * @param {number} id - The ID of the storage location.
 * @returns {string} - The storage location name, or a dash if unavailable.
 */
const storageLocationName = (id) => getStorageLocationById(id)?.name ?? '—';

/**
 * Clears the search text and every filter.
 */
const resetFilters = () => {
  search.value = '';
  locationFilter.value = null;
  categoryFilter.value = null;
  conditionFilter.value = 'all';
};

/**
 * Navigates to the inventory item detail page.
 * @param {number} id - The ID of the inventory item.
 */
const navigateToDetail = (id) => {
  router.push({ name: 'inventory-item-detail', params: { id } });
};

/**
 * Opens the inventory item form to add or edit an item.
 * @param {Object|null} inventoryItem - The inventory item to edit, or null to add one.
 */
const openInventoryItemForm = (inventoryItem = null) => {
  selectedInventoryItem.value = inventoryItem;
  inventoryItemFormVisible.value = true;
};

/**
 * Opens the stock adjustment form for an inventory item.
 * @param {Object} inventoryItem - The inventory item to adjust.
 */
const openStockAdjustmentForm = (inventoryItem) => {
  selectedInventoryItem.value = inventoryItem;
  stockAdjustmentFormVisible.value = true;
};

/**
 * Confirms that changes were saved.
 */
const notifySaved = () => {
  toast.add({
    severity: 'success',
    summary: t('inventory.inventory-item-list.saved'),
    life: 3000,
  });
};
</script>

<template>
  <inventory-layout>
    <template #actions>
      <pv-button
        :label="t('inventory.inventory-item-list.new')"
        icon="pi pi-plus"
        rounded
        :disabled="saving || !storageLocations.length"
        @click="openInventoryItemForm()"
      />
    </template>

    <section class="flex flex-column gap-3">
      <div class="flex align-items-center gap-2 overflow-x-auto">
        <pv-select-button
          v-model="conditionFilter"
          :options="conditionOptions"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          :aria-label="t('inventory.inventory-item-list.condition')"
          class="flex-shrink-0"
        >
          <template #option="{ option }">
            <span class="flex align-items-center gap-2 white-space-nowrap">
              <i
                v-if="option.dot"
                :class="['pi pi-circle-fill text-xs', option.dot]"
                aria-hidden="true"
              />
              <span>{{ option.label }}</span>
              <span class="font-mono text-sm opacity-70">{{
                n(option.count)
              }}</span>
            </span>
          </template>
        </pv-select-button>
        <i
          v-tooltip.bottom="t('inventory.inventory-item-list.property-scope')"
          class="pi pi-info-circle text-color-secondary flex-shrink-0 p-2"
          tabindex="0"
          :aria-label="t('inventory.inventory-item-list.property-scope')"
        />
      </div>
      <div class="flex flex-wrap align-items-center gap-2">
        <pv-icon-field class="w-full md:w-20rem">
          <pv-input-icon class="pi pi-search" />
          <pv-input-text
            v-model="search"
            :placeholder="t('inventory.inventory-item-list.search')"
            :aria-label="t('inventory.inventory-item-list.search')"
            fluid
          />
        </pv-icon-field>
        <pv-select
          v-model="locationFilter"
          :options="storageLocations"
          option-label="name"
          option-value="id"
          :placeholder="t('inventory.inventory-item-list.all-locations')"
          :aria-label="t('inventory.inventory-item-list.storage')"
          show-clear
          class="w-full sm:w-14rem"
        />
        <pv-select
          v-model="categoryFilter"
          :options="categoryOptions"
          option-label="label"
          option-value="value"
          :placeholder="t('inventory.inventory-item-list.all-categories')"
          :aria-label="t('inventory.inventory-item-list.category')"
          show-clear
          class="w-full sm:w-14rem"
        />
        <pv-button
          v-if="filtersApplied"
          :label="t('inventory.inventory-item-list.clear')"
          icon="pi pi-filter-slash"
          severity="secondary"
          text
          @click="resetFilters"
        />
        <span class="ml-auto text-sm text-color-secondary" aria-live="polite">{{
          t(
            'inventory.inventory-item-list.results',
            filteredInventoryItems.length,
          )
        }}</span>
      </div>

      <pv-data-table
        :value="filteredInventoryItems"
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
            <i class="pi pi-box text-3xl text-color-secondary" />
            <span class="font-medium">{{
              t('inventory.inventory-item-list.empty-title')
            }}</span>
            <span class="text-sm text-color-secondary">{{
              t('inventory.inventory-item-list.empty-text')
            }}</span>
          </div>
        </template>
        <pv-column
          field="name"
          :header="t('inventory.inventory-item-list.name')"
          sortable
        >
          <template #body="{ data }">
            <router-link
              :to="{
                name: 'inventory-item-detail',
                params: { id: data.id },
              }"
              class="flex align-items-center gap-3 text-color"
              @click.stop
            >
              <inventory-item-avatar :category="data.category" />
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
        <pv-column
          field="category"
          :header="t('inventory.inventory-item-list.category')"
        >
          <template #body="{ data }">{{
            t(`inventory.inventory-terms.categories.${data.category}`)
          }}</template>
        </pv-column>
        <pv-column :header="t('inventory.inventory-item-list.primary-storage')">
          <template #body="{ data }">{{
            storageLocationName(data.primaryLocationId)
          }}</template>
        </pv-column>
        <pv-column
          field="totalQuantity"
          :header="t('inventory.inventory-item-list.quantity')"
          sortable
        >
          <template #body="{ data }">
            <span class="font-mono white-space-nowrap"
              >{{ n(data.totalQuantity) }}
              <span class="text-color-secondary">{{
                t(`inventory.inventory-terms.units.${data.unit}`)
              }}</span></span
            >
          </template>
        </pv-column>
        <pv-column :header="t('inventory.inventory-item-list.condition')">
          <template #body="{ data }">
            <stock-condition-tag :condition="data.stockCondition" />
          </template>
        </pv-column>
        <pv-column
          :header="t('inventory.inventory-item-list.actions')"
          class="text-right white-space-nowrap"
          style="width: 1%"
          :pt="{ columnHeaderContent: { class: 'justify-content-end' } }"
        >
          <template #body="{ data }">
            <div class="flex justify-content-end gap-1">
              <pv-button
                v-tooltip.top="t('inventory.inventory-item-list.adjust')"
                icon="pi pi-arrow-right-arrow-left"
                severity="secondary"
                text
                rounded
                :aria-label="`${t('inventory.inventory-item-list.adjust')}: ${data.name}`"
                :disabled="saving"
                @click.stop="openStockAdjustmentForm(data)"
              />
              <pv-button
                v-tooltip.top="t('inventory.inventory-item-list.edit')"
                icon="pi pi-pencil"
                severity="secondary"
                text
                rounded
                :aria-label="`${t('inventory.inventory-item-list.edit')}: ${data.name}`"
                :disabled="saving"
                @click.stop="openInventoryItemForm(data)"
              />
            </div>
          </template>
        </pv-column>
      </pv-data-table>
    </section>

    <inventory-item-form
      v-if="inventoryItemFormVisible"
      v-model:visible="inventoryItemFormVisible"
      :inventory-item="selectedInventoryItem"
      @saved="notifySaved"
    />
    <stock-adjustment-form
      v-if="stockAdjustmentFormVisible"
      v-model:visible="stockAdjustmentFormVisible"
      :inventory-item="selectedInventoryItem"
      @saved="notifySaved"
    />
  </inventory-layout>
</template>
