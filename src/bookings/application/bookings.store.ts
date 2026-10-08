import { HttpResponse } from '@angular/common/http';
import {
  computed,
  effect,
  inject,
  Injectable,
  signal,
  untracked,
  WritableSignal,
} from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { AccessControlStore } from '../../access-control/application/access-control.store';
import { IssueGuestKeyCardsCommand } from '../../access-control/domain/issue-guest-key-cards.command';
import { RoomsStore } from '../../rooms/application/rooms.store';
import { CancelBookingCommand } from '../domain/cancel-booking.command';
import { CheckInBookingCommand } from '../domain/check-in-booking.command';
import { CheckOutBookingCommand } from '../domain/check-out-booking.command';
import { Booking, PaymentStatus } from '../domain/model/booking.entity';
import { BookingsError } from '../domain/model/bookings.error';
import { Payment } from '../domain/model/payment.entity';
import { BookingAssembler } from '../infrastructure/booking.assembler';
import { BookingsApiService } from '../infrastructure/bookings-api.service';
import { PaymentAssembler } from '../infrastructure/payment.assembler';

/** Operator recorded in booking status changes until IAM is implemented. */
export const demoOperator = 'Demo operator';

/** Assembler of a property-scoped collection. */
interface CollectionAssembler<T> {
  toEntitiesFromResponse(response: HttpResponse<unknown>): T[];
}

/**
 * Application service store for the Bookings bounded context, replacing the `bookings` Pinia store.
 * It coordinates booking use cases with the rooms, rates, and availability of the Rooms context
 * and the key cards of the Access Control context, and keeps UI-facing state in signals.
 */
@Injectable({ providedIn: 'root' })
export class BookingsStore {
  private readonly bookingsApi = inject(BookingsApiService);
  private readonly roomsStore = inject(RoomsStore);
  private readonly accessControlStore = inject(AccessControlStore);

  /** Bookings of the current property. */
  readonly bookings = signal<Booking[]>([]);
  /** Payments of the current property's bookings. */
  readonly payments = signal<Payment[]>([]);
  /** Errors encountered during API operations. */
  readonly errors = signal<unknown[]>([]);
  /** Whether bookings have been loaded from the API. */
  readonly bookingsLoaded = signal(false);
  /** Whether payments have been loaded from the API. */
  readonly paymentsLoaded = signal(false);
  /** Whether a create or update operation is in progress. */
  readonly saving = signal(false);
  /** Identifier of the property whose bookings are managed, shared with the Rooms context. */
  readonly currentPropertyId = computed(() =>
    this.roomsStore.currentPropertyId(),
  );
  /** Number of loaded bookings. */
  readonly bookingsCount = computed(() =>
    this.bookingsLoaded() ? this.bookings().length : 0,
  );

  constructor() {
    // Bookings follow the property selected in either context.
    effect(() => {
      this.currentPropertyId();
      untracked(() => this.fetchBookings());
    });
  }

  /**
   * Loads one property-scoped collection and ignores responses for a previously selected property.
   * @param request - Infrastructure request.
   * @param assembler - Assembler for the collection.
   * @param collection - Collection state.
   * @param loaded - Loaded flag of the collection.
   */
  private fetchCollection<T>(
    request: (propertyId: number) => Observable<HttpResponse<unknown>>,
    assembler: CollectionAssembler<T>,
    collection: WritableSignal<T[]>,
    loaded: WritableSignal<boolean>,
  ): Promise<void> {
    const propertyId = this.currentPropertyId();
    collection.set([]);
    loaded.set(false);
    if (!propertyId) return Promise.resolve();
    return firstValueFrom(request(propertyId))
      .then((response) => {
        if (propertyId !== this.currentPropertyId()) return;
        collection.set(assembler.toEntitiesFromResponse(response));
        loaded.set(true);
      })
      .catch((error) => {
        if (propertyId === this.currentPropertyId()) this.recordError(error);
      });
  }

