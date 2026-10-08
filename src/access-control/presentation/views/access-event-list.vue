<script setup>
import { computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import useAccessControlStore from '../../application/access-control.store.js';
import useRoomsStore from '../../../rooms/application/rooms.store.js';
import { AccessEvent } from '../../domain/model/access-event.entity.js';
import {
  CalendarDate,
  formatDay,
} from '../../../shared/presentation/calendar-format.js';
import AccessControlLayout from '../components/access-control-layout.vue';
import AccessEventDrawer from '../components/access-event-drawer.vue';

const { t, n, locale } = useI18n();
const route = useRoute();
const store = useAccessControlStore();
const roomsStore = useRoomsStore();
const { accessEvents, currentPropertyId } = toRefs(store);
const { getCredentialById } = store;

const today = CalendarDate.today();
const search = ref(route.query.search ?? '');
const resultFilter = ref(null);
const accessPointFilter = ref(null);
const day = ref(CalendarDate.toDate(today));
const selectedEvent = ref(null);

const selectedDay = computed(() =>
  day.value ? CalendarDate.fromDate(day.value) : null,
);
const eventRows = computed(() =>
  accessEvents.value
    .map((accessEvent) => {
      const credential = getCredentialById(accessEvent.credentialId);
      return {
        id: accessEvent.id,
        accessEvent,
        day: CalendarDate.fromDate(new Date(accessEvent.occurredAt)),
        access: accessEvent.roomId
          ? (roomsStore.getRoomById(accessEvent.roomId)?.number ?? '—')
          : credential?.scope
            ? t(
                `access-control.access-control-terms.scopes.${credential.scope}`,
              )
            : '—',
      };
    })
    .toSorted((a, b) =>
      b.accessEvent.occurredAt.localeCompare(a.accessEvent.occurredAt),
    ),
);
const dayRows = computed(() =>
  eventRows.value.filter(
    (row) => !selectedDay.value || row.day === selectedDay.value,
  ),
);
const filteredRows = computed(() => {
  const query = search.value.trim().toLowerCase();
  return dayRows.value.filter(
    ({ accessEvent, access }) =>
      (!resultFilter.value || accessEvent.result === resultFilter.value) &&
      (!accessPointFilter.value ||
        accessEvent.accessPoint === accessPointFilter.value) &&
      `${accessEvent.holderName} ${accessEvent.cardId} ${access}`
        .toLowerCase()
        .includes(query),
  );
});
const counts = computed(() => ({
  total: dayRows.value.length,
  granted: dayRows.value.filter((row) => !row.accessEvent.isDenied).length,
  denied: dayRows.value.filter((row) => row.accessEvent.isDenied).length,
}));
const resultOptions = computed(() =>
  ['granted', 'denied'].map((value) => ({
    value,
    label: t(`access-control.access-control-terms.results.${value}`),
  })),
);
const accessPointOptions = computed(() =>
  AccessEvent.accessPoints.map((value) => ({
    value,
    label: t(`access-control.access-control-terms.access-points.${value}`),
  })),
);
const filtersActive = computed(
  () =>
    search.value ||
    resultFilter.value ||
    accessPointFilter.value ||
    selectedDay.value !== today,
);

watch(currentPropertyId, () => resetFilters());

/**
 * Clears the filters and shows today's events.
 */
const resetFilters = () => {
  search.value = '';
  resultFilter.value = null;
  accessPointFilter.value = null;
  day.value = CalendarDate.toDate(today);
};

/**
 * Formats the time of an event.
 * @param {string} value - ISO date-time.
 * @returns {string} Localized time.
 */
const time = (value) =>
  new Intl.DateTimeFormat(locale.value, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
</script>

<template>
  <access-control-layout
    :title="t('access-control.access-event-list.title')"
    :back-route="{ name: 'access-control-credentials' }"
  >
    <section class="flex flex-column gap-3">
      <dl
        class="flex flex-wrap align-items-baseline gap-4 m-0 pb-3 border-bottom-1 surface-border"
      >
        <div class="flex align-items-baseline gap-2">
          <dd class="m-0 text-2xl font-semibold">{{ n(counts.total) }}</dd>
          <dt class="text-color-secondary">
            {{
              selectedDay === today
                ? t(
                    'access-control.access-event-list.events-today',
                    counts.total,
                  )
                : t('access-control.access-event-list.events', counts.total)
            }}
          </dt>
        </div>
        <div class="flex align-items-baseline gap-2">
          <dd class="m-0 text-xl font-semibold text-green-700">
            {{ n(counts.granted) }}
          </dd>
          <dt class="text-color-secondary">
            {{ t('access-control.access-control-terms.results.granted') }}
          </dt>
        </div>
        <div class="flex align-items-baseline gap-2">
          <dd class="m-0 text-xl font-semibold text-red-600">
            {{ n(counts.denied) }}
          </dd>
          <dt class="text-color-secondary">
            {{ t('access-control.access-control-terms.results.denied') }}
          </dt>
        </div>
      </dl>

      <div class="flex flex-wrap align-items-center gap-2">
        <pv-icon-field class="w-full md:w-18rem">
          <pv-input-icon class="pi pi-search" />
          <pv-input-text
            v-model="search"
            :placeholder="t('access-control.access-event-list.search')"
            :aria-label="t('access-control.access-event-list.search')"
            fluid
          />
        </pv-icon-field>
        <pv-select
          v-model="resultFilter"
          :options="resultOptions"
          option-label="label"
          option-value="value"
          :placeholder="t('access-control.access-event-list.all-results')"
          :aria-label="t('access-control.access-event-list.result')"
          show-clear
          class="w-full sm:w-11rem"
        />
        <pv-select
          v-model="accessPointFilter"
          :options="accessPointOptions"
          option-label="label"
          option-value="value"
          :placeholder="t('access-control.access-event-list.all-access-points')"
          :aria-label="t('access-control.access-event-list.access-point')"
          show-clear
          class="w-full sm:w-13rem"
        />
        <pv-date-picker
          v-model="day"
          :max-date="CalendarDate.toDate(today)"
          :manual-input="false"
          :aria-label="t('access-control.access-event-list.day')"
          show-icon
          icon-display="input"
          show-button-bar
          class="w-full sm:w-12rem"
        />
        <pv-button
          v-if="filtersActive"
          :label="t('access-control.access-event-list.clear')"
          icon="pi pi-filter-slash"
          severity="secondary"
          text
          @click="resetFilters"
        />
        <span class="ml-auto text-sm text-color-secondary" aria-live="polite">{{
          t('access-control.access-event-list.results', filteredRows.length)
        }}</span>
      </div>

      <pv-data-table
        :value="filteredRows"
        data-key="id"
        row-hover
        scrollable
        paginator
        :rows="12"
        :always-show-paginator="false"
        table-style="min-width: 58rem"
        :pt="{ bodyRow: { class: 'cursor-pointer' } }"
        @row-click="selectedEvent = $event.data.accessEvent"
      >
        <template #empty>
          <div
            class="flex flex-column align-items-center gap-2 py-6 text-center"
          >
            <i
              class="pi pi-history text-3xl text-color-secondary"
              aria-hidden="true"
            />
            <span class="font-medium">{{
              t('access-control.access-event-list.empty-title')
            }}</span>
            <span class="text-sm text-color-secondary">{{
              t('access-control.access-event-list.empty-text')
            }}</span>
          </div>
        </template>
        <pv-column :header="t('access-control.access-event-list.time')">
          <template #body="{ data }">
            <span class="flex flex-column">
              <span class="font-mono font-semibold white-space-nowrap">{{
                time(data.accessEvent.occurredAt)
              }}</span>
              <span class="text-sm text-color-secondary">{{
                data.day === today
                  ? t('access-control.access-event-list.today')
                  : formatDay(data.day, locale, {
                      day: 'numeric',
                      month: 'short',
                    })
              }}</span>
            </span>
          </template>
        </pv-column>
        <pv-column :header="t('access-control.access-event-list.credential')">
          <template #body="{ data }">
            <span class="flex flex-column">
              <span class="font-mono font-semibold">{{
                data.accessEvent.cardId
              }}</span>
              <span class="text-sm text-color-secondary">{{
                t(
                  `access-control.access-control-terms.holder-types.${data.accessEvent.holderType}`,
                )
              }}</span>
            </span>
          </template>
        </pv-column>
        <pv-column
          field="accessEvent.holderName"
          :header="t('access-control.access-event-list.person')"
        />
        <pv-column :header="t('access-control.access-event-list.access-point')">
          <template #body="{ data }">
            {{
              t(
                `access-control.access-control-terms.access-points.${data.accessEvent.accessPoint}`,
              )
            }}
          </template>
        </pv-column>
        <pv-column :header="t('access-control.access-event-list.result')">
          <template #body="{ data }">
            <span
              :class="[
                'flex align-items-start gap-2',
                data.accessEvent.isDenied ? 'text-red-600' : 'text-green-700',
              ]"
            >
              <i
                :class="[
                  data.accessEvent.isDenied ? 'pi pi-ban' : 'pi pi-sign-in',
                  'mt-1',
                ]"
                aria-hidden="true"
              />
              <span class="flex flex-column">
                <span class="font-medium">{{
                  t(
                    `access-control.access-control-terms.results.${data.accessEvent.result}`,
                  )
                }}</span>
                <span
                  v-if="data.accessEvent.isDenied"
                  class="text-sm text-color-secondary"
                  >{{
                    t(
                      `access-control.access-control-terms.denial-reasons.${data.accessEvent.denialReason}`,
                    )
                  }}</span
                >
              </span>
            </span>
          </template>
        </pv-column>
        <pv-column
          field="access"
          :header="t('access-control.access-event-list.access')"
        />
        <pv-column style="width: 1%">
          <template #body>
            <i
              class="pi pi-chevron-right text-color-secondary"
              aria-hidden="true"
            />
          </template>
        </pv-column>
      </pv-data-table>
    </section>

    <access-event-drawer
      v-if="selectedEvent"
      :visible="!!selectedEvent"
      :access-event="selectedEvent"
      @update:visible="(value) => !value && (selectedEvent = null)"
    />
  </access-control-layout>
</template>
