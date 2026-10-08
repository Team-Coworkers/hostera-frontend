<script setup>
import { computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import useInventoryStore from '../../application/inventory.store.js';
import { AdjustStockCommand } from '../../domain/adjust-stock.command.js';
import { StockAdjustment } from '../../domain/model/stock-adjustment.entity.js';
import { InventoryError } from '../../domain/model/inventory.error.js';

const props = defineProps({
  inventoryItem: { type: Object, required: true },
});
const visible = defineModel('visible', { type: Boolean });
const emit = defineEmits(['saved']);

const { t, locale, n } = useI18n();
const store = useInventoryStore();
const { storageLocations, saving } = toRefs(store);
const { adjustStock } = store;

const form = ref({
  operation: 'in',
  quantity: null,
  locationId: props.inventoryItem.primaryLocationId,
  destinationLocationId: null,
  reason: 'supplier-delivery',
  note: '',
});
const errorCode = ref('');
const operationIcons = {
  in: 'pi pi-plus-circle',
  out: 'pi pi-minus-circle',
  transfer: 'pi pi-arrow-right-arrow-left',
};
const operationOptions = computed(() =>
  AdjustStockCommand.operations.map((value) => ({
    value,
    icon: operationIcons[value],
    label: t(`inventory.inventory-terms.operations.${value}`),
  })),
);
const unitLabel = computed(() =>
  t(`inventory.inventory-terms.units.${props.inventoryItem.unit}`),
);
const reasonOptions = computed(() =>
  StockAdjustment.reasons[form.value.operation]
    .filter((reason) => reason !== 'opening-stock')
    .map((value) => ({
      value,
      label: t(`inventory.inventory-terms.reasons.${value}`),
    })),
);
const destinationLocations = computed(() =>
  storageLocations.value.filter(
    (storageLocation) => storageLocation.id !== form.value.locationId,
  ),
);
const currentQuantity = computed(() =>
  props.inventoryItem.quantityAt(form.value.locationId),
);
const resultingQuantity = computed(
  () =>
    currentQuantity.value +
    (form.value.operation === 'in' ? 1 : -1) * (form.value.quantity ?? 0),
);

watch(
  () => form.value.operation,
  () => {
    form.value.reason = reasonOptions.value[0]?.value;
    errorCode.value = '';
  },
);
watch(
  () => form.value.locationId,
  () => {
    if (form.value.destinationLocationId === form.value.locationId)
      form.value.destinationLocationId = null;
  },
);

/**
 * Records the stock adjustment through an adjust-stock command.
 */
const performStockAdjustment = async () => {
  errorCode.value = '';
  const adjustStockCommand = new AdjustStockCommand({
    inventoryItemId: props.inventoryItem.id,
    ...form.value,
  });
  try {
    emit('saved', await adjustStock(adjustStockCommand));
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
          t('inventory.stock-adjustment-form.title')
        }}</span>
        <span class="text-sm text-color-secondary"
          >{{ inventoryItem.name }} ·
          <span class="font-mono">{{ inventoryItem.code }}</span></span
        >
      </div>
    </template>

    <form
      id="stock-adjustment-form"
      class="flex flex-column gap-3"
      @submit.prevent="performStockAdjustment"
    >
      <div
        class="flex align-items-center justify-content-between gap-3 p-3 border-round-lg surface-100"
        aria-live="polite"
      >
        <div class="flex flex-column">
          <span class="text-sm text-color-secondary">{{
            t('inventory.stock-adjustment-form.current')
          }}</span>
          <span class="font-mono text-xl"
            >{{ n(currentQuantity) }} {{ unitLabel }}</span
          >
        </div>
        <i class="pi pi-arrow-right text-color-secondary" aria-hidden="true" />
        <div class="flex flex-column align-items-end">
          <span class="text-sm text-color-secondary">{{
            t('inventory.stock-adjustment-form.result')
          }}</span>
          <span
            :class="[
              'font-mono text-xl',
              { 'text-red-600': resultingQuantity < 0 },
            ]"
            >{{ n(resultingQuantity) }} {{ unitLabel }}</span
          >
        </div>
      </div>

      <div class="flex flex-column gap-2">
        <span id="adjustment-operation" class="text-sm font-medium">{{
          t('inventory.stock-adjustment-form.operation')
        }}</span>
        <pv-select-button
          v-model="form.operation"
          :options="operationOptions"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          aria-labelledby="adjustment-operation"
          fluid
        >
          <template #option="{ option }">
            <i :class="option.icon" aria-hidden="true" />
            <span>{{ option.label }}</span>
          </template>
        </pv-select-button>
      </div>

      <div class="formgrid grid">
        <div class="field col-12 sm:col-6 flex flex-column gap-2 mb-0">
          <label for="adjustment-quantity" class="text-sm font-medium">{{
            t('inventory.stock-adjustment-form.quantity')
          }}</label>
          <pv-input-group>
            <pv-input-number
              v-model="form.quantity"
              input-id="adjustment-quantity"
              :locale="locale"
              :min="0"
              :max-fraction-digits="inventoryItem.unit === 'units' ? 0 : 3"
              input-class="font-mono"
            />
            <pv-input-group-addon class="text-sm">{{
              unitLabel
            }}</pv-input-group-addon>
          </pv-input-group>
        </div>
        <div class="field col-12 sm:col-6 flex flex-column gap-2 mb-0">
          <label for="adjustment-origin" class="text-sm font-medium">{{
            t('inventory.stock-adjustment-form.origin')
          }}</label>
          <pv-select
            v-model="form.locationId"
            input-id="adjustment-origin"
            :options="storageLocations"
            option-label="name"
            option-value="id"
            fluid
          />
        </div>
      </div>

      <div v-if="form.operation === 'transfer'" class="flex flex-column gap-2">
        <label for="adjustment-destination" class="text-sm font-medium">{{
          t('inventory.stock-adjustment-form.destination')
        }}</label>
        <pv-select
          v-model="form.destinationLocationId"
          input-id="adjustment-destination"
          :options="destinationLocations"
          option-label="name"
          option-value="id"
          fluid
        />
        <pv-message size="small" severity="secondary" variant="simple">
          {{ t('inventory.stock-adjustment-form.transfer-help') }}
        </pv-message>
      </div>

      <div class="flex flex-column gap-2">
        <label for="adjustment-reason" class="text-sm font-medium">{{
          t('inventory.stock-adjustment-form.reason')
        }}</label>
        <pv-select
          v-model="form.reason"
          input-id="adjustment-reason"
          :options="reasonOptions"
          option-label="label"
          option-value="value"
          fluid
        />
      </div>

      <div class="flex flex-column gap-2">
        <label for="adjustment-note" class="text-sm font-medium">{{
          t('inventory.stock-adjustment-form.note')
        }}</label>
        <pv-textarea
          id="adjustment-note"
          v-model="form.note"
          rows="3"
          maxlength="500"
          :required="form.reason === 'other'"
          auto-resize
          fluid
        />
        <pv-message size="small" severity="secondary" variant="simple">
          {{ t('inventory.stock-adjustment-form.note-help') }}
        </pv-message>
      </div>

      <pv-message severity="success" icon="pi pi-history">
        {{ t('inventory.stock-adjustment-form.audit') }}
      </pv-message>
      <pv-message v-if="errorCode" severity="error" icon="pi pi-times-circle">
        {{ t(`inventory.inventory-terms.errors.${errorCode}`) }}
      </pv-message>
    </form>

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <pv-button
          :label="t('inventory.stock-adjustment-form.cancel')"
          severity="secondary"
          outlined
          rounded
          :disabled="saving"
          @click="visible = false"
        />
        <pv-button
          type="submit"
          form="stock-adjustment-form"
          :label="t('inventory.stock-adjustment-form.save')"
          icon="pi pi-save"
          rounded
          :loading="saving"
        />
      </div>
    </template>
  </pv-drawer>
</template>
