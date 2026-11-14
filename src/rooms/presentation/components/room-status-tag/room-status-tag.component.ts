import { Component, computed, inject, input } from '@angular/core';
import {
  StatusTagComponent,
  TagSeverity,
} from '../../../../shared/presentation/components/status-tag/status-tag.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { RoomStatus } from '../../../domain/model/room.entity';

const statusStyles: Record<RoomStatus, { icon: string; severity: TagSeverity }> =
  {
    available: { icon: 'check', severity: 'success' },
    ready: { icon: 'verified', severity: 'success' },
    occupied: { icon: 'person', severity: 'primary' },
    'needs-cleaning': { icon: 'cleaning_services', severity: 'secondary' },
    blocked: { icon: 'block', severity: 'warn' },
  };

/** Tag with the icon and color of the housekeeping status that the API keeps for a room. */
@Component({
  selector: 'app-room-status-tag',
  imports: [StatusTagComponent],
  template: `<app-status-tag
    class="max-w-full"
    [icon]="style().icon"
    [severity]="style().severity"
    [value]="i18n.t('rooms.rooms-terms.room-statuses.' + status())"
  />`,
  styles: `
    :host {
      display: inline-flex;
      max-width: 100%;
      min-width: 0;
    }
  `,
})
export class RoomStatusTagComponent {
  protected readonly i18n = inject(I18nService);
  readonly status = input.required<RoomStatus>();
  protected readonly style = computed(
    () => statusStyles[this.status()] ?? statusStyles.available,
  );
}