  /** Loads the current property's bookings and their payments. */
  fetchBookings(): Promise<void> {
    this.errors.set([]);
    return Promise.all([
      this.fetchCollection(
        (propertyId) => this.bookingsApi.getBookings(propertyId),
        BookingAssembler,
        this.bookings,
        this.bookingsLoaded,
      ),
      this.fetchCollection(
        (propertyId) => this.bookingsApi.getPayments(propertyId),
        PaymentAssembler,
        this.payments,
        this.paymentsLoaded,
      ),
    ]).then(() => undefined);
  }

  /**
   * Finds a booking entity by identifier.
   * @param id - Booking identifier.
   */
  getBookingById(id: number | string | null): Booking | undefined {
    const idNum = Number(id);
    return this.bookings().find((booking) => booking.id === idNum);
  }

  /**
   * Lists the payments of a booking, oldest first.
   * @param bookingId - Booking identifier.
   */
  getPaymentsOf(bookingId: number | null): Payment[] {
    return this.payments()
      .filter((payment) => payment.bookingId === bookingId)
      .toSorted((a, b) => a.paidAt.localeCompare(b.paidAt));
  }

  /**
   * Derives the amount a booking still owes.
   * @param booking - Booking to check.
   */
  getBalanceDue(booking: Booking): number {
    return booking.balanceDue(this.getPaymentsOf(booking.id));
  }

  /**
   * Classifies how much of a booking has been paid.
   * @param booking - Booking to check.
   */
  getPaymentStatus(booking: Booking): PaymentStatus {
    return booking.paymentStatus(this.getPaymentsOf(booking.id));
  }

