<script setup>
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import useInventoryStore from '../../application/inventory.store.js';
import { InventoryItem } from '../../domain/model/inventory-item.entity.js';
import { InventoryError } from '../../domain/model/inventory.error.js';

const props = defineProps({
  inventoryItem: { type: Object, default: null },
});
const visible = defineModel('visible', { type: Boolean });
const emit = defineEmits(['saved']);

const { t, locale } = useI18n();
const store = useInventoryStore();
const { storageLocations, currentPropertyId, currentProperty, saving } =
  toRefs(store);
const { addInventoryItem, updateInventoryItem } = store;

const form = ref({
  name: props.inventoryItem?.name ?? '',
  code: props.inventoryItem?.code ?? '',
  category: props.inventoryItem?.category ?? 'linen',
  unit: props.inventoryItem?.unit ?? 'units',
  primaryLocationId:
    props.inventoryItem?.primaryLocationId ??
    storageLocations.value[0]?.id ??
    null,
  lowStockThreshold: props.inventoryItem?.lowStockThreshold ?? 10,
  openingQuantity: 0,
});
const errorCode = ref('');
const isEdit = computed(() => !!props.inventoryItem);
const unitLocked = computed(() => !!props.inventoryItem?.adjustments.length);
const categoryOptions = computed(() =>
  InventoryItem.categories.map((value) => ({
    value,
    label: t(`inventory.inventory-terms.categories.${value}`),
  })),
);
const unitOptions = computed(() =>
  InventoryItem.units.map((value) => ({
    value,
    label: t(`inventory.inventory-terms.units.${value}`),
  })),
);

/**
 * Saves the inventory item, either by adding a new one or updating an existing one.
 */
const saveInventoryItem = async () => {
  errorCode.value = '';
  const inventoryItem = new InventoryItem({
    id: props.inventoryItem?.id ?? null,
    propertyId: props.inventoryItem?.propertyId ?? currentPropertyId.value,
    name: form.value.name,
    code: form.value.code,
    category: form.value.category,
    unit: form.value.unit,
    primaryLocationId: form.value.primaryLocationId,
    lowStockThreshold: form.value.lowStockThreshold,
    stocks: props.inventoryItem?.stocks ?? [],
    adjustments: props.inventoryItem?.adjustments ?? [],
  });
  try {
    const savedInventoryItem = isEdit.value
      ? await updateInventoryItem(inventoryItem)
      : await addInventoryItem(inventoryItem, form.value.openingQuantity);
    emit('saved', savedInventoryItem);
    visible.value = false;
  } catch (error) {
    errorCode.value =
      error instanceof InventoryError ? error.code : 'connection';
  }
};
</script>

