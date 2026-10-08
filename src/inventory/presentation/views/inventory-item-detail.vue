<script setup>
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue';
import useInventoryStore from '../../application/inventory.store.js';
import { InventoryError } from '../../domain/model/inventory.error.js';
import InventoryLayout from '../components/inventory-layout.vue';
import InventoryItemAvatar from '../components/inventory-item-avatar.vue';
import InventoryItemForm from '../components/inventory-item-form.vue';
import StockAdjustmentForm from '../components/stock-adjustment-form.vue';
import StockConditionTag from '../components/stock-condition-tag.vue';

const { t, n, locale } = useI18n();
const route = useRoute();
const toast = useToast();
const store = useInventoryStore();
const { currentProperty, saving } = toRefs(store);
const {
  getInventoryItemById,
  getStorageLocationById,
  unassignStorageLocation,
} = store;

const inventoryItemFormVisible = ref(false);
const stockAdjustmentFormVisible = ref(false);

const inventoryItem = computed(() => getInventoryItemById(route.params.id));
const stockHistory = computed(() =>
  [...(inventoryItem.value?.adjustments ?? [])].reverse(),
);
const itemFacts = computed(() => [
  {
    label: t('inventory.inventory-item-detail.category'),
    value: t(
      `inventory.inventory-terms.categories.${inventoryItem.value.category}`,
    ),
  },
  {
    label: t('inventory.inventory-item-detail.unit'),
    value: t(`inventory.inventory-terms.units.${inventoryItem.value.unit}`),
  },
  {
    label: t('inventory.inventory-item-detail.threshold'),
    value: n(inventoryItem.value.lowStockThreshold),
  },
  {
    label: t('inventory.inventory-item-detail.primary-storage'),
    value: storageLocationName(inventoryItem.value.primaryLocationId),
  },
  {
    label: t('inventory.inventory-item-detail.property'),
    value: currentProperty.value?.name,
  },
]);
const breadcrumbItems = computed(() => [
  {
    label: t('inventory.inventory-item-detail.inventory'),
    route: { name: 'inventory-items' },
  },
  { label: inventoryItem.value?.code },
]);

/**
 * Returns the display name of a storage location.
 * @param {number} id - The ID of the storage location.
 * @returns {string} - The storage location name, or a dash if unavailable.
 */
const storageLocationName = (id) => getStorageLocationById(id)?.name ?? '—';

/**
 * Formats the date when a stock adjustment was recorded.
 * @param {string} value - ISO date.
 * @returns {string} - Localized date and time.
 */
