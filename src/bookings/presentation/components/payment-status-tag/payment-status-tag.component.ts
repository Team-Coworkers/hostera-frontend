import { Component, computed, inject, input } from '@angular/core';
import {
  StatusTagComponent,
  TagSeverity,
} from '../../../../shared/presentation/components/status-tag/status-tag.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { PaymentStatus } from '../../../domain/model/booking.entity';

const severities: Record<PaymentStatus, TagSeverity> = {
  unpaid: 'danger',
  'partially-paid': 'warn',
  paid: 'success',
};

/** Tag with the color of a booking's payment status. */
@Component({
  selector: 'app-payment-status-tag',
  imports: [StatusTagComponent],
  template: `<app-status-tag
    icon="account_balance_wallet"
    [severity]="severity()"
    [value]="i18n.t('bookings.bookings-terms.payment-statuses.' + status())"
  />`,
})
export class PaymentStatusTagComponent {
  protected readonly i18n = inject(I18nService);
  readonly status = input.required<PaymentStatus>();
  protected readonly severity = computed(
    () => severities[this.status()] ?? 'secondary',
  );
}
