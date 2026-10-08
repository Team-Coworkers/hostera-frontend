import { BookingsError } from './bookings.error';
import { Payment } from './payment.entity';

/** Booking statuses, from the first request to the end of the stay. */
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked-in'
  | 'checked-out'
  | 'cancelled'
  | 'no-show';

/** Reasons staff can give when cancelling a booking. */
export type CancellationReason =
  | 'guest-request'
  | 'change-of-plans'
  | 'duplicate-booking'
  | 'property-unable'
  | 'other';

/** Identity documents staff can verify at check-in. */
export type DocumentType = 'dni' | 'passport' | 'foreign-resident-card';

/** Room conditions staff can report at check-out. */
export type RoomCondition = 'no-issues' | 'needs-attention';

/** Languages a guest can prefer for communication. */
export type PreferredLanguage = 'es' | 'en';

/** How much of a booking total has been paid. */
export type PaymentStatus = 'unpaid' | 'partially-paid' | 'paid';

/** Attributes of a {@link Booking}, as exchanged with the API. */
export interface BookingAttributes {
  /** Booking identifier. */
  id: number | null;
  /** Identifier of the property. */
  propertyId: number | null;
  /** Booking code shown to guests and staff. */
  code: string;
  /** Booking status. */
  status: BookingStatus;
  /** Guest's full name. */
  guestName: string;
  /** Guest's email address. */
  guestEmail: string;
  /** Guest's phone number. */
  guestPhone: string;
  /** Guest's preferred language. */
  preferredLanguage: PreferredLanguage;
  /** ISO day of the first night. */
  checkInDate: string;
  /** ISO day the guest leaves, after the last night. */
  checkOutDate: string;
  /** Number of guests. */
  guests: number;
  /** Identifier of the booked room type. */
  roomTypeId: number | null;
  /** Identifier of the assigned room. */
  roomId: number | null;
  /** Identifier of the rate plan. */
  ratePlanId: number | null;
  /** Price of all nights when the booking was saved. */
  totalAmount: number;
  /** Guest's request for the stay. */
  guestRequest: string;
  /** ISO day the booking was created. */
  createdAt: string;
  /** ISO date-time the booking was confirmed. */
  confirmedAt: string | null;
  /** Operator who confirmed the booking. */
  confirmedBy: string | null;
  /** ISO date-time the booking was cancelled. */
  cancelledAt: string | null;
  /** Operator who cancelled the booking. */
  cancelledBy: string | null;
  /** Why the booking was cancelled. */
  cancellationReason: CancellationReason | null;
  /** Internal note about the cancellation. */
  cancellationNote: string;
  /** ISO date-time the no-show was recorded. */
  noShowAt: string | null;
  /** Operator who recorded the no-show. */
  noShowBy: string | null;
  /** ISO date-time the guest checked in. */
  checkedInAt: string | null;
  /** Operator who completed the check-in. */
  checkedInBy: string | null;
  /** Identity document verified at check-in. */
  guestDocumentType: DocumentType | null;
  /** Number of the verified identity document. */
  guestDocumentNumber: string;
  /** ISO date-time the guest checked out. */
  checkedOutAt: string | null;
  /** Operator who completed the check-out. */
  checkedOutBy: string | null;
  /** Room condition reported at check-out. */
  roomCondition: RoomCondition | null;
  /** Internal note about the departure. */
  departureNote: string;
}

/**
 * Booking entity within the Bookings bounded context.
 * It arranges a planned guest stay in one room over a range of nights and keeps the guest's contact details.
 */
export class Booking implements BookingAttributes {
  /** Booking statuses, from the first request to the end of the stay. */
  static readonly statuses: BookingStatus[] = [
    'pending',
    'confirmed',
    'checked-in',
    'checked-out',
    'cancelled',
    'no-show',
  ];

  /** Statuses whose booking keeps its room for its nights. */
  static readonly roomHoldingStatuses: BookingStatus[] = [
    'pending',
    'confirmed',
    'checked-in',
  ];

  /** Statuses whose booking can still be edited. */
  static readonly editableStatuses: BookingStatus[] = ['pending', 'confirmed'];

  /** Reasons staff can give when cancelling a booking. */
  static readonly cancellationReasons: CancellationReason[] = [
    'guest-request',
    'change-of-plans',
    'duplicate-booking',
    'property-unable',
    'other',
  ];

  /** Identity documents staff can verify at check-in. */
  static readonly documentTypes: DocumentType[] = [
    'dni',
    'passport',
    'foreign-resident-card',
  ];

  /** Room conditions staff can report at check-out. */
  static readonly roomConditions: RoomCondition[] = [
    'no-issues',
    'needs-attention',
  ];

