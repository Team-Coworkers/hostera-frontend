<script setup>
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import useRoomsStore from '../../application/rooms.store.js';
import { Room } from '../../domain/model/room.entity.js';
import { RoomsError } from '../../domain/model/rooms.error.js';

const props = defineProps({
  room: { type: Object, default: null },
});
const visible = defineModel('visible', { type: Boolean });
const emit = defineEmits(['saved']);

const { t, locale } = useI18n();
const store = useRoomsStore();
const { roomTypes, currentPropertyId, currentProperty, saving } = toRefs(store);
const { addRoom, updateRoom, getRoomTypeById } = store;

const form = ref({
  number: props.room?.number ?? '',
  roomTypeId:
    props.room?.roomTypeId ??
    roomTypes.value.find((roomType) => roomType.isActive)?.id ??
    null,
  floor: props.room?.floor ?? null,
});
const errorCode = ref('');
const isEdit = computed(() => !!props.room);
// Inactive room types stay selectable only for the room that already uses them.
const roomTypeOptions = computed(() =>
  roomTypes.value.filter(
    (roomType) => roomType.isActive || roomType.id === props.room?.roomTypeId,
  ),
);
const selectedRoomType = computed(() => getRoomTypeById(form.value.roomTypeId));

/**
 * Saves the room, either by adding a new one or updating an existing one.
 */
const saveRoom = async () => {
  errorCode.value = '';
  const room = new Room({
    id: props.room?.id ?? null,
    propertyId: props.room?.propertyId ?? currentPropertyId.value,
    ...form.value,
  });
  try {
    const savedRoom = isEdit.value
      ? await updateRoom(room)
      : await addRoom(room);
    emit('saved', savedRoom);
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
            ? t('rooms.room-form.edit-title', { number: room.number })
            : t('rooms.room-form.new-title')
        }}</span>
        <span class="text-sm text-color-secondary">{{
          currentProperty?.name
        }}</span>
      </div>
    </template>

    <form
      id="room-form"
      class="flex flex-column gap-3"
      @submit.prevent="saveRoom"
    >
      <div class="formgrid grid">
        <div class="field col-12 sm:col-7 flex flex-column gap-2 mb-0">
          <label for="room-number" class="text-sm font-medium">{{
            t('rooms.room-form.number')
          }}</label>
          <pv-input-text
            id="room-number"
            v-model="form.number"
            :placeholder="t('rooms.room-form.number-placeholder')"
            class="font-mono"
            required
            maxlength="10"
            autofocus
            fluid
          />
        </div>
        <div class="field col-12 sm:col-5 flex flex-column gap-2 mb-0">
          <label for="room-floor" class="text-sm font-medium">{{
            t('rooms.room-form.floor')
          }}</label>
          <pv-input-number
            v-model="form.floor"
            input-id="room-floor"
            :min="-5"
            :max="200"
            :use-grouping="false"
            :locale="locale"
            fluid
          />
        </div>
      </div>
      <div class="flex flex-column gap-2">
        <label for="room-type" class="text-sm font-medium">{{
          t('rooms.room-form.room-type')
        }}</label>
        <pv-select
          v-model="form.roomTypeId"
          input-id="room-type"
          :options="roomTypeOptions"
          option-label="name"
          option-value="id"
          :placeholder="t('rooms.room-form.room-type-placeholder')"
          fluid
        >
          <template #option="{ option }">
            <span class="flex flex-column">
              <span class="font-medium">{{ option.name }}</span>
              <span class="text-sm text-color-secondary">{{
                t('rooms.room-form.room-type-summary', {
                  capacity: t('rooms.rooms-terms.guests', option.capacity),
                  beds: option.bedConfiguration,
                })
              }}</span>
            </span>
          </template>
        </pv-select>
        <small v-if="selectedRoomType" class="text-color-secondary">{{
          t('rooms.room-form.inherits', {
            capacity: t('rooms.rooms-terms.guests', selectedRoomType.capacity),
            beds: selectedRoomType.bedConfiguration,
          })
        }}</small>
      </div>
      <pv-message
        v-if="!roomTypeOptions.length"
        severity="warn"
        icon="pi pi-info-circle"
      >
        {{ t('rooms.room-form.no-room-types') }}
      </pv-message>
      <pv-message
        v-if="!isEdit"
        size="small"
        severity="secondary"
        variant="simple"
        icon="pi pi-check-circle"
      >
        {{ t('rooms.room-form.starts-available') }}
      </pv-message>
      <pv-message v-if="errorCode" severity="error" icon="pi pi-times-circle">
        {{ t(`rooms.rooms-terms.errors.${errorCode}`) }}
      </pv-message>
    </form>

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <pv-button
          :label="t('rooms.room-form.cancel')"
          severity="secondary"
          outlined
          rounded
          :disabled="saving"
          @click="visible = false"
        />
        <pv-button
          type="submit"
          form="room-form"
          :label="t('rooms.room-form.save')"
          icon="pi pi-save"
          rounded
          :loading="saving"
          :disabled="!roomTypeOptions.length"
        />
      </div>
    </template>
  </pv-drawer>
</template>