  /**
   * Derives the price of a stay as the sum of its nightly rates.
   * @param booking - Booking with room type, rate plan, and stay dates.
   * @returns Price of all nights in the property's currency.
   */
  quoteTotal(booking: Booking): number {
    const total = booking.nights.reduce(
      (sum, date) =>
        sum +
        (this.roomsStore.getNightlyRate(
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
   * @param roomId - Room identifier.
   * @param booking - Booking whose stay is checked; it never conflicts with itself.
   */
  isRoomAvailable(roomId: number | null, booking: Booking): boolean {
    return (
      !this.bookings().some(
        (entry) =>
          entry.id !== booking.id &&
          entry.roomId === roomId &&
          entry.holdsRoom &&
          entry.overlaps(booking.checkInDate, booking.checkOutDate),
      ) &&
      this.roomsStore.isRoomBookable(
        roomId,
        booking.checkInDate,
        booking.lastNight,
      )
    );
  }

  /**
   * Rejects a booking whose room, rate plan, or guests cannot be sold for its stay.
   * A room type or rate plan made inactive stays acceptable for the booking that already uses it.
   * @param booking - Booking to check.
   * @param currentBooking - Persisted booking, when updating.
   * @throws BookingsError When the booking cannot be sold.
   */
  private ensureBookable(
    booking: Booking,
    currentBooking: Booking | null = null,
  ): void {
    const roomType = this.roomsStore.getRoomTypeById(booking.roomTypeId);
    if (!roomType) throw new BookingsError('room-type-required');
    if (!roomType.isActive && currentBooking?.roomTypeId !== roomType.id)
      throw new BookingsError('inactive-room-type');
    if (this.roomsStore.getRoomById(booking.roomId)?.roomTypeId !== roomType.id)
      throw new BookingsError('room-not-in-room-type');
    const ratePlan = this.roomsStore.getRatePlanById(booking.ratePlanId);
    if (!ratePlan) throw new BookingsError('rate-plan-required');
    if (!ratePlan.isActive && currentBooking?.ratePlanId !== ratePlan.id)
      throw new BookingsError('inactive-rate-plan');
    if (!ratePlan.appliesTo(roomType.id))
      throw new BookingsError('rate-plan-not-for-room-type');
    if (booking.guests > roomType.capacity)
      throw new BookingsError('over-capacity');
    if (!this.isRoomAvailable(booking.roomId, booking))
      throw new BookingsError('room-unavailable');
  }

  /** @param error - Error to record. */
  private recordError(error: unknown): void {
    this.errors.update((errors) => [...errors, error]);
  }

  /**
   * Tracks a create or update request and records its errors.
   * @param request - Pending infrastructure request.
   * @returns The same request result.
   */
  private trackSaving<T>(request: Promise<T>): Promise<T> {
    this.saving.set(true);
    return request
      .catch((error) => {
        this.recordError(error);
        throw error;
      })
      .finally(() => this.saving.set(false));
  }

  /**
   * Creates a pending booking with the property's next booking code and its quoted total, then refreshes room availability.
   * @param booking - Booking entity to persist.
   * @returns Created booking.
   * @throws BookingsError When a business rule is violated.
   */
  addBooking(booking: Booking): Promise<Booking> {
    booking.validate();
    this.ensureBookable(booking);
    const propertyId = this.currentPropertyId()!;
    return this.trackSaving(
      firstValueFrom(this.bookingsApi.getLatestBooking(propertyId))
        .then((response) => {
          const [latestBooking] =
            BookingAssembler.toEntitiesFromResponse(response);
          const newBooking = new Booking({
            ...booking,
            propertyId,
            code: Booking.nextCode(propertyId, latestBooking?.code),
            status: 'pending',
            totalAmount: this.quoteTotal(booking),
            createdAt: new Date().toISOString().slice(0, 10),
          });
          return firstValueFrom(this.bookingsApi.createBooking(newBooking));
        })
        .then((response) => {
          const newBooking = BookingAssembler.toEntityFromResource(
            response.body!,
          );
          this.bookings.update((bookings) => [...bookings, newBooking]);
          this.roomsStore.fetchRoomAssignments();
          return newBooking;
        }),
    );
  }

  /**
   * Updates a pending or confirmed booking, quoting a new total when its room type, rate plan, or nights change.
   * @param booking - Booking entity with updated data.
   * @returns Updated booking.
   * @throws BookingsError When a business rule is violated.
   */
  updateBooking(booking: Booking): Promise<Booking> {
    const currentBooking = this.getBookingById(booking.id);
    if (!currentBooking) throw new BookingsError('not-found');
    if (!currentBooking.isEditable) throw new BookingsError('not-editable');
    booking.validate();
    this.ensureBookable(booking, currentBooking);
    const updatedBooking = new Booking({
      ...booking,
      propertyId: currentBooking.propertyId,
      code: currentBooking.code,
      status: currentBooking.status,
      createdAt: currentBooking.createdAt,
      totalAmount: booking.hasSamePricingAs(currentBooking)
        ? currentBooking.totalAmount
        : this.quoteTotal(booking),
    });
    return this.saveChanges(updatedBooking);
  }

  /**
   * Persists a changed booking, replaces it in local state, and refreshes room availability.
   * @param booking - Changed booking.
   * @returns Persisted booking.
   */
  private saveChanges(booking: Booking): Promise<Booking> {
    return this.trackSaving(
      firstValueFrom(this.bookingsApi.updateBooking(booking)).then(
        (response) => {
          const savedBooking = BookingAssembler.toEntityFromResource(
            response.body!,
          );
          this.bookings.update((bookings) =>
            bookings.map((entry) =>
              entry.id === savedBooking.id ? savedBooking : entry,
            ),
          );
          this.roomsStore.fetchRoomAssignments();
          return savedBooking;
        },
      ),
    );
  }

  /**
   * Finds a booking that must exist to change its status.
   * @param bookingId - Booking identifier.
   * @throws BookingsError When the booking no longer exists.
   */
  private requireBooking(bookingId: number | null): Booking {
    const booking = this.getBookingById(bookingId);
    if (!booking) throw new BookingsError('not-found');
    return booking;
  }

  /** Returns the current local ISO calendar day. */
  private today(): string {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  /**
   * Records a payment received for a booking that still accepts payments, up to its balance due.
   * @param payment - Payment entity to persist.
   * @returns Recorded payment.
   * @throws BookingsError When a business rule is violated.
   */
  recordPayment(payment: Payment): Promise<Payment> {
    const booking = this.requireBooking(payment.bookingId);
    if (!booking.acceptsPayments)
      throw new BookingsError('payments-not-accepted');
    payment.validate();
    if (payment.amount > this.getBalanceDue(booking))
      throw new BookingsError('payment-exceeds-balance');
    const newPayment = new Payment({
      ...payment,
      propertyId: booking.propertyId,
      recordedBy: demoOperator,
    });
    return this.trackSaving(
      firstValueFrom(this.bookingsApi.createPayment(newPayment)).then(
        (response) => {
          const savedPayment = PaymentAssembler.toEntityFromResource(
            response.body!,
          );
          this.payments.update((payments) => [...payments, savedPayment]);
          return savedPayment;
        },
      ),
    );
  }

  /**
   * Checks in the guest of a confirmed booking after verifying their identity document,
   * then registers the encoded key cards with Access Control.
   * @param command - Check-in command.
   * @returns Checked-in booking.
   * @throws BookingsError When the booking cannot be checked in or no key card was encoded.
   */
  async checkInBooking(command: CheckInBookingCommand): Promise<Booking> {
    const {
      bookingId,
      documentType,
      documentNumber,
      documentVerified,
      keyCardIds,
    } = command;
    const checkedInBooking = this.requireBooking(bookingId).checkIn({
      today: this.today(),
      documentType,
      documentNumber,
      documentVerified,
      at: new Date().toISOString(),
      by: demoOperator,
    });
    if (!keyCardIds.length) throw new BookingsError('key-card-required');
    const savedBooking = await this.saveChanges(checkedInBooking);
    await this.accessControlStore.issueGuestKeyCards(
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
   * @param command - Check-out command.
   * @returns Checked-out booking.
   * @throws BookingsError When the booking cannot be checked out.
   */
  async checkOutBooking(command: CheckOutBookingCommand): Promise<Booking> {
    const { bookingId, roomCondition, note } = command;
    const booking = this.requireBooking(bookingId);
    const savedBooking = await this.saveChanges(
      booking.checkOut({
        balanceDue: this.getBalanceDue(booking),
        roomCondition,
        note,
        at: new Date().toISOString(),
        by: demoOperator,
      }),
    );
    await this.accessControlStore.endGuestKeyCards(savedBooking.id);
    return savedBooking;
  }

  /**
   * Confirms a pending booking.
   * @param bookingId - Booking identifier.
   * @throws BookingsError When the booking cannot be confirmed.
   */
  confirmBooking(bookingId: number): Promise<Booking> {
    return this.saveChanges(
      this.requireBooking(bookingId).confirm(
        new Date().toISOString(),
        demoOperator,
      ),
    );
  }

  /**
   * Cancels a pending or confirmed booking, which frees its room.
   * @param command - Cancel-booking command.
   * @throws BookingsError When the booking cannot be cancelled.
   */
  cancelBooking(command: CancelBookingCommand): Promise<Booking> {
    const { bookingId, reason, note } = command;
    return this.saveChanges(
      this.requireBooking(bookingId).cancel({
        reason,
        note,
        at: new Date().toISOString(),
        by: demoOperator,
      }),
    );
  }

  /**
   * Records that the guest of a confirmed booking did not arrive, which frees its room.
   * @param bookingId - Booking identifier.
   * @throws BookingsError When the booking cannot be marked as no-show.
   */
  markNoShow(bookingId: number): Promise<Booking> {
    return this.saveChanges(
      this.requireBooking(bookingId).markNoShow(
        this.today(),
        new Date().toISOString(),
        demoOperator,
      ),
    );
  }

  /**
   * Returns a cancelled booking to Pending when its stay has not started and its room is still available.
   * @param bookingId - Booking identifier.
   * @throws BookingsError When the booking cannot be restored.
   */
  restoreBooking(bookingId: number): Promise<Booking> {
    const restoredBooking = this.requireBooking(bookingId).restore(
      this.today(),
    );
    if (!this.isRoomAvailable(restoredBooking.roomId, restoredBooking))
      throw new BookingsError('room-unavailable');
    return this.saveChanges(restoredBooking);
  }
}
