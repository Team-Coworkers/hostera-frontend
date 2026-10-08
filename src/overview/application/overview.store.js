/**
 * Application service store for the Overview bounded context.
 * It reads bookings and rooms from their contexts and the portfolio of every property to summarize operations.
 *
 * @module useOverviewStore
 */
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { OverviewApi } from '../infrastructure/overview-api.js';
import { PropertyOverviewAssembler } from '../infrastructure/property-overview.assembler.js';
import { DailyPerformance } from '../domain/model/daily-performance.entity.js';
import useRoomsStore from '../../rooms/application/rooms.store.js';
import useBookingsStore from '../../bookings/application/bookings.store.js';

const overviewApi = new OverviewApi();

/**
 * Reactive store that exposes Overview queries.
 *
 * @returns {Object} Store state and actions.
 */
const useOverviewStore = defineStore('overview', () => {
  const roomsStore = useRoomsStore();
  const bookingsStore = useBookingsStore();

  /**
   * Overview of each property for today.
   * @type {import('vue').Ref<PropertyOverview[]>}
   */
  const propertyOverviews = ref([]);
  /**
   * Whether property overviews have been loaded from the API.
   * @type {import('vue').Ref<boolean>}
   */
  const propertyOverviewsLoaded = ref(false);
  /**
   * Errors encountered while loading property overviews.
   * @type {import('vue').Ref<Error[]>}
   */
  const propertyOverviewErrors = ref([]);

  /**
   * Returns the current local ISO calendar day.
   * @returns {string}
   */
  function today() {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  /**
   * Moves an ISO calendar day by a number of days.
   * @param {string} value - ISO calendar day.
   * @param {number} days - Days to add; negative values move backwards.
   * @returns {string} ISO calendar day.
   */
  function addDays(value, days) {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  /**
   * Loads the overview of every property for today.
   * @returns {Promise<void>}
   */
  function fetchPropertyOverviews() {
    propertyOverviewErrors.value = [];
    propertyOverviewsLoaded.value = false;
    return overviewApi
      .getPortfolio()
      .then((responses) => {
        propertyOverviews.value =
          PropertyOverviewAssembler.toEntitiesFromResponses(
            roomsStore.properties,
            responses,
            today(),
          );
        propertyOverviewsLoaded.value = true;
      })
      .catch((error) => {
        propertyOverviewErrors.value.push(error);
      });
  }

  // Overviews follow the loaded properties and refresh when bookings change.
  watch(
    () => [roomsStore.properties.length, bookingsStore.bookings],
    () => {
      if (roomsStore.propertiesLoaded) fetchPropertyOverviews();
    },
    { immediate: true },
  );

  /**
   * Room revenue and occupancy of the current property over a period, with the change against the previous period.
   * @param {'last-7'|'last-30'|'next-30'} period - Period to summarize.
   * @returns {{days: DailyPerformance[], revenue: number, previousRevenue: number, change: ?number, occupancyRate: number}}
   */
  function getPerformance(period) {
    const length = period === 'last-7' ? 7 : 30;
    const start =
      period === 'next-30' ? today() : addDays(today(), -(length - 1));
    const dates = Array.from({ length }, (_, index) => addDays(start, index));
    const previousDates = dates.map((date) => addDays(date, -length));
    const inputs = {
      bookings: bookingsStore.bookings,
      roomsCount: roomsStore.rooms.length,
    };
    const days = DailyPerformance.series({ ...inputs, dates });
    const previous = DailyPerformance.series({
      ...inputs,
      dates: previousDates,
    });
    const sum = (entries) =>
      entries.reduce((total, entry) => total + entry.revenue, 0);
    const revenue = sum(days);
    const previousRevenue = sum(previous);
    return {
      days,
      revenue,
      previousRevenue,
      change: previousRevenue
        ? (revenue - previousRevenue) / previousRevenue
        : null,
      occupancyRate:
        days.reduce((total, day) => total + day.occupancyRate, 0) / length,
    };
  }

  /**
   * Today's arrivals of the current property: bookings due today and those already checked in today.
   * @type {import('vue').ComputedRef<{booking: Booking, arrived: boolean, balanceDue: number}[]>}
   */
  const todaysArrivals = computed(() => {
    const day = today();
    return bookingsStore.bookings
      .filter(
        (booking) =>
          booking.checkInDate === day &&
          ['pending', 'confirmed', 'checked-in'].includes(booking.status),
      )
      .map((booking) => ({
        booking,
        arrived: booking.status === 'checked-in',
        balanceDue: bookingsStore.getBalanceDue(booking),
      }))
      .toSorted((a, b) => Number(a.arrived) - Number(b.arrived));
  });

  /**
   * Number of rooms of the current property in each day status today.
   * @type {import('vue').ComputedRef<Object<string, number>>}
   */
  const roomStatusCounts = computed(() => {
    const day = today();
    const counts = {};
    for (const room of roomsStore.rooms) {
      const status = roomsStore.getDayStatus(room.id, day);
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  });

  /**
   * Finds bookings of the current property by guest name or booking code.
   * @param {string} query - Text to search.
   * @returns {Booking[]} Up to eight matching bookings, latest stays first.
   */
  function searchBookings(query) {
    const text = query.trim().toLowerCase();
    if (!text) return [];
    return bookingsStore.bookings
      .filter((booking) =>
        `${booking.guestName} ${booking.code}`.toLowerCase().includes(text),
      )
      .toSorted((a, b) => b.checkInDate.localeCompare(a.checkInDate))
      .slice(0, 8);
  }

  return {
    propertyOverviews,
    propertyOverviewsLoaded,
    propertyOverviewErrors,
    fetchPropertyOverviews,
    getPerformance,
    todaysArrivals,
    roomStatusCounts,
    searchBookings,
  };
});

export default useOverviewStore;
