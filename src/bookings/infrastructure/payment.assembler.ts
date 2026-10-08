import { HttpResponse } from '@angular/common/http';
import { resourcesFromResponse } from '../../shared/infrastructure/resources-from-response';
import { Payment, PaymentAttributes } from '../domain/model/payment.entity';

/** Resource payload of a payment, as exchanged with the API. */
export type PaymentResource = Partial<PaymentAttributes>;

/**
 * Maps payment resources into Bookings domain entities.
 */
export class PaymentAssembler {
  /**
   * @param resource - Payment resource payload.
   * @returns Payment entity.
   */
  static toEntityFromResource(resource: PaymentResource): Payment {
    return new Payment({ ...resource });
  }

  /**
   * Parses payment resources from a response and maps them into entities.
   * @param response - HTTP response with payment resources.
   * @returns Payment entities.
   */
  static toEntitiesFromResponse(response: HttpResponse<unknown>): Payment[] {
    return resourcesFromResponse<PaymentResource>(response, 'payments').map(
      (resource) => this.toEntityFromResource(resource),
    );
  }
}
