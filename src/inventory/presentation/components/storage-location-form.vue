<script setup>
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import useInventoryStore from '../../application/inventory.store.js';
import { StorageLocation } from '../../domain/model/storage-location.entity.js';
import { InventoryError } from '../../domain/model/inventory.error.js';

const props = defineProps({
  storageLocation: { type: Object, default: null },
});
const visible = defineModel('visible', { type: Boolean });
const emit = defineEmits(['saved']);

const { t } = useI18n();
const store = useInventoryStore();
const { currentPropertyId, currentProperty, saving } = toRefs(store);
const { addStorageLocation, updateStorageLocation } = store;

const form = ref({
  name: props.storageLocation?.name ?? '',
  code: props.storageLocation?.code ?? '',
  type: props.storageLocation?.type ?? 'warehouse',
  area: props.storageLocation?.area ?? '',
  responsibleTeam: props.storageLocation?.responsibleTeam ?? '',
  description: props.storageLocation?.description ?? '',
});
const errorCode = ref('');
const isEdit = computed(() => !!props.storageLocation);
const typeOptions = computed(() =>
  StorageLocation.types.map((value) => ({
    value,
    label: t(`inventory.inventory-terms.location-types.${value}`),
  })),
);

/**
 * Saves the storage location, either by adding a new one or updating an existing one.
 */
const saveStorageLocation = async () => {
  errorCode.value = '';
  const storageLocation = new StorageLocation({
    id: props.storageLocation?.id ?? null,
    propertyId: props.storageLocation?.propertyId ?? currentPropertyId.value,
    ...form.value,
  });
  try {
    const savedStorageLocation = isEdit.value
      ? await updateStorageLocation(storageLocation)
      : await addStorageLocation(storageLocation);
    emit('saved', savedStorageLocation);
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
            ? t('inventory.storage-location-form.edit-title')
            : t('inventory.storage-location-form.new-title')
        }}</span>
        <span class="text-sm text-color-secondary">{{
          currentProperty?.name
        }}</span>
      </div>
    </template>

    <form
      id="storage-location-form"
      class="flex flex-column gap-3"
      @submit.prevent="saveStorageLocation"
    >
      <div class="flex flex-column gap-2">
        <label for="location-name" class="text-sm font-medium">{{
          t('inventory.storage-location-form.name')
        }}</label>
        <pv-input-text
          id="location-name"
          v-model="form.name"
          required
          maxlength="100"
          autofocus
          fluid
        />
      </div>
      <div class="formgrid grid">
        <div class="field col-12 sm:col-6 flex flex-column gap-2 mb-0">
          <label for="location-code" class="text-sm font-medium">{{
            t('inventory.storage-location-form.code')
          }}</label>
          <pv-input-text
            id="location-code"
            v-model="form.code"
            class="font-mono"
            required
            maxlength="40"
            :disabled="isEdit"
            fluid
          />
        </div>
        <div class="field col-12 sm:col-6 flex flex-column gap-2 mb-0">
          <label for="location-type" class="text-sm font-medium">{{
            t('inventory.storage-location-form.type')
          }}</label>
          <pv-select
            v-model="form.type"
            input-id="location-type"
            :options="typeOptions"
            option-label="label"
            option-value="value"
            fluid
          />
        </div>
      </div>
      <pv-message
        v-if="isEdit"
        size="small"
        severity="secondary"
        variant="simple"
        icon="pi pi-lock"
      >
        {{ t('inventory.storage-location-form.code-locked') }}
      </pv-message>
      <div class="formgrid grid">
        <div class="field col-12 sm:col-6 flex flex-column gap-2 mb-0">
          <label for="location-area" class="text-sm font-medium">{{
            t('inventory.storage-location-form.area')
          }}</label>
          <pv-input-text
            id="location-area"
            v-model="form.area"
            required
            maxlength="100"
            fluid
          />
        </div>
        <div class="field col-12 sm:col-6 flex flex-column gap-2 mb-0">
          <label for="location-team" class="text-sm font-medium">{{
            t('inventory.storage-location-form.team')
          }}</label>
          <pv-input-text
            id="location-team"
            v-model="form.responsibleTeam"
            required
            maxlength="100"
            fluid
          />
        </div>
      </div>
      <div class="flex flex-column gap-2">
        <label for="location-description" class="text-sm font-medium">{{
          t('inventory.storage-location-form.description')
        }}</label>
        <pv-textarea
          id="location-description"
          v-model="form.description"
          rows="4"
          maxlength="500"
          auto-resize
          fluid
        />
      </div>
      <pv-message v-if="errorCode" severity="error" icon="pi pi-times-circle">
        {{ t(`inventory.inventory-terms.errors.${errorCode}`) }}
      </pv-message>
    </form>

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <pv-button
          :label="t('inventory.storage-location-form.cancel')"
          severity="secondary"
          outlined
          rounded
          :disabled="saving"
          @click="visible = false"
        />
        <pv-button
          type="submit"
          form="storage-location-form"
          :label="t('inventory.storage-location-form.save')"
          icon="pi pi-save"
          rounded
          :loading="saving"
        />
      </div>
    </template>
  </pv-drawer>
</template>
