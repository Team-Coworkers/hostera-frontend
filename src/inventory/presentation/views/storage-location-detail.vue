<script setup>
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useConfirm, useToast } from 'primevue';
import useInventoryStore from '../../application/inventory.store.js';
import { InventoryError } from '../../domain/model/inventory.error.js';
import InventoryLayout from '../components/inventory-layout.vue';
import InventoryItemAvatar from '../components/inventory-item-avatar.vue';
import StorageLocationAvatar from '../components/storage-location-avatar.vue';
import StockConditionTag from '../components/stock-condition-tag.vue';
import StorageLocationForm from '../components/storage-location-form.vue';
import StockAdjustmentForm from '../components/stock-adjustment-form.vue';

const { t, n } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const store = useInventoryStore();
const { inventoryItems, currentProperty, saving } = toRefs(store);
const { getStorageLocationById, deleteStorageLocation } = store;

const storageLocationFormVisible = ref(false);
const stockAdjustmentFormVisible = ref(false);
const selectedInventoryItem = ref(null);

const storageLocation = computed(() => getStorageLocationById(route.params.id));
const assignedInventoryItems = computed(() =>
  inventoryItems.value.filter((item) =>
    item.stocks.some((stock) => stock.locationId === storageLocation.value?.id),
  ),
);
const stockAlertsCount = computed(
  () =>
    assignedInventoryItems.value.filter(
      (item) => item.stockCondition !== 'in-stock',
    ).length,
);
const locationFacts = computed(() => [
  {
    label: t('inventory.storage-location-detail.type'),
    value: t(
      `inventory.inventory-terms.location-types.${storageLocation.value.type}`,
    ),
  },
  {
    label: t('inventory.storage-location-detail.area'),
    value: storageLocation.value.area,
  },
  {
    label: t('inventory.storage-location-detail.team'),
    value: storageLocation.value.responsibleTeam,
  },
  {
    label: t('inventory.storage-location-detail.property'),
    value: currentProperty.value?.name,
  },
]);
const breadcrumbItems = computed(() => [
  {
    label: t('inventory.storage-location-detail.inventory'),
    route: { name: 'inventory-items' },
  },
  {
    label: t('inventory.storage-location-detail.storage-locations'),
    route: { name: 'inventory-storage-locations' },
  },
  { label: storageLocation.value?.code },
]);

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
    summary: t('inventory.storage-location-detail.saved'),
    life: 3000,
  });
};

/**
 * Confirm deletion of the storage location and execute deletion if confirmed.
 */
