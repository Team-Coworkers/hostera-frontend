import { Component, computed, inject, input } from '@angular/core';
import {
  StatusTagComponent,
  TagSeverity,
} from '../../../../shared/presentation/components/status-tag/status-tag.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { CredentialStatus } from '../../../domain/model/credential.entity';

const appearances: Record<
  CredentialStatus,
  { icon: string; severity: TagSeverity }
> = {
  active: { icon: 'check_circle', severity: 'success' },
  scheduled: { icon: 'schedule', severity: 'warn' },
  expired: { icon: 'history', severity: 'secondary' },
  revoked: { icon: 'block', severity: 'danger' },
};

/** Tag with the icon and color of a credential status. */
@Component({
  selector: 'app-credential-status-tag',
  imports: [StatusTagComponent],
  template: `<app-status-tag
    [icon]="appearance().icon"
    [severity]="appearance().severity"
    [value]="i18n.t('access-control.access-control-terms.statuses.' + status())"
  />`,
})
export class CredentialStatusTagComponent {
  protected readonly i18n = inject(I18nService);
  readonly status = input.required<CredentialStatus>();
  protected readonly appearance = computed(
    () => appearances[this.status()] ?? appearances.active,
  );
}