  /** Statuses whose booking can still receive payments. */
  static readonly paymentAcceptingStatuses: BookingStatus[] = [
    'pending',
    'confirmed',
    'checked-in',
  ];

  /** Languages a guest can prefer for communication. */
  static readonly preferredLanguages: PreferredLanguage[] = ['es', 'en'];

  /**
   * Checks whether a value is an existing calendar day in ISO `YYYY-MM-DD` format.
   * @param value - Value to check.
   */
  static #isCalendarDay(value: unknown): boolean {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
      return false;
    const date = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }

  /**
   * Moves an ISO calendar day by a number of days.
   * @param value - ISO calendar day.
   * @param days - Days to add; negative values move backwards.
   */
  static #addDays(value: string, days: number): string {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  /**
   * Builds the code that follows a property's latest booking code.
   * Each property numbers its bookings in its own thousand, such as BKG-1001 for the first property.
   * @param propertyId - Identifier of the property.
   * @param latestCode - Highest booking code of the property, if any.
   * @returns Next booking code.
   */
  static nextCode(propertyId: number, latestCode?: string | null): string {
    return `BKG-${Math.max(Booking.numberOf(latestCode), propertyId * 1000) + 1}`;
  }

  /**
   * Reads the sequential number of a booking code.
   * @param code - Booking code.
   * @returns Booking number, or 0 when the code has none.
   */
  static numberOf(code?: string | null): number {
    return Number(/^BKG-(\d+)$/.exec(code ?? '')?.[1] ?? 0);
  }

  id: number | null;
  propertyId: number | null;
  code: string;
  status: BookingStatus;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  preferredLanguage: PreferredLanguage;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  roomTypeId: number | null;
  roomId: number | null;
  ratePlanId: number | null;
  totalAmount: number;
  guestRequest: string;
  createdAt: string;
  confirmedAt: string | null;
  confirmedBy: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationReason: CancellationReason | null;
  cancellationNote: string;
  noShowAt: string | null;
  noShowBy: string | null;
  checkedInAt: string | null;
  checkedInBy: string | null;
  guestDocumentType: DocumentType | null;
  guestDocumentNumber: string;
  checkedOutAt: string | null;
  checkedOutBy: string | null;
  roomCondition: RoomCondition | null;
  departureNote: string;

  /**
   * @param params - Entity attributes.
   */
  constructor({
    id = null,
    propertyId = null,
    code = '',
    status = 'pending',
    guestName = '',
    guestEmail = '',
    guestPhone = '',
    preferredLanguage = 'es',
    checkInDate = '',
    checkOutDate = '',
    guests = 1,
    roomTypeId = null,
    roomId = null,
    ratePlanId = null,
    totalAmount = 0,
    guestRequest = '',
    createdAt = '',
    confirmedAt = null,
    confirmedBy = null,
    cancelledAt = null,
    cancelledBy = null,
    cancellationReason = null,
    cancellationNote = '',
    noShowAt = null,
    noShowBy = null,
    checkedInAt = null,
    checkedInBy = null,
    guestDocumentType = null,
    guestDocumentNumber = '',
    checkedOutAt = null,
    checkedOutBy = null,
    roomCondition = null,
    departureNote = '',
  }: Partial<BookingAttributes> = {}) {
    this.id = id;
    this.propertyId = propertyId;
    this.code = code;
    this.status = status;
    this.guestName = guestName.trim();
    this.guestEmail = guestEmail.trim();
    this.guestPhone = guestPhone.trim();
    this.preferredLanguage = preferredLanguage;
    this.checkInDate = checkInDate;
    this.checkOutDate = checkOutDate;
    this.guests = guests;
    this.roomTypeId = roomTypeId;
    this.roomId = roomId;
    this.ratePlanId = ratePlanId;
    this.totalAmount = totalAmount;
    this.guestRequest = guestRequest.trim();
    this.createdAt = createdAt;
    this.confirmedAt = confirmedAt;
    this.confirmedBy = confirmedBy;
    this.cancelledAt = cancelledAt;
    this.cancelledBy = cancelledBy;
    this.cancellationReason = cancellationReason;
    this.cancellationNote = cancellationNote.trim();
    this.noShowAt = noShowAt;
    this.noShowBy = noShowBy;
    this.checkedInAt = checkedInAt;
    this.checkedInBy = checkedInBy;
    this.guestDocumentType = guestDocumentType;
    this.guestDocumentNumber = guestDocumentNumber.trim();
    this.checkedOutAt = checkedOutAt;
    this.checkedOutBy = checkedOutBy;
    this.roomCondition = roomCondition;
    this.departureNote = departureNote.trim();
  }

  /** Whether the booking keeps its room for its nights. */
  get holdsRoom(): boolean {
    return Booking.roomHoldingStatuses.includes(this.status);
  }

  /** Whether the booking can still be edited. */
  get isEditable(): boolean {
    return Booking.editableStatuses.includes(this.status);
  }

  /** Whether the booking can be confirmed. */
  get canBeConfirmed(): boolean {
    return this.status === 'pending';
  }

  /** Whether the booking can be cancelled. */
  get canBeCancelled(): boolean {
    return this.status === 'pending' || this.status === 'confirmed';
  }

  /**
   * Whether the guest's absence can be recorded: the booking is confirmed and its check-in day has arrived.
   * @param today - Current ISO calendar day.
   */
  canBeMarkedNoShow(today: string): boolean {
    return this.status === 'confirmed' && this.checkInDate <= today;
  }

  /**
   * Whether a cancelled booking can be restored because its stay has not started.
   * Its room must also still be available, which the application checks.
   * @param today - Current ISO calendar day.
   */
  canBeRestored(today: string): boolean {
    return this.status === 'cancelled' && today <= this.checkInDate;
  }

  /** Whether the booking can still receive payments. */
  get acceptsPayments(): boolean {
    return Booking.paymentAcceptingStatuses.includes(this.status);
  }

  /**
   * Derives the amount still owed after the booking's payments.
   * @param payments - Payments of the booking.
   * @returns Balance due, never below zero.
   */
  balanceDue(payments: Payment[]): number {
    const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    return Math.max(Math.round((this.totalAmount - paid) * 100) / 100, 0);
  }

  /**
   * Classifies how much of the booking total has been paid.
   * @param payments - Payments of the booking.
   */
  paymentStatus(payments: Payment[]): PaymentStatus {
    if (this.balanceDue(payments) === 0) return 'paid';
    return payments.length ? 'partially-paid' : 'unpaid';
  }

  /**
   * Whether the guest can check in: the booking is confirmed and today is one of its nights.
   * @param today - Current ISO calendar day.
   */
  canBeCheckedIn(today: string): boolean {
    return (
      this.status === 'confirmed' &&
      this.checkInDate <= today &&
      today < this.checkOutDate
    );
  }

  /** Whether the guest can check out. */
  get canBeCheckedOut(): boolean {
    return this.status === 'checked-in';
  }

  /**
   * Checks the guest in after their identity document is verified; a balance due does not prevent it.
   * @param checkIn - Check-in details.
   * @returns Checked-in copy of the booking.
   * @throws BookingsError When the booking cannot be checked in or the identity is not verified.
   */
  checkIn({
    today,
    documentType,
    documentNumber,
    documentVerified,
    at,
    by,
  }: {
    today: string;
    documentType: DocumentType | null;
    documentNumber: string;
    documentVerified: boolean;
    at: string;
    by: string;
  }): Booking {
    if (!this.canBeCheckedIn(today))
      throw new BookingsError('invalid-status-change');
    if (!documentType || !Booking.documentTypes.includes(documentType))
      throw new BookingsError('invalid-document-type');
    if (!documentNumber?.trim())
      throw new BookingsError('document-number-required');
    if (!documentVerified) throw new BookingsError('identity-not-verified');
    return new Booking({
      ...this,
      status: 'checked-in',
      checkedInAt: at,
      checkedInBy: by,
      guestDocumentType: documentType,
      guestDocumentNumber: documentNumber,
    });
  }

  /**
   * Checks the guest out once nothing is owed, which frees the room for any remaining nights.
   * @param checkOut - Check-out details.
   * @returns Checked-out copy of the booking.
   * @throws BookingsError When the booking cannot be checked out or a balance remains.
   */
  checkOut({
    balanceDue,
    roomCondition,
    note = '',
    at,
    by,
  }: {
    balanceDue: number;
    roomCondition: RoomCondition | null;
    note?: string;
    at: string;
    by: string;
  }): Booking {
    if (!this.canBeCheckedOut) throw new BookingsError('invalid-status-change');
    if (balanceDue > 0) throw new BookingsError('balance-due');
    if (!roomCondition || !Booking.roomConditions.includes(roomCondition))
      throw new BookingsError('invalid-room-condition');
    return new Booking({
      ...this,
      status: 'checked-out',
      checkedOutAt: at,
      checkedOutBy: by,
      roomCondition,
      departureNote: note,
    });
  }

  /**
   * Confirms a pending booking.
   * @param at - ISO date-time of the confirmation.
   * @param by - Operator who confirms.
   * @returns Confirmed copy of the booking.
   * @throws BookingsError When the booking is not pending.
   */
  confirm(at: string, by: string): Booking {
    if (!this.canBeConfirmed) throw new BookingsError('invalid-status-change');
    return new Booking({
      ...this,
      status: 'confirmed',
      confirmedAt: at,
      confirmedBy: by,
    });
  }

  /**
   * Cancels a pending or confirmed booking, which frees its room.
   * @param cancellation - Cancellation details; the note is required for the Other reason.
   * @returns Cancelled copy of the booking.
   * @throws BookingsError When the booking cannot be cancelled or the reason is incomplete.
   */
  cancel({
    reason,
    note = '',
    at,
    by,
  }: {
    reason: CancellationReason | null;
    note?: string;
    at: string;
    by: string;
  }): Booking {
    if (!this.canBeCancelled) throw new BookingsError('invalid-status-change');
    if (!reason || !Booking.cancellationReasons.includes(reason))
      throw new BookingsError('invalid-cancellation-reason');
    if (reason === 'other' && !note.trim())
      throw new BookingsError('cancellation-note-required');
    return new Booking({
      ...this,
      status: 'cancelled',
      cancelledAt: at,
      cancelledBy: by,
      cancellationReason: reason,
      cancellationNote: note,
    });
  }

  /**
   * Records that the guest of a confirmed booking did not arrive, which frees its room.
   * @param today - Current ISO calendar day.
   * @param at - ISO date-time the no-show is recorded.
   * @param by - Operator who records it.
   * @returns No-show copy of the booking.
   * @throws BookingsError When the booking is not confirmed or its check-in day has not arrived.
   */
  markNoShow(today: string, at: string, by: string): Booking {
    if (!this.canBeMarkedNoShow(today))
      throw new BookingsError('invalid-status-change');
    return new Booking({
      ...this,
      status: 'no-show',
      noShowAt: at,
      noShowBy: by,
    });
  }

  /**
   * Returns a cancelled booking to Pending, keeping its saved total, so it must be confirmed again.
   * @param today - Current ISO calendar day.
   * @returns Pending copy of the booking without its cancellation.
   * @throws BookingsError When the booking is not cancelled or its stay has started.
   */
  restore(today: string): Booking {
    if (!this.canBeRestored(today))
      throw new BookingsError('invalid-status-change');
    return new Booking({
      ...this,
      status: 'pending',
      confirmedAt: null,
      confirmedBy: null,
      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,
      cancellationNote: '',
    });
  }

  /** Lists the nights of the stay, from the check-in day to the day before check-out. */
  get nights(): string[] {
    const nights: string[] = [];
    for (
      let date = this.checkInDate;
      date < this.checkOutDate;
      date = Booking.#addDays(date, 1)
    )
      nights.push(date);
    return nights;
  }

  /** The ISO day of the last night of the stay. */
  get lastNight(): string {
    return Booking.#addDays(this.checkOutDate, -1);
  }

  /**
   * Whether the stay shares at least one night with another stay.
   * @param checkInDate - ISO check-in day of the other stay.
   * @param checkOutDate - ISO check-out day of the other stay.
   */
  overlaps(checkInDate: string, checkOutDate: string): boolean {
    return this.checkInDate < checkOutDate && checkInDate < this.checkOutDate;
  }

  /**
   * Whether another booking uses the same room, nights, and rate plan, so its saved price still applies.
   * @param booking - Booking to compare.
   */
  hasSamePricingAs(booking: Booking): boolean {
    return (
      this.roomTypeId === booking.roomTypeId &&
      this.ratePlanId === booking.ratePlanId &&
      this.checkInDate === booking.checkInDate &&
      this.checkOutDate === booking.checkOutDate
    );
  }

  /**
   * Validates the booking's attributes.
   * @throws BookingsError When a business rule is violated.
   */
  validate(): void {
    if (
      !this.guestName ||
      !this.guestEmail ||
      !this.roomTypeId ||
      !this.roomId ||
      !this.ratePlanId
    )
      throw new BookingsError('required-fields');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.guestEmail))
      throw new BookingsError('invalid-email');
    if (!Booking.preferredLanguages.includes(this.preferredLanguage))
      throw new BookingsError('invalid-language');
    if (
      !Booking.#isCalendarDay(this.checkInDate) ||
      !Booking.#isCalendarDay(this.checkOutDate) ||
      this.checkOutDate <= this.checkInDate
    )
      throw new BookingsError('invalid-stay-dates');
    if (!Number.isInteger(this.guests) || this.guests < 1)
      throw new BookingsError('invalid-guests');
    if (!Booking.statuses.includes(this.status))
      throw new BookingsError('invalid-status');
  }
}
