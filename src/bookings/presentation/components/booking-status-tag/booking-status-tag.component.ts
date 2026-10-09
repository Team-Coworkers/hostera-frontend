import { Component, computed, inject, input } from '@angular/core';
import {
  StatusTagComponent,
  TagSeverity,
} from '../../../../shared/presentation/components/status-tag/status-tag.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { BookingStatus } from '../../../domain/model/booking.entity';

const appearances: Record<
  BookingStatus,
  { icon: string; severity: TagSeverity }
> = {
  pending: { icon: 'schedule', severity: 'warn' },
  confirmed: { icon: 'event', severity: 'info' },
  'checked-in': { icon: 'login', severity: 'success' },
  'checked-out': { icon: 'logout', severity: 'secondary' },
  cancelled: { icon: 'cancel', severity: 'danger' },
  'no-show': { icon: 'person_remove', severity: 'secondary' },
};

/** Tag with the icon and color of a booking status. */
@Component({
  selector: 'app-booking-status-tag',
  imports: [StatusTagComponent],
  template: `<app-status-tag
    [icon]="appearance().icon"
    [severity]="appearance().severity"
    [value]="i18n.t('bookings.bookings-terms.statuses.' + status())"
  />`,
})
export class BookingStatusTagComponent {
  protected readonly i18n = inject(I18nService);
  readonly status = input.required<BookingStatus>();
  protected readonly appearance = computed(
    () => appearances[this.status()] ?? appearances.pending,
  );
}