<template>
  <pv-drawer
    v-model:visible="visible"
    position="right"
    class="w-full md:w-30rem"
    :dismissable="!saving"
    :close-on-escape="!saving"
    :show-close-icon="!saving"
    block-scroll
  >
    <template #header>
      <div class="flex flex-column">
        <span class="text-xl font-bold">{{
          isEdit
            ? t('inventory.inventory-item-form.edit-title')
            : t('inventory.inventory-item-form.new-title')
        }}</span>
        <span class="text-sm text-color-secondary">{{
          currentProperty?.name
        }}</span>
      </div>
    </template>

    <form
      id="inventory-item-form"
      class="flex flex-column gap-4"
      @submit.prevent="saveInventoryItem"
    >
      <section class="flex flex-column gap-3">
        <h3 class="m-0 text-base font-semibold">
          {{ t('inventory.inventory-item-form.details-section') }}
        </h3>
        <div class="flex flex-column gap-2">
          <label for="item-name" class="text-sm font-medium">{{
            t('inventory.inventory-item-form.name')
          }}</label>
          <pv-input-text
            id="item-name"
            v-model="form.name"
            :placeholder="t('inventory.inventory-item-form.name-placeholder')"
            required
            maxlength="100"
            autofocus
            fluid
          />
        </div>
        <div class="formgrid grid">
          <div class="field col-12 sm:col-6 flex flex-column gap-2 mb-0">
            <label for="item-code" class="text-sm font-medium">{{
              t('inventory.inventory-item-form.code')
            }}</label>
            <pv-input-text
              id="item-code"
              v-model="form.code"
              placeholder="LIN-BT-001"
              class="font-mono"
              required
              maxlength="40"
              fluid
            />
          </div>
          <div class="field col-12 sm:col-6 flex flex-column gap-2 mb-0">
            <label for="item-unit" class="text-sm font-medium">{{
              t('inventory.inventory-item-form.unit')
            }}</label>
            <pv-select
              v-model="form.unit"
              input-id="item-unit"
              :options="unitOptions"
              option-label="label"
              option-value="value"
              :disabled="unitLocked"
              fluid
            />
          </div>
        </div>
        <pv-message
          v-if="unitLocked"
          size="small"
          severity="secondary"
          variant="simple"
          icon="pi pi-lock"
        >
          {{ t('inventory.inventory-item-form.unit-locked') }}
        </pv-message>
        <div class="flex flex-column gap-2">
          <label for="item-category" class="text-sm font-medium">{{
            t('inventory.inventory-item-form.category')
          }}</label>
          <pv-select
            v-model="form.category"
            input-id="item-category"
            :options="categoryOptions"
            option-label="label"
            option-value="value"
            fluid
          />
        </div>
      </section>

      <pv-divider class="m-0" />

      <section class="flex flex-column gap-3">
        <h3 class="m-0 text-base font-semibold">
          {{ t('inventory.inventory-item-form.stock-section') }}
        </h3>
        <div class="flex flex-column gap-2">
          <label for="item-location" class="text-sm font-medium">{{
            t('inventory.inventory-item-form.storage')
          }}</label>
          <pv-select
            v-model="form.primaryLocationId"
            input-id="item-location"
            :options="storageLocations"
            option-label="name"
            option-value="id"
            fluid
          />
        </div>
        <div class="formgrid grid">
          <div
            v-if="!isEdit"
            class="field col-12 sm:col-6 flex flex-column gap-2 mb-0"
          >
            <label for="item-opening-quantity" class="text-sm font-medium">{{
              t('inventory.inventory-item-form.opening-quantity')
            }}</label>
            <pv-input-group>
              <pv-input-number
                v-model="form.openingQuantity"
                input-id="item-opening-quantity"
                :locale="locale"
                :min="0"
                :max-fraction-digits="form.unit === 'units' ? 0 : 3"
                input-class="font-mono"
              />
              <pv-input-group-addon class="text-sm">{{
                t(`inventory.inventory-terms.units.${form.unit}`)
              }}</pv-input-group-addon>
            </pv-input-group>
          </div>
          <div
            :class="[
              'field col-12 flex flex-column gap-2 mb-0',
              { 'sm:col-6': !isEdit },
            ]"
          >
            <label for="item-threshold" class="text-sm font-medium">{{
              t('inventory.inventory-item-form.threshold')
            }}</label>
            <pv-input-group>
              <pv-input-number
                v-model="form.lowStockThreshold"
                input-id="item-threshold"
                :locale="locale"
                :min="0"
                :max-fraction-digits="form.unit === 'units' ? 0 : 3"
                input-class="font-mono"
              />
              <pv-input-group-addon class="text-sm">{{
                t(`inventory.inventory-terms.units.${form.unit}`)
              }}</pv-input-group-addon>
            </pv-input-group>
          </div>
        </div>
        <pv-message severity="secondary" icon="pi pi-info-circle">
          {{
            isEdit
              ? t('inventory.inventory-item-form.threshold-help')
              : t('inventory.inventory-item-form.opening-quantity-help')
          }}
        </pv-message>
      </section>

      <pv-message v-if="errorCode" severity="error" icon="pi pi-times-circle">
        {{ t(`inventory.inventory-terms.errors.${errorCode}`) }}
      </pv-message>
    </form>

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <pv-button
          :label="t('inventory.inventory-item-form.cancel')"
          severity="secondary"
          outlined
          rounded
          :disabled="saving"
          @click="visible = false"
        />
        <pv-button
          type="submit"
          form="inventory-item-form"
          :label="t('inventory.inventory-item-form.save')"
          icon="pi pi-save"
          rounded
          :loading="saving"
        />
      </div>
    </template>
  </pv-drawer>
</template>