const confirmDelete = () => {
  confirm.require({
    message: t('inventory.storage-location-detail.confirm-delete', {
      name: storageLocation.value.name,
    }),
    header: t('inventory.storage-location-detail.delete-header'),
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: t('inventory.storage-location-detail.confirm'),
    rejectLabel: t('inventory.storage-location-detail.cancel'),
    acceptProps: { severity: 'danger' },
    rejectProps: { severity: 'secondary', outlined: true },
    accept: async () => {
      try {
        await deleteStorageLocation(storageLocation.value);
        toast.add({
          severity: 'success',
          summary: t('inventory.storage-location-detail.removed'),
          life: 3000,
        });
        await router.push({ name: 'inventory-storage-locations' });
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
    <template v-if="storageLocation">
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
          <storage-location-avatar :type="storageLocation.type" size="large" />
          <div class="flex flex-column gap-1 min-w-0">
            <div class="flex flex-wrap align-items-center gap-2">
              <h2 class="m-0 text-2xl font-bold tracking-tight">
                {{ storageLocation.name }}
              </h2>
              <pv-tag
                v-if="stockAlertsCount"
                severity="warn"
                :value="
                  t(
                    'inventory.storage-location-detail.alerts-count',
                    stockAlertsCount,
                  )
                "
              />
              <pv-tag
                v-else
                severity="success"
                :value="t('inventory.storage-location-detail.no-alerts')"
              />
            </div>
            <span class="text-sm text-color-secondary">
              <span class="font-mono">{{ storageLocation.code }}</span> ·
              {{
                t(
                  `inventory.inventory-terms.location-types.${storageLocation.type}`,
                )
              }}
            </span>
          </div>
        </div>
        <div class="flex align-items-center gap-4">
          <div class="flex flex-column md:align-items-end">
            <span class="text-sm text-color-secondary">{{
              t('inventory.storage-location-detail.assigned-items')
            }}</span>
            <span class="font-mono text-xl">{{
              n(assignedInventoryItems.length)
            }}</span>
          </div>
          <div class="flex gap-2 ml-auto md:ml-0">
            <pv-button
              :label="t('inventory.storage-location-detail.edit')"
              icon="pi pi-pencil"
              severity="secondary"
              outlined
              rounded
              :disabled="saving"
              @click="storageLocationFormVisible = true"
            />
            <pv-button
              :label="t('inventory.storage-location-detail.delete')"
              icon="pi pi-trash"
              severity="danger"
              outlined
              rounded
              :disabled="saving"
              @click="confirmDelete"
            />
          </div>
        </div>
      </header>

      <div class="grid">
        <section class="col-12 lg:col-8 flex flex-column gap-3">
          <h3 class="flex align-items-center gap-2 m-0 text-base font-semibold">
            <i class="pi pi-box text-color-secondary" aria-hidden="true" />
            {{ t('inventory.storage-location-detail.items') }}
          </h3>
          <pv-data-table
            :value="assignedInventoryItems"
            data-key="id"
            size="small"
            row-hover
            scrollable
            table-style="min-width: 36rem"
          >
            <template #empty>
              <span class="text-color-secondary">{{
                t('inventory.storage-location-detail.empty-title')
              }}</span>
            </template>
            <pv-column :header="t('inventory.storage-location-detail.name')">
              <template #body="{ data }">
                <router-link
                  :to="{
                    name: 'inventory-item-detail',
                    params: { id: data.id },
                  }"
                  class="flex align-items-center gap-2 text-color"
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
              :header="t('inventory.storage-location-detail.quantity')"
            >
              <template #body="{ data }">
                <span class="font-mono white-space-nowrap"
                  >{{ n(data.quantityAt(storageLocation.id)) }}
                  <span class="text-color-secondary">{{
                    t(`inventory.inventory-terms.units.${data.unit}`)
                  }}</span></span
                >
              </template>
            </pv-column>
            <pv-column
              :header="t('inventory.storage-location-detail.condition')"
            >
              <template #body="{ data }">
                <stock-condition-tag :condition="data.stockCondition" />
              </template>
            </pv-column>
            <pv-column class="text-right white-space-nowrap" style="width: 1%">
              <template #body="{ data }">
                <pv-button
                  v-tooltip.top="t('inventory.storage-location-detail.adjust')"
                  icon="pi pi-arrow-right-arrow-left"
                  severity="secondary"
                  text
                  rounded
                  :aria-label="`${t('inventory.storage-location-detail.adjust')}: ${data.name}`"
                  :disabled="saving"
                  @click="openStockAdjustmentForm(data)"
                />
              </template>
            </pv-column>
          </pv-data-table>
        </section>

        <aside class="col-12 lg:col-4">
          <div
            class="flex flex-column gap-4 p-4 surface-50 border-1 surface-border border-round-xl"
          >
            <section class="flex flex-column gap-3">
              <h3
                class="flex align-items-center gap-2 m-0 text-base font-semibold"
              >
                <i
                  class="pi pi-info-circle text-color-secondary"
                  aria-hidden="true"
                />
                {{ t('inventory.storage-location-detail.details') }}
              </h3>
              <dl class="flex flex-column gap-2 m-0">
                <div
                  v-for="fact in locationFacts"
                  :key="fact.label"
                  class="flex justify-content-between gap-3"
                >
                  <dt class="text-color-secondary">{{ fact.label }}</dt>
                  <dd class="m-0 text-right font-medium">{{ fact.value }}</dd>
                </div>
              </dl>
            </section>

            <section
              v-if="storageLocation.description"
              class="flex flex-column gap-2"
            >
              <h3
                class="flex align-items-center gap-2 m-0 text-base font-semibold"
              >
                <i
                  class="pi pi-align-left text-color-secondary"
                  aria-hidden="true"
                />
                {{ t('inventory.storage-location-detail.description') }}
              </h3>
              <p class="m-0 line-height-3">
                {{ storageLocation.description }}
              </p>
            </section>

            <p class="m-0 text-sm text-color-secondary line-height-3">
              {{ t('inventory.storage-location-detail.quantity-help') }}
            </p>
          </div>
        </aside>
      </div>

      <storage-location-form
        v-if="storageLocationFormVisible"
        v-model:visible="storageLocationFormVisible"
        :storage-location="storageLocation"
        @saved="notifySaved"
      />
      <stock-adjustment-form
        v-if="stockAdjustmentFormVisible"
        v-model:visible="stockAdjustmentFormVisible"
        :inventory-item="selectedInventoryItem"
        @saved="notifySaved"
      />
    </template>
    <pv-message v-else severity="warn" icon="pi pi-search">
      <div class="flex flex-column sm:flex-row sm:align-items-center gap-3">
        <span>{{ t('inventory.storage-location-detail.not-found') }}</span>
        <router-link
          :to="{ name: 'inventory-storage-locations' }"
          class="font-medium"
          >{{ t('inventory.storage-location-detail.back') }}</router-link
        >
      </div>
    </pv-message>
  </inventory-layout>
</template>
