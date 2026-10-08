import { BookingsError } from './bookings.error.js';

/**
 * Payment entity within the Bookings bounded context.
 * It records an amount received for a booking through a channel outside Hostera.
 *
 * @class Payment
 */
export class Payment {
  /**
   * Channels through which a payment can be received.
   * @type {string[]}
   */
  static methods = ['cash', 'card-terminal', 'bank-transfer', 'other'];

  /**
   * @param {Object} params - Entity attributes.
   * @param {?number} [params.id=null] - Payment identifier.
   * @param {?number} [params.propertyId=null] - Identifier of the property.
   * @param {?number} [params.bookingId=null] - Identifier of the paid booking.
   * @param {number} [params.amount=0] - Amount received in the property's currency.
   * @param {string} [params.method='card-terminal'] - Channel of the payment.
   * @param {string} [params.paidAt=''] - ISO date-time the payment was received.
   * @param {string} [params.reference=''] - Receipt or transaction reference.
   * @param {?string} [params.recordedBy=null] - Operator who recorded the payment.
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
  }) {
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
   * @throws {BookingsError} When a business rule is violated.
   */
  validate() {
    if (!this.bookingId) throw new BookingsError('required-fields');
    if (!Number.isFinite(this.amount) || this.amount <= 0)
      throw new BookingsError('invalid-payment-amount');
    if (!Payment.methods.includes(this.method))
      throw new BookingsError('invalid-payment-method');
    if (!this.paidAt || Number.isNaN(new Date(this.paidAt).getTime()))
      throw new BookingsError('invalid-payment-date');
  }
}
