<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import useOverviewStore from '../../application/overview.store.js';
import { formatDayRange } from '../../../shared/presentation/calendar-format.js';
import BookingStatusTag from '../../../bookings/presentation/components/booking-status-tag.vue';

const { t, locale } = useI18n();
const router = useRouter();
const store = useOverviewStore();

const query = ref('');
const suggestions = ref([]);
const search = ref(null);
const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

/**
 * Updates the suggestions for the typed text.
 * @param {{query: string}} event - AutoComplete search event.
 */
const complete = (event) => {
  suggestions.value = store.searchBookings(event.query);
};

/**
 * Opens the chosen booking and clears the search.
 * @param {{value: Object}} event - AutoComplete selection event.
 */
const openBooking = (event) => {
  query.value = '';
  router.push({
    name: 'bookings-booking-detail',
    params: { id: event.value.id },
  });
};

/**
 * Focuses the search with Ctrl+K or ⌘K.
 * @param {KeyboardEvent} event - Key event.
 */
const focusSearch = (event) => {
  if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    search.value?.$el.querySelector('input')?.focus();
  }
};

onMounted(() => window.addEventListener('keydown', focusSearch));
onBeforeUnmount(() => window.removeEventListener('keydown', focusSearch));
</script>

<template>
  <pv-icon-field class="w-full md:w-18rem">
    <pv-input-icon class="pi pi-search z-1" />
    <pv-auto-complete
      ref="search"
      v-model="query"
      :suggestions="suggestions"
      option-label="guestName"
      :placeholder="
        t('overview.booking-search.placeholder', {
          shortcut: isMac ? '⌘K' : 'Ctrl+K',
        })
      "
      :aria-label="t('overview.booking-search.label')"
      :empty-search-message="t('overview.booking-search.empty')"
      :delay="150"
      size="small"
      input-class="w-full pl-5"
      fluid
      @complete="complete"
      @option-select="openBooking"
    >
      <template #option="{ option }">
        <span
          class="flex align-items-center justify-content-between gap-3 w-full"
        >
          <span class="flex flex-column min-w-0">
            <span class="font-semibold">{{ option.guestName }}</span>
            <span class="text-sm text-color-secondary"
              ><span class="font-mono">{{ option.code }}</span> ·
              {{
                formatDayRange(option.checkInDate, option.checkOutDate, locale)
              }}</span
            >
          </span>
          <booking-status-tag :status="option.status" />
        </span>
      </template>
    </pv-auto-complete>
  </pv-icon-field>
</template>
