<script setup>
import { computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useConfirm, useToast } from 'primevue';
import useRoomsStore from '../../application/rooms.store.js';
import { RoomsError } from '../../domain/model/rooms.error.js';
import { formatMoney } from '../../../shared/presentation/calendar-format.js';
import RoomsLayout from '../components/rooms-layout.vue';
import RoomAvatar from '../components/room-avatar.vue';
import RoomTypeForm from '../components/room-type-form.vue';

const { t, n, locale } = useI18n();
const toast = useToast();
const confirm = useConfirm();
const store = useRoomsStore();
const { roomTypes, roomsCount, currentProperty, currentPropertyId, saving } =
  toRefs(store);
const { getRoomsByRoomType, deleteRoomType } = store;

const search = ref('');
const roomTypeFormVisible = ref(false);
const selectedRoomType = ref(null);

const filteredRoomTypes = computed(() => {
  const query = search.value.trim().toLowerCase();
  return roomTypes.value
    .filter((roomType) =>
      `${roomType.name} ${roomType.bedConfiguration}`
        .toLowerCase()
        .includes(query),
    )
    .map((roomType) => ({
      roomType,
      id: roomType.id,
      roomsCount: getRoomsByRoomType(roomType.id).length,
    }));
});

watch(currentPropertyId, () => {
  search.value = '';
});

/**
 * Opens the room type form to add or edit a room type.
 * @param {Object|null} roomType - The room type to edit, or null to add one.
 */
const openRoomTypeForm = (roomType = null) => {
  selectedRoomType.value = roomType;
  roomTypeFormVisible.value = true;
};

/**
 * Confirms that changes were saved.
 */
const notifySaved = () => {
  toast.add({
    severity: 'success',
    summary: t('rooms.room-type-list.saved'),
    life: 3000,
  });
};

/**
 * Confirm deletion of an unused room type and execute deletion if confirmed.
 * @param {Object} roomType - The room type to delete.
 */
const confirmDelete = (roomType) => {
  confirm.require({
    message: t('rooms.room-type-list.confirm-delete', { name: roomType.name }),
    header: t('rooms.room-type-list.delete-header'),
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: t('rooms.room-type-list.confirm'),
    rejectLabel: t('rooms.room-type-list.cancel'),
    acceptProps: { severity: 'danger' },
    rejectProps: { severity: 'secondary', outlined: true },
    accept: async () => {
      try {
        await deleteRoomType(roomType);
        toast.add({
          severity: 'success',
          summary: t('rooms.room-type-list.removed'),
          life: 3000,
        });
      } catch (error) {
        const errorCode =
          error instanceof RoomsError ? error.code : 'connection';
        toast.add({
          severity: 'error',
          summary: t(`rooms.rooms-terms.errors.${errorCode}`),
          life: 6000,
        });
      }
    },
  });
};
</script>

<template>
  <rooms-layout>
    <template #actions>
      <pv-button
        :label="t('rooms.room-type-list.new')"
        icon="pi pi-plus"
        rounded
        :disabled="saving"
        @click="openRoomTypeForm()"
      />
    </template>

    <section class="flex flex-column gap-3">
      <div class="flex flex-wrap align-items-center gap-2">
        <pv-icon-field class="w-full md:w-20rem">
          <pv-input-icon class="pi pi-search" />
          <pv-input-text
            v-model="search"
            :placeholder="t('rooms.room-type-list.search')"
            :aria-label="t('rooms.room-type-list.search')"
            fluid
          />
        </pv-icon-field>
        <span class="ml-auto text-sm text-color-secondary" aria-live="polite">{{
          t('rooms.room-type-list.summary', {
            types: t('rooms.room-type-list.types-count', roomTypes.length),
            rooms: t('rooms.room-type-list.rooms-count', roomsCount),
          })
        }}</span>
      </div>

      <pv-data-table
        :value="filteredRoomTypes"
        data-key="id"
        row-hover
        scrollable
        table-style="min-width: 52rem"
      >
        <template #empty>
          <div
            class="flex flex-column align-items-center gap-2 py-6 text-center"
          >
            <i class="pi pi-th-large text-3xl text-color-secondary" />
            <span class="font-medium">{{
              t('rooms.room-type-list.empty-title')
            }}</span>
            <span class="text-sm text-color-secondary">{{
              t('rooms.room-type-list.empty-text')
            }}</span>
          </div>
        </template>
        <pv-column
          field="roomType.name"
          :header="t('rooms.room-type-list.name')"
          sortable
        >
          <template #body="{ data }">
            <span class="flex align-items-center gap-3">
              <room-avatar icon="pi pi-th-large" />
              <span class="font-semibold white-space-nowrap">{{
                data.roomType.name
              }}</span>
            </span>
          </template>
        </pv-column>
        <pv-column
          field="roomType.capacity"
          :header="t('rooms.room-type-list.capacity')"
          sortable
        >
          <template #body="{ data }">{{
            t('rooms.rooms-terms.guests', data.roomType.capacity)
          }}</template>
        </pv-column>
        <pv-column
          field="roomType.bedConfiguration"
          :header="t('rooms.room-type-list.beds')"
        />
        <pv-column
          field="roomsCount"
          :header="t('rooms.room-type-list.rooms')"
          sortable
        >
          <template #body="{ data }">
            <span class="font-mono">{{ n(data.roomsCount) }}</span>
          </template>
        </pv-column>
        <pv-column
          field="roomType.baseNightlyRate"
          :header="t('rooms.room-type-list.base-rate')"
          sortable
        >
          <template #body="{ data }">
            <span class="font-mono white-space-nowrap">{{
              formatMoney(
                data.roomType.baseNightlyRate,
                currentProperty?.currency ?? 'PEN',
                locale,
              )
            }}</span>
          </template>
        </pv-column>
        <pv-column :header="t('rooms.room-type-list.status')">
          <template #body="{ data }">
            <pv-tag
              :severity="data.roomType.isActive ? 'success' : 'secondary'"
              :value="
                t(
                  `rooms.rooms-terms.room-type-statuses.${data.roomType.status}`,
                )
              "
            />
          </template>
        </pv-column>
        <pv-column
          :header="t('rooms.room-type-list.actions')"
          class="text-right white-space-nowrap"
          style="width: 1%"
          :pt="{ columnHeaderContent: { class: 'justify-content-end' } }"
        >
          <template #body="{ data }">
            <div class="flex justify-content-end gap-1">
              <pv-button
                v-tooltip.top="t('rooms.room-type-list.edit')"
                icon="pi pi-pencil"
                severity="secondary"
                text
                rounded
                :aria-label="`${t('rooms.room-type-list.edit')}: ${data.roomType.name}`"
                :disabled="saving"
                @click="openRoomTypeForm(data.roomType)"
              />
              <!-- The wrapper keeps the tooltip available while the button is disabled. -->
              <span
                v-tooltip.top="
                  data.roomsCount
                    ? t('rooms.room-type-list.delete-in-use')
                    : t('rooms.room-type-list.delete')
                "
              >
                <pv-button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  :aria-label="`${t('rooms.room-type-list.delete')}: ${data.roomType.name}`"
                  :disabled="saving || data.roomsCount > 0"
                  @click="confirmDelete(data.roomType)"
                />
              </span>
            </div>
          </template>
        </pv-column>
      </pv-data-table>
    </section>

    <room-type-form
      v-if="roomTypeFormVisible"
      v-model:visible="roomTypeFormVisible"
      :room-type="selectedRoomType"
      @saved="notifySaved"
    />
  </rooms-layout>
</template>
