import { Component, inject, input } from '@angular/core';
import {
  StatusTagComponent,
  TagSeverity,
} from '../../../../shared/presentation/components/status-tag/status-tag.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { StockCondition } from '../../../domain/model/inventory-item.entity';

const severities: Record<StockCondition, TagSeverity> = {
  'in-stock': 'success',
  'low-stock': 'warn',
  'out-of-stock': 'danger',
};

/** Tag with the color of an item's stock condition. */
@Component({
  selector: 'app-stock-condition-tag',
  imports: [StatusTagComponent],
  template: `<app-status-tag
    [severity]="severities[condition()]"
    [value]="i18n.t('inventory.inventory-terms.conditions.' + condition())"
  />`,
})
export class StockConditionTagComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly severities = severities;
  readonly condition = input.required<StockCondition>();
}
