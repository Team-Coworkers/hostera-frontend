/**
 * Application service store for the Bookings bounded context.
 * It coordinates booking use cases with the rooms, rates, and availability of the Rooms context and keeps UI-facing state.
 *
 * @module useBookingsStore
 */
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { BookingsApi } from '../infrastructure/bookings-api.js';
import { BookingAssembler } from '../infrastructure/booking.assembler.js';
import { PaymentAssembler } from '../infrastructure/payment.assembler.js';
import { Booking } from '../domain/model/booking.entity.js';
import { Payment } from '../domain/model/payment.entity.js';
import { BookingsError } from '../domain/model/bookings.error.js';
import useRoomsStore from '../../rooms/application/rooms.store.js';
import useAccessControlStore from '../../access-control/application/access-control.store.js';
import { IssueGuestKeyCardsCommand } from '../../access-control/domain/issue-guest-key-cards.command.js';

const bookingsApi = new BookingsApi();

/**
 * Operator recorded in booking status changes until IAM is implemented.
 * @type {string}
 */
const demoOperator = 'Demo operator';

/**
 * Reactive store that exposes Bookings commands and queries.
 *
 * @returns {Object} Store state and actions.
 */
const useBookingsStore = defineStore('bookings', () => {
  const roomsStore = useRoomsStore();
  const accessControlStore = useAccessControlStore();

  /**
   * List of booking entities of the current property.
   * @type {import('vue').Ref<Booking[]>}
   */
  const bookings = ref([]);
  /**
   * List of payment entities of the current property's bookings.
   * @type {import('vue').Ref<Payment[]>}
   */
  const payments = ref([]);
  /**
   * List of errors encountered during API operations.
   * @type {import('vue').Ref<Error[]>}
   */
  const errors = ref([]);
  /**
   * Whether bookings have been loaded from the API.
   * @type {import('vue').Ref<boolean>}
   */
  const bookingsLoaded = ref(false);
  /**
   * Whether payments have been loaded from the API.
   * @type {import('vue').Ref<boolean>}
   */
  const paymentsLoaded = ref(false);
  /**
   * Whether a create or update operation is in progress.
   * @type {import('vue').Ref<boolean>}
   */
  const saving = ref(false);
  /**
   * Identifier of the property whose bookings are managed, shared with the Rooms context.
   * @type {import('vue').ComputedRef<?number>}
   */
  const currentPropertyId = computed(() => roomsStore.currentPropertyId);
  /**
   * Number of loaded bookings.
   * @type {import('vue').ComputedRef<number>}
   */
  const bookingsCount = computed(() => {
    return bookingsLoaded.value ? bookings.value.length : 0;
  });

  /**
   * Loads one property-scoped collection and ignores responses for a previously selected property.
   * @param {(propertyId: number) => Promise<import('axios').AxiosResponse>} request - Infrastructure request.
   * @param {{toEntitiesFromResponse: Function}} assembler - Assembler for the collection.
   * @param {import('vue').Ref<Array>} collection - Collection state.
   * @param {import('vue').Ref<boolean>} loaded - Loaded flag of the collection.
   * @returns {Promise<void>}
   */
  function fetchCollection(request, assembler, collection, loaded) {
    const propertyId = currentPropertyId.value;
    collection.value = [];
    loaded.value = false;
    if (!propertyId) return Promise.resolve();
    return request(propertyId)
      .then((response) => {
        if (propertyId !== currentPropertyId.value) return;
        collection.value = assembler.toEntitiesFromResponse(response);
        loaded.value = true;
      })
      .catch((error) => {
        if (propertyId === currentPropertyId.value) errors.value.push(error);
      });
  }

  /**
   * Loads the current property's bookings and their payments.
   * @returns {Promise<void>}
   */
  function fetchBookings() {
    errors.value = [];
    return Promise.all([
      fetchCollection(
        (propertyId) => bookingsApi.getBookings(propertyId),
        BookingAssembler,
        bookings,
        bookingsLoaded,
      ),
      fetchCollection(
        (propertyId) => bookingsApi.getPayments(propertyId),
        PaymentAssembler,
        payments,
        paymentsLoaded,
      ),
    ]).then(() => {});
  }

  // Bookings follow the property selected in either context.
  watch(currentPropertyId, fetchBookings, { immediate: true });

  /**
   * Finds a booking entity by identifier.
   * @param {number|string} id - Booking identifier.
   * @returns {Booking|undefined} Matching booking, if available.
   */
  function getBookingById(id) {
    let idNum = parseInt(id);
    return bookings.value.find((booking) => booking['id'] === idNum);
  }

  /**
   * Lists the payments of a booking, oldest first.
   * @param {number} bookingId - Booking identifier.
   * @returns {Payment[]} Payments of the booking.
   */
  function getPaymentsOf(bookingId) {
    return payments.value
      .filter((payment) => payment.bookingId === bookingId)
      .toSorted((a, b) => a.paidAt.localeCompare(b.paidAt));
  }

  /**
   * Derives the amount a booking still owes.
   * @param {Booking} booking - Booking to check.
   * @returns {number} Balance due.
   */
  function getBalanceDue(booking) {
    return booking.balanceDue(getPaymentsOf(booking.id));
  }

  /**
   * Classifies how much of a booking has been paid.
   * @param {Booking} booking - Booking to check.
   * @returns {'unpaid'|'partially-paid'|'paid'}
   */
  function getPaymentStatus(booking) {
    return booking.paymentStatus(getPaymentsOf(booking.id));
  }

  /**
   * Derives the price of a stay as the sum of its nightly rates.
   * @param {Booking} booking - Booking with room type, rate plan, and stay dates.
   * @returns {number} Price of all nights in the property's currency.
   */
  function quoteTotal(booking) {
    const total = booking.nights.reduce(
      (sum, date) =>
        sum +
        (roomsStore.getNightlyRate(
          booking.roomTypeId,
          booking.ratePlanId,
          date,
        ) ?? 0),
      0,
    );
    return Math.round(total * 100) / 100;
  }

  /**
   * Whether a room is free for a stay: no other room-holding booking shares a night, and no status prevents booking.
   * @param {number} roomId - Room identifier.
   * @param {Booking} booking - Booking whose stay is checked; it never conflicts with itself.
   * @returns {boolean}
   */
  function isRoomAvailable(roomId, booking) {
    return (
      !bookings.value.some(
        (entry) =>
          entry['id'] !== booking.id &&
          entry.roomId === roomId &&
          entry.holdsRoom &&
          entry.overlaps(booking.checkInDate, booking.checkOutDate),
      ) &&
      roomsStore.isRoomBookable(roomId, booking.checkInDate, booking.lastNight)
    );
  }

  /**
   * Rejects a booking whose room, rate plan, or guests cannot be sold for its stay.
   * A room type or rate plan made inactive stays acceptable for the booking that already uses it.
   * @param {Booking} booking - Booking to check.
   * @param {?Booking} [currentBooking=null] - Persisted booking, when updating.
   * @throws {BookingsError} When the booking cannot be sold.
   */
  function ensureBookable(booking, currentBooking = null) {
    const roomType = roomsStore.getRoomTypeById(booking.roomTypeId);
    if (!roomType) throw new BookingsError('room-type-required');
    if (!roomType.isActive && currentBooking?.roomTypeId !== roomType.id)
      throw new BookingsError('inactive-room-type');
    if (roomsStore.getRoomById(booking.roomId)?.roomTypeId !== roomType.id)
      throw new BookingsError('room-not-in-room-type');
    const ratePlan = roomsStore.getRatePlanById(booking.ratePlanId);
    if (!ratePlan) throw new BookingsError('rate-plan-required');
    if (!ratePlan.isActive && currentBooking?.ratePlanId !== ratePlan.id)
      throw new BookingsError('inactive-rate-plan');
    if (!ratePlan.appliesTo(roomType.id))
      throw new BookingsError('rate-plan-not-for-room-type');
    if (booking.guests > roomType.capacity)
      throw new BookingsError('over-capacity');
    if (!isRoomAvailable(booking.roomId, booking))
      throw new BookingsError('room-unavailable');
  }

  /**
   * Tracks a create or update request and records its errors.
   * @template T
   * @param {Promise<T>} request - Pending infrastructure request.
   * @returns {Promise<T>} The same request result.
   */
  function trackSaving(request) {
    saving.value = true;
    return request
      .catch((error) => {
        errors.value.push(error);
        throw error;
      })
      .finally(() => {
        saving.value = false;
      });
  }

  /**
   * Creates a pending booking with the property's next booking code and its quoted total, then refreshes room availability.
   * @param {Booking} booking - Booking entity to persist.
   * @returns {Promise<Booking>} Created booking.
   * @throws {BookingsError} When a business rule is violated.
   */
  function addBooking(booking) {
    booking.validate();
    ensureBookable(booking);
    return trackSaving(
      bookingsApi
        .getLatestBooking(currentPropertyId.value)
        .then((response) => {
          const [latestBooking] =
            BookingAssembler.toEntitiesFromResponse(response);
          const newBooking = new Booking({
            ...booking,
            propertyId: currentPropertyId.value,
            code: Booking.nextCode(
              currentPropertyId.value,
              latestBooking?.code,
            ),
            status: 'pending',
            totalAmount: quoteTotal(booking),
            createdAt: new Date().toISOString().slice(0, 10),
          });
          return bookingsApi.createBooking(newBooking);
        })
        .then((response) => {
          const newBooking = BookingAssembler.toEntityFromResource(
            response.data,
          );
          bookings.value.push(newBooking);
          roomsStore.fetchRoomAssignments();
          return newBooking;
        }),
    );
  }

  /**
   * Updates a pending or confirmed booking, quoting a new total when its room type, rate plan, or nights change.
   * @param {Booking} booking - Booking entity with updated data.
   * @returns {Promise<Booking>} Updated booking.
   * @throws {BookingsError} When a business rule is violated.
   */
  function updateBooking(booking) {
    const currentBooking = getBookingById(booking.id);
    if (!currentBooking) throw new BookingsError('not-found');
    if (!currentBooking.isEditable) throw new BookingsError('not-editable');
    booking.validate();
    ensureBookable(booking, currentBooking);
    const updatedBooking = new Booking({
      ...booking,
      propertyId: currentBooking.propertyId,
      code: currentBooking.code,
      status: currentBooking.status,
      createdAt: currentBooking.createdAt,
      totalAmount: booking.hasSamePricingAs(currentBooking)
        ? currentBooking.totalAmount
        : quoteTotal(booking),
    });
    return saveChanges(updatedBooking);
  }

  /**
   * Persists a changed booking, replaces it in local state, and refreshes room availability.
   * @param {Booking} booking - Changed booking.
   * @returns {Promise<Booking>} Persisted booking.
   */
  function saveChanges(booking) {
    return trackSaving(
      bookingsApi.updateBooking(booking).then((response) => {
        const savedBooking = BookingAssembler.toEntityFromResource(
          response.data,
        );
        const index = bookings.value.findIndex(
          (entry) => entry['id'] === savedBooking.id,
        );
        if (index !== -1) bookings.value[index] = savedBooking;
        roomsStore.fetchRoomAssignments();
        return savedBooking;
      }),
    );
  }

  /**
   * Finds a booking that must exist to change its status.
   * @param {number} bookingId - Booking identifier.
   * @returns {Booking} Persisted booking.
   * @throws {BookingsError} When the booking no longer exists.
   */
  function requireBooking(bookingId) {
    const booking = getBookingById(bookingId);
    if (!booking) throw new BookingsError('not-found');
    return booking;
  }

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
   * Records a payment received for a booking that still accepts payments, up to its balance due.
   * @param {Payment} payment - Payment entity to persist.
   * @returns {Promise<Payment>} Recorded payment.
   * @throws {BookingsError} When a business rule is violated.
   */
  function recordPayment(payment) {
    const booking = requireBooking(payment.bookingId);
    if (!booking.acceptsPayments)
      throw new BookingsError('payments-not-accepted');
    payment.validate();
    if (payment.amount > getBalanceDue(booking))
      throw new BookingsError('payment-exceeds-balance');
    const newPayment = new Payment({
      ...payment,
      propertyId: booking.propertyId,
      recordedBy: demoOperator,
    });
    return trackSaving(
      bookingsApi.createPayment(newPayment).then((response) => {
        const savedPayment = PaymentAssembler.toEntityFromResource(
          response.data,
        );
        payments.value.push(savedPayment);
        return savedPayment;
      }),
    );
  }

  /**
   * Checks in the guest of a confirmed booking after verifying their identity document,
   * then registers the encoded key cards with Access Control.
   * @param {import('../domain/check-in-booking.command.js').CheckInBookingCommand} checkInBookingCommand - Check-in command.
   * @returns {Promise<Booking>} Checked-in booking.
   * @throws {BookingsError} When the booking cannot be checked in or no key card was encoded.
   */
  async function checkInBooking(checkInBookingCommand) {
    const {
      bookingId,
      documentType,
      documentNumber,
      documentVerified,
      keyCardIds,
    } = checkInBookingCommand;
    const checkedInBooking = requireBooking(bookingId).checkIn({
      today: today(),
      documentType,
      documentNumber,
      documentVerified,
      at: new Date().toISOString(),
      by: demoOperator,
    });
    if (!keyCardIds.length) throw new BookingsError('key-card-required');
    const savedBooking = await saveChanges(checkedInBooking);
    await accessControlStore.issueGuestKeyCards(
      new IssueGuestKeyCardsCommand({
        bookingId: savedBooking.id,
        bookingCode: savedBooking.code,
        roomId: savedBooking.roomId,
        holderName: savedBooking.guestName,
        checkOutDate: savedBooking.checkOutDate,
        cardIds: keyCardIds,
      }),
    );
    return savedBooking;
  }

  /**
   * Checks out the guest of a checked-in booking once its balance is paid, then ends its key cards.
   * @param {import('../domain/check-out-booking.command.js').CheckOutBookingCommand} checkOutBookingCommand - Check-out command.
   * @returns {Promise<Booking>} Checked-out booking.
   * @throws {BookingsError} When the booking cannot be checked out.
   */
  async function checkOutBooking(checkOutBookingCommand) {
    const { bookingId, roomCondition, note } = checkOutBookingCommand;
    const booking = requireBooking(bookingId);
    const savedBooking = await saveChanges(
      booking.checkOut({
        balanceDue: getBalanceDue(booking),
        roomCondition,
        note,
        at: new Date().toISOString(),
        by: demoOperator,
      }),
    );
    await accessControlStore.endGuestKeyCards(savedBooking.id);
    return savedBooking;
  }

  /**
   * Confirms a pending booking.
   * @param {number} bookingId - Booking identifier.
   * @returns {Promise<Booking>} Confirmed booking.
   * @throws {BookingsError} When the booking cannot be confirmed.
   */
  function confirmBooking(bookingId) {
    return saveChanges(
      requireBooking(bookingId).confirm(new Date().toISOString(), demoOperator),
    );
  }

  /**
   * Cancels a pending or confirmed booking, which frees its room.
   * @param {import('../domain/cancel-booking.command.js').CancelBookingCommand} cancelBookingCommand - Cancel-booking command.
   * @returns {Promise<Booking>} Cancelled booking.
   * @throws {BookingsError} When the booking cannot be cancelled.
   */
  function cancelBooking(cancelBookingCommand) {
    const { bookingId, reason, note } = cancelBookingCommand;
    return saveChanges(
      requireBooking(bookingId).cancel({
        reason,
        note,
        at: new Date().toISOString(),
        by: demoOperator,
      }),
    );
  }

  /**
   * Records that the guest of a confirmed booking did not arrive, which frees its room.
   * @param {number} bookingId - Booking identifier.
   * @returns {Promise<Booking>} No-show booking.
   * @throws {BookingsError} When the booking cannot be marked as no-show.
   */
  function markNoShow(bookingId) {
    return saveChanges(
      requireBooking(bookingId).markNoShow(
        today(),
        new Date().toISOString(),
        demoOperator,
      ),
    );
  }

  /**
   * Returns a cancelled booking to Pending when its stay has not started and its room is still available.
   * @param {number} bookingId - Booking identifier.
   * @returns {Promise<Booking>} Restored booking.
   * @throws {BookingsError} When the booking cannot be restored.
   */
  function restoreBooking(bookingId) {
    const restoredBooking = requireBooking(bookingId).restore(today());
    if (!isRoomAvailable(restoredBooking.roomId, restoredBooking))
      throw new BookingsError('room-unavailable');
    return saveChanges(restoredBooking);
  }

  return {
    bookings,
    payments,
    errors,
    bookingsLoaded,
    paymentsLoaded,
    saving,
    currentPropertyId,
    bookingsCount,
    fetchBookings,
    getBookingById,
    getPaymentsOf,
    getBalanceDue,
    getPaymentStatus,
    quoteTotal,
    isRoomAvailable,
    addBooking,
    updateBooking,
    confirmBooking,
    cancelBooking,
    markNoShow,
    restoreBooking,
    recordPayment,
    checkInBooking,
    checkOutBooking,
  };
});

export default useBookingsStore;