const formatDate = (value) =>
  new Intl.DateTimeFormat(locale.value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

/**
 * Returns the display name of the operator who recorded an adjustment.
 * @param {string} operator - Recorded operator.
 * @returns {string} - Localized operator name.
 */
const operatorName = (operator) =>
  operator === 'Demo operator'
    ? t('inventory.inventory-terms.demo-operator')
    : operator;

/**
 * Confirms that changes were saved.
 */
const notifySaved = () => {
  toast.add({
    severity: 'success',
    summary: t('inventory.inventory-item-detail.saved'),
    life: 3000,
  });
};

/**
 * Shows the reason why an operation failed.
 * @param {Error} error - The operation error.
 */
const notifyError = (error) => {
  const errorCode = error instanceof InventoryError ? error.code : 'connection';
  toast.add({
    severity: 'error',
    summary: t(`inventory.inventory-terms.errors.${errorCode}`),
    life: 6000,
  });
};

/**
 * Removes an empty secondary storage location assignment.
 * @param {number} storageLocationId - The ID of the storage location to unassign.
 */
const removeAssignment = async (storageLocationId) => {
  try {
    await unassignStorageLocation(inventoryItem.value, storageLocationId);
    notifySaved();
  } catch (error) {
    notifyError(error);
  }
};
</script>

<template>
  <inventory-layout>
    <template v-if="inventoryItem">
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
          <inventory-item-avatar
            :category="inventoryItem.category"
            size="large"
          />
          <div class="flex flex-column gap-1 min-w-0">
            <div class="flex flex-wrap align-items-center gap-2">
              <h2 class="m-0 text-2xl font-bold tracking-tight">
                {{ inventoryItem.name }}
              </h2>
              <stock-condition-tag :condition="inventoryItem.stockCondition" />
            </div>
            <span class="text-sm text-color-secondary">
              <span class="font-mono">{{ inventoryItem.code }}</span> ·
              {{
                t(
                  `inventory.inventory-terms.categories.${inventoryItem.category}`,
                )
              }}
            </span>
          </div>
        </div>
        <div class="flex align-items-center gap-4">
          <div class="flex flex-column md:align-items-end">
            <span class="text-sm text-color-secondary">{{
              t('inventory.inventory-item-detail.quantity')
            }}</span>
            <span class="font-mono text-xl white-space-nowrap"
              >{{ n(inventoryItem.totalQuantity) }}
              <span class="text-sm text-color-secondary">{{
                t(`inventory.inventory-terms.units.${inventoryItem.unit}`)
              }}</span></span
            >
          </div>
          <div class="flex gap-2 ml-auto md:ml-0">
            <pv-button
              :label="t('inventory.inventory-item-detail.edit')"
              icon="pi pi-pencil"
              severity="secondary"
              outlined
              rounded
              :disabled="saving"
              @click="inventoryItemFormVisible = true"
            />
            <pv-button
              :label="t('inventory.inventory-item-detail.adjust')"
              icon="pi pi-arrow-right-arrow-left"
              rounded
              :disabled="saving"
              @click="stockAdjustmentFormVisible = true"
            />
          </div>
        </div>
      </header>

      <div class="grid">
        <section class="col-12 lg:col-8 flex flex-column gap-3">
          <h3 class="flex align-items-center gap-2 m-0 text-base font-semibold">
            <i class="pi pi-history text-color-secondary" aria-hidden="true" />
            {{ t('inventory.inventory-item-detail.history') }}
          </h3>
          <pv-data-table
            :value="stockHistory"
            data-key="id"
            paginator
            :rows="8"
            :always-show-paginator="false"
            size="small"
            scrollable
            table-style="min-width: 44rem"
          >
            <template #empty>
              <span class="text-color-secondary">{{
                t('inventory.inventory-item-detail.no-history')
              }}</span>
            </template>
            <pv-column
              :header="t('inventory.inventory-item-detail.recorded-at')"
            >
              <template #body="{ data }">
                <span class="white-space-nowrap">{{
                  formatDate(data.recordedAt)
                }}</span>
              </template>
            </pv-column>
            <pv-column :header="t('inventory.inventory-item-detail.operation')">
              <template #body="{ data }">
                <span class="flex align-items-center gap-2 white-space-nowrap">
                  <i
                    :class="[
                      'pi',
                      data.operation === 'in'
                        ? 'pi-plus-circle text-primary'
                        : 'pi-minus-circle text-red-600',
                    ]"
                    aria-hidden="true"
                  />
                  <span class="flex flex-column">
                    <span>{{
                      t(
                        `inventory.inventory-terms.operations.${data.operation}`,
                      )
                    }}</span>
                    <span
                      v-if="data.transferId"
                      class="text-sm text-color-secondary"
                      >{{
                        t('inventory.inventory-terms.operations.transfer')
                      }}</span
                    >
                  </span>
                </span>
              </template>
            </pv-column>
            <pv-column :header="t('inventory.inventory-item-detail.change')">
              <template #body="{ data }">
                <span
                  :class="[
                    'font-mono font-medium',
                    data.operation === 'in' ? 'text-primary' : 'text-red-600',
                  ]"
                  >{{ data.operation === 'in' ? '+' : '−'
                  }}{{ n(data.quantity) }}</span
                >
              </template>
            </pv-column>
            <pv-column
              field="locationName"
              :header="t('inventory.inventory-item-detail.storage')"
            />
            <pv-column :header="t('inventory.inventory-item-detail.reason')">
              <template #body="{ data }">
                <span class="flex flex-column">
                  <span>{{
                    t(`inventory.inventory-terms.reasons.${data.reason}`)
                  }}</span>
                  <span v-if="data.note" class="text-sm text-color-secondary">{{
                    data.note
                  }}</span>
                </span>
              </template>
            </pv-column>
            <pv-column :header="t('inventory.inventory-item-detail.operator')">
              <template #body="{ data }">{{
                operatorName(data.operator)
              }}</template>
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
                {{ t('inventory.inventory-item-detail.details') }}
              </h3>
              <dl class="flex flex-column gap-2 m-0">
                <div
                  v-for="fact in itemFacts"
                  :key="fact.label"
                  class="flex justify-content-between gap-3"
                >
                  <dt class="text-color-secondary">{{ fact.label }}</dt>
                  <dd class="m-0 text-right font-medium">{{ fact.value }}</dd>
                </div>
              </dl>
            </section>

            <section class="flex flex-column gap-2">
              <h3
                class="flex align-items-center gap-2 m-0 text-base font-semibold"
              >
                <i
                  class="pi pi-warehouse text-color-secondary"
                  aria-hidden="true"
                />
                {{ t('inventory.inventory-item-detail.allocation') }}
              </h3>
              <ul class="list-none p-0 m-0">
                <li
                  v-for="stock in inventoryItem.stocks"
                  :key="stock.locationId"
                  class="flex align-items-center gap-2 py-2 border-bottom-1 surface-border"
                >
                  <div class="flex flex-column flex-1 min-w-0">
                    <router-link
                      :to="{
                        name: 'inventory-storage-location-detail',
                        params: { id: stock.locationId },
                      }"
                      class="font-medium text-color hover:text-primary"
                      >{{ storageLocationName(stock.locationId) }}</router-link
                    >
                    <span class="text-sm text-color-secondary">{{
                      stock.locationId === inventoryItem.primaryLocationId
                        ? t('inventory.inventory-item-detail.primary-storage')
                        : t('inventory.inventory-item-detail.secondary-storage')
                    }}</span>
                  </div>
                  <span class="font-mono">{{ n(stock.quantity) }}</span>
                  <pv-button
                    v-if="
                      stock.quantity === 0 &&
                      stock.locationId !== inventoryItem.primaryLocationId
                    "
                    v-tooltip.top="
                      t('inventory.inventory-item-detail.remove-assignment')
                    "
                    icon="pi pi-times"
                    severity="secondary"
                    text
                    rounded
                    size="small"
                    :aria-label="`${t('inventory.inventory-item-detail.remove-assignment')}: ${storageLocationName(stock.locationId)}`"
                    :disabled="saving"
                    @click="removeAssignment(stock.locationId)"
                  />
                </li>
              </ul>
              <p class="m-0 text-sm text-color-secondary line-height-3">
                {{ t('inventory.inventory-item-detail.unit-help') }}
              </p>
            </section>
          </div>
        </aside>
      </div>

      <inventory-item-form
        v-if="inventoryItemFormVisible"
        v-model:visible="inventoryItemFormVisible"
        :inventory-item="inventoryItem"
        @saved="notifySaved"
      />
      <stock-adjustment-form
        v-if="stockAdjustmentFormVisible"
        v-model:visible="stockAdjustmentFormVisible"
        :inventory-item="inventoryItem"
        @saved="notifySaved"
      />
    </template>
    <pv-message v-else severity="warn" icon="pi pi-search">
      <div class="flex flex-column sm:flex-row sm:align-items-center gap-3">
        <span>{{ t('inventory.inventory-item-detail.not-found') }}</span>
        <router-link :to="{ name: 'inventory-items' }" class="font-medium">{{
          t('inventory.inventory-item-detail.back')
        }}</router-link>
      </div>
    </pv-message>
  </inventory-layout>
</template>
