import { Component, computed, inject, input } from '@angular/core';
import {
  StatusTagComponent,
  TagSeverity,
} from '../../../../shared/presentation/components/status-tag/status-tag.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { DayStatus } from '../../../domain/model/room.entity';

const statusStyles: Record<DayStatus, { icon: string; severity: TagSeverity }> =
  {
    available: { icon: 'check', severity: 'success' },
    booked: { icon: 'event', severity: 'info' },
    occupied: { icon: 'person', severity: 'primary' },
    blocked: { icon: 'block', severity: 'warn' },
    'out-of-service': { icon: 'build', severity: 'danger' },
    'needs-cleaning': { icon: 'cleaning_services', severity: 'secondary' },
  };

/** Tag with the icon and color of a room's day status. */
@Component({
  selector: 'app-day-status-tag',
  imports: [StatusTagComponent],
  template: `<app-status-tag
    class="max-w-full"
    [class.compact]="compact()"
    [icon]="style().icon"
    [severity]="style().severity"
    [value]="i18n.t('rooms.rooms-terms.day-statuses.' + status())"
  />`,
  styles: `
    :host {
      display: inline-flex;
      max-width: 100%;
      min-width: 0;
    }
    /* Below the md breakpoint a compact tag keeps only its icon. */
    @media (max-width: 767px) {
      .compact ::ng-deep .status-tag {
        font-size: 0;
        gap: 0;
      }
    }
  `,
})
export class DayStatusTagComponent {
  protected readonly i18n = inject(I18nService);
  readonly status = input.required<DayStatus>();
  /** Hides the label below the md breakpoint, keeping the icon. */
  readonly compact = input(false);
  protected readonly style = computed(
    () => statusStyles[this.status()] ?? statusStyles.available,
  );
}
