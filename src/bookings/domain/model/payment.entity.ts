import { BookingsError } from './bookings.error';

/** Channels through which a payment can be received. */
export type PaymentMethod =
  'cash' | 'card-terminal' | 'bank-transfer' | 'other';

/** Attributes of a {@link Payment}, as exchanged with the API. */
export interface PaymentAttributes {
  /** Payment identifier. */
  id: number | null;
  /** Identifier of the property. */
  propertyId: number | null;
  /** Identifier of the paid booking. */
  bookingId: number | null;
  /** Amount received in the property's currency. */
  amount: number;
  /** Channel of the payment. */
  method: PaymentMethod;
  /** ISO date-time the payment was received. */
  paidAt: string;
  /** Receipt or transaction reference. */
  reference: string;
  /** Operator who recorded the payment. */
  recordedBy: string | null;
}

/**
 * Payment entity within the Bookings bounded context.
 * It records an amount received for a booking through a channel outside Hostera.
 */
export class Payment implements PaymentAttributes {
  /** Channels through which a payment can be received. */
  static readonly methods: PaymentMethod[] = [
    'cash',
    'card-terminal',
    'bank-transfer',
    'other',
  ];

  id: number | null;
  propertyId: number | null;
  bookingId: number | null;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  reference: string;
  recordedBy: string | null;

  /**
   * @param params - Entity attributes.
   */
  constructor({
    id = null,
    propertyId = null,
    bookingId = null,
    amount = 0,
    method = 'card-terminal',
    paidAt = '',
    reference = '',
    recordedBy = null,
  }: Partial<PaymentAttributes> = {}) {
    this.id = id;
    this.propertyId = propertyId;
    this.bookingId = bookingId;
    this.amount = amount;
    this.method = method;
    this.paidAt = paidAt;
    this.reference = reference.trim();
    this.recordedBy = recordedBy;
  }

  /**
   * Validates the payment's attributes.
   * @throws BookingsError When a business rule is violated.
   */
  validate(): void {
    if (!this.bookingId) throw new BookingsError('required-fields');
    if (!Number.isFinite(this.amount) || this.amount <= 0)
      throw new BookingsError('invalid-payment-amount');
    if (!Payment.methods.includes(this.method))
      throw new BookingsError('invalid-payment-method');
    if (!this.paidAt || Number.isNaN(new Date(this.paidAt).getTime()))
      throw new BookingsError('invalid-payment-date');
  }
}
