<script setup>
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import useRoomsStore from '../../application/rooms.store.js';
import { RoomType } from '../../domain/model/room-type.entity.js';
import { RoomsError } from '../../domain/model/rooms.error.js';
import { moneyLocale } from '../../../shared/presentation/calendar-format.js';

const props = defineProps({
  roomType: { type: Object, default: null },
});
const visible = defineModel('visible', { type: Boolean });
const emit = defineEmits(['saved']);

const { t, locale } = useI18n();
const store = useRoomsStore();
const { currentPropertyId, currentProperty, saving } = toRefs(store);
const { addRoomType, updateRoomType, getRoomsByRoomType } = store;

const form = ref({
  name: props.roomType?.name ?? '',
  capacity: props.roomType?.capacity ?? 2,
  bedConfiguration: props.roomType?.bedConfiguration ?? '',
  baseNightlyRate: props.roomType?.baseNightlyRate ?? null,
  active: props.roomType ? props.roomType.isActive : true,
});
const errorCode = ref('');
const isEdit = computed(() => !!props.roomType);
const roomsCount = computed(() =>
  isEdit.value ? getRoomsByRoomType(props.roomType.id).length : 0,
);

/**
 * Saves the room type, either by adding a new one or updating an existing one.
 */
const saveRoomType = async () => {
  errorCode.value = '';
  const { active, ...attributes } = form.value;
  const roomType = new RoomType({
    id: props.roomType?.id ?? null,
    propertyId: props.roomType?.propertyId ?? currentPropertyId.value,
    ...attributes,
    baseNightlyRate: attributes.baseNightlyRate ?? 0,
    status: active ? 'active' : 'inactive',
  });
  try {
    const savedRoomType = isEdit.value
      ? await updateRoomType(roomType)
      : await addRoomType(roomType);
    emit('saved', savedRoomType);
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
            ? t('rooms.room-type-form.edit-title')
            : t('rooms.room-type-form.new-title')
        }}</span>
        <span class="text-sm text-color-secondary">{{
          isEdit
            ? t('rooms.room-type-form.rooms-count', roomsCount)
            : currentProperty?.name
        }}</span>
      </div>
    </template>

    <form
      id="room-type-form"
      class="flex flex-column gap-3"
      @submit.prevent="saveRoomType"
    >
      <div class="flex flex-column gap-2">
        <label for="room-type-name" class="text-sm font-medium">{{
          t('rooms.room-type-form.name')
        }}</label>
        <pv-input-text
          id="room-type-name"
          v-model="form.name"
          :placeholder="t('rooms.room-type-form.name-placeholder')"
          required
          maxlength="60"
          autofocus
          fluid
        />
      </div>
      <div class="formgrid grid">
        <div class="field col-12 sm:col-5 flex flex-column gap-2 mb-0">
          <label for="room-type-capacity" class="text-sm font-medium">{{
            t('rooms.room-type-form.capacity')
          }}</label>
          <pv-input-group>
            <pv-input-number
              v-model="form.capacity"
              input-id="room-type-capacity"
              :min="1"
              :max="RoomType.maxCapacity"
              :locale="locale"
              required
              fluid
            />
            <pv-input-group-addon>{{
              t('rooms.room-type-form.guests')
            }}</pv-input-group-addon>
          </pv-input-group>
        </div>
        <div class="field col-12 sm:col-7 flex flex-column gap-2 mb-0">
          <label for="room-type-beds" class="text-sm font-medium">{{
            t('rooms.room-type-form.beds')
          }}</label>
          <pv-input-text
            id="room-type-beds"
            v-model="form.bedConfiguration"
            :placeholder="t('rooms.room-type-form.beds-placeholder')"
            required
            maxlength="60"
            fluid
          />
        </div>
      </div>
      <div class="flex flex-column gap-2">
        <label for="room-type-rate" class="text-sm font-medium">{{
          t('rooms.room-type-form.base-rate')
        }}</label>
        <pv-input-number
          v-model="form.baseNightlyRate"
          input-id="room-type-rate"
          mode="currency"
          :currency="currentProperty?.currency ?? 'PEN'"
          :locale="moneyLocale(currentProperty?.currency ?? 'PEN', locale)"
          :min="0"
          input-class="font-mono"
          required
          fluid
        />
        <small class="text-color-secondary">{{
          t('rooms.room-type-form.base-rate-help')
        }}</small>
      </div>
      <div
        class="flex align-items-center justify-content-between gap-3 p-3 border-1 surface-border border-round-lg"
      >
        <label for="room-type-active" class="flex flex-column gap-1">
          <span class="font-medium">{{
            t('rooms.room-type-form.active')
          }}</span>
          <span class="text-sm text-color-secondary">{{
            t('rooms.room-type-form.active-help')
          }}</span>
        </label>
        <pv-toggle-switch v-model="form.active" input-id="room-type-active" />
      </div>
      <pv-message
        v-if="roomsCount"
        size="small"
        severity="secondary"
        variant="simple"
        icon="pi pi-info-circle"
      >
        {{ t('rooms.room-type-form.in-use', roomsCount) }}
      </pv-message>
      <pv-message v-if="errorCode" severity="error" icon="pi pi-times-circle">
        {{ t(`rooms.rooms-terms.errors.${errorCode}`) }}
      </pv-message>
    </form>

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <pv-button
          :label="t('rooms.room-type-form.cancel')"
          severity="secondary"
          outlined
          rounded
          :disabled="saving"
          @click="visible = false"
        />
        <pv-button
          type="submit"
          form="room-type-form"
          :label="t('rooms.room-type-form.save')"
          icon="pi pi-save"
          rounded
          :loading="saving"
        />
      </div>
    </template>
  </pv-drawer>
</template>
