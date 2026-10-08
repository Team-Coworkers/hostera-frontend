<script setup>
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import useRoomsStore from '../../application/rooms.store.js';
import { RatePlan } from '../../domain/model/rate-plan.entity.js';
import { RoomsError } from '../../domain/model/rooms.error.js';

const props = defineProps({
  ratePlan: { type: Object, default: null },
});
const visible = defineModel('visible', { type: Boolean });
const emit = defineEmits(['saved']);

const { t } = useI18n();
const store = useRoomsStore();
const { roomTypes, currentPropertyId, currentProperty, saving } = toRefs(store);
const { addRatePlan, updateRatePlan } = store;

const form = ref({
  name: props.ratePlan?.name ?? '',
  roomTypeIds: [...(props.ratePlan?.roomTypeIds ?? [])],
  includedServices: props.ratePlan?.includedServices ?? 'room-only',
  refundable: props.ratePlan?.refundable ?? true,
  cancellationPolicy: props.ratePlan?.cancellationPolicy ?? '',
  active: props.ratePlan ? props.ratePlan.isActive : true,
});
const errorCode = ref('');
const isEdit = computed(() => !!props.ratePlan);
// Inactive room types stay selectable only for the plan that already includes them.
const roomTypeOptions = computed(() =>
  roomTypes.value.filter(
    (roomType) =>
      roomType.isActive || props.ratePlan?.roomTypeIds.includes(roomType.id),
  ),
);
const includedServicesOptions = computed(() =>
  RatePlan.includedServicesOptions.map((value) => ({
    value,
    label: t(`rooms.rooms-terms.included-services.${value}`),
  })),
);

/**
 * Saves the rate plan, either by adding a new one or updating an existing one.
 */
const saveRatePlan = async () => {
  errorCode.value = '';
  const { active, ...attributes } = form.value;
  const ratePlan = new RatePlan({
    id: props.ratePlan?.id ?? null,
    propertyId: props.ratePlan?.propertyId ?? currentPropertyId.value,
    ...attributes,
    status: active ? 'active' : 'inactive',
  });
  try {
    const savedRatePlan = isEdit.value
      ? await updateRatePlan(ratePlan)
      : await addRatePlan(ratePlan);
    emit('saved', savedRatePlan);
    visible.value = false;
  } catch (error) {
    errorCode.value = error instanceof RoomsError ? error.code : 'connection';
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
            ? t('rooms.rate-plan-form.edit-title')
            : t('rooms.rate-plan-form.new-title')
        }}</span>
        <span class="text-sm text-color-secondary">{{
          currentProperty?.name
        }}</span>
      </div>
    </template>

    <form
      id="rate-plan-form"
      class="flex flex-column gap-3"
      @submit.prevent="saveRatePlan"
    >
      <div class="flex flex-column gap-2">
        <label for="rate-plan-name" class="text-sm font-medium">{{
          t('rooms.rate-plan-form.name')
        }}</label>
        <pv-input-text
          id="rate-plan-name"
          v-model="form.name"
          :placeholder="t('rooms.rate-plan-form.name-placeholder')"
          required
          maxlength="60"
          autofocus
          fluid
        />
      </div>
      <div class="flex flex-column gap-2">
        <label for="rate-plan-room-types" class="text-sm font-medium">{{
          t('rooms.rate-plan-form.room-types')
        }}</label>
        <pv-multi-select
          v-model="form.roomTypeIds"
          input-id="rate-plan-room-types"
          :options="roomTypeOptions"
          option-label="name"
          option-value="id"
          :placeholder="t('rooms.rate-plan-form.all-room-types')"
          display="chip"
          :show-toggle-all="false"
          fluid
        />
        <small class="text-color-secondary line-height-3">{{
          t('rooms.rate-plan-form.room-types-help')
        }}</small>
      </div>
      <div class="flex flex-column gap-2">
        <label for="rate-plan-services" class="text-sm font-medium">{{
          t('rooms.rate-plan-form.included-services')
        }}</label>
        <pv-select
          v-model="form.includedServices"
          input-id="rate-plan-services"
          :options="includedServicesOptions"
          option-label="label"
          option-value="value"
          fluid
        />
      </div>
      <div
        class="flex align-items-center justify-content-between gap-3 p-3 border-1 surface-border border-round-lg"
      >
        <label for="rate-plan-refundable" class="flex flex-column gap-1">
          <span class="font-medium">{{
            t('rooms.rate-plan-form.refundable')
          }}</span>
          <span class="text-sm text-color-secondary">{{
            form.refundable
              ? t('rooms.rate-plan-form.refundable-help')
              : t('rooms.rate-plan-form.non-refundable-help')
          }}</span>
        </label>
        <pv-toggle-switch
          v-model="form.refundable"
          input-id="rate-plan-refundable"
        />
      </div>
      <div v-if="form.refundable" class="flex flex-column gap-2">
        <label for="rate-plan-policy" class="text-sm font-medium">{{
          t('rooms.rate-plan-form.cancellation-policy')
        }}</label>
        <pv-textarea
          id="rate-plan-policy"
          v-model="form.cancellationPolicy"
          :placeholder="
            t('rooms.rate-plan-form.cancellation-policy-placeholder')
          "
          rows="2"
          maxlength="200"
          required
          auto-resize
          fluid
        />
      </div>
      <div
        v-if="isEdit"
        class="flex align-items-center justify-content-between gap-3 p-3 border-1 surface-border border-round-lg"
      >
        <label for="rate-plan-active" class="flex flex-column gap-1">
          <span class="font-medium">{{
            t('rooms.rate-plan-form.active')
          }}</span>
          <span class="text-sm text-color-secondary">{{
            t('rooms.rate-plan-form.active-help')
          }}</span>
        </label>
        <pv-toggle-switch v-model="form.active" input-id="rate-plan-active" />
      </div>
      <pv-message v-if="errorCode" severity="error" icon="pi pi-times-circle">
        {{ t(`rooms.rooms-terms.errors.${errorCode}`) }}
      </pv-message>
    </form>

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <pv-button
          :label="t('rooms.rate-plan-form.cancel')"
          severity="secondary"
          outlined
          rounded
          :disabled="saving"
          @click="visible = false"
        />
        <pv-button
          type="submit"
          form="rate-plan-form"
          :label="
            isEdit
              ? t('rooms.rate-plan-form.save')
              : t('rooms.rate-plan-form.create')
          "
          :icon="isEdit ? 'pi pi-save' : 'pi pi-check'"
          rounded
          :loading="saving"
        />
      </div>
    </template>
  </pv-drawer>
</template>
